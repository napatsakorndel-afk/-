const fs = require('fs');
let code = fs.readFileSync('src/components/StatusChecker.tsx', 'utf8');

// Remove import
code = code.replace(/import { QRCodeCanvas } from "qrcode\.react";\n?/, '');

// Remove QR code section
const qrRegex = /\{\/\* QR CODE DISPLAY \*\/\}.*?แสกน QR Code นี้ ณ จุดเช็คอินในวันงาน<\/p>\s*<\/div>/s;
code = code.replace(qrRegex, '');

fs.writeFileSync('src/components/StatusChecker.tsx', code);
console.log("Patched StatusChecker");
