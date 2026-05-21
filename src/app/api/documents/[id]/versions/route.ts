import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document || document.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
    }

    const versions = await prisma.documentVersion.findMany({
      where: { documentId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(versions);
  } catch {
    return NextResponse.json({ error: "Failed to fetch versions" }, { status: 500 });
  }
}
