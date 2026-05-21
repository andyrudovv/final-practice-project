import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeTemplate } from "@/lib/sanitize";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const category = formData.get("category") as string | null;

    if (!file || !name) {
      return NextResponse.json(
        { error: "File and name are required" },
        { status: 400 }
      );
    }

    if (!file.name.endsWith(".html") && !file.name.endsWith(".htm")) {
      return NextResponse.json(
        { error: "Only .html and .htm files are supported" },
        { status: 400 }
      );
    }

    const htmlContent = await file.text();

    if (htmlContent.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File is too large (max 5MB)" },
        { status: 400 }
      );
    }

    const sanitizedHtml = sanitizeTemplate(htmlContent);

    const template = await prisma.template.create({
      data: {
        name,
        description,
        category,
        html: sanitizedHtml,
        authorId: session.user.id,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to upload template" },
      { status: 500 }
    );
  }
}
