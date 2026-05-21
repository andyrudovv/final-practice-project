import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeTemplate } from "@/lib/sanitize";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = await prisma.template.findUnique({
      where: { id },
      include: { author: { select: { name: true, email: true } } },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch {
    return NextResponse.json({ error: "Failed to fetch template" }, { status: 500 });
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
    const { name, description, category, html, css, js, isActive } = await req.json();

    const existing = await prisma.template.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const isAdmin = (session.user as { role?: string }).role === "ADMIN";
    if (existing.authorId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const template = await prisma.template.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        description: description ?? existing.description,
        category: category ?? existing.category,
        html: html ? sanitizeTemplate(html) : existing.html,
        css: css !== undefined ? css : existing.css,
        js: js !== undefined ? js : existing.js,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        version: html ? existing.version + 1 : existing.version,
      },
    });

    return NextResponse.json(template);
  } catch {
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
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
    const existing = await prisma.template.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const isAdmin = (session.user as { role?: string }).role === "ADMIN";
    if (existing.authorId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "You can only delete your own templates" }, { status: 403 });
    }

    await prisma.template.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
