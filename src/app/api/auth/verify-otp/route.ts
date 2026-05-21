import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const otp = await prisma.otp.findFirst({
      where: {
        email: normalizedEmail,
        code,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    // Mark as verified
    await prisma.otp.update({
      where: { id: otp.id },
      data: { verified: true },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
