import express from "express";
import path from "path";
import compression from "compression";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { Registration, DistanceType, ShirtSizeType, EventStats } from "./src/types.js";
import { generatePromptPayPayload } from "./src/lib/promptpay.js";
import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from "firebase/firestore";
import nodemailer from "nodemailer";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(compression());
const PORT = 3000;

// Increase payload limit for base64 upload of slip images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBWtJ0COzNmGKWmbGotCDvVbgLiCJnFRnI",
  authDomain: "natural-operand-mfs6l.firebaseapp.com",
  projectId: "natural-operand-mfs6l",
  storageBucket: "natural-operand-mfs6l.firebasestorage.app",
  messagingSenderId: "605399316499",
  appId: "1:605399316499:web:ea5d227ea922070bcc67e6"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = initializeFirestore(firebaseApp, {
  ignoreUndefinedProperties: true
}, "ai-studio-lsedrunning2569-a9736ca5-e9f6-446e-8815-2ce4dfe58c8a");

// Helper to get active payment settings
let cachedPayment: any = null;
let paymentCacheTime = 0;
const getPaymentSettings = async () => {
  if (cachedPayment && Date.now() - paymentCacheTime < 60000) {
    return cachedPayment;
  }
  const defaults = {
    regular: {
      bankName: "ทหารไทยธนชาต (ttb)",
      accountNo: process.env.PROMPTPAY_ID || "0830131768",
      accountName: process.env.PROMPTPAY_NAME || "นาย นภัสกร กลิ่นเฟื่อง",
      qrImage: ""
    },
    taxDeduct: {
      bankName: "ธนาคารกรุงไทย (มธ.)",
      accountNo: "022-0-12345-6",
      accountName: "มธ.คณะวิทยาการเรียนรู้และศึกษาศาสตร์ (เงินบริจาค e-Donation)",
      qrImage: ""
    }
  };
  try {
    const docRef = doc(db, "settings", "payment");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      cachedPayment = {
        regular: {
          bankName: data.regular?.bankName || defaults.regular.bankName,
          accountNo: data.regular?.accountNo || defaults.regular.accountNo,
          accountName: data.regular?.accountName || defaults.regular.accountName,
          qrImage: data.regular?.qrImage || defaults.regular.qrImage
        },
        taxDeduct: {
          bankName: data.taxDeduct?.bankName || defaults.taxDeduct.bankName,
          accountNo: data.taxDeduct?.accountNo || defaults.taxDeduct.accountNo,
          accountName: data.taxDeduct?.accountName || defaults.taxDeduct.accountName,
          qrImage: data.taxDeduct?.qrImage || defaults.taxDeduct.qrImage
        }
      };
      paymentCacheTime = Date.now();
      return cachedPayment;
    }
  } catch (err) {
    console.error("Error reading payment settings from Firestore:", err);
  }
  return defaults;
};

