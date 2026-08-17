const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ Nodemailer SMTP Transporter[\s\S]*?const getTransporter = async \(\) => \{[\s\S]*?return null;\n  \}\n\};/g;

const newCode = `// Nodemailer SMTP Transporter
let cachedTransporter: any = null;

const getTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    if (!cachedTransporter) {
      cachedTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
    return cachedTransporter;
  }
  
  if (cachedTransporter) return cachedTransporter;

  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    return cachedTransporter;
  } catch (err) {
    console.error("Failed to create Ethereal test account, using console logging fallback:", err);
    return null;
  }
};`;

if (regex.test(code)) {
    code = code.replace(regex, newCode);
    fs.writeFileSync('server.ts', code);
    console.log("Success transporter");
} else {
    console.log("Transporter regex failed");
}
