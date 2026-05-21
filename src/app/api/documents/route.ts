import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documents = await prisma.document.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        template: { select: { name: true, category: true } },
      },
    });

    return NextResponse.json(documents);
  } catch {
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, templateId, html, formData } = await req.json();

    if (!templateId || !html) {
      return NextResponse.json(
        { error: "Template ID and HTML are required" },
        { status: 400 }
      );
    }

    const template = await prisma.template.findUnique({ where: { id: templateId } });
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const document = await prisma.document.create({
      data: {
        name: name || `${template.name} - Document`,
        html,
        formData: formData || {},
        templateVersion: template.version,
        userId: session.user.id,
        templateId,
      },
    });

    await prisma.documentVersion.create({
      data: {
        html,
        formData: formData || {},
        comment: "Initial version",
        documentId: document.id,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}