// Helper to enrich a registration with the correct selected payment channel
const getEnrichedPaymentDetails = (reg: any, settings: any) => {
  // Use settings.regular for ALL registrations now as requested by user ("เปลี่ยนเป็นใช้บัญชีเดียวในการรับเงินแล้ว")
  const acct = settings.regular;

  let qrImage = "";
  // If no custom uploaded image is provided, we can dynamically fallback to generating a PromptPay QR payload if the accountNo looks like a PromptPay ID
  if (!qrImage) {
    const cleanNo = acct.accountNo.replace(/[^0-9]/g, "");
    const payload = generatePromptPayPayload(cleanNo, reg.price);
    qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=002d63&data=${encodeURIComponent(payload)}`;
  }

  return {
    paymentBankName: acct.bankName,
    paymentAccountNo: acct.accountNo,
    paymentAccountName: acct.accountName,
    paymentQrImage: qrImage,
    // Keep backward compatibility
    qrPayload: generatePromptPayPayload(acct.accountNo.replace(/[^0-9]/g, ""), reg.price),
    qrAccountName: acct.accountName
  };
};

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Read database from Firestore
const readDB = async (): Promise<Registration[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "registrations"));
    const list: Registration[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Registration);
    });
    return list;
  } catch (error) {
    console.error("Error reading from Firestore:", error);
    return [];
  }
};

// Nodemailer SMTP Transporter
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
};

const sendEmail = async (to: string, subject: string, html: string): Promise<string | null> => {
  try {
    const transporter = await getTransporter();
    if (!transporter) {
      console.log("No SMTP Transporter available. Simulating email send to:", to);
      console.log("Subject:", subject);
      return null;
    }
    
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"วิ่ง-ฉาย-แสง (LSEd Running)" <noreply@lsed-run69.com>',
      to,
      subject,
      html,
    });
    
    console.log("Email sent successfully to:", to);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log("Ethereal Email Preview URL:", previewUrl);
      return previewUrl;
    }
    return "SENT";
  } catch (err) {
    console.error("Error sending email:", err);
    return null;
  }
};

// Email templates

const getRegistrationEmailHtml = (reg: Registration) => {
  const isDonation = reg.distance === "donation";
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; background-color: #ffffff; color: #1e293b; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
${`
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
`}
      <div style="padding: 40px 32px; line-height: 1.7;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background-color: #eff6ff; color: #2563eb; font-size: 13px; font-weight: 800; padding: 6px 16px; border-radius: 20px; letter-spacing: 1px; margin-bottom: 12px;">ขั้นตอนที่ 1 / 2</div>
          <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #0f172a;">รอการชำระเงินของคุณ</h2>
          <p style="color: #64748b; margin-top: 8px; font-size: 15px;">สวัสดีคุณ <strong>${reg.firstName} ${reg.lastName}</strong>, ขอบคุณสำหรับการสมัครเข้าร่วมกิจกรรม!</p>
        </div>

        <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 16px; padding: 20px; text-align: center; margin: 0 0 32px 0;">
          <p style="margin: 0 0 8px; font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">รหัสลงทะเบียน (Ref ID)</p>
          <span style="font-family: monospace; font-size: 28px; font-weight: 900; color: #E25B45; letter-spacing: 2px;">${reg.id}</span>
        </div>

        <h3 style="color: #0f172a; font-size: 16px; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 16px;">สรุปรายละเอียดการสมัคร</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 14px;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">ประเภท:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0f172a; text-align: right;">${isDonation ? "บริจาคเพื่อการศึกษา" : reg.distance}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">ไซส์เสื้อ:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0f172a; text-align: right;">${reg.shirtSize === "NONE" ? "ไม่รับเสื้อ" : reg.shirtSize}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">ยอดชำระสุทธิ:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 900; color: #E25B45; font-size: 18px; text-align: right;">${reg.price} บาท</td>
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

        ${!isDonation ? `
        <div style="text-align: center; margin-top: 32px;">
          <div style="font-size: 13px; color: #64748b; font-weight: bold;">พบกันวันอาทิตย์ที่ 13 ธันวาคม 2569</div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">ณ คณะ LSEd มธ.ศูนย์รังสิต • ปล่อยตัว 05:00 น.</div>
        </div>
        ` : `
        <div style="text-align: center; margin-top: 32px; font-size: 13px; color: #166534; font-weight: bold; background-color: #f0fdf4; padding: 12px; border-radius: 8px;">
          ท่านสามารถนำไปลดหย่อนภาษีได้ 2 เท่า (ระบบจะส่งข้อมูลอัตโนมัติ)
        </div>
        `}
      </div>
${`
      <div style="background-color: #f8fafc; padding: 32px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0 0 8px; font-weight: bold; color: #64748b;">คณะวิทยาการเรียนรู้และศึกษาศาสตร์ มหาวิทยาลัยธรรมศาสตร์</p>
        <p style="margin: 0 0 16px;">ขอบพระคุณที่ร่วมเป็นส่วนหนึ่งในการสนับสนุนกองทุนการเรียนรู้และทุนการศึกษา</p>
        <p style="margin: 0; font-size: 11px;">© 2026 LSEd TU. All rights reserved.</p>
      </div>
`}
    </div>
  `;
};

const getApprovalEmailHtml = (reg: Registration, appUrl: string) => {
  const isDonation = reg.distance === "donation";
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; background-color: #ffffff; color: #1e293b; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
${`
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
`}
      <div style="padding: 40px 32px; line-height: 1.7;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background-color: #ecfdf5; color: #059669; font-size: 13px; font-weight: 800; padding: 6px 16px; border-radius: 20px; letter-spacing: 1px; margin-bottom: 12px;">✅ อนุมัติสำเร็จ</div>
          <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #0f172a;">การชำระเงินเสร็จสมบูรณ์</h2>
          <p style="color: #64748b; margin-top: 8px; font-size: 15px;">สวัสดีคุณ <strong>${reg.firstName} ${reg.lastName}</strong>, สิทธิ์ของคุณได้รับการยืนยันแล้ว!</p>
        </div>

        <div style="background-color: #f0fdf4; border: 2px solid #34d399; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 32px; position: relative; overflow: hidden;">
          <div style="position: absolute; top: -10px; right: -10px; opacity: 0.1; font-size: 80px;">🏆</div>
          <p style="margin: 0 0 8px; font-size: 12px; font-weight: bold; color: #047857; text-transform: uppercase; letter-spacing: 1px; position: relative; z-index: 1;">
            ${isDonation ? "หมายเลขผู้บริจาค (Donor ID)" : "หมายเลขบิ๊บ (BIB) ของคุณ"}
          </p>
          <span style="font-family: monospace; font-size: 40px; font-weight: 900; color: #047857; letter-spacing: 2px; display: block; position: relative; z-index: 1;">${reg.bibNumber}</span>
        </div>

        ${!isDonation ? `
        <div style="background-color: #ffffff; border: 1px dashed #cbd5e1; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 32px;">
          <h3 style="color: #0f172a; margin: 0 0 16px; font-size: 16px;">QR Code สำหรับสแกนเข้างาน</h3>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${reg.id}&margin=10" alt="QR Code" style="border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);" />
          <p style="font-size: 12px; font-weight: bold; color: #64748b; margin: 12px 0 0;">โปรดแสดง QR Code นี้ หรือบอกเลขบิ๊บ ที่จุดลงทะเบียน</p>
        </div>
        ` : ''}

        <h3 style="color: #0f172a; font-size: 16px; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 16px;">ข้อมูลสรุปสิทธิ์ของคุณ</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 14px;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">รหัสลงทะเบียน:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0f172a; text-align: right;">${reg.id}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">ประเภท:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #2563eb; text-align: right;">${isDonation ? "บริจาคเพื่อการศึกษา" : reg.distance}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">ไซส์เสื้อ:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0f172a; text-align: right;">${reg.shirtSize === "NONE" ? "-" : reg.shirtSize}</td>
          </tr>
        </table>

        ${!isDonation ? `
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 32px;">
          <p style="margin: 0 0 12px; font-weight: 800; color: #0f172a; font-size: 15px;">การรับอุปกรณ์ (บิ๊บและเสื้อ)</p>
          ${reg.deliveryMethod === 'shipping' 
            ? `<div style="display: flex; align-items: flex-start; gap: 12px;">
                 <span style="font-size: 20px;">🚚</span>
                 <div>
                   <p style="margin: 0 0 4px; font-weight: bold; color: #334155; font-size: 14px;">จัดส่งทางไปรษณีย์</p>
                   <p style="margin: 0; color: #64748b; font-size: 13px;">ระบบจะจัดส่งพัสดุตามที่อยู่ของท่าน และส่งอีเมลแจ้งเลข Tracking เมื่อเริ่มจัดส่งแล้ว</p>
                 </div>
               </div>`
            : `<div style="display: flex; align-items: flex-start; gap: 12px;">
                 <span style="font-size: 20px;">🎪</span>
                 <div>
                   <p style="margin: 0 0 4px; font-weight: bold; color: #334155; font-size: 14px;">รับด้วยตนเองหน้างาน</p>
                   <p style="margin: 0; color: #64748b; font-size: 13px;">โปรดเตรียม QR Code นี้มาแสดงตนที่จุดรับอุปกรณ์ในวันเสาร์ก่อนวันแข่งขัน หรือเช้าวันแข่งขัน</p>
                 </div>
               </div>`
          }
        </div>
        ` : ''}

        <div style="text-align: center; margin-top: 40px; margin-bottom: 8px;">
          <a href="${appUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 800; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">ตรวจสอบสถานะบนเว็บไซต์</a>
        </div>
      </div>
${`
      <div style="background-color: #f8fafc; padding: 32px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0 0 8px; font-weight: bold; color: #64748b;">คณะวิทยาการเรียนรู้และศึกษาศาสตร์ มหาวิทยาลัยธรรมศาสตร์</p>
        <p style="margin: 0 0 16px;">ขอบพระคุณที่ร่วมเป็นส่วนหนึ่งในการสนับสนุนกองทุนการเรียนรู้และทุนการศึกษา</p>
        <p style="margin: 0; font-size: 11px;">© 2026 LSEd TU. All rights reserved.</p>
      </div>
`}
    </div>
  `;
};

const getRejectionEmailHtml = (reg: Registration, reason: string) => {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; background-color: #ffffff; color: #1e293b; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
${`
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
`}
      <div style="padding: 40px 32px; line-height: 1.7;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background-color: #fef2f2; color: #e11d48; font-size: 13px; font-weight: 800; padding: 6px 16px; border-radius: 20px; letter-spacing: 1px; margin-bottom: 12px;">⚠️ พบปัญหาในการชำระเงิน</div>
          <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #0f172a;">สลิปโอนเงินไม่ผ่านการตรวจสอบ</h2>
          <p style="color: #64748b; margin-top: 8px; font-size: 15px;">สวัสดีคุณ <strong>${reg.firstName} ${reg.lastName}</strong>, สลิปที่ท่านแนบมาไม่ผ่านการตรวจสอบจากแอดมิน</p>
        </div>

        <div style="background-color: #fff1f2; border-left: 4px solid #e11d48; padding: 20px; border-radius: 0 12px 12px 0; margin-bottom: 32px;">
          <p style="margin: 0 0 8px; font-weight: 800; color: #9f1239; font-size: 14px;">เหตุผลจากผู้ตรวจสอบ:</p>
          <p style="margin: 0; color: #be123c; font-size: 15px;">${reason}</p>
        </div>

        <h3 style="color: #0f172a; font-size: 16px; margin-bottom: 16px;">วิธีดำเนินการแก้ไข</h3>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 32px;">
          <ol style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px;">
            <li style="margin-bottom: 12px;">ไปที่หน้าเว็บไซต์ <strong>"ตรวจสอบสิทธิ์ / ส่งสลิป"</strong></li>
            <li style="margin-bottom: 12px;">กรอกเบอร์โทร, บัตรประชาชน, หรือรหัส: <strong>${reg.id}</strong></li>
            <li>อัปโหลดสลิปใหม่ให้ตรงกับยอดชำระ <strong>${reg.price} บาท</strong></li>
          </ol>
        </div>

      </div>
${`
      <div style="background-color: #f8fafc; padding: 32px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0 0 8px; font-weight: bold; color: #64748b;">คณะวิทยาการเรียนรู้และศึกษาศาสตร์ มหาวิทยาลัยธรรมศาสตร์</p>
        <p style="margin: 0 0 16px;">ขอบพระคุณที่ร่วมเป็นส่วนหนึ่งในการสนับสนุนกองทุนการเรียนรู้และทุนการศึกษา</p>
        <p style="margin: 0; font-size: 11px;">© 2026 LSEd TU. All rights reserved.</p>
      </div>
`}
    </div>
  `;
};

const getShippingEmailHtml = (reg: Registration, appUrl: string) => {
  const carrierMap: Record<string, string> = {
    thailandpost: "ไปรษณีย์ไทย (EMS)",
    flash: "Flash Express",
    kerry: "Kerry Express",
    jandt: "J&T Express",
  };
  const carrierName = carrierMap[reg.shippingCarrier || ""] || reg.shippingCarrier || "ไปรษณีย์ไทย (EMS)";
  
  let trackingUrl = `https://track.thailandpost.co.th/?trackNumber=${reg.shippingTrackingNumber}`;
  if (reg.shippingCarrier === "flash") trackingUrl = `https://flashexpress.co.th/tracking/?se=${reg.shippingTrackingNumber}`;
  else if (reg.shippingCarrier === "kerry") trackingUrl = `https://th.kerryexpress.com/th/track/?track=${reg.shippingTrackingNumber}`;
  else if (reg.shippingCarrier === "jandt") trackingUrl = `https://www.jtexpress.co.th/index/query/query.html?billNo=${reg.shippingTrackingNumber}`;

  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; background-color: #ffffff; color: #1e293b; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
${`
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
`}
      <div style="padding: 40px 32px; line-height: 1.7;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background-color: #fff7ed; color: #ea580c; font-size: 13px; font-weight: 800; padding: 6px 16px; border-radius: 20px; letter-spacing: 1px; margin-bottom: 12px;">📦 จัดส่งพัสดุแล้ว</div>
          <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #0f172a;">พัสดุของคุณอยู่ระหว่างทาง!</h2>
          <p style="color: #64748b; margin-top: 8px; font-size: 15px;">สวัสดีคุณ <strong>${reg.firstName} ${reg.lastName}</strong>, อุปกรณ์วิ่งของคุณถูกจัดส่งแล้ว</p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">หมายเลขพัสดุ (Tracking)</p>
            <span style="font-family: monospace; font-size: 28px; font-weight: 900; color: #ea580c; letter-spacing: 1px; display: block; word-break: break-all;">${reg.shippingTrackingNumber}</span>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">ผู้ให้บริการจัดส่ง:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0f172a; text-align: right;">${carrierName}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">วันที่จัดส่ง:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0f172a; text-align: right;">${reg.shippedAt || "วันนี้"}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">หมายเลขบิ๊บในกล่อง:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0f172a; text-align: right;">${reg.bibNumber || "-"}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${trackingUrl}" target="_blank" style="background-color: #ea580c; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 800; display: inline-block; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.25); width: 100%; max-width: 280px; box-sizing: border-box; margin-bottom: 12px;">คลิกเพื่อติดตามพัสดุ ↗</a>
          <a href="${appUrl}" target="_blank" style="background-color: #f1f5f9; color: #334155; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 800; display: inline-block; border: 1px solid #cbd5e1; width: 100%; max-width: 280px; box-sizing: border-box;">ตรวจสอบสถานะบนเว็บไซต์</a>
        </div>

        <div style="font-size: 13px; color: #64748b; line-height: 1.6; text-align: center; background-color: #f8fafc; padding: 16px; border-radius: 12px;">
          <span style="font-size: 20px; display: block; margin-bottom: 8px;">💡</span>
          ระบบติดตามพัสดุอาจใช้เวลาประมาณ 12-24 ชั่วโมงในการอัปเดตข้อมูลขึ้นระบบ หากท่านยังไม่พบข้อมูล กรุณาเว้นระยะเวลาและตรวจสอบอีกครั้ง
        </div>
      </div>
${`
      <div style="background-color: #f8fafc; padding: 32px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0 0 8px; font-weight: bold; color: #64748b;">คณะวิทยาการเรียนรู้และศึกษาศาสตร์ มหาวิทยาลัยธรรมศาสตร์</p>
        <p style="margin: 0 0 16px;">ขอบพระคุณที่ร่วมเป็นส่วนหนึ่งในการสนับสนุนกองทุนการเรียนรู้และทุนการศึกษา</p>
        <p style="margin: 0; font-size: 11px;">© 2026 LSEd TU. All rights reserved.</p>
      </div>
`}
    </div>
  `;
};

// Pricing config
const PRICE_MAP: Record<DistanceType, number> = {
  "REGULAR": 555,
  "5K": 555,
  "vip": 990,
  "vip_duo": 2800,
  "vip_trio": 3900,
  "donation": 0,
  "souvenir": 390,
};

// Generate next BIB number
const generateBIB = (registrations: Registration[], distance: DistanceType): string => {
  if (distance === "donation") {
    const approvedDonors = registrations.filter(r => r.distance === "donation" && r.status === "approved");
    const startNum = 9001;
    
    const currentMaxBib = approvedDonors.reduce((max, r) => {
      if (r.bibNumber && r.bibNumber.startsWith("DONOR-")) {
        const numPart = parseInt(r.bibNumber.split("-")[1], 10);
        if (!isNaN(numPart) && numPart > max) return numPart;
      }
      return max;
    }, startNum - 1);

    const nextNum = currentMaxBib + 1;
    return `DONOR-${nextNum}`;
  }

  if (distance === "souvenir") {
    const approvedSouvenirs = registrations.filter(r => r.distance === "souvenir" && r.status === "approved");
    const startNum = 5001;
    
    const currentMaxBib = approvedSouvenirs.reduce((max, r) => {
      if (r.bibNumber && r.bibNumber.startsWith("SVN-")) {
        const numPart = parseInt(r.bibNumber.split("-")[1], 10);
        if (!isNaN(numPart) && numPart > max) return numPart;
      }
      return max;
    }, startNum - 1);

    const nextNum = currentMaxBib + 1;
    return `SVN-${nextNum}`;
  }

  // Use LSE- prefixed numbers for all running registrations (REGULAR and VIPs)
  const approvedRunners = registrations.filter(r => r.distance !== "donation" && r.distance !== "souvenir" && r.status === "approved");
  let prefix = "LSE";
  let startNum = 1001;
  
  const currentMaxBib = approvedRunners.reduce((max, r) => {
    if (r.bibNumber && r.bibNumber.startsWith("LSE-")) {
      const parts = r.bibNumber.split("-");
      if (parts.length > 1) {
        const numPart = parseInt(parts[1], 10);
        if (!isNaN(numPart) && numPart > max) return numPart;
      }
    }
    return max;
  }, startNum - 1);

  const nextNum = currentMaxBib + 1;
  return `${prefix}-${nextNum}`;
};

// Helper to generate a unique Registration ID e.g., LSED-XXXXXX
const generateRefID = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const timestampPart = Date.now().toString(36).toUpperCase().slice(-4);
  return `LSED-${timestampPart}${result}`;
};

// ==========================================
// API ROUTES
// ==========================================

// Get event stats
app.get("/api/stats", async (req, res) => {
  const dbData = await readDB();
  
  const totalRegistered = dbData.length;
  const totalApproved = dbData.filter(r => r.status === "approved").length;
  const totalPendingVerification = dbData.filter(r => r.status === "pending_verification").length;
  const totalPendingPayment = dbData.filter(r => r.status === "pending_payment").length;
  const totalRejected = dbData.filter(r => r.status === "rejected").length;
  
  // Calculate total income (only count approved)
  const totalIncome = dbData
    .filter(r => r.status === "approved")
    .reduce((sum, r) => sum + r.price, 0);

  const byDistance: Record<DistanceType, number> = { "REGULAR": 0, "5K": 0, "vip": 0, "vip_duo": 0, "vip_trio": 0, "donation": 0, "souvenir": 0 };
  const byShirtSize: Record<ShirtSizeType, number> = {
    XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, "3XL": 0, "4XL": 0, "5XL": 0, "6XL": 0, "7XL": 0, NONE: 0
  };
  const byStatus: Record<any, number> = {
    pending_payment: 0,
    pending_verification: 0,
    approved: 0,
    rejected: 0
  };

  dbData.forEach(r => {
    if (byDistance[r.distance] !== undefined) byDistance[r.distance]++;
    if (byShirtSize[r.shirtSize] !== undefined) byShirtSize[r.shirtSize]++;
    if (byStatus[r.status] !== undefined) byStatus[r.status]++;
  });

  const stats: EventStats = {
    totalRegistered,
    totalApproved,
    totalPendingVerification,
    totalPendingPayment,
    totalRejected,
    totalIncome,
    byDistance,
    byShirtSize,
    byStatus
  };

  res.json(stats);
});

// Search and list all registrations (for Admin)

// Proxy QR code for download
app.get("/api/qr-download", async (req, res) => {
  try {
    const payload = req.query.payload as string;
    if (!payload) return res.status(400).json({ error: "Missing payload" });
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&color=002d63&data=${encodeURIComponent(payload)}`;
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    res.set("Content-Type", "image/png");
    res.set("Content-Disposition", `attachment; filename="PromptPay_QR.png"`);
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: "Failed to generate QR" });
  }
});

