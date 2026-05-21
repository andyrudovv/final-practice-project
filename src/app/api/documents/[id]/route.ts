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
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        template: { select: { name: true, category: true, html: true, css: true, js: true } },
        versions: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(document);
  } catch {
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { name, html, formData, status } = await req.json();

    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const document = await prisma.document.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        html: html ?? existing.html,
        formData: formData !== undefined ? formData : undefined,
        status: status ?? existing.status,
      },
    });

    if (html && html !== existing.html) {
      await prisma.documentVersion.create({
        data: {
          html,
          formData: formData || existing.formData,
          comment: status === "FINAL" ? "Final version" : "Auto-saved",
          documentId: document.id,
        },
      });
    }

    return NextResponse.json(document);
  } catch {
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.document.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
