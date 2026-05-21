import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const original = await prisma.document.findUnique({ where: { id } });
    if (!original || original.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
    }

    const duplicate = await prisma.document.create({
      data: {
        name: `${original.name} (copy)`,
        html: original.html,
        formData: original.formData ?? undefined,
        status: "DRAFT",
        templateVersion: original.templateVersion,
        userId: session.user.id,
        templateId: original.templateId,
      },
    });

    return NextResponse.json(duplicate, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to duplicate" }, { status: 500 });
  }
}