app.get("/api/registrations", async (req, res) => {
  const dbData = await readDB();
  const { search, distance, status } = req.query;
  
  let filtered = [...dbData];

  // Apply filters
  if (distance && distance !== "all") {
    filtered = filtered.filter(r => r.distance === distance);
  }
  
  if (status && status !== "all") {
    filtered = filtered.filter(r => r.status === status);
  }

  if (search) {
    const q = (search as string).toLowerCase().trim();
    filtered = filtered.filter(r => 
      r.id.toLowerCase().includes(q) ||
      `${r.firstName} ${r.lastName}`.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.phone.includes(q) ||
      r.nationalId.includes(q) ||
      (r.bibNumber && r.bibNumber.toLowerCase().includes(q))
    );
  }

  // Sort by createdAt descending
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(filtered);
});

// Find one registration by registration reference or nationalId (for Status Checker)
app.get("/api/registrations/lookup", async (req, res) => {
  const { query: lookupQuery } = req.query;
  if (!lookupQuery) {
    return res.status(400).json({ error: "โปรดระบุอีเมล, เบอร์โทร, เลขบัตรประชาชน หรือรหัสอ้างอิง" });
  }

  const dbData = await readDB();
  const q = (lookupQuery as string).trim().toLowerCase();

  const found = dbData.filter(r => 
    r.id.toLowerCase() === q ||
    r.nationalId.toLowerCase() === q ||
    r.email.toLowerCase() === q ||
    r.phone.replace(/[^0-9]/g, "") === q.replace(/[^0-9]/g, "")
  );

  if (found.length === 0) {
    return res.status(404).json({ error: "ไม่พบข้อมูลการลงทะเบียนสำหรับข้อมูลที่ระบุ" });
  }

  // Enrich with live dynamic QR and bank details
  const settings = await getPaymentSettings();
  const enriched = found.map(r => ({
    ...r,
    ...getEnrichedPaymentDetails(r, settings)
  }));

  // Return all matches
  res.json(enriched);
});

