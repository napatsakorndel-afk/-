const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ Send confirmation email asynchronously\s*const emailHtml = getRegistrationEmailHtml\(newReg\);\s*const emailPreviewUrl = await sendEmail\(newReg\.email, "ยืนยันการลงทะเบียน วิ่ง-ฉาย-แสง \(LSEd Running 2569\)", emailHtml\);\s*const settings = await getPaymentSettings\(\);\s*res\.status\(201\)\.json\(\{[\s\S]*?emailPreviewUrl: emailPreviewUrl \|\| undefined\s*\}\);/;

const newCode = `// Send confirmation email asynchronously (do not await to prevent blocking)
    const emailHtml = getRegistrationEmailHtml(newReg);
    sendEmail(newReg.email, "ยืนยันการลงทะเบียน วิ่ง-ฉาย-แสง (LSEd Running 2569)", emailHtml).catch(err => console.error("Email send failed:", err));
    const settings = await getPaymentSettings();
    res.status(201).json({
      ...newReg,
      ...getEnrichedPaymentDetails(newReg, settings)
    });`;

if (regex.test(code)) {
    code = code.replace(regex, newCode);
    fs.writeFileSync('server.ts', code);
    console.log("Success register async");
} else {
    console.log("Register regex failed");
}
