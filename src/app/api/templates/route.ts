import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeTemplate } from "@/lib/sanitize";

export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true, email: true } } },
    });
    return NextResponse.json(templates);
  } catch {
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, category, html, css, js } = await req.json();

    if (!name || !html) {
      return NextResponse.json(
        { error: "Name and HTML content are required" },
        { status: 400 }
      );
    }

    const sanitizedHtml = sanitizeTemplate(html);

    const template = await prisma.template.create({
      data: {
        name,
        description,
        category,
        html: sanitizedHtml,
        css: css || null,
        js: js || null,
        authorId: session.user.id,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