// Public endpoint to get shipping list (masked for privacy)
app.get("/api/registrations/shipping", async (req, res) => {
  const dbData = await readDB();
  const approvedShipped = dbData.filter(r => r.status === "approved" && r.deliveryMethod === "shipping");
  
  const publicList = approvedShipped.map(r => ({
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName.substring(0, 1) + ".", // Mask last name
    bibNumber: r.bibNumber || "รออนุมัติ",
    shippingTrackingNumber: r.shippingTrackingNumber || "",
    shippingCarrier: r.shippingCarrier || "",
    phone: r.phone.length >= 9 
      ? r.phone.substring(0, 3) + "-XXX-" + r.phone.substring(r.phone.length - 4)
      : r.phone, // Mask phone
  }));

  res.json(publicList);
});

// Register a runner
app.post("/api/register", async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    nationalId,
    age,
    gender,
    bloodType,
    emergencyContactName,
    emergencyContactPhone,
    distance,
    shirtSize,
    deliveryMethod,
    shippingAddress,
    taxDeduction,
    donationAmount
  } = req.body;

  const isDonation = distance === "donation";
  let finalPrice = isDonation ? Number(donationAmount || 500) : (PRICE_MAP[distance as DistanceType] || 0);
  
  if (!isDonation && deliveryMethod === "shipping") {
    finalPrice += 60;
  }

  // Basic validations
  if (!firstName || !lastName || !email || !phone || !nationalId || !distance || (!isDonation && (!age || !gender || !shirtSize))) {
    return res.status(400).json({ error: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน" });
  }

  // Create registration object
  const newReg: Registration = {
    id: generateRefID(),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim(),
    phone: phone.trim(),
    nationalId: nationalId.trim(),
    age: isDonation ? Number(age || 0) : Number(age),
    gender: isDonation ? (gender || "other") : gender,
    bloodType: bloodType || "Unknown",
    emergencyContactName: emergencyContactName ? emergencyContactName.trim() : "",
    emergencyContactPhone: emergencyContactPhone ? emergencyContactPhone.trim() : "",
    distance,
    shirtSize: isDonation ? (shirtSize || "NONE") : shirtSize,
    deliveryMethod: deliveryMethod || "pickup",
    shippingAddress: (deliveryMethod === "shipping" ? (shippingAddress || "").trim() : ""),
    shippingCarrier: deliveryMethod === "shipping" ? "thailandpost" : undefined,
    taxDeduction: !!taxDeduction,
    status: "pending_payment",
    price: finalPrice,
    createdAt: new Date().toISOString()
  };

  try {
    // Write directly to Firestore
    await setDoc(doc(db, "registrations", newReg.id), newReg);

    // Send confirmation email asynchronously (do not await to prevent blocking)
    const emailHtml = getRegistrationEmailHtml(newReg);
    sendEmail(newReg.email, "ยืนยันการลงทะเบียน วิ่ง-ฉาย-แสง (LSEd Running 2569)", emailHtml).catch(err => console.error("Email send failed:", err));
    const settings = await getPaymentSettings();
    res.status(201).json({
      ...newReg,
      ...getEnrichedPaymentDetails(newReg, settings)
    });
  } catch (error: any) {
    console.error("Firestore write error during registration:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการบันทึกข้อมูลลงทะเบียนลงในคลาวด์ดาต้าเบส" });
  }
});

// Upload Payment Slip
app.post("/api/upload-slip", async (req, res) => {
  const { id, slipUrl } = req.body;

  if (!id || !slipUrl) {
    return res.status(400).json({ error: "ข้อมูลสลิปไม่ครบถ้วน" });
  }

  try {
    const regDocRef = doc(db, "registrations", id);
    const docSnap = await getDoc(regDocRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: "ไม่พบข้อมูลการลงทะเบียนที่อ้างอิง" });
    }

    const regData = docSnap.data() as Registration;
    regData.slipUrl = slipUrl;
    regData.status = "pending_verification";
    regData.rejectionReason = undefined; // Clear previous rejection reasons

    await setDoc(regDocRef, regData);

    res.json(regData);
  } catch (err: any) {
    console.error("Error uploading slip:", err);
    res.status(500).json({ error: "ไม่สามารถอัปเดตสถานะสลิปชำระเงินใน Firestore ได้" });
  }
});

