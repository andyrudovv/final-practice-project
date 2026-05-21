import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirnameSeed = path.dirname(__filename);

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@doctemplate.local" },
    update: {},
    create: {
      email: "admin@doctemplate.local",
      name: "Administrator",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("Created admin user:", admin.email);

  const userPassword = await bcrypt.hash("user123", 12);
  const user = await prisma.user.upsert({
    where: { email: "user@doctemplate.local" },
    update: {},
    create: {
      email: "user@doctemplate.local",
      name: "Demo User",
      password: userPassword,
      role: "USER",
    },
  });
  console.log("Created demo user:", user.email);

  const templatePath = path.join(__dirnameSeed, "..", "..", "application-form.html");
  let templateHtml = "";
  try {
    templateHtml = fs.readFileSync(templatePath, "utf-8");
    console.log("Loaded application-form.html from", templatePath);
  } catch {
    console.log("application-form.html not found, using embedded fallback");
    templateHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Sample Application</title>
  <style>
    body { font-family: "Times New Roman", serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { text-align: center; }
    .field { margin: 10px 0; }
    .field label { display: block; font-weight: bold; margin-bottom: 4px; }
    .field input { width: 100%; padding: 6px; border: 1px solid #ccc; font-family: inherit; }
    .body-content { min-height: 200px; border: 1px solid #ccc; padding: 10px; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>APPLICATION</h1>
  <div class="field"><label>Full Name:</label><input type="text" placeholder="Enter your full name" /></div>
  <div class="field"><label>Date:</label><input type="date" /></div>
  <div class="body-content" contenteditable="true"><p>Enter your application text here...</p></div>
  <div class="field"><label>Signature:</label><input type="text" placeholder="Your signature" /></div>
</body>
</html>`;
  }

  await prisma.template.upsert({
    where: { id: "seed-application-form" },
    update: { html: templateHtml },
    create: {
      id: "seed-application-form",
      name: "Application Form",
      description: "A formal application/explanation letter template with print layout, form fields, and variant selection.",
      category: "Forms",
      html: templateHtml,
      authorId: admin.id,
    },
  });
  console.log("Created template: Application Form");

  await prisma.template.upsert({
    where: { id: "seed-business-letter" },
    update: {},
    create: {
      id: "seed-business-letter",
      name: "Business Letter",
      description: "A professional business letter template with sender/recipient fields, date, and formal formatting.",
      category: "Letters",
      html: `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Business Letter</title>
  <style>
    @page { size: A4 portrait; margin: 25mm 20mm; }
    * { box-sizing: border-box; }
    body { font-family: "Times New Roman", serif; font-size: 12pt; line-height: 1.6; color: #111; margin: 0; padding: 0; background: #fff; }
    .page { max-width: 170mm; margin: 0 auto; padding: 20mm 0; }
    .sender { margin-bottom: 30px; }
    .sender-name { font-weight: bold; font-size: 14pt; }
    .date-line { margin: 20px 0; }
    .recipient { margin-bottom: 30px; }
    .subject { font-weight: bold; margin: 20px 0; }
    .body-text { min-height: 200px; margin: 20px 0; }
    .closing { margin-top: 40px; }
    .signature-line { margin-top: 60px; border-top: 1px solid #111; width: 200px; padding-top: 5px; }
    input[type="text"], input[type="date"] { border: none; border-bottom: 1px solid #999; font-family: inherit; font-size: inherit; padding: 2px 4px; width: 250px; outline: none; }
    input:focus { border-bottom-color: #6366f1; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="sender">
      <div class="sender-name"><input type="text" placeholder="Your Name" /></div>
      <div><input type="text" placeholder="Your Address" /></div>
      <div><input type="text" placeholder="City, Country" /></div>
      <div><input type="text" placeholder="Email" /></div>
      <div><input type="text" placeholder="Phone" /></div>
    </div>
    <div class="date-line"><input type="date" /></div>
    <div class="recipient">
      <div><input type="text" placeholder="Recipient Name" /></div>
      <div><input type="text" placeholder="Company / Organization" /></div>
      <div><input type="text" placeholder="Address" /></div>
      <div><input type="text" placeholder="City, Country" /></div>
    </div>
    <div class="subject">Re: <input type="text" placeholder="Subject of the letter" style="width: 400px;" /></div>
    <div class="body-text" contenteditable="true">
      <p>Dear Sir/Madam,</p>
      <p>I am writing to you regarding...</p>
      <p>Thank you for your attention to this matter.</p>
    </div>
    <div class="closing">
      <p>Sincerely,</p>
      <div class="signature-line"><input type="text" placeholder="Your Name" /></div>
    </div>
  </div>
</body>
</html>`,
      authorId: admin.id,
    },
  });
  console.log("Created template: Business Letter");

  await prisma.template.upsert({
    where: { id: "seed-certificate" },
    update: {},
    create: {
      id: "seed-certificate",
      name: "Certificate of Completion",
      description: "A formal certificate template with decorative border, suitable for courses and achievements.",
      category: "Certificates",
      html: `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Certificate of Completion</title>
  <style>
    @page { size: A4 landscape; margin: 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, serif; background: #fff; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .certificate { width: 270mm; min-height: 180mm; border: 3px solid #1a365d; padding: 20mm; text-align: center; position: relative; }
    .certificate::before { content: ''; position: absolute; inset: 5mm; border: 1px solid #c9a84c; pointer-events: none; }
    .cert-title { font-size: 28pt; color: #1a365d; font-variant: small-caps; letter-spacing: 3px; margin-bottom: 10mm; }
    .cert-subtitle { font-size: 14pt; color: #666; margin-bottom: 15mm; }
    .cert-name { font-size: 24pt; color: #1a365d; border-bottom: 2px solid #c9a84c; display: inline-block; padding: 5px 40px; margin-bottom: 10mm; min-width: 200px; }
    .cert-name input { border: none; text-align: center; font-family: inherit; font-size: inherit; color: inherit; outline: none; width: 100%; background: transparent; }
    .cert-body { font-size: 12pt; color: #444; line-height: 1.8; margin-bottom: 15mm; }
    .cert-body input { border: none; border-bottom: 1px solid #ccc; font-family: inherit; font-size: inherit; outline: none; text-align: center; width: 200px; }
    .cert-footer { display: flex; justify-content: space-around; margin-top: 20mm; }
    .cert-sig { text-align: center; }
    .cert-sig-line { border-top: 1px solid #333; width: 150px; margin: 0 auto 5px; }
    .cert-sig input { border: none; text-align: center; font-family: inherit; font-size: 10pt; outline: none; width: 150px; }
    .cert-sig-label { font-size: 9pt; color: #888; }
    @media print { body { background: none; } }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="cert-title">Certificate of Completion</div>
    <div class="cert-subtitle">This is to certify that</div>
    <div class="cert-name"><input type="text" placeholder="Recipient Name" /></div>
    <div class="cert-body">
      has successfully completed the
      <input type="text" placeholder="course / program name" style="width: 300px;" />
      <br />on <input type="date" /> with distinction.
    </div>
    <div class="cert-footer">
      <div class="cert-sig">
        <div class="cert-sig-line"></div>
        <input type="text" placeholder="Director Name" />
        <div class="cert-sig-label">Director</div>
      </div>
      <div class="cert-sig">
        <div class="cert-sig-line"></div>
        <input type="text" placeholder="Instructor Name" />
        <div class="cert-sig-label">Instructor</div>
      </div>
    </div>
  </div>
</body>
</html>`,
      authorId: admin.id,
    },
  });
  console.log("Created template: Certificate of Completion");

  console.log("\n--- Seed complete ---");
  console.log("Admin login: admin@doctemplate.local / admin123");
  console.log("User login:  user@doctemplate.local / user123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
