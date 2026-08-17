const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const getCommonHeader = () => `
      <div style="background-color: #ffffff; padding: 32px 32px 24px; text-align: center; border-bottom: 4px solid #E25B45;">
        <div style="display: inline-block; padding: 8px 16px; background-color: rgba(226, 91, 69, 0.1); border: 1px solid rgba(226, 91, 69, 0.2); border-radius: 12px; margin-bottom: 12px;">
          <span style="font-size: 28px; font-weight: 900; font-style: italic; color: #2563eb; letter-spacing: 1px;">LSEd</span>
          <span style="font-size: 16px; font-weight: 900; color: #0f172a; letter-spacing: 2px; margin-left: 4px;">RUNNING 2569</span>
        </div>
        <div style="font-size: 14px; font-weight: 800; color: #7F1D1D; text-transform: uppercase; letter-spacing: 2px;">
          Run to Shine <span style="color: #E25B45;">✨</span>
        </div>
        <div style="font-size: 12px; font-weight: 700; color: #64748b; margin-top: 4px;">โครงการวิ่งฉายแสง</div>
      </div>
`;

const getCommonFooter = () => `
      <div style="background-color: #f8fafc; padding: 32px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0 0 8px; font-weight: bold; color: #64748b;">คณะวิทยาการเรียนรู้และศึกษาศาสตร์ มหาวิทยาลัยธรรมศาสตร์</p>
        <p style="margin: 0 0 16px;">ขอบพระคุณที่ร่วมเป็นส่วนหนึ่งในการสนับสนุนกองทุนการเรียนรู้และทุนการศึกษา</p>
        <p style="margin: 0; font-size: 11px;">© 2026 LSEd TU. All rights reserved.</p>
      </div>
`;