// Admin action: Analyze Payment Slip using Gemini AI
app.post("/api/admin/analyze-slip", async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "โปรดระบุรหัสผู้สมัครสำหรับการวิเคราะห์สลิป" });
  }

  try {
    const regDocRef = doc(db, "registrations", id);
    const docSnap = await getDoc(regDocRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: "ไม่พบข้อมูลผู้สมัคร" });
    }

    const reg = docSnap.data() as Registration;
    if (!reg.slipUrl) {
      return res.status(400).json({ error: "ไม่พบข้อมูลรูปภาพสลิปสำหรับการวิเคราะห์" });
    }

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "ระบบวิเคราะห์สลิปด้วย AI ไม่พร้อมใช้งาน (คีย์ API หาย)" });
    }

    // Parse base64 from slipUrl data URL
    let mimeType = "image/jpeg";
    let base64Data = "";

    const matches = reg.slipUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      mimeType = matches[1];
      base64Data = matches[2];
    } else {
      // In case the slipUrl is raw base64 or custom format
      base64Data = reg.slipUrl;
    }

    // Prepare inputs for Gemini
    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Data
      }
    };

    const promptPart = {
      text: `คุณคือ AI ตรวจสอบสลิปการโอนเงินธนาคารของไทยสำหรับระบบหลังบ้านงานวิ่ง "วิ่ง-ฉาย-แสง (LSEd Running 2569)"
ข้อมูลการลงทะเบียนจริงของผู้สมัคร:
- รหัสอ้างอิง (Ref ID): ${reg.id}
- ชื่อผู้สมัคร: ${reg.firstName} ${reg.lastName}
- ยอดเงินที่ต้องโอนจริง (Required Price): ${reg.price} บาท
- ประเภทการสมัคร/ระยะวิ่ง: ${reg.distance}

โปรดตรวจสอบสลิปโอนเงินนี้อย่างละเอียด และสกัดข้อมูลต่อไปนี้กลับมาในรูปแบบ JSON:
1. date: วันที่โอนเงินในสลิป (เช่น "2026-07-05")
2. time: เวลาที่โอนเงินในสลิป (เช่น "14:35")
3. amount: ยอดเงินที่สกัดได้จากสลิป (ตัวเลขเท่านั้น เช่น 599 หรือ 1500)
4. isAmountCorrect: เปรียบเทียบกับยอดที่ต้องโอนจริง (${reg.price}) ว่า ยอดโอนบนสลิปถูกต้อง ครบถ้วนหรือไม่ (true/false)
5. senderName: ชื่อผู้โอนเงินที่แสดงบนสลิป (ถ้ามี)
6. receiverName: ชื่อผู้รับเงิน/บัญชีปลายทางที่แสดงบนสลิป (ถ้ามี)
7. isValidSlip: ตรวจดูว่ารูปภาพนี้เป็นสลิปโอนเงินธนาคารของจริงที่ถูกต้อง สมบูรณ์ (ไม่ใช่สลิปปลอม, ภาพหน้าจอเปล่า, สลิปที่ใช้ซ้ำ หรือรูปภาพอื่นๆ ที่ไม่เกี่ยวกับการโอนเงิน) (true/false)
8. message: คำแนะนำวิเคราะห์สลิปภาษาไทยสั้นๆ กระชับ เช่น "สลิปโอนเงินถูกต้อง ยอดโอน 599 บาทตรงตามที่กำหนด", "สลิปจริงแต่ยอดโอนไม่ถูกต้อง (ขาด 100 บาท)", "รูปนี้ไม่ใช่สลิปโอนเงิน โปรดปฏิเสธ"

คำเตือน: โปรดส่งกลับเฉพาะ JSON ตามโครงสร้างที่ระบุอย่างเข้มงวด`
    };

    const aiResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [imagePart, promptPart],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            time: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            isAmountCorrect: { type: Type.BOOLEAN },
            senderName: { type: Type.STRING },
            receiverName: { type: Type.STRING },
            isValidSlip: { type: Type.BOOLEAN },
            message: { type: Type.STRING }
          },
          required: ["amount", "isAmountCorrect", "isValidSlip", "message"]
        }
      }
    });

    const resultText = aiResponse.text;
    if (!resultText) {
      throw new Error("ไม่มีการตอบกลับจากระบบ AI");
    }

    const analysis = JSON.parse(resultText.trim());
    res.json({
      success: true,
      analysis
    });

  } catch (err: any) {
    console.error("AI slip analysis error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการตรวจสอบสลิปด้วย AI: " + err.message });
  }
});

// Admin action: Approve Registration & Assign BIB
app.post("/api/admin/approve", async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "โปรดระบุรหัสผู้สมัคร" });
  }

  try {
    const regDocRef = doc(db, "registrations", id);
    const docSnap = await getDoc(regDocRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: "ไม่พบข้อมูลผู้สมัคร" });
    }

    const reg = docSnap.data() as Registration;
    
    if (reg.status === "approved") {
      return res.status(400).json({ error: "ผู้สมัครนี้ได้รับการอนุมัติบิบเรียบร้อยแล้ว" });
    }

    // Get all registrations to generate BIB number
    const dbData = await readDB();
    const bib = generateBIB(dbData, reg.distance);
    
    reg.status = "approved";
    reg.bibNumber = bib;
    reg.verifiedAt = new Date().toISOString();
    reg.rejectionReason = undefined;

    await setDoc(regDocRef, reg);

    // Send payment approved email asynchronously
    const appUrl = req.headers.origin || req.protocol + "://" + req.get("host");
    const emailHtml = getApprovalEmailHtml(reg, appUrl);
    const emailPreviewUrl = await sendEmail(reg.email, "ยืนยันการชำระเงินสำเร็จ วิ่ง-ฉาย-แสง (LSEd Running 2569) - ได้รับ BIB แล้ว!", emailHtml);

    res.json({
      ...reg,
      emailPreviewUrl: emailPreviewUrl || undefined
    });
  } catch (err: any) {
    console.error("Error approving runner:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการอนุมัติผู้สมัครใน Firestore" });
  }
});

// Admin action: Reject Registration
// Check-in a runner via QR scan
app.post("/api/admin/checkin", async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "No ID provided" });
  
  try {
    const regRef = doc(db, "registrations", id);
    const docSnap = await getDoc(regRef);
    if (!docSnap.exists()) return res.status(404).json({ error: "ไม่พบข้อมูลการลงทะเบียน" });
    
    const regData = docSnap.data() as Registration;
    if (regData.status !== "approved") {
      return res.status(400).json({ error: `ไม่สามารถเช็คอินได้ สถานะปัจจุบัน: ${regData.status}` });
    }
    if (regData.checkedIn) {
      return res.status(400).json({ error: "ผู้เข้าร่วมนี้ได้ทำการเช็คอินไปแล้ว" });
    }
    
    const checkedInAt = new Date().toISOString();
    await updateDoc(regRef, {
      checkedIn: true,
      checkedInAt
    });
    
    res.json({ success: true, checkedInAt, runner: regData });
  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการเช็คอิน" });
  }
});

