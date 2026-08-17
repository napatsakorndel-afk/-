const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const originalTableHTML = `        \${!isDonation ? \`
        <h3 style="color: #0f172a;">ข้อมูลกิจกรรมเพิ่มเติม</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; width: 120px;">วันจัดงาน:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">วันอาทิตย์ที่ 13 ธันวาคม 2569</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">จุดปล่อยตัว:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #1d4ed8;">SC3 วิ่งวนกลับมาที่คณะ LSEd มธ.ศูนย์รังสิต</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">กำหนดการเช้าตรู่:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">ปล่อยตัวเริ่มตั้งแต่เวลา 05:00 น. เป็นต้นไป</td>
          </tr>
        </table>
        \` : \``;

const newTableHTML = `        \${!isDonation ? \`
        <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
          <h3 style="color: #0f172a; margin-top: 0;">QR Code สำหรับสแกนเข้างาน</h3>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=\${reg.id}" alt="QR Code" style="margin-top: 8px; border-radius: 8px;" />
          <p style="font-size: 12px; color: #64748b; margin-bottom: 0; margin-top: 12px;">โปรดแสดง QR Code นี้ที่จุดลงทะเบียนในวันงาน</p>
        </div>
        <h3 style="color: #0f172a;">ข้อมูลกิจกรรมเพิ่มเติม</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; width: 120px;">วันจัดงาน:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">วันอาทิตย์ที่ 13 ธันวาคม 2569</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">จุดปล่อยตัว:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #1d4ed8;">SC3 วิ่งวนกลับมาที่คณะ LSEd มธ.ศูนย์รังสิต</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">กำหนดการเช้าตรู่:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">ปล่อยตัวเริ่มตั้งแต่เวลา 05:00 น. เป็นต้นไป</td>
          </tr>
        </table>
        
        <h3 style="color: #0f172a;">การรับอุปกรณ์ (บิ๊บและเสื้อ)</h3>
        <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; font-size: 14px; color: #0369a1; margin-bottom: 24px;">
          \${reg.shippingMethod === 'delivery' 
            ? \`<p style="margin: 0 0 8px; font-weight: bold;">ท่านได้เลือกรับอุปกรณ์ทางไปรษณีย์</p>
               <p style="margin: 0;">ทางทีมงานจะจัดส่งอุปกรณ์ให้ท่านตามที่อยู่ที่ระบุไว้ โปรดรอรับหมายเลขพัสดุ (Tracking Number) โดยท่านสามารถตรวจสอบสถานะได้ที่เว็บไซต์ในเมนู "ตรวจสอบสถานะ"</p>\`
            : \`<p style="margin: 0 0 8px; font-weight: bold;">ท่านได้เลือกรับอุปกรณ์ด้วยตนเอง</p>
               <p style="margin: 0;">กรุณาติดต่อรับอุปกรณ์ที่จุดลงทะเบียนในวันงาน โดยใช้รหัสอ้างอิงและ QR Code ด้านบน</p>\`
          }
        </div>
        \` : \``;

code = code.replace(originalTableHTML, newTableHTML);

const endTarget = `<p style="margin-top: 24px; font-size: 13px; color: #475569;">ขอบพระคุณที่ร่วมเป็นส่วนหนึ่งของกิจกรรมวิ่ง-ฉาย-แสง เพื่อขับเคลื่อนพัฒนาการศึกษาไทยยั่งยืนร่วมกันครับ!</p>`;
const endReplacement = `<div style="text-align: center; margin-top: 32px; margin-bottom: 16px;">
          <a href="\${appUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">ตรวจสอบสถานะการสมัครบนเว็บไซต์</a>
        </div>
        <p style="margin-top: 24px; font-size: 13px; color: #475569; text-align: center;">ขอบพระคุณที่ร่วมเป็นส่วนหนึ่งของกิจกรรมวิ่ง-ฉาย-แสง เพื่อขับเคลื่อนพัฒนาการศึกษาไทยยั่งยืนร่วมกันครับ!</p>`;

code = code.replace(endTarget, endReplacement);

code = code.replace(
  'const getApprovalEmailHtml = (reg: Registration) => {',
  'const getApprovalEmailHtml = (reg: Registration, appUrl: string) => {'
);

code = code.replace(
  'const emailHtml = getApprovalEmailHtml(reg);',
  'const appUrl = req.headers.origin || req.protocol + "://" + req.get("host");\\n    const emailHtml = getApprovalEmailHtml(reg, appUrl);'
);

fs.writeFileSync('server.ts', code);
console.log("Success patch email template");
