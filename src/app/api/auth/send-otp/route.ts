import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOtp, sendOtpEmail } from "@/lib/mail";

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MS = 60 * 1000; // 1 minute between sends

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Rate-limit: don't send another OTP if one was sent less than 60s ago
    const recent = await prisma.otp.findFirst({
      where: {
        email: normalizedEmail,
        createdAt: { gt: new Date(Date.now() - RATE_LIMIT_MS) },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recent) {
      return NextResponse.json(
        { error: "Please wait before requesting another code" },
        { status: 429 }
      );
    }

    // Clean up old OTPs for this email
    await prisma.otp.deleteMany({ where: { email: normalizedEmail } });

    const code = generateOtp();

    await prisma.otp.create({
      data: {
        email: normalizedEmail,
        code,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    await sendOtpEmail(normalizedEmail, code);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("send-otp error:", err);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