app.post("/api/admin/reject", async (req, res) => {
  const { id, reason } = req.body;

  if (!id || !reason) {
    return res.status(400).json({ error: "โปรดระบุรหัสผู้สมัครและเหตุผลที่ไม่อนุมัติ" });
  }

  try {
    const regDocRef = doc(db, "registrations", id);
    const docSnap = await getDoc(regDocRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: "ไม่พบข้อมูลผู้สมัคร" });
    }

    const reg = docSnap.data() as Registration;
    reg.status = "rejected";
    reg.rejectionReason = reason;
    reg.bibNumber = undefined; // Remove BIB if any

    await setDoc(regDocRef, reg);

    // Send rejection email asynchronously
    const emailHtml = getRejectionEmailHtml(reg, reason);
    const emailPreviewUrl = await sendEmail(reg.email, "แจ้งผลการตรวจสอบหลักฐานการโอนเงิน วิ่ง-ฉาย-แสง (LSEd Running 2569)", emailHtml);

    res.json({
      ...reg,
      emailPreviewUrl: emailPreviewUrl || undefined
    });
  } catch (err: any) {
    console.error("Error rejecting runner:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการปฏิเสธสลิปผู้สมัครใน Firestore" });
  }
});

// Admin action: Delete Registration
app.post("/api/admin/delete", async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "โปรดระบุรหัสผู้สมัคร" });
  }

  try {
    const regDocRef = doc(db, "registrations", id);
    const docSnap = await getDoc(regDocRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: "ไม่พบข้อมูลผู้สมัครที่ต้องการลบ" });
    }

    await deleteDoc(regDocRef);
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting runner:", err);
    res.status(500).json({ error: "ไม่สามารถลบข้อมูลผู้สมัครใน Firestore ได้" });
  }
});

// Admin action: Edit Runner Details
app.post("/api/admin/edit", async (req, res) => {
  const { 
    id, 
    firstName, 
    lastName, 
    shirtSize, 
    distance, 
    phone, 
    email, 
    bibNumber, 
    taxDeduction, 
    deliveryMethod, 
    shippingAddress, 
    shippingTrackingNumber,
    shippingCarrier,
    shippedAt
  } = req.body;

  if (!id) {
    return res.status(400).json({ error: "ไม่สามารถอัปเดตข้อมูลได้" });
  }

  try {
    const regDocRef = doc(db, "registrations", id);
    const docSnap = await getDoc(regDocRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: "ไม่พบข้อมูลผู้สมัคร" });
    }

    const reg = docSnap.data() as Registration;
    reg.firstName = firstName || reg.firstName;
    reg.lastName = lastName || reg.lastName;
    reg.shirtSize = shirtSize || reg.shirtSize;
    reg.distance = distance || reg.distance;
    reg.phone = phone || reg.phone;
    reg.email = email || reg.email;
    
    if (taxDeduction !== undefined) reg.taxDeduction = taxDeduction;
    if (deliveryMethod !== undefined) reg.deliveryMethod = deliveryMethod;
    if (shippingAddress !== undefined) reg.shippingAddress = shippingAddress;
    
    if (shippingTrackingNumber !== undefined) {
      reg.shippingTrackingNumber = shippingTrackingNumber;
      if (shippingTrackingNumber) {
        if (!reg.shippedAt) {
          reg.shippedAt = new Date().toLocaleString("th-TH");
        }
      } else {
        reg.shippedAt = undefined;
      }
    }
    
    if (shippingCarrier !== undefined) reg.shippingCarrier = shippingCarrier;
    if (shippedAt !== undefined) reg.shippedAt = shippedAt;

    // Recalculate price
    let basePrice = PRICE_MAP[reg.distance as DistanceType] || 0;
    if (reg.distance !== "donation" && reg.deliveryMethod === "shipping") {
      basePrice += 60;
    }
    reg.price = basePrice || reg.price;
    
    if (bibNumber !== undefined) {
      reg.bibNumber = bibNumber;
    }

    await setDoc(regDocRef, reg);
    res.json(reg);
  } catch (err: any) {
    console.error("Error editing runner details:", err);
    res.status(500).json({ error: "ไม่สามารถอัปเดตรายละเอียดผู้สมัครใน Firestore ได้" });
  }
});

// Admin action: Simulate Shipping Tracking Number Notification via Email, SMS & LINE OA Mock
app.post("/api/admin/simulate-shipping-notification", async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "กรุณาระบุ ID ของผู้สมัคร" });
  }

  try {
    const regDocRef = doc(db, "registrations", id);
    const docSnap = await getDoc(regDocRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: "ไม่พบข้อมูลผู้สมัคร" });
    }

    const reg = docSnap.data() as Registration;
    if (!reg.shippingTrackingNumber) {
      return res.status(400).json({ error: "ผู้สมัครรายนี้ยังไม่มีหมายเลขพัสดุ กรุณาระบุและบันทึกเลขพัสดุก่อนจำลองแจ้งเตือน" });
    }

    // Generate simulated notification payloads
    const carrierMap: Record<string, string> = {
      thailandpost: "ไปรษณีย์ไทย (EMS)",
      flash: "Flash Express",
      kerry: "Kerry Express",
      jandt: "J&T Express",
    };
    const carrierName = carrierMap[reg.shippingCarrier || ""] || reg.shippingCarrier || "ไปรษณีย์ไทย (EMS)";
    
    let trackingUrl = `https://track.thailandpost.co.th/?trackNumber=${reg.shippingTrackingNumber}`;
    if (reg.shippingCarrier === "flash") trackingUrl = `https://flashexpress.co.th/tracking/?se=${reg.shippingTrackingNumber}`;
    else if (reg.shippingCarrier === "kerry") trackingUrl = `https://th.kerryexpress.com/th/track/?track=${reg.shippingTrackingNumber}`;
    else if (reg.shippingCarrier === "jandt") trackingUrl = `https://www.jtexpress.co.th/index/query/query.html?billNo=${reg.shippingTrackingNumber}`;

    // Send mock email
    const appUrl = req.headers.origin || req.protocol + "://" + req.get("host");
    const emailHtml = getShippingEmailHtml(reg, appUrl);
    const emailPreviewUrl = await sendEmail(
      reg.email,
      `แจ้งจัดส่งพัสดุเสร็จสิ้น - โครงการ วิ่ง-ฉาย-แสง (LSEd Running 2569) 🚚`,
      emailHtml
    );

    // SMS simulation text
    const smsText = `[LSEd-RUNNING] พัสดุของคุณ (${reg.firstName}) ได้รับการจัดส่งเรียบร้อยแล้ว! เลขพัสดุ ${reg.shippingTrackingNumber} (${carrierName}) ตรวจสอบสถานะ: ${trackingUrl}`;

    // LINE OA message simulation text
    const lineText = `✨ สวัสดีคุณ ${reg.firstName} ขบวนวิ่ง "วิ่ง-ฉาย-แสง" ได้จัดส่งพัสดุเสื้อวิ่งและบิ๊บของคุณเรียบร้อยแล้ว!\n\n📦 เลขพัสดุ: ${reg.shippingTrackingNumber}\n🚚 ผู้ให้บริการ: ${carrierName}\n📅 วันที่จัดส่ง: ${reg.shippedAt || "วันนี้"}\n\nขอบคุณที่ร่วมเป็นส่วนหนึ่งในการสมทบเข้ากองทุนคณะช่วยเหลือเป็นทุนการศึกษาและสนับสนุนการเรียนรู้ให้นักศึกษา LSEd 💛❤️`;

    res.json({
      success: true,
      email: reg.email,
      emailPreviewUrl: emailPreviewUrl || undefined,
      smsText,
      lineText,
      recipientName: `${reg.firstName} ${reg.lastName}`,
    });
  } catch (err: any) {
    console.error("Error simulating shipping notification:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการจำลองส่งการแจ้งเตือน" });
  }
});

