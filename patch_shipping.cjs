const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Add appUrl param
code = code.replace(
  'const getShippingEmailHtml = (reg: Registration) => {',
  'const getShippingEmailHtml = (reg: Registration, appUrl: string) => {'
);

const target = `<div style="text-align: center; margin: 32px 0;">
          <a href="\${trackingUrl}" target="_blank" style="background-color: #ea580c; color: #ffffff; padding: 14px 28px; font-weight: bold; text-decoration: none; border-radius: 12px; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(234, 88, 12, 0.2); display: inline-block;">
            คลิกเพื่อติดตามพัสดุ ↗
          </a>
        </div>`;
        
const replacement = `<div style="text-align: center; margin: 32px 0; display: flex; flex-direction: column; gap: 12px; align-items: center;">
          <a href="\${trackingUrl}" target="_blank" style="background-color: #ea580c; color: #ffffff; padding: 14px 28px; font-weight: bold; text-decoration: none; border-radius: 12px; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(234, 88, 12, 0.2); display: inline-block; width: 100%; max-width: 250px;">
            คลิกเพื่อติดตามพัสดุ ↗
          </a>
          <a href="\${appUrl}" target="_blank" style="background-color: #f1f5f9; color: #334155; padding: 12px 24px; font-weight: bold; text-decoration: none; border-radius: 12px; font-size: 14px; border: 1px solid #cbd5e1; display: inline-block; width: 100%; max-width: 250px;">
            ตรวจสอบสถานะบนเว็บไซต์
          </a>
        </div>`;
        
code = code.replace(target, replacement);

const apiHandlerTarget = `const emailHtml = getShippingEmailHtml(reg);`;
const apiHandlerReplacement = `const appUrl = req.headers.origin || req.protocol + "://" + req.get("host");\\n    const emailHtml = getShippingEmailHtml(reg, appUrl);`;
code = code.replace(apiHandlerTarget, apiHandlerReplacement);

fs.writeFileSync('server.ts', code);
console.log("Success patch shipping email template");