const replacementCode = `
const getRegistrationEmailHtml = (reg: Registration) => {
  const isDonation = reg.distance === "donation";
  return \`
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; background-color: #ffffff; color: #1e293b; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
\${` + '`' + getCommonHeader() + '`' + `}
      <div style="padding: 40px 32px; line-height: 1.7;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background-color: #eff6ff; color: #2563eb; font-size: 13px; font-weight: 800; padding: 6px 16px; border-radius: 20px; letter-spacing: 1px; margin-bottom: 12px;">ขั้นตอนที่ 1 / 2</div>
          <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #0f172a;">รอการชำระเงินของคุณ</h2>
          <p style="color: #64748b; margin-top: 8px; font-size: 15px;">สวัสดีคุณ <strong>\${reg.firstName} \${reg.lastName}</strong>, ขอบคุณสำหรับการสมัครเข้าร่วมกิจกรรม!</p>
        </div>

        <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 16px; padding: 20px; text-align: center; margin: 0 0 32px 0;">
          <p style="margin: 0 0 8px; font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">รหัสลงทะเบียน (Ref ID)</p>
          <span style="font-family: monospace; font-size: 28px; font-weight: 900; color: #E25B45; letter-spacing: 2px;">\${reg.id}</span>
        </div>

        <h3 style="color: #0f172a; font-size: 16px; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 16px;">สรุปรายละเอียดการสมัคร</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 14px;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">ประเภท:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0f172a; text-align: right;">\${isDonation ? "บริจาคเพื่อการศึกษา" : reg.distance}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">ไซส์เสื้อ:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0f172a; text-align: right;">\${reg.shirtSize === "NONE" ? "ไม่รับเสื้อ" : reg.shirtSize}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">ยอดชำระสุทธิ:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 900; color: #E25B45; font-size: 18px; text-align: right;">\${reg.price} บาท</td>
          </tr>
        </table>

        <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; border-radius: 0 12px 12px 0; margin-bottom: 32px; font-size: 14px;">
          <p style="margin: 0 0 12px; font-weight: 800; color: #1e3a8a; font-size: 15px;">บัญชีสำหรับการโอนเงินชำระค่าสมัคร</p>
          <div style="background-color: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #bfdbfe; margin-bottom: 12px;">
            <p style="margin: 0 0 8px; color: #1e40af;"><span style="color: #64748b; font-size: 12px; display: block;">ธนาคาร</span> <strong>ทหารไทยธนชาต (ttb)</strong></p>
            <p style="margin: 0 0 8px; color: #1e40af;"><span style="color: #64748b; font-size: 12px; display: block;">เลขบัญชี</span> <strong style="font-size: 18px; letter-spacing: 1px;">123-4-56789-0</strong></p>
            <p style="margin: 0; color: #1e40af;"><span style="color: #64748b; font-size: 12px; display: block;">ชื่อบัญชี</span> <strong>คณะวิทยาการเรียนรู้และศึกษาศาสตร์ มหาวิทยาลัยธรรมศาสตร์</strong></p>
          </div>
          <p style="margin: 0; color: #1e40af; font-size: 12px; font-weight: bold;">*หลังจากโอนเงินแล้ว โปรดไปที่หน้าเว็บไซต์เพื่อแนบสลิปการโอนเงิน</p>
        </div>

        \${!isDonation ? \`
        <div style="text-align: center; margin-top: 32px;">
          <div style="font-size: 13px; color: #64748b; font-weight: bold;">พบกันวันอาทิตย์ที่ 13 ธันวาคม 2569</div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">ณ คณะ LSEd มธ.ศูนย์รังสิต • ปล่อยตัว 05:00 น.</div>
        </div>
        \` : \`
        <div style="text-align: center; margin-top: 32px; font-size: 13px; color: #166534; font-weight: bold; background-color: #f0fdf4; padding: 12px; border-radius: 8px;">
          ท่านสามารถนำไปลดหย่อนภาษีได้ 2 เท่า (ระบบจะส่งข้อมูลอัตโนมัติ)
        </div>
        \`}
      </div>
\${` + '`' + getCommonFooter() + '`' + `}
    </div>
  \`;
};

const getApprovalEmailHtml = (reg: Registration, appUrl: string) => {
  const isDonation = reg.distance === "donation";
  return \`
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; background-color: #ffffff; color: #1e293b; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
\${` + '`' + getCommonHeader() + '`' + `}
      <div style="padding: 40px 32px; line-height: 1.7;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background-color: #ecfdf5; color: #059669; font-size: 13px; font-weight: 800; padding: 6px 16px; border-radius: 20px; letter-spacing: 1px; margin-bottom: 12px;">✅ อนุมัติสำเร็จ</div>
          <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #0f172a;">การชำระเงินเสร็จสมบูรณ์</h2>
          <p style="color: #64748b; margin-top: 8px; font-size: 15px;">สวัสดีคุณ <strong>\${reg.firstName} \${reg.lastName}</strong>, สิทธิ์ของคุณได้รับการยืนยันแล้ว!</p>
        </div>

        <div style="background-color: #f0fdf4; border: 2px solid #34d399; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 32px; position: relative; overflow: hidden;">
          <div style="position: absolute; top: -10px; right: -10px; opacity: 0.1; font-size: 80px;">🏆</div>
          <p style="margin: 0 0 8px; font-size: 12px; font-weight: bold; color: #047857; text-transform: uppercase; letter-spacing: 1px; position: relative; z-index: 1;">
            \${isDonation ? "หมายเลขผู้บริจาค (Donor ID)" : "หมายเลขบิ๊บ (BIB) ของคุณ"}
          </p>
          <span style="font-family: monospace; font-size: 40px; font-weight: 900; color: #047857; letter-spacing: 2px; display: block; position: relative; z-index: 1;">\${reg.bibNumber}</span>
        </div>

        \${!isDonation ? \`
        <div style="background-color: #ffffff; border: 1px dashed #cbd5e1; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 32px;">
          <h3 style="color: #0f172a; margin: 0 0 16px; font-size: 16px;">QR Code สำหรับสแกนเข้างาน</h3>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=\${reg.id}&margin=10" alt="QR Code" style="border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);" />
          <p style="font-size: 12px; font-weight: bold; color: #64748b; margin: 12px 0 0;">โปรดแสดง QR Code นี้ หรือบอกเลขบิ๊บ ที่จุดลงทะเบียน</p>
        </div>
        \` : ''}

        <h3 style="color: #0f172a; font-size: 16px; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 16px;">ข้อมูลสรุปสิทธิ์ของคุณ</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 14px;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">รหัสลงทะเบียน:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0f172a; text-align: right;">\${reg.id}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">ประเภท:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #2563eb; text-align: right;">\${isDonation ? "บริจาคเพื่อการศึกษา" : reg.distance}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">ไซส์เสื้อ:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0f172a; text-align: right;">\${reg.shirtSize === "NONE" ? "-" : reg.shirtSize}</td>
          </tr>
        </table>

        \${!isDonation ? \`
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 32px;">
          <p style="margin: 0 0 12px; font-weight: 800; color: #0f172a; font-size: 15px;">การรับอุปกรณ์ (บิ๊บและเสื้อ)</p>
          \${reg.shippingMethod === 'delivery' 
            ? \`<div style="display: flex; align-items: flex-start; gap: 12px;">
                 <span style="font-size: 20px;">🚚</span>
                 <div>
                   <p style="margin: 0 0 4px; font-weight: bold; color: #334155; font-size: 14px;">จัดส่งทางไปรษณีย์</p>
                   <p style="margin: 0; color: #64748b; font-size: 13px;">ระบบจะจัดส่งพัสดุตามที่อยู่ของท่าน และส่งอีเมลแจ้งเลข Tracking เมื่อเริ่มจัดส่งแล้ว</p>
                 </div>
               </div>\`
            : \`<div style="display: flex; align-items: flex-start; gap: 12px;">
                 <span style="font-size: 20px;">🎪</span>
                 <div>
                   <p style="margin: 0 0 4px; font-weight: bold; color: #334155; font-size: 14px;">รับด้วยตนเองหน้างาน</p>
                   <p style="margin: 0; color: #64748b; font-size: 13px;">โปรดเตรียม QR Code นี้มาแสดงตนที่จุดรับอุปกรณ์ในวันเสาร์ก่อนวันแข่งขัน หรือเช้าวันแข่งขัน</p>
                 </div>
               </div>\`
          }
        </div>
        \` : ''}

        <div style="text-align: center; margin-top: 40px; margin-bottom: 8px;">
          <a href="\${appUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 800; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">ตรวจสอบสถานะบนเว็บไซต์</a>
        </div>
      </div>
\${` + '`' + getCommonFooter() + '`' + `}
    </div>
  \`;
};

const getRejectionEmailHtml = (reg: Registration, reason: string) => {
  return \`
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; background-color: #ffffff; color: #1e293b; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
\${` + '`' + getCommonHeader() + '`' + `}
      <div style="padding: 40px 32px; line-height: 1.7;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background-color: #fef2f2; color: #e11d48; font-size: 13px; font-weight: 800; padding: 6px 16px; border-radius: 20px; letter-spacing: 1px; margin-bottom: 12px;">⚠️ พบปัญหาในการชำระเงิน</div>
          <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #0f172a;">สลิปโอนเงินไม่ผ่านการตรวจสอบ</h2>
          <p style="color: #64748b; margin-top: 8px; font-size: 15px;">สวัสดีคุณ <strong>\${reg.firstName} \${reg.lastName}</strong>, สลิปที่ท่านแนบมาไม่ผ่านการตรวจสอบจากแอดมิน</p>
        </div>

        <div style="background-color: #fff1f2; border-left: 4px solid #e11d48; padding: 20px; border-radius: 0 12px 12px 0; margin-bottom: 32px;">
          <p style="margin: 0 0 8px; font-weight: 800; color: #9f1239; font-size: 14px;">เหตุผลจากผู้ตรวจสอบ:</p>
          <p style="margin: 0; color: #be123c; font-size: 15px;">\${reason}</p>
        </div>

        <h3 style="color: #0f172a; font-size: 16px; margin-bottom: 16px;">วิธีดำเนินการแก้ไข</h3>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 32px;">
          <ol style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px;">
            <li style="margin-bottom: 12px;">ไปที่หน้าเว็บไซต์ <strong>"ตรวจสอบสิทธิ์ / ส่งสลิป"</strong></li>
            <li style="margin-bottom: 12px;">กรอกเบอร์โทร, บัตรประชาชน, หรือรหัส: <strong>\${reg.id}</strong></li>
            <li>อัปโหลดสลิปใหม่ให้ตรงกับยอดชำระ <strong>\${reg.price} บาท</strong></li>
          </ol>
        </div>

      </div>
\${` + '`' + getCommonFooter() + '`' + `}
    </div>
  \`;
};

const getShippingEmailHtml = (reg: Registration, appUrl: string) => {
  const carrierMap: Record<string, string> = {
    thailandpost: "ไปรษณีย์ไทย (EMS)",
    flash: "Flash Express",
    kerry: "Kerry Express",
    jandt: "J&T Express",
  };
  const carrierName = carrierMap[reg.shippingCarrier || ""] || reg.shippingCarrier || "ไปรษณีย์ไทย (EMS)";
  
  let trackingUrl = \`https://track.thailandpost.co.th/?trackNumber=\${reg.shippingTrackingNumber}\`;
  if (reg.shippingCarrier === "flash") trackingUrl = \`https://flashexpress.co.th/tracking/?se=\${reg.shippingTrackingNumber}\`;
  else if (reg.shippingCarrier === "kerry") trackingUrl = \`https://th.kerryexpress.com/th/track/?track=\${reg.shippingTrackingNumber}\`;
  else if (reg.shippingCarrier === "jandt") trackingUrl = \`https://www.jtexpress.co.th/index/query/query.html?billNo=\${reg.shippingTrackingNumber}\`;

  return \`
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; background-color: #ffffff; color: #1e293b; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
\${` + '`' + getCommonHeader() + '`' + `}
      <div style="padding: 40px 32px; line-height: 1.7;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background-color: #fff7ed; color: #ea580c; font-size: 13px; font-weight: 800; padding: 6px 16px; border-radius: 20px; letter-spacing: 1px; margin-bottom: 12px;">📦 จัดส่งพัสดุแล้ว</div>
          <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #0f172a;">พัสดุของคุณอยู่ระหว่างทาง!</h2>
          <p style="color: #64748b; margin-top: 8px; font-size: 15px;">สวัสดีคุณ <strong>\${reg.firstName} \${reg.lastName}</strong>, อุปกรณ์วิ่งของคุณถูกจัดส่งแล้ว</p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">หมายเลขพัสดุ (Tracking)</p>
            <span style="font-family: monospace; font-size: 28px; font-weight: 900; color: #ea580c; letter-spacing: 1px; display: block; word-break: break-all;">\${reg.shippingTrackingNumber}</span>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">ผู้ให้บริการจัดส่ง:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0f172a; text-align: right;">\${carrierName}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">วันที่จัดส่ง:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0f172a; text-align: right;">\${reg.shippedAt || "วันนี้"}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">หมายเลขบิ๊บในกล่อง:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0f172a; text-align: right;">\${reg.bibNumber || "-"}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin-bottom: 32px;">
          <a href="\${trackingUrl}" target="_blank" style="background-color: #ea580c; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 800; display: inline-block; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.25); width: 100%; max-width: 280px; box-sizing: border-box; margin-bottom: 12px;">คลิกเพื่อติดตามพัสดุ ↗</a>
          <a href="\${appUrl}" target="_blank" style="background-color: #f1f5f9; color: #334155; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 800; display: inline-block; border: 1px solid #cbd5e1; width: 100%; max-width: 280px; box-sizing: border-box;">ตรวจสอบสถานะบนเว็บไซต์</a>
        </div>

        <div style="font-size: 13px; color: #64748b; line-height: 1.6; text-align: center; background-color: #f8fafc; padding: 16px; border-radius: 12px;">
          <span style="font-size: 20px; display: block; margin-bottom: 8px;">💡</span>
          ระบบติดตามพัสดุอาจใช้เวลาประมาณ 12-24 ชั่วโมงในการอัปเดตข้อมูลขึ้นระบบ หากท่านยังไม่พบข้อมูล กรุณาเว้นระยะเวลาและตรวจสอบอีกครั้ง
        </div>
      </div>
\${` + '`' + getCommonFooter() + '`' + `}
    </div>
  \`;
};
`;

// Extract everything from `const getRegistrationEmailHtml` down to the end of `getShippingEmailHtml` and replace it.
// To do this safely, we find the index of `const getRegistrationEmailHtml`
// and the index of `// Pricing config` which comes right after the email templates.

const startIndex = code.indexOf('const getRegistrationEmailHtml');
const endIndex = code.indexOf('// Pricing config');

if (startIndex !== -1 && endIndex !== -1) {
  const newCode = code.substring(0, startIndex) + replacementCode + '\n' + code.substring(endIndex);
  fs.writeFileSync('server.ts', newCode);
  console.log("Replaced email templates perfectly!");
} else {
  console.error("Could not find the indices!");
}