// Admin action: Clear all registrations
app.post("/api/admin/clear", async (req, res) => {
  try {
    const querySnapshot = await getDocs(collection(db, "registrations"));
    const deletePromises: Promise<void>[] = [];
    querySnapshot.forEach((docSnap) => {
      deletePromises.push(deleteDoc(doc(db, "registrations", docSnap.id)));
    });
    await Promise.all(deletePromises);
    res.json({ success: true, message: "ล้างฐานข้อมูลผู้สมัครทั้งหมดใน Firestore เรียบร้อยแล้ว" });
  } catch (err: any) {
    console.error("Error clearing database:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการล้างข้อมูลใน Firestore" });
  }
});

// Admin action: Populate Mock Data for presentation
app.post("/api/admin/populate-mock", async (req, res) => {
  const mockSlipBase64 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='400' viewBox='0 0 300 400'><rect width='300' height='400' fill='%23e2e8f0'/><text x='150' y='200' font-family='Arial' font-size='18' text-anchor='middle' fill='%2364748b'>Mock Payment Slip</text><text x='150' y='230' font-family='Arial' font-size='14' text-anchor='middle' fill='%2394a3b8'>K-Bank Transfer successful</text></svg>";

  const mockRunners: Omit<Registration, "id">[] = [
    {
      firstName: "สมชาย",
      lastName: "ดีใจ",
      email: "somchai.d@gmail.com",
      phone: "0812345678",
      nationalId: "1100123456789",
      age: 28,
      gender: "male",
      bloodType: "A",
      emergencyContactName: "คุณสมศรี ดีใจ (มารดา)",
      emergencyContactPhone: "0819876543",
      distance: "vip",
      shirtSize: "L",
      status: "approved",
      price: 1500,
      bibNumber: "VIP-1001",
      slipUrl: mockSlipBase64,
      createdAt: new Date(Date.now() - 36 * 3600000).toISOString(),
      verifiedAt: new Date(Date.now() - 34 * 3600000).toISOString(),
    },
    {
      firstName: "ณัฐชา",
      lastName: "รักษ์ดี",
      email: "nattacha.r@lsed.tu.ac.th",
      phone: "0898765432",
      nationalId: "1209987654321",
      age: 21,
      gender: "female",
      bloodType: "O",
      emergencyContactName: "สมควร รักษ์ดี (บิดา)",
      emergencyContactPhone: "0865432109",
      distance: "5K",
      shirtSize: "M",
      status: "approved",
      price: 599,
      bibNumber: "L05-2001",
      slipUrl: mockSlipBase64,
      createdAt: new Date(Date.now() - 32 * 3600000).toISOString(),
      verifiedAt: new Date(Date.now() - 30 * 3600000).toISOString(),
    },
    {
      firstName: "พงศธร",
      lastName: "สุวรรณประสิทธิ์",
      email: "pongsatorn.s@gmail.com",
      phone: "0841238947",
      nationalId: "3101500293847",
      age: 35,
      gender: "male",
      bloodType: "B",
      emergencyContactName: "รพีพรรณ สุวรรณประสิทธิ์ (ภรรยา)",
      emergencyContactPhone: "0841234567",
      distance: "vip_duo",
      shirtSize: "XL",
      status: "pending_verification",
      price: 2800,
      slipUrl: mockSlipBase64,
      createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    },
    {
      firstName: "วิภาดา",
      lastName: "จันทร์เพ็ญ",
      email: "wipada.j@outlook.com",
      phone: "0865551234",
      nationalId: "1409987625143",
      age: 42,
      gender: "female",
      bloodType: "AB",
      emergencyContactName: "จิรวัฒน์ จันทร์เพ็ญ (สามี)",
      emergencyContactPhone: "0865559876",
      distance: "donation",
      shirtSize: "NONE",
      status: "approved",
      price: 1000,
      bibNumber: "DONOR-9001",
      slipUrl: mockSlipBase64,
      createdAt: new Date(Date.now() - 28 * 3600000).toISOString(),
      verifiedAt: new Date(Date.now() - 25 * 3600000).toISOString(),
    },
    {
      firstName: "ธนกร",
      lastName: "วิทยาโกศล",
      email: "tanakorn.w@gmail.com",
      phone: "0823334445",
      nationalId: "5102030405060",
      age: 19,
      gender: "male",
      bloodType: "O",
      emergencyContactName: "มาลินี วิทยาโกศล (มารดา)",
      emergencyContactPhone: "0829998887",
      distance: "5K",
      shirtSize: "M",
      status: "pending_payment",
      price: 599,
      createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    },
    {
      firstName: "อภิญญา",
      lastName: "เลิศวิจิตร",
      email: "apinya.l@gmail.com",
      phone: "0871112223",
      nationalId: "1234567890123",
      age: 26,
      gender: "female",
      bloodType: "A",
      emergencyContactName: "สมคิด เลิศวิจิตร (บิดา)",
      emergencyContactPhone: "0873332221",
      distance: "vip",
      shirtSize: "XS",
      status: "rejected",
      price: 1500,
      slipUrl: mockSlipBase64,
      rejectionReason: "สลิปที่อัปโหลดไม่ถูกต้อง กรุณาอัปโหลดสลิปธนาคารที่มีการโอนเงินจำนวน 1,500 บาทจริงอีกครั้ง",
      createdAt: new Date(Date.now() - 20 * 3600000).toISOString(),
    },
    {
      firstName: "ธีรเดช",
      lastName: "สุขใจ",
      email: "teeradech.s@hotmail.com",
      phone: "0901234567",
      nationalId: "3100500456123",
      age: 31,
      gender: "male",
      bloodType: "O",
      emergencyContactName: "พวงศรี สุขใจ (มารดา)",
      emergencyContactPhone: "0891234567",
      distance: "5K",
      shirtSize: "L",
      status: "approved",
      price: 599,
      bibNumber: "L05-2002",
      slipUrl: mockSlipBase64,
      createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      verifiedAt: new Date(Date.now() - 22 * 3600000).toISOString(),
    },
    {
      firstName: "ศิริพร",
      lastName: "ตั้งมั่น",
      email: "siriporn.t@gmail.com",
      phone: "0887654321",
      nationalId: "1509987651234",
      age: 48,
      gender: "female",
      bloodType: "B",
      emergencyContactName: "สมบัติ ตั้งมั่น (พี่ชาย)",
      emergencyContactPhone: "0881234567",
      distance: "vip_trio",
      shirtSize: "XXL",
      status: "pending_verification",
      price: 3900,
      slipUrl: mockSlipBase64,
      createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    },
    {
      firstName: "กิตติพงษ์",
      lastName: "แซ่ลิ้ม",
      email: "kittipong.lim@gmail.com",
      phone: "0832123456",
      nationalId: "1100200304050",
      age: 22,
      gender: "male",
      bloodType: "Unknown",
      emergencyContactName: "สุพรรณ แซ่ลิ้ม (บิดา)",
      emergencyContactPhone: "0839991112",
      distance: "5K",
      shirtSize: "XL",
      status: "approved",
      price: 599,
      bibNumber: "L05-2003",
      slipUrl: mockSlipBase64,
      createdAt: new Date(Date.now() - 18 * 3600000).toISOString(),
      verifiedAt: new Date(Date.now() - 17 * 3600000).toISOString(),
    },
    {
      firstName: "ปวีณา",
      lastName: "ดวงดี",
      email: "paweena.d@gmail.com",
      phone: "0856781234",
      nationalId: "1203495810293",
      age: 25,
      gender: "female",
      bloodType: "A",
      emergencyContactName: "อนันต์ ดวงดี (พี่ชาย)",
      emergencyContactPhone: "0851112222",
      distance: "donation",
      shirtSize: "NONE",
      status: "pending_payment",
      price: 500,
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      firstName: "อนันต์",
      lastName: "รักษ์ไปรษณีย์",
      email: "anan.post@gmail.com",
      phone: "0812233445",
      nationalId: "1100500123456",
      age: 30,
      gender: "male",
      bloodType: "O",
      emergencyContactName: "วิภา รักษ์ไปรษณีย์ (ภรรยา)",
      emergencyContactPhone: "0812233446",
      distance: "REGULAR",
      shirtSize: "L",
      deliveryMethod: "shipping",
      shippingAddress: "123/45 หมู่ 2 ถนนวิภาวดีรังสิต แขวงตลาดบางเขน เขตหลักสี่ กรุงเทพมหานคร 10210",
      shippingCarrier: "thailandpost",
      status: "approved",
      price: 615,
      bibNumber: "L05-8001",
      slipUrl: mockSlipBase64,
      createdAt: new Date(Date.now() - 15 * 3600000).toISOString(),
      verifiedAt: new Date(Date.now() - 14 * 3600000).toISOString(),
    },
    {
      firstName: "มณีวรรณ",
      lastName: "ทรงส่งด่วน",
      email: "maneewan.fast@outlook.com",
      phone: "0894567890",
      nationalId: "1209987654312",
      age: 27,
      gender: "female",
      bloodType: "B",
      emergencyContactName: "ประภา ทรงส่งด่วน (มารดา)",
      emergencyContactPhone: "0894567891",
      distance: "vip",
      shirtSize: "M",
      deliveryMethod: "shipping",
      shippingAddress: "88/9 อาคารเอสเปซ คอนโด ชั้น 10 ซอยสุขุมวิท 77 แขวงอ่อนนุช เขตสวนหลวง กรุงเทพมหานคร 10250",
      shippingCarrier: "thailandpost",
      status: "approved",
      price: 1050,
      bibNumber: "VIP-8002",
      slipUrl: mockSlipBase64,
      createdAt: new Date(Date.now() - 20 * 3600000).toISOString(),
      verifiedAt: new Date(Date.now() - 19 * 3600000).toISOString(),
    },
    {
      firstName: "วิทวัส",
      lastName: "ทองดี",
      email: "wittawat.gold@gmail.com",
      phone: "0841112222",
      nationalId: "3101500293111",
      age: 33,
      gender: "male",
      bloodType: "AB",
      emergencyContactName: "มานะ ทองดี (บิดา)",
      emergencyContactPhone: "0841112223",
      distance: "REGULAR",
      shirtSize: "XL",
      deliveryMethod: "shipping",
      shippingAddress: "405 ม.5 ต.คลองหนึ่ง อ.คลองหลวง จ.ปทุมธานี 12120",
      shippingCarrier: "thailandpost",
      status: "pending_verification",
      price: 615,
      slipUrl: mockSlipBase64,
      createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    },
    {
      firstName: "ขวัญใจ",
      lastName: "ประทุมทิพย์",
      email: "kwanjai.p@gmail.com",
      phone: "0877778888",
      nationalId: "1234567890999",
      age: 24,
      gender: "female",
      bloodType: "A",
      emergencyContactName: "ปรีชา ประทุมทิพย์ (พี่ชาย)",
      emergencyContactPhone: "0877778889",
      distance: "vip",
      shirtSize: "XS",
      deliveryMethod: "shipping",
      shippingAddress: "99/999 หมู่บ้านสิริเพลส ถนนแจ้งวัฒนะ ต.บางพูด อ.ปากเกร็ด จ.นนทบุรี 11120",
      shippingCarrier: "thailandpost",
      status: "pending_payment",
      price: 1050,
      createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    }
  ];

  try {
    const writePromises: Promise<void>[] = mockRunners.map((runner, i) => {
      const id = `LSED-MOCK0${i + 1}`;
      const mockReg: Registration = {
        ...runner,
        id
      };
      return setDoc(doc(db, "registrations", id), mockReg);
    });

    await Promise.all(writePromises);
    res.json({ success: true, message: "สร้างข้อมูลจำลองจำนวน 14 รายการลงใน Firestore เรียบร้อยแล้ว!" });
  } catch (err: any) {
    console.error("Error populating mock data:", err);
    res.status(500).json({ error: "ไม่สามารถสร้างข้อมูลจำลองลงใน Firestore ได้" });
  }
});


