import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOtpEmail(to: string, code: string) {
  await transporter.sendMail({
    from: `"DocTemplate" <${process.env.SMTP_USER}>`,
    to,
    subject: "Your verification code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #4f46e5; margin-bottom: 8px;">DocTemplate</h2>
        <p style="color: #374151; font-size: 15px;">Your verification code is:</p>
        <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #111827;">${code}</span>
        </div>
        <p style="color: #6b7280; font-size: 13px;">This code expires in 5 minutes. If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  });
}