// Get assets settings
let cachedAssets: any = null;
let assetsCacheTime = 0;
app.get("/api/assets/settings", async (req, res) => {
  try {
    if (cachedAssets && Date.now() - assetsCacheTime < 60000) {
      return res.json(cachedAssets);
    }
    const docRef = doc(db, "settings", "assets");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      cachedAssets = docSnap.data();
      assetsCacheTime = Date.now();
      res.json(cachedAssets);
    } else {
      res.json({ shirtImage: "", poloShirtImage: "", medalImage: "", routeMapImage: "", logoImage: "", souvenirImage: "" });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch assets settings" });
  }
});

// Update assets settings
app.post("/api/assets/settings", async (req, res) => {
  assetsCacheTime = 0;
  const { shirtImage, poloShirtImage, medalImage, routeMapImage, logoImage, souvenirImage } = req.body;
  try {
    await setDoc(doc(db, "settings", "assets"), {
      shirtImage: shirtImage || "",
      poloShirtImage: poloShirtImage || "",
      medalImage: medalImage || "",
      routeMapImage: routeMapImage || "",
      logoImage: logoImage || "",
      souvenirImage: souvenirImage || ""
    });
    res.json({ success: true, message: "บันทึกรูปภาพของที่ระลึกสำเร็จ" });
  } catch (err: any) {
    console.error("Error saving assets:", err);
    res.status(500).json({ error: "ไม่สามารถบันทึกข้อมูลรูปภาพของที่ระลึกได้" });
  }
});

// Get payment settings
app.get("/api/payment/settings", async (req, res) => {
  const settings = await getPaymentSettings();
  res.json(settings);
});

// Update payment settings
app.post("/api/payment/settings", async (req, res) => {
  paymentCacheTime = 0;
  const { regular, taxDeduct } = req.body;
  if (!regular || !taxDeduct) {
    return res.status(400).json({ error: "โปรดกรอกข้อมูลให้ครบถ้วนทั้งบัญชีปกติและบัญชีลดหย่อนภาษี" });
  }

  try {
    await setDoc(doc(db, "settings", "payment"), {
      regular: {
        bankName: (regular.bankName || "").trim(),
        accountNo: (regular.accountNo || "").trim(),
        accountName: (regular.accountName || "").trim(),
        qrImage: regular.qrImage || ""
      },
      taxDeduct: {
        bankName: (taxDeduct.bankName || "").trim(),
        accountNo: (taxDeduct.accountNo || "").trim(),
        accountName: (taxDeduct.accountName || "").trim(),
        qrImage: taxDeduct.qrImage || ""
      }
    });
    res.json({ success: true, regular, taxDeduct });
  } catch (err: any) {
    console.error("Error saving payment settings:", err);
    res.status(500).json({ error: "ไม่สามารถบันทึกข้อมูลตั้งค่าใน Firestore ได้" });
  }
});


// ==========================================
// VITE MIDDLEWARE & STATIC ASSETS
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LSEd Running 2569 server started on http://0.0.0.0:${PORT}`);
  });
}

startServer();
