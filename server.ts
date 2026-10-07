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
  ignoreUndefinedProperties: true,
  experimentalAutoDetectLongPolling: true
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

interface EmailLogEntry {
  id: string;
  recipient: string;
  recipientName?: string;
  subject: string;
  type: 'registration' | 'payment_received' | 'approval' | 'rejection' | 'shipping' | 'reminder';
  sentAt: string;
  previewUrl?: string;
  html?: string;
  status: 'sent' | 'simulated' | 'failed';
}

const recentEmailLogs: EmailLogEntry[] = [];

const recordEmailLog = (entry: Omit<EmailLogEntry, 'id'>) => {
  const log: EmailLogEntry = {
    id: 'email-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    ...entry
  };
  recentEmailLogs.unshift(log);
  if (recentEmailLogs.length > 50) {
    recentEmailLogs.pop();
  }
  return log;
};

const sendEmail = async (to: string, subject: string, html: string, meta?: { type: EmailLogEntry['type']; recipientName?: string }): Promise<string | null> => {
  try {
    const transporter = await getTransporter();
    if (!transporter) {
      console.log("No SMTP Transporter available. Simulating email send to:", to);
      console.log("Subject:", subject);
      if (meta) {
        recordEmailLog({
          recipient: to,
          recipientName: meta.recipientName,
          subject,
          type: meta.type,
          sentAt: new Date().toISOString(),
          html,
          status: 'simulated'
        });
      }
      return null;
    }
    
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"วิ่ง-ฉาย-แสง (LSEd Running)" <noreply@lsed-running.com>',
      to,
      subject,
      html,
    });
    
    console.log("Email sent successfully to:", to);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log("Ethereal Email Preview URL:", previewUrl);
    }

    if (meta) {
      recordEmailLog({
        recipient: to,
        recipientName: meta.recipientName,
        subject,
        type: meta.type,
        sentAt: new Date().toISOString(),
        previewUrl: previewUrl || undefined,
        html,
        status: 'sent'
      });
    }

    return previewUrl || "SENT";
  } catch (err) {
    console.error("Error sending email:", err);
    if (meta) {
      recordEmailLog({
        recipient: to,
        recipientName: meta.recipientName,
        subject,
        type: meta.type,
        sentAt: new Date().toISOString(),
        html,
        status: 'failed'
      });
    }
    return null;
  }
};

// ==========================================
// EMAIL TEMPLATES & DESIGN SYSTEM
// Color Theme: Turquoise (#0d9488, #14b8a6) & Warm Orange (#f97316, #ea580c)
// Brand: LSEd (small 'd'), คณะวิทยาการเรียนรู้และศึกษาศาสตร์ ม.ธรรมศาสตร์
// Date: 24 มกราคม 2570
// ==========================================

const getEmailHeaderHtml = (badgeLabel: string, badgeBg: string = "#f0fdfa", badgeTextColor: string = "#0f766e", badgeBorder: string = "#ccfbf1") => {
  return `
    <div style="background: linear-gradient(135deg, #0f766e 0%, #0d9488 60%, #14b8a6 100%); padding: 36px 32px 30px; text-align: center; position: relative;">
      <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 9999px; padding: 6px 18px; margin-bottom: 12px;">
        <span style="font-family: 'Poppins', 'Helvetica Neue', Arial, sans-serif; font-size: 20px; font-weight: 900; color: #ffffff; letter-spacing: 1px; font-style: italic;">LSEd</span>
        <span style="font-family: 'Poppins', 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 800; color: #fed7aa; letter-spacing: 2px; margin-left: 6px;">RUNNING 2569</span>
      </div>
      <div style="font-size: 14px; font-weight: 800; color: #ffedd5; letter-spacing: 2px; text-transform: uppercase;">
        RUN TO SHINE <span style="color: #fdba74;">✨</span> โครงการวิ่งฉายแสง
      </div>
      <div style="font-size: 12px; font-weight: 600; color: rgba(255, 255, 255, 0.85); margin-top: 6px; letter-spacing: 0.5px;">
        คณะวิทยาการเรียนรู้และศึกษาศาสตร์ มหาวิทยาลัยธรรมศาสตร์
      </div>
    </div>
    <div style="background-color: #f97316; height: 4px; width: 100%;"></div>
    <div style="padding: 24px 32px 0; text-align: center;">
      <div style="display: inline-block; background-color: ${badgeBg}; color: ${badgeTextColor}; border: 1px solid ${badgeBorder}; font-size: 12px; font-weight: 800; padding: 6px 18px; border-radius: 9999px; letter-spacing: 0.5px;">
        ${badgeLabel}
      </div>
    </div>
  `;
};

const getEmailFooterHtml = () => {
  return `
    <div style="background-color: #f8fafc; padding: 32px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; line-height: 1.7;">
      <div style="display: inline-block; width: 36px; height: 3px; background-color: #14b8a6; border-radius: 2px; margin-bottom: 16px;"></div>
      <p style="margin: 0 0 6px; font-weight: 800; color: #0f766e; font-size: 13px;">คณะวิทยาการเรียนรู้และศึกษาศาสตร์ มหาวิทยาลัยธรรมศาสตร์ (LSEd)</p>
      <p style="margin: 0 0 10px; color: #64748b;">อาคารเรียนและปฏิบัติการรวม มหาวิทยาลัยธรรมศาสตร์ ศูนย์รังสิต ต.คลองหนึ่ง อ.คลองหลวง จ.ปทุมธานี 12120</p>
      <p style="margin: 0 0 16px; font-size: 11px; color: #94a3b8;">
        ขอบพระคุณที่ร่วมเป็นส่วนหนึ่งในการสนับสนุนกองทุนพัฒนาการเรียนรู้และทุนการศึกษาแก่นักศึกษาธรรมศาสตร์<br/>
        การบริจาคผ่านระบบ e-Donation สามารถนำไปหักลดหย่อนภาษีได้ 2 เท่า ตามหลักเกณฑ์กรมสรรพากร
      </p>
      <div style="border-top: 1px dashed #e2e8f0; padding-top: 14px; font-size: 11px; color: #94a3b8;">
        © 2570 (2027) LSEd Running • โครงการวิ่งฉายแสง มหาวิทยาลัยธรรมศาสตร์
      </div>
    </div>
  `;
};

// 1. อีเมลยืนยันการลงทะเบียน & รอชำระเงิน (Registration Received & Payment Pending)
const getRegistrationEmailHtml = (reg: Registration, settings?: any, appUrl: string = "https://lsed-running.web.app") => {
  const isDonation = reg.distance === "donation";
  const acct = settings?.regular || {
    bankName: "ทหารไทยธนชาต (ttb)",
    accountNo: "083-013-1768",
    accountName: "นภัสกร กลิ่นเฟื่อง (LSEd RUNNING)"
  };
  const cleanNo = acct.accountNo.replace(/[^0-9]/g, "");
  const qrPayload = generatePromptPayPayload(cleanNo, reg.price);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrPayload)}&margin=10`;

  return `
    <div style="font-family: 'Poppins', 'Prompt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff; color: #1e293b; box-shadow: 0 12px 30px -8px rgba(13, 148, 136, 0.12);">
      ${getEmailHeaderHtml("ขั้นตอนที่ 1 / 2 : รอการชำระเงิน", "#fff7ed", "#ea580c", "#ffedd5")}
      
      <div style="padding: 24px 32px 36px; line-height: 1.7;">
        <div style="text-align: center; margin-bottom: 28px;">
          <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 800; color: #0f172a;">ขอบคุณสำหรับการลงทะเบียน</h2>
          <p style="color: #64748b; margin: 0; font-size: 15px;">สวัสดีคุณ <strong>${reg.firstName} ${reg.lastName}</strong>, บัญชีการสมัครของท่านถูกบันทึกเข้าระบบเรียบร้อยแล้ว</p>
        </div>

        <!-- Ref ID Box -->
        <div style="background: linear-gradient(135deg, #f0fdfa 0%, #fff7ed 100%); border: 1px dashed #14b8a6; border-radius: 18px; padding: 20px; text-align: center; margin-bottom: 28px;">
          <p style="margin: 0 0 6px; font-size: 11px; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: 1.5px;">รหัสการลงทะเบียน (Reference ID)</p>
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 30px; font-weight: 900; color: #ea580c; letter-spacing: 2px;">${reg.id}</span>
          <p style="margin: 6px 0 0; font-size: 12px; color: #64748b;">(โปรดเก็บรหัสนี้ไว้สำหรับตรวจสอบสถานะหรือแนบสลิป)</p>
        </div>

        <!-- Summary Table -->
        <h3 style="color: #0f766e; font-size: 16px; border-bottom: 2px solid #ccfbf1; padding-bottom: 8px; margin: 0 0 16px; font-weight: 800; display: flex; align-items: center;">
          📋 สรุปรายการลงทะเบียน
        </h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px; font-size: 14px;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">ประเภทที่สมัคร:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: 700; color: #0f172a; text-align: right;">${isDonation ? "บริจาคเพื่อการศึกษา (e-Donation)" : reg.distance}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">ไซส์เสื้อ:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: 700; color: #0f172a; text-align: right;">${reg.shirtSize === "NONE" ? "ไม่รับเสื้อ" : reg.shirtSize}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">วิธีรับอุปกรณ์:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: 700; color: #0f172a; text-align: right;">${reg.deliveryMethod === 'shipping' ? "🚚 จัดส่งพัสดุถึงบ้าน" : "🎪 รับด้วยตนเองหน้างาน"}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #0f766e; font-weight: 800;">ยอดเงินที่ต้องชำระ:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 900; color: #ea580c; font-size: 22px; text-align: right;">${reg.price.toLocaleString()} บาท</td>
          </tr>
        </table>

        <!-- Payment Details & QR -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px; margin-bottom: 28px; text-align: center;">
          <h4 style="margin: 0 0 14px; font-size: 15px; font-weight: 800; color: #0f172a;">ช่องทางชำระเงินผ่าน PromptPay QR</h4>
          <div style="display: inline-block; padding: 12px; background-color: #ffffff; border-radius: 16px; border: 1px solid #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 16px;">
            <img src="${qrUrl}" alt="PromptPay QR Code" style="display: block; width: 180px; height: 180px; border-radius: 8px;" />
          </div>
          <div style="text-align: left; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; font-size: 13px; line-height: 1.8;">
            <div><span style="color: #64748b;">ธนาคาร:</span> <strong style="color: #0f172a;">${acct.bankName}</strong></div>
            <div><span style="color: #64748b;">เลขที่บัญชี / PromptPay:</span> <strong style="color: #0d9488; font-size: 15px; font-family: monospace;">${acct.accountNo}</strong></div>
            <div><span style="color: #64748b;">ชื่อบัญชี:</span> <strong style="color: #0f172a;">${acct.accountName}</strong></div>
            <div><span style="color: #64748b;">ยอดเงิน:</span> <strong style="color: #ea580c; font-size: 15px;">${reg.price.toLocaleString()} บาท</strong></div>
          </div>
        </div>

        <!-- Action Button -->
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${appUrl}?checkRef=${reg.id}" target="_blank" style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff; padding: 15px 32px; text-decoration: none; border-radius: 14px; font-weight: 800; font-size: 15px; display: inline-block; box-shadow: 0 6px 18px rgba(13, 148, 136, 0.35); letter-spacing: 0.5px;">
            แนบสลิปโอนเงิน / ตรวจสอบสิทธิ์ ↗
          </a>
        </div>

        <p style="margin: 0; font-size: 12px; color: #64748b; text-align: center;">
          *หลังจากท่านแนบสลิปโอนเงินแล้ว เจ้าหน้าที่จะทำการตรวจสอบและส่งอีเมลแจ้งเลข BIB พร้อมบัตรเข้างานให้ท่านทันที
        </p>
      </div>

      ${getEmailFooterHtml()}
    </div>
  `;
};

// 2. อีเมลแจ้งหลังชำระเงินเสร็จ: ได้รับสลิปแล้ว อยู่ระหว่างรออนุมัติ [USER REQUEST 1]
const getPaymentReceivedEmailHtml = (reg: Registration, appUrl: string = "https://lsed-running.web.app") => {
  const isDonation = reg.distance === "donation";
  return `
    <div style="font-family: 'Poppins', 'Prompt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff; color: #1e293b; box-shadow: 0 12px 30px -8px rgba(13, 148, 136, 0.12);">
      ${getEmailHeaderHtml("⏳ ชำระเงินเรียบร้อยแล้ว • อยู่ระหว่างรออนุมัติ", "#f0fdfa", "#0f766e", "#ccfbf1")}
      
      <div style="padding: 24px 32px 36px; line-height: 1.7;">
        <div style="text-align: center; margin-bottom: 28px;">
          <div style="display: inline-block; width: 64px; height: 64px; line-height: 64px; border-radius: 50%; background-color: #f0fdfa; border: 2px solid #14b8a6; font-size: 30px; margin-bottom: 12px;">
            📨
          </div>
          <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 800; color: #0f172a;">ได้รับหลักฐานการชำระเงินเรียบร้อยแล้ว</h2>
          <p style="color: #64748b; margin: 0; font-size: 15px;">สวัสดีคุณ <strong>${reg.firstName} ${reg.lastName}</strong>, ระบบได้รับสลิปโอนเงินของท่านแล้ว และได้ส่งต่อให้ฝ่ายตรวจสอบความถูกต้อง</p>
        </div>

        <!-- Highlight Card -->
        <div style="background-color: #f0fdfa; border: 1.5px solid #5eead4; border-radius: 18px; padding: 22px; margin-bottom: 28px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #99f6e4; padding-bottom: 12px; margin-bottom: 12px;">
            <span style="font-size: 13px; font-weight: 700; color: #0f766e;">รหัสการลงทะเบียน (Ref ID):</span>
            <span style="font-family: monospace; font-size: 18px; font-weight: 900; color: #0f766e; letter-spacing: 1px;">${reg.id}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #99f6e4; padding-bottom: 12px; margin-bottom: 12px;">
            <span style="font-size: 13px; font-weight: 700; color: #0f766e;">ยอดชำระที่แจ้ง:</span>
            <span style="font-size: 18px; font-weight: 900; color: #ea580c;">${reg.price.toLocaleString()} บาท</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 13px; font-weight: 700; color: #0f766e;">สถานะปัจจุบัน:</span>
            <span style="font-size: 13px; font-weight: 800; background-color: #fff7ed; color: #ea580c; border: 1px solid #fed7aa; padding: 3px 12px; border-radius: 9999px;">
              รอการอนุมัติ (Pending Verification)
            </span>
          </div>
        </div>

        <!-- Next Steps Timeline -->
        <h3 style="color: #0f766e; font-size: 16px; border-bottom: 2px solid #ccfbf1; padding-bottom: 8px; margin: 0 0 16px; font-weight: 800;">
          📌 สิ่งที่จะเกิดขึ้นต่อไป
        </h3>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 20px; margin-bottom: 28px;">
          <div style="margin-bottom: 16px; display: flex; align-items: flex-start;">
            <span style="background-color: #0d9488; color: #ffffff; font-weight: 800; font-size: 12px; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">1</span>
            <div>
              <strong style="color: #0f172a; font-size: 14px; display: block;">การตรวจสอบสลิปและยอดเงิน</strong>
              <span style="font-size: 13px; color: #64748b;">เจ้าหน้าที่จะตรวจสอบความถูกต้องของสลิป โดยทั่วไปใช้เวลาประมาณ 12 - 24 ชั่วโมง</span>
            </div>
          </div>
          <div style="margin-bottom: 16px; display: flex; align-items: flex-start;">
            <span style="background-color: #f97316; color: #ffffff; font-weight: 800; font-size: 12px; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">2</span>
            <div>
              <strong style="color: #0f172a; font-size: 14px; display: block;">ส่งอีเมลบัตรเข้างาน E-Ticket & หมายเลข BIB</strong>
              <span style="font-size: 13px; color: #64748b;">เมื่อได้รับการอนุมัติเรียบร้อย ระบบจะส่งอีเมลแจ้งเลข BIB และ QR Code สำหรับเข้างานให้ท่านโดยอัตโนมัติ</span>
            </div>
          </div>
          <div style="display: flex; align-items: flex-start;">
            <span style="background-color: #64748b; color: #ffffff; font-weight: 800; font-size: 12px; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">3</span>
            <div>
              <strong style="color: #0f172a; font-size: 14px; display: block;">การรับอุปกรณ์และเตรียมตัวสำหรับวันงาน</strong>
              <span style="font-size: 13px; color: #64748b;">รับอุปกรณ์ตามวิธีที่ท่านเลือก (จัดส่งพัสดุ หรือ รับหน้างาน) และพบกันวันอาทิตย์ที่ 24 มกราคม 2570</span>
            </div>
          </div>
        </div>

        <!-- Status Button -->
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${appUrl}?checkRef=${reg.id}" target="_blank" style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 14px; font-weight: 800; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(13, 148, 136, 0.3);">
            ตรวจสอบสถานะบนเว็บไซต์ ↗
          </a>
        </div>

        <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 14px 16px; border-radius: 0 12px 12px 0; font-size: 12px; color: #9a3412;">
          💡 <strong>ข้อแนะนำ:</strong> หากท่านโอนเงินถูกต้องเรียบร้อยแล้ว ไม่จำเป็นต้องโอนเงินซ้ำหรือส่งข้อมูลซ้ำ ระบบจะรักษาคิวของท่านตามลำดับเวลาที่แนบสลิป
        </div>
      </div>

      ${getEmailFooterHtml()}
    </div>
  `;
};

// 3. อีเมลแจ้งอนุมัติสิทธิ์ & บัตรเข้างาน E-Ticket / E-BIB Pass [USER REQUEST 2]
const getApprovalEmailHtml = (reg: Registration, appUrl: string = "https://lsed-running.web.app") => {
  const isDonation = reg.distance === "donation";
  const bib = reg.bibNumber || "LSE-1001";
  const entryQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(reg.id)}&margin=10`;

  return `
    <div style="font-family: 'Poppins', 'Prompt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff; color: #1e293b; box-shadow: 0 12px 35px -8px rgba(13, 148, 136, 0.16);">
      ${getEmailHeaderHtml("🎉 อนุมัติสิทธิ์สำเร็จ • ยืนยันการเข้าร่วมงานวิ่ง", "#ecfdf5", "#047857", "#a7f3d0")}
      
      <div style="padding: 24px 32px 36px; line-height: 1.7;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="margin: 0 0 6px; font-size: 24px; font-weight: 900; color: #0f172a;">ยินดีต้อนรับสู่ขบวนวิ่งฉายแสง</h2>
          <p style="color: #64748b; margin: 0; font-size: 15px;">สวัสดีคุณ <strong>${reg.firstName} ${reg.lastName}</strong>, สิทธิ์ของท่านได้รับการอนุมัติเรียบร้อยแล้ว!</p>
        </div>

        <!-- ================= OFFICIAL RUNNER PASS / E-TICKET ================= -->
        <div style="background: linear-gradient(135deg, #042f2e 0%, #0f766e 50%, #0d9488 100%); border-radius: 22px; padding: 24px; color: #ffffff; margin-bottom: 30px; box-shadow: 0 10px 25px -5px rgba(15, 118, 110, 0.35); position: relative; overflow: hidden;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.2); padding-bottom: 14px; margin-bottom: 18px;">
            <div>
              <span style="font-size: 11px; font-weight: 800; color: #fed7aa; text-transform: uppercase; letter-spacing: 1.5px; display: block;">OFFICIAL RUNNER PASS</span>
              <span style="font-size: 16px; font-weight: 900; color: #ffffff;">โครงการวิ่ง-ฉาย-แสง (LSEd RUNNING 2569)</span>
            </div>
            <div style="background-color: #ea580c; color: #ffffff; font-size: 11px; font-weight: 900; padding: 4px 12px; border-radius: 9999px; letter-spacing: 0.5px;">
              ${reg.distance.toUpperCase()}
            </div>
          </div>

          <!-- BIB Display -->
          <div style="text-align: center; background-color: rgba(255, 255, 255, 0.1); border: 1.5px dashed rgba(255, 255, 255, 0.35); border-radius: 16px; padding: 20px 14px; margin-bottom: 18px;">
            <p style="margin: 0 0 4px; font-size: 12px; font-weight: 800; color: #fed7aa; text-transform: uppercase; letter-spacing: 2px;">
              ${isDonation ? "หมายเลขผู้บริจาค (DONOR ID)" : "หมายเลขบิ๊บประจำตัวนักวิ่ง (BIB NUMBER)"}
            </p>
            <div style="font-family: 'Poppins', 'Courier New', monospace; font-size: 44px; font-weight: 900; color: #ffffff; letter-spacing: 3px; line-height: 1.1; text-shadow: 0 2px 8px rgba(0,0,0,0.3);">
              ${bib}
            </div>
          </div>

          <!-- QR Code Entry Ticket -->
          <div style="background-color: #ffffff; border-radius: 16px; padding: 18px; text-align: center; color: #0f172a; margin-bottom: 18px;">
            <p style="margin: 0 0 10px; font-size: 13px; font-weight: 800; color: #0f766e;">
              📱 QR Code สำหรับเช็คอินเข้างาน & รับอุปกรณ์
            </p>
            <div style="display: inline-block; padding: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
              <img src="${entryQrUrl}" alt="Entry QR Code" style="display: block; width: 150px; height: 150px; border-radius: 8px;" />
            </div>
            <p style="margin: 10px 0 0; font-size: 11px; font-weight: 700; color: #64748b;">
              โปรดบันทึกภาพหน้าจอนี้ หรือเปิดอีเมลแสดงต่อเจ้าหน้าที่ ณ จุดลงทะเบียน
            </p>
          </div>

          <!-- Runner Info Grid -->
          <table style="width: 100%; font-size: 12px; color: #e0f2fe; line-height: 1.8;">
            <tr>
              <td style="color: #99f6e4;">ชื่อ-นามสกุล:</td>
              <td style="text-align: right; font-weight: 700; color: #ffffff;">${reg.firstName} ${reg.lastName}</td>
            </tr>
            <tr>
              <td style="color: #99f6e4;">รหัสลงทะเบียน (Ref ID):</td>
              <td style="text-align: right; font-family: monospace; font-weight: 700; color: #ffffff;">${reg.id}</td>
            </tr>
            <tr>
              <td style="color: #99f6e4;">ไซส์เสื้อ:</td>
              <td style="text-align: right; font-weight: 700; color: #ffffff;">${reg.shirtSize === "NONE" ? "ไม่รับเสื้อ" : reg.shirtSize}</td>
            </tr>
            <tr>
              <td style="color: #99f6e4;">วิธีรับอุปกรณ์:</td>
              <td style="text-align: right; font-weight: 700; color: #fed7aa;">${reg.deliveryMethod === 'shipping' ? "จัดส่งทางไปรษณีย์" : "รับด้วยตนเองหน้างาน"}</td>
            </tr>
          </table>
        </div>

        <!-- ================= ESSENTIAL RACE DAY INFORMATION ================= -->
        <h3 style="color: #0f766e; font-size: 17px; border-bottom: 2px solid #ccfbf1; padding-bottom: 8px; margin: 0 0 16px; font-weight: 800;">
          🗓️ ข้อมูลสำคัญในวันจัดงาน (Race Day Guide)
        </h3>
        
        <table style="width: 100%; border-collapse: separate; border-spacing: 0 10px; margin-bottom: 26px; font-size: 13px;">
          <tr>
            <td style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 14px 16px; border-radius: 0 12px 12px 0;">
              <strong style="color: #0f766e; font-size: 14px; display: block; margin-bottom: 4px;">📅 วันจัดกิจกรรม</strong>
              <span style="color: #0f172a; font-weight: 700; font-size: 15px;">วันอาทิตย์ที่ 24 มกราคม พ.ศ. 2570</span>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 14px 16px; border-radius: 0 12px 12px 0;">
              <strong style="color: #0f766e; font-size: 14px; display: block; margin-bottom: 4px;">📍 สถานที่จัดงาน</strong>
              <span style="color: #0f172a; font-weight: 700;">ลานกิจกรรม คณะวิทยาการเรียนรู้และศึกษาศาสตร์ (LSEd) มหาวิทยาลัยธรรมศาสตร์ ศูนย์รังสิต</span>
            </td>
          </tr>
          <tr>
            <td style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 14px 16px; border-radius: 0 12px 12px 0;">
              <strong style="color: #ea580c; font-size: 14px; display: block; margin-bottom: 6px;">⏰ กำหนดการปล่อยตัว (Flag-off Schedule)</strong>
              <div style="color: #334155; line-height: 1.8;">
                • <strong>04:00 น.</strong> เปิดจุดลงทะเบียน รายงานตัว และรับฝากสัมภาระ<br/>
                • <strong>04:40 น.</strong> รวมพลวอร์มอัพยืดเหยียดร่างกาย โดยทีมผู้เชี่ยวชาญ<br/>
                • <strong>05:00 น.</strong> สัญญาณแตรปล่อยตัวนักวิ่งระยะ 5 กิโลเมตร (Flag-off)<br/>
                • <strong>06:30 น.</strong> ร่วมรับประทานอาหารเช้า ข้าวต้ม และเครื่องดื่มสุขภาพ<br/>
                • <strong>07:15 น.</strong> พิธีมอบของที่ระลึก ถ่ายภาพร่วมกัน และปิดงาน
              </div>
            </td>
          </tr>
        </table>

        <!-- ================= RACE KIT COLLECTION ================= -->
        <h3 style="color: #0f766e; font-size: 17px; border-bottom: 2px solid #ccfbf1; padding-bottom: 8px; margin: 0 0 14px; font-weight: 800;">
          📦 การรับอุปกรณ์วิ่ง (เสื้อ & หมายเลขบิ๊บ)
        </h3>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px; margin-bottom: 26px; font-size: 13px; line-height: 1.8;">
          ${reg.deliveryMethod === 'shipping' ? `
            <div style="display: flex; align-items: flex-start;">
              <span style="font-size: 24px; margin-right: 12px;">🚚</span>
              <div>
                <strong style="color: #0f172a; font-size: 14px; display: block;">ท่านเลือก: จัดส่งทางไปรษณีย์ถึงบ้าน</strong>
                <p style="margin: 4px 0 0; color: #475569;">
                  ทางโครงการจะจัดส่งพัสดุอุปกรณ์วิ่งถึงที่อยู่ของท่านล่วงหน้า 7 - 10 วันก่อนวันแข่งขัน 
                  และระบบจะส่งอีเมลแจ้งหมายเลขพัสดุ (Tracking Number) ให้ท่านโดยอัตโนมัติเมื่อเริ่มจัดส่ง
                </p>
              </div>
            </div>
          ` : `
            <div style="display: flex; align-items: flex-start;">
              <span style="font-size: 24px; margin-right: 12px;">🎪</span>
              <div>
                <strong style="color: #0f172a; font-size: 14px; display: block;">ท่านเลือก: รับด้วยตนเองหน้างาน</strong>
                <p style="margin: 4px 0 0; color: #475569;">
                  สามารถมารับอุปกรณ์ได้ 2 ช่วงเวลาดังนี้:<br/>
                  1. <strong>วันเสาร์ที่ 23 มกราคม 2570</strong> เวลา 10:00 - 18:00 น. ณ โถงกิจกรรม คณะ LSEd มธ.ศูนย์รังสิต<br/>
                  2. <strong>เช้าวันแข่งขัน 24 มกราคม 2570</strong> เวลา 04:00 - 04:45 น. ณ จุดรับอุปกรณ์หน้างาน<br/>
                  <span style="color: #0f766e; font-weight: 700;">*โปรดเตรียม QR Code ในอีเมลนี้หรือบัตรประชาชนมาแสดงตน</span>
                </p>
              </div>
            </div>
          `}
        </div>

        <!-- ================= RUNNER ENTITLEMENTS & PARKING ================= -->
        <h3 style="color: #0f766e; font-size: 17px; border-bottom: 2px solid #ccfbf1; padding-bottom: 8px; margin: 0 0 14px; font-weight: 800;">
          ✨ สิทธิประโยชน์ & ข้อมูลการเดินทาง
        </h3>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px; margin-bottom: 28px; font-size: 13px; line-height: 1.8;">
          <strong style="color: #0f172a; display: block; margin-bottom: 6px;">🎁 สิ่งที่ท่านจะได้รับ:</strong>
          <ul style="margin: 0 0 14px; padding-left: 20px; color: #475569;">
            <li>เสื้อวิ่งที่ระลึกผ้าไมโครดาวกระจาย นุ่ม เบา ระบายอากาศดีเยี่ยม</li>
            <li>เหรียญรางวัลที่ระลึก Run to Shine (เมื่อเข้าเส้นชัย)</li>
            <li>จุดบริการน้ำดื่มเกลือแร่ทุก 2 กิโลเมตร และหน่วยปฐมพยาบาลตลอดเส้นทาง</li>
            <li>อาหารเช้าเพื่อสุขภาพ ผลไม้ และเครื่องดื่มไม่อั้นหลังเข้าเส้นชัย</li>
            <li>ประกันอุบัติเหตุคุ้มครองตลอดช่วงเวลาจัดกิจกรรม</li>
            ${isDonation ? "<li>สิทธิ์ลดหย่อนภาษี 2 เท่า (e-Donation กรมสรรพากรอัตโนมัติ)</li>" : ""}
          </ul>

          <strong style="color: #0f172a; display: block; margin-bottom: 6px;">🚗 จุดจอดรถ (ที่จอดรถฟรี):</strong>
          <p style="margin: 0; color: #475569;">
            ท่านสามารถนำรถยนต์เข้าจอดได้ฟรี ณ ลานจอดรถยิมเนเซียม 4, 5, 6 และอาคารจอดรถรอบคณะ LSEd มหาวิทยาลัยธรรมศาสตร์ ศูนย์รังสิต (เดินมายังจุดสตาร์ทประมาณ 300 เมตร)
          </p>
        </div>

        <!-- ================= BUTTONS ================= -->
        <div style="text-align: center; margin-bottom: 28px;">
          <a href="${appUrl}?checkRef=${reg.id}" target="_blank" style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff; padding: 15px 32px; text-decoration: none; border-radius: 14px; font-weight: 800; font-size: 15px; display: inline-block; box-shadow: 0 6px 18px rgba(13, 148, 136, 0.35); margin-right: 8px; margin-bottom: 10px;">
            เปิดดูบัตร E-BIB บนเว็บไซต์ ↗
          </a>
          <a href="https://maps.google.com/?q=Faculty+of+Learning+Sciences+and+Education+Thammasat+University" target="_blank" style="background-color: #ffffff; color: #0f766e; border: 1.5px solid #14b8a6; padding: 14px 24px; text-decoration: none; border-radius: 14px; font-weight: 800; font-size: 14px; display: inline-block;">
            📍 แผนที่ Google Maps
          </a>
        </div>

        <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
          หากท่านมีข้อสงสัยหรือต้องการสอบถามข้อมูลเพิ่มเติม สามารถติดต่อสอบถามได้ทางอีเมลนี้ หรือโทรติดต่อคณะ LSEd มธ.
        </p>
      </div>

      ${getEmailFooterHtml()}
    </div>
  `;
};

// 4. อีเมลแจ้งสลิปมีปัญหา / ขอให้อัปโหลดใหม่
const getRejectionEmailHtml = (reg: Registration, reason: string, appUrl: string = "https://lsed-running.web.app") => {
  return `
    <div style="font-family: 'Poppins', 'Prompt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff; color: #1e293b; box-shadow: 0 12px 30px -8px rgba(225, 29, 72, 0.12);">
      ${getEmailHeaderHtml("⚠️ แจ้งเตือน • พบปัญหาการตรวจสอบสลิป", "#fff1f2", "#be123c", "#fecdd3")}
      
      <div style="padding: 24px 32px 36px; line-height: 1.7;">
        <div style="text-align: center; margin-bottom: 28px;">
          <div style="display: inline-block; width: 64px; height: 64px; line-height: 64px; border-radius: 50%; background-color: #fff1f2; border: 2px solid #f43f5e; font-size: 30px; margin-bottom: 12px;">
            ⚠️
          </div>
          <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 800; color: #0f172a;">สลิปโอนเงินไม่ผ่านการตรวจสอบ</h2>
          <p style="color: #64748b; margin: 0; font-size: 15px;">สวัสดีคุณ <strong>${reg.firstName} ${reg.lastName}</strong>, สลิปที่ท่านแนบมาไม่สามารถยืนยันความถูกต้องได้</p>
        </div>

        <div style="background-color: #fff1f2; border-left: 4px solid #e11d48; padding: 20px; border-radius: 0 14px 14px 0; margin-bottom: 28px;">
          <p style="margin: 0 0 6px; font-weight: 800; color: #9f1239; font-size: 14px;">เหตุผลจากเจ้าหน้าที่ผู้ตรวจสอบ:</p>
          <p style="margin: 0; color: #be123c; font-size: 15px; font-weight: 600;">"${reason}"</p>
        </div>

        <h3 style="color: #0f172a; font-size: 16px; margin: 0 0 14px; font-weight: 800;">วิธีดำเนินการแก้ไข (ทำได้ทันที):</h3>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 28px; font-size: 14px; color: #475569;">
          <ol style="margin: 0; padding-left: 20px; line-height: 1.9;">
            <li>คลิกปุ่ม <strong>"อัปโหลดสลิปใหม่"</strong> ด้านล่างนี้</li>
            <li>ระบบจะพาท่านไปยังหน้าส่งสลิปพร้อมกรอกรหัส <strong>${reg.id}</strong> ให้โดยอัตโนมัติ</li>
            <li>แนบรูปภาพสลิปที่ชัดเจนและมียอดโอนถูกต้อง <strong>${reg.price.toLocaleString()} บาท</strong></li>
          </ol>
        </div>

        <div style="text-align: center; margin-bottom: 20px;">
          <a href="${appUrl}?checkRef=${reg.id}" target="_blank" style="background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 14px; font-weight: 800; font-size: 15px; display: inline-block; box-shadow: 0 6px 18px rgba(225, 29, 72, 0.3);">
            อัปโหลดสลิปใหม่ทันที ↗
          </a>
        </div>
      </div>

      ${getEmailFooterHtml()}
    </div>
  `;
};

// 5. อีเมลแจ้งจัดส่งพัสดุ (Shipping Tracking)
const getShippingEmailHtml = (reg: Registration, appUrl: string = "https://lsed-running.web.app") => {
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
    <div style="font-family: 'Poppins', 'Prompt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff; color: #1e293b; box-shadow: 0 12px 30px -8px rgba(234, 88, 12, 0.12);">
      ${getEmailHeaderHtml("📦 จัดส่งพัสดุแล้ว • เสื้อวิ่งและหมายเลขบิ๊บ", "#fff7ed", "#ea580c", "#ffedd5")}
      
      <div style="padding: 24px 32px 36px; line-height: 1.7;">
        <div style="text-align: center; margin-bottom: 28px;">
          <div style="display: inline-block; width: 64px; height: 64px; line-height: 64px; border-radius: 50%; background-color: #fff7ed; border: 2px solid #fb923c; font-size: 30px; margin-bottom: 12px;">
            🚚
          </div>
          <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 800; color: #0f172a;">พัสดุของคุณอยู่ระหว่างการจัดส่ง!</h2>
          <p style="color: #64748b; margin: 0; font-size: 15px;">สวัสดีคุณ <strong>${reg.firstName} ${reg.lastName}</strong>, อุปกรณ์วิ่งของท่านถูกจัดส่งเรียบร้อยแล้ว</p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px; margin-bottom: 28px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <p style="margin: 0 0 6px; font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px;">หมายเลขพัสดุ (Tracking Number)</p>
            <span style="font-family: monospace; font-size: 28px; font-weight: 900; color: #ea580c; letter-spacing: 1.5px; display: block; word-break: break-all;">
              ${reg.shippingTrackingNumber}
            </span>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">ผู้ให้บริการจัดส่ง:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: 700; color: #0f172a; text-align: right;">${carrierName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">วันที่จัดส่ง:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: 700; color: #0f172a; text-align: right;">${reg.shippedAt || "วันนี้"}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">หมายเลขบิ๊บในพัสดุ:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: 800; color: #0d9488; text-align: right;">${reg.bibNumber || "-"}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${trackingUrl}" target="_blank" style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; padding: 15px 32px; text-decoration: none; border-radius: 14px; font-weight: 800; font-size: 15px; display: inline-block; box-shadow: 0 6px 18px rgba(234, 88, 12, 0.35); margin-bottom: 10px;">
            ติดตามสถานะพัสดุ ↗
          </a>
        </div>

        <div style="background-color: #f0fdfa; border: 1px solid #ccfbf1; padding: 14px 16px; border-radius: 12px; font-size: 12px; color: #0f766e; text-align: center;">
          💡 ระบบติดตามพัสดุอาจใช้เวลาประมาณ 12 - 24 ชั่วโมงในการเชื่อมโยงข้อมูลเข้าระบบขนส่ง หากยังไม่พบข้อมูล สามารถลองตรวจสอบอีกครั้งในวันถัดไป
        </div>
      </div>

      ${getEmailFooterHtml()}
    </div>
  `;
};

// 6. อีเมลแจ้งเตือนล่วงหน้า 3 วันก่อนวันงาน (3-Day Race Reminder & Briefing)
const getRaceDayReminderEmailHtml = (reg: Registration, appUrl: string = "https://lsed-running.web.app") => {
  const bib = reg.bibNumber || "LSE-1001";
  const entryQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(reg.id)}&margin=10`;

  return `
    <div style="font-family: 'Poppins', 'Prompt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff; color: #1e293b; box-shadow: 0 12px 35px -8px rgba(13, 148, 136, 0.18);">
      ${getEmailHeaderHtml("⏰ เตือนความจำล่วงหน้า 3 วัน • สู่วันวิ่งฉายแสง", "#fff7ed", "#ea580c", "#ffedd5")}
      
      <div style="padding: 24px 32px 36px; line-height: 1.7;">
        <!-- Header Greetings -->
        <div style="text-align: center; margin-bottom: 26px;">
          <div style="display: inline-block; background-color: #f0fdfa; border: 1.5px solid #14b8a6; color: #0f766e; font-size: 13px; font-weight: 800; padding: 6px 18px; border-radius: 9999px; margin-bottom: 12px; letter-spacing: 0.5px;">
            🏃‍♂️ นับถอยหลังอีก 3 วัน สู่วันอาทิตย์ที่ 24 มกราคม 2570
          </div>
          <h2 style="margin: 0 0 8px; font-size: 23px; font-weight: 900; color: #0f172a;">พร้อมแล้วหรือยัง? ข้อมูลเตรียมตัวก่อนวันแข่งขัน</h2>
          <p style="color: #64748b; margin: 0; font-size: 15px;">สวัสดีคุณ <strong>${reg.firstName} ${reg.lastName}</strong>, สรุปข้อมูลสถานที่ เวลา และสิ่งของที่ต้องนำมาในวันงาน</p>
        </div>

        <!-- ================= RUNNER TICKET PASS ================= -->
        <div style="background: linear-gradient(135deg, #042f2e 0%, #0f766e 60%, #0d9488 100%); border-radius: 20px; padding: 22px; color: #ffffff; margin-bottom: 26px; box-shadow: 0 8px 20px -4px rgba(15, 118, 110, 0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.2); padding-bottom: 12px; margin-bottom: 16px;">
            <div>
              <span style="font-size: 11px; font-weight: 800; color: #fed7aa; text-transform: uppercase; letter-spacing: 1px;">บัตรประจำตัวนักวิ่ง (RUNNER PASS)</span>
              <p style="margin: 0; font-size: 15px; font-weight: 800;">${reg.firstName} ${reg.lastName}</p>
            </div>
            <div style="background-color: #ea580c; color: #ffffff; font-size: 11px; font-weight: 900; padding: 4px 12px; border-radius: 9999px;">
              ${reg.distance.toUpperCase()}
            </div>
          </div>

          <!-- BIB Number Banner -->
          <div style="background-color: rgba(255, 255, 255, 0.1); border: 1.5px dashed rgba(255, 255, 255, 0.35); border-radius: 14px; padding: 14px; text-align: center; margin-bottom: 16px;">
            <p style="margin: 0 0 2px; font-size: 11px; font-weight: 800; color: #fed7aa; letter-spacing: 1.5px; text-transform: uppercase;">หมายเลข BIB ประจำตัวของคุณ</p>
            <span style="font-family: monospace; font-size: 38px; font-weight: 900; color: #ffffff; letter-spacing: 3px; display: block; text-shadow: 0 2px 8px rgba(0,0,0,0.3);">${bib}</span>
          </div>

          <!-- QR Code Entry -->
          <div style="background-color: #ffffff; border-radius: 14px; padding: 16px; text-align: center; color: #0f172a;">
            <p style="margin: 0 0 8px; font-size: 13px; font-weight: 800; color: #0f766e;">
              📱 QR Code สำหรับเช็คอินเข้างาน & จุดรับฝากของ
            </p>
            <div style="display: inline-block; padding: 6px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
              <img src="${entryQrUrl}" alt="Entry QR Code" style="display: block; width: 140px; height: 140px; border-radius: 6px;" />
            </div>
            <p style="margin: 8px 0 0; font-size: 11px; color: #64748b;">
              บันทึกภาพหน้าจอหรือเปิดอีเมลนี้แสดงต่อเจ้าหน้าที่
            </p>
          </div>
        </div>

        <!-- ================= SECTION 1: สถานที่และการเดินทาง ================= -->
        <h3 style="color: #0f766e; font-size: 16px; border-bottom: 2px solid #ccfbf1; padding-bottom: 8px; margin: 0 0 14px; font-weight: 800; display: flex; align-items: center;">
          📍 1. สถานที่จัดงานและการเดินทาง
        </h3>
        <div style="background-color: #f0fdfa; border: 1.5px solid #ccfbf1; border-radius: 16px; padding: 18px; margin-bottom: 26px; font-size: 13px; line-height: 1.8;">
          <div style="margin-bottom: 10px;">
            <strong style="color: #0f766e; font-size: 14px; display: block;">สถานที่จัดกิจกรรม:</strong>
            <span style="color: #0f172a; font-weight: 700;">ลานกิจกรรม คณะวิทยาการเรียนรู้และศึกษาศาสตร์ (LSEd) มหาวิทยาลัยธรรมศาสตร์ ศูนย์รังสิต</span>
          </div>
          <div style="margin-bottom: 10px;">
            <strong style="color: #0f766e; font-size: 14px; display: block;">🚗 จุดจอดรถฟรี (Free Parking):</strong>
            <span style="color: #334155;">
              • <strong>ลานจอดรถยิมเนเซียม 4, 5, 6</strong> มธ. ศูนย์รังสิต (รองรับรถยนต์ได้มากกว่า 500 คัน)<br/>
              • <strong>อาคารจอดรถรอบคณะ LSEd</strong> (เดินมายังจุดปล่อยตัวเพียง 3-5 นาที)
            </span>
          </div>
          <div>
            <strong style="color: #0f766e; font-size: 14px; display: block;">🚪 ประตูเข้าสู่มหาวิทยาลัยที่แนะนำ:</strong>
            <span style="color: #334155;">
              แนะนำเข้าทาง <strong>ประตูพหลโยธิน 1</strong> (ฝั่งถนนพหลโยธิน) หรือ <strong>ประตูเชียงราก 1</strong> (ฝั่งถนนเชียงราก) จะใกล้จุดจัดงานมากที่สุด
            </span>
          </div>
        </div>

        <!-- ================= SECTION 2: เวลาและกำหนดการ ================= -->
        <h3 style="color: #0f766e; font-size: 16px; border-bottom: 2px solid #ccfbf1; padding-bottom: 8px; margin: 0 0 14px; font-weight: 800;">
          ⏰ 2. กำหนดการวันงาน วันอาทิตย์ที่ 24 มกราคม 2570
        </h3>
        <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 18px; border-radius: 0 16px 16px 0; margin-bottom: 26px; font-size: 13px; line-height: 1.9;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; font-weight: 800; color: #ea580c; width: 85px; vertical-align: top;">04:00 น.</td>
              <td style="padding: 4px 0; color: #0f172a;">เปิดจุดลงทะเบียน รายงานตัว ตรวจสอบ BIB และเปิดจุดรับฝากสัมภาระ</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: 800; color: #ea580c; width: 85px; vertical-align: top;">04:40 น.</td>
              <td style="padding: 4px 0; color: #0f172a;">รวมพลบริเวณหน้าเวที ยืดเหยียดกล้ามเนื้อและวอร์มอัพร่างกายโดยทีมผู้เชี่ยวชาญ</td>
            </tr>
            <tr style="background-color: rgba(234, 88, 12, 0.08);">
              <td style="padding: 6px 4px; font-weight: 900; color: #c2410c; width: 85px; vertical-align: top;">05:00 น.</td>
              <td style="padding: 6px 4px; font-weight: 800; color: #c2410c;">🔔 สัญญาณแตรปล่อยตัวนักวิ่งระยะ 5 กิโลเมตร (Flag-off) พร้อมกัน</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: 800; color: #ea580c; width: 85px; vertical-align: top;">06:30 น.</td>
              <td style="padding: 4px 0; color: #0f172a;">ร่วมรับประทานอาหารเช้า ข้าวต้ม ผลไม้ และเครื่องดื่มสุขภาพหลังเข้าเส้นชัย</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: 800; color: #ea580c; width: 85px; vertical-align: top;">07:15 น.</td>
              <td style="padding: 4px 0; color: #0f172a;">พิธีมอบของที่ระลึก ถ่ายภาพร่วมกัน และปิดกิจกรรม</td>
            </tr>
          </table>
          <p style="margin: 8px 0 0; font-size: 12px; color: #9a3412; font-weight: 700;">
            *ขอความกรุณานักวิ่งทุกท่านเดินทางมาถึงก่อนเวลา 04:30 น. เพื่อความสะดวกในการฝากสัมภาระและเตรียมตัว
          </p>
        </div>

        <!-- ================= SECTION 3: เช็คลิสต์สิ่งของที่ต้องนำมา ================= -->
        <h3 style="color: #0f766e; font-size: 16px; border-bottom: 2px solid #ccfbf1; padding-bottom: 8px; margin: 0 0 14px; font-weight: 800;">
          🎒 3. สิ่งของที่ต้องนำมาในวันงาน (Runner's Checklist)
        </h3>
        <div style="background-color: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 26px; font-size: 13px; line-height: 2;">
          <div style="display: flex; align-items: flex-start; margin-bottom: 8px;">
            <span style="color: #0d9488; font-weight: 900; margin-right: 8px; font-size: 16px;">☑</span>
            <div><strong style="color: #0f172a;">หมายเลข BIB ประจำตัว (${bib}):</strong> ติดเข็มกลัดที่หน้าอกเสื้อให้มองเห็นได้ชัดเจนตลอดการวิ่ง</div>
          </div>
          <div style="display: flex; align-items: flex-start; margin-bottom: 8px;">
            <span style="color: #0d9488; font-weight: 900; margin-right: 8px; font-size: 16px;">☑</span>
            <div><strong style="color: #0f172a;">QR Code บัตรเข้างาน / บัตรประชาชน:</strong> สำหรับสแกนเข้างาน หรือใช้ยืนยันตัวตนในกรณีต่างๆ</div>
          </div>
          <div style="display: flex; align-items: flex-start; margin-bottom: 8px;">
            <span style="color: #0d9488; font-weight: 900; margin-right: 8px; font-size: 16px;">☑</span>
            <div><strong style="color: #0f172a;">เสื้อวิ่งของโครงการ:</strong> สวมใส่เสื้อโครงการผ้าดาวกระจายเพื่อความพร้อมเพรียงและสวยงาม</div>
          </div>
          <div style="display: flex; align-items: flex-start; margin-bottom: 8px;">
            <span style="color: #0d9488; font-weight: 900; margin-right: 8px; font-size: 16px;">☑</span>
            <div><strong style="color: #0f172a;">รองเท้าวิ่งและถุงเท้ากีฬา:</strong> สวมใส่คู่ที่คุ้นเคยเพื่อป้องกันการบาดเจ็บและแผลพุพอง</div>
          </div>
          <div style="display: flex; align-items: flex-start; margin-bottom: 8px;">
            <span style="color: #0d9488; font-weight: 900; margin-right: 8px; font-size: 16px;">☑</span>
            <div><strong style="color: #0f172a;">ยาประจำตัว:</strong> หากท่านมีโรคประจำตัวหรือแพ้ยา กรุณานำติดตัวมาด้วยเสมอ</div>
          </div>
          <div style="display: flex; align-items: flex-start;">
            <span style="color: #0d9488; font-weight: 900; margin-right: 8px; font-size: 16px;">☑</span>
            <div><strong style="color: #0f172a;">กระบอกน้ำส่วนตัว (รักษ์โลก):</strong> โครงการจัดจุดเติมน้ำเย็นตลอดงานเพื่อลดขยะพลาสติก</div>
          </div>
        </div>

        <!-- ================= SECTION 4: การรับอุปกรณ์สำหรับผู้ที่ยังไม่ได้รับ ================= -->
        <h3 style="color: #0f766e; font-size: 16px; border-bottom: 2px solid #ccfbf1; padding-bottom: 8px; margin: 0 0 14px; font-weight: 800;">
          🎪 4. การรับอุปกรณ์ (สำหรับผู้ที่ยังไม่ได้รับเสื้อและบิ๊บ)
        </h3>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px; margin-bottom: 26px; font-size: 13px; line-height: 1.8;">
          ${reg.deliveryMethod === 'shipping' ? `
            <p style="margin: 0; color: #334155;">
              • <strong>กรณีจัดส่งทางไปรษณีย์:</strong> หากท่านยังไม่ได้รับพัสดุอุปกรณ์วิ่งภายในวันศุกร์ที่ 22 ม.ค. 2570 
              สามารถติดต่อโต๊ะอำนวยการหน้างานในเช้าวันแข่งขัน พร้อมแสดง Ref ID: <strong>${reg.id}</strong> เพื่อรับอุปกรณ์วิ่งสำรองได้ทันที
            </p>
          ` : `
            <p style="margin: 0; color: #334155;">
              • <strong>กรณีรับด้วยตนเองหน้างาน:</strong> สามารถมารับได้ 2 ช่วงเวลา:<br/>
              1. <strong>วันเสาร์ที่ 23 มกราคม 2570</strong> เวลา 10:00 - 18:00 น. ณ โถงกิจกรรม คณะ LSEd มธ.ศูนย์รังสิต (แนะนำช่วงนี้เพื่อเลี่ยงความแออัด)<br/>
              2. <strong>เช้าวันอาทิตย์ที่ 24 มกราคม 2570</strong> เวลา 04:00 - 04:45 น. ณ จุดรับอุปกรณ์หน้างาน
            </p>
          `}
        </div>

        <!-- ================= SECTION 5: ข้อแนะนำสุขภาพ ================= -->
        <div style="background-color: #f0fdfa; border: 1px solid #99f6e4; border-radius: 14px; padding: 16px; margin-bottom: 28px; font-size: 12px; line-height: 1.8; color: #0f766e;">
          💡 <strong>ข้อแนะนำด้านสุขภาพ:</strong> กรุณานอนหลับพักผ่อนให้เพียงพออย่างน้อย 7-8 ชั่วโมงในคืนก่อนวันแข่งขัน งดอาหารมื้อหนักก่อนเวลาปล่อยตัว 2 ชั่วโมง จิบน้ำเป็นระยะ และหากรู้สึกผิดปกติหรือมีอาการหน้ามืดระหว่างวิ่ง โปรดหยุดพักและแจ้งหน่วยพยาบาลทันที
        </div>

        <!-- ================= BUTTONS ================= -->
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${appUrl}?checkRef=${reg.id}" target="_blank" style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 14px; font-weight: 800; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(13, 148, 136, 0.3); margin-right: 8px; margin-bottom: 10px;">
            เปิดดูบัตร E-BIB บนเว็บไซต์ ↗
          </a>
          <a href="https://maps.google.com/?q=Faculty+of+Learning+Sciences+and+Education+Thammasat+University" target="_blank" style="background-color: #ffffff; color: #0f766e; border: 1.5px solid #14b8a6; padding: 14px 22px; text-decoration: none; border-radius: 14px; font-weight: 800; font-size: 14px; display: inline-block;">
            📍 แผนที่ Google Maps
          </a>
        </div>
      </div>

      ${getEmailFooterHtml()}
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

// Helper to generate a unique Registration ID e.g., LSEd-XXXXXX
const generateRefID = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const timestampPart = Date.now().toString(36).toUpperCase().slice(-4);
  return `LSEd-${timestampPart}${result}`;
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

    // Send Payment Received Email
    const appUrl = req.headers.origin || req.protocol + "://" + req.get("host");
    const emailHtml = getPaymentReceivedEmailHtml(regData, appUrl);
    const emailPreviewUrl = await sendEmail(
      regData.email,
      "แจ้งได้รับหลักฐานการชำระเงินเรียบร้อยแล้ว - อยู่ระหว่างรออนุมัติ | วิ่ง-ฉาย-แสง (LSEd Running 2569)",
      emailHtml,
      { type: "payment_received", recipientName: `${regData.firstName} ${regData.lastName}` }
    );

    res.json({
      ...regData,
      emailPreviewUrl: emailPreviewUrl || undefined
    });
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
    const emailPreviewUrl = await sendEmail(
      reg.email,
      `🎉 บัตรเข้างาน E-Ticket & หมายเลข BIB (${reg.bibNumber}) | วิ่ง-ฉาย-แสง (LSEd Running 2569)`,
      emailHtml,
      { type: "approval", recipientName: `${reg.firstName} ${reg.lastName}` }
    );

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
    const appUrl = req.headers.origin || req.protocol + "://" + req.get("host");
    const emailHtml = getRejectionEmailHtml(reg, reason, appUrl);
    const emailPreviewUrl = await sendEmail(
      reg.email,
      "แจ้งผลการตรวจสอบหลักฐานการโอนเงิน | วิ่ง-ฉาย-แสง (LSEd Running 2569)",
      emailHtml,
      { type: "rejection", recipientName: `${reg.firstName} ${reg.lastName}` }
    );

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

// ==========================================
// EMAIL NOTIFICATIONS & REMINDER ENDPOINTS
// ==========================================

// Get recent email logs
app.get("/api/emails/recent", (req, res) => {
  res.json(recentEmailLogs);
});

// Preview email template with real or sample runner data
app.post("/api/emails/preview", async (req, res) => {
  const { type, id } = req.body;
  const appUrl = req.headers.origin || req.protocol + "://" + req.get("host");

  let reg: Registration | null = null;
  if (id) {
    try {
      const docSnap = await getDoc(doc(db, "registrations", id));
      if (docSnap.exists()) {
        reg = docSnap.data() as Registration;
      }
    } catch (e) {
      console.warn("Could not load runner for preview:", e);
    }
  }

  if (!reg) {
    reg = {
      id: "LSEd-SAMPLE",
      firstName: "ธนภัทร",
      lastName: "รุ่งเรืองฉาย",
      email: "runner.sample@example.com",
      phone: "081-234-5678",
      nationalId: "1100100123456",
      age: 26,
      gender: "male",
      bloodType: "B",
      emergencyContactName: "คุณแม่",
      emergencyContactPhone: "089-876-5432",
      distance: "REGULAR",
      shirtSize: "L",
      status: "approved",
      price: 555,
      bibNumber: "LSE-1024",
      deliveryMethod: "shipping",
      shippingTrackingNumber: "TH1234567890B",
      shippingCarrier: "thailandpost",
      shippedAt: "20 มกราคม 2570",
      createdAt: new Date().toISOString(),
    };
  }

  let html = "";
  let subject = "";

  switch (type) {
    case "registration": {
      const settings = await getPaymentSettings();
      html = getRegistrationEmailHtml(reg, settings, appUrl);
      subject = "ขั้นตอนที่ 1 / 2 : รอการชำระเงิน | วิ่ง-ฉาย-แสง (LSEd Running 2569)";
      break;
    }
    case "payment_received": {
      html = getPaymentReceivedEmailHtml(reg, appUrl);
      subject = "แจ้งได้รับหลักฐานการชำระเงินเรียบร้อยแล้ว - อยู่ระหว่างรออนุมัติ | วิ่ง-ฉาย-แสง (LSEd Running 2569)";
      break;
    }
    case "approval": {
      html = getApprovalEmailHtml(reg, appUrl);
      subject = `🎉 บัตรเข้างาน E-Ticket & หมายเลข BIB (${reg.bibNumber || "LSE-1024"}) | วิ่ง-ฉาย-แสง (LSEd Running 2569)`;
      break;
    }
    case "rejection": {
      html = getRejectionEmailHtml(reg, "ยอดเงินในสลิปไม่ตรงกับระยะวิ่งที่เลือก หรือภาพสลิปไม่คมชัด", appUrl);
      subject = "แจ้งผลการตรวจสอบหลักฐานการโอนเงิน | วิ่ง-ฉาย-แสง (LSEd Running 2569)";
      break;
    }
    case "shipping": {
      html = getShippingEmailHtml(reg, appUrl);
      subject = `แจ้งจัดส่งพัสดุเสร็จสิ้น - โครงการ วิ่ง-ฉาย-แสง (LSEd Running 2569) 🚚`;
      break;
    }
    case "reminder":
    default: {
      html = getRaceDayReminderEmailHtml(reg, appUrl);
      subject = `[สำคัญ] เตือนความจำล่วงหน้า 3 วันสู่งาน "วิ่ง-ฉาย-แสง" (LSEd Running 2569) 🏃‍♂️ วันอาทิตย์ที่ 24 มกราคม 2570`;
      break;
    }
  }

  res.json({ subject, html });
});

// Admin send single runner email
app.post("/api/admin/send-email", async (req, res) => {
  const { id, type, testEmail } = req.body;
  if (!id && !testEmail) {
    return res.status(400).json({ error: "โปรดระบุรหัสผู้สมัครหรืออีเมลทดสอบ" });
  }

  try {
    let reg: Registration | null = null;
    if (id) {
      const docSnap = await getDoc(doc(db, "registrations", id));
      if (docSnap.exists()) {
        reg = docSnap.data() as Registration;
      }
    }

    if (!reg) {
      reg = {
        id: "LSEd-TEST01",
        firstName: "ทดสอบ",
        lastName: "ระบบอีเมล",
        email: testEmail || "admin@example.com",
        phone: "081-000-0000",
        nationalId: "1100100000000",
        age: 25,
        gender: "other",
        bloodType: "Unknown",
        emergencyContactName: "ผู้ดูแลระบบ",
        emergencyContactPhone: "081-000-0000",
        distance: "REGULAR",
        shirtSize: "M",
        status: "approved",
        price: 555,
        bibNumber: "LSE-1001",
        deliveryMethod: "shipping",
        shippingTrackingNumber: "TH0099887766EMS",
        shippingCarrier: "thailandpost",
        createdAt: new Date().toISOString()
      };
    }

    const appUrl = req.headers.origin || req.protocol + "://" + req.get("host");
    const targetRecipient = testEmail || reg.email;
    let html = "";
    let subject = "";

    if (type === "reminder") {
      html = getRaceDayReminderEmailHtml(reg, appUrl);
      subject = `[สำคัญ] เตือนความจำล่วงหน้า 3 วันสู่งาน "วิ่ง-ฉาย-แสง" (LSEd Running 2569) 🏃‍♂️ วันอาทิตย์ที่ 24 มกราคม 2570`;
    } else if (type === "payment_received") {
      html = getPaymentReceivedEmailHtml(reg, appUrl);
      subject = "แจ้งได้รับหลักฐานการชำระเงินเรียบร้อยแล้ว - อยู่ระหว่างรออนุมัติ | วิ่ง-ฉาย-แสง (LSEd Running 2569)";
    } else if (type === "approval") {
      html = getApprovalEmailHtml(reg, appUrl);
      subject = `🎉 บัตรเข้างาน E-Ticket & หมายเลข BIB (${reg.bibNumber || "LSE-1001"}) | วิ่ง-ฉาย-แสง (LSEd Running 2569)`;
    } else if (type === "registration") {
      const settings = await getPaymentSettings();
      html = getRegistrationEmailHtml(reg, settings, appUrl);
      subject = "ขั้นตอนที่ 1 / 2 : รอการชำระเงิน | วิ่ง-ฉาย-แสง (LSEd Running 2569)";
    } else {
      html = getRaceDayReminderEmailHtml(reg, appUrl);
      subject = `เตือนความจำก่อนวันงาน | วิ่ง-ฉาย-แสง (LSEd Running 2569)`;
    }

    const emailPreviewUrl = await sendEmail(targetRecipient, subject, html, {
      type: type || "reminder",
      recipientName: `${reg.firstName} ${reg.lastName}`
    });

    if (id && !testEmail && type === "reminder") {
      await updateDoc(doc(db, "registrations", id), {
        reminderSentAt: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      email: targetRecipient,
      emailPreviewUrl: emailPreviewUrl || undefined,
      message: `ส่งอีเมลไปยัง ${targetRecipient} สำเร็จ`
    });
  } catch (err: any) {
    console.error("Error sending admin email:", err);
    res.status(500).json({ error: "ไม่สามารถส่งอีเมลได้: " + err.message });
  }
});

// Get reminder status (3-day countdown metrics)
app.get("/api/admin/reminder-status", async (req, res) => {
  try {
    const registrations = await readDB();
    const approved = registrations.filter(r => r.status === "approved");
    const reminderSent = approved.filter(r => !!r.reminderSentAt);
    
    // Target event: 24 January 2570 (2027) 05:00 AM
    const eventTime = new Date("2027-01-24T05:00:00").getTime();
    const now = Date.now();
    const diffMs = eventTime - now;
    const daysUntilRace = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const isThreeDaysBefore = daysUntilRace <= 3 && daysUntilRace >= 0;

    res.json({
      totalApproved: approved.length,
      reminderSentCount: reminderSent.length,
      reminderPendingCount: approved.length - reminderSent.length,
      daysUntilRace,
      isThreeDaysBefore,
      recommendedSendDate: "21 มกราคม 2570"
    });
  } catch (err: any) {
    console.error("Error getting reminder status:", err);
    res.status(500).json({ error: "ไม่สามารถดึงข้อมูลสถานะการแจ้งเตือนได้" });
  }
});

// Admin batch send 3-day reminder to approved runners
app.post("/api/admin/send-batch-reminder", async (req, res) => {
  const { testEmail, dryRun, targetId, skipAlreadySent = false } = req.body;
  const appUrl = req.headers.origin || req.protocol + "://" + req.get("host");

  try {
    const registrations = await readDB();
    let eligibleRunners = registrations.filter(r => r.status === "approved");

    if (targetId) {
      eligibleRunners = eligibleRunners.filter(r => r.id === targetId);
    } else if (skipAlreadySent) {
      eligibleRunners = eligibleRunners.filter(r => !r.reminderSentAt);
    }

    if (dryRun) {
      return res.json({
        success: true,
        dryRun: true,
        count: eligibleRunners.length,
        recipients: eligibleRunners.map(r => `${r.firstName} ${r.lastName} (${r.email}) - BIB: ${r.bibNumber || "-"}`)
      });
    }

    // If testEmail is provided, send one sample test email to testEmail
    if (testEmail) {
      const sampleRunner = eligibleRunners[0] || ({
        id: "LSEd-SAMPLE",
        firstName: "ทดสอบแอดมิน",
        lastName: "ธรรมศาสตร์",
        email: testEmail,
        phone: "081-234-5678",
        nationalId: "1100100123456",
        age: 26,
        gender: "male",
        bloodType: "B",
        emergencyContactName: "ผู้ดูแลระบบ",
        emergencyContactPhone: "081-234-5678",
        distance: "REGULAR",
        shirtSize: "L",
        status: "approved",
        price: 555,
        bibNumber: "LSE-1008",
        deliveryMethod: "pickup",
        createdAt: new Date().toISOString()
      } as Registration);

      const html = getRaceDayReminderEmailHtml(sampleRunner, appUrl);
      const subject = `[ทดสอบ] [สำคัญ] เตือนความจำล่วงหน้า 3 วันสู่งาน "วิ่ง-ฉาย-แสง" (LSEd Running 2569) 🏃‍♂️ วันอาทิตย์ที่ 24 มกราคม 2570`;
      const emailPreviewUrl = await sendEmail(testEmail, subject, html, {
        type: "reminder",
        recipientName: `${sampleRunner.firstName} ${sampleRunner.lastName}`
      });

      return res.json({
        success: true,
        count: 1,
        recipients: [testEmail],
        emailPreviewUrl: emailPreviewUrl || undefined,
        message: `ส่งอีเมลแจ้งเตือนตัวอย่างไปยัง ${testEmail} สำเร็จเรียบร้อยแล้ว`
      });
    }

    // Batch send to all eligible runners
    const results: string[] = [];
    let sentCount = 0;
    let failedCount = 0;
    let firstPreviewUrl: string | undefined;

    for (const runner of eligibleRunners) {
      try {
        const html = getRaceDayReminderEmailHtml(runner, appUrl);
        const subject = `[สำคัญ] เตือนความจำล่วงหน้า 3 วันสู่งาน "วิ่ง-ฉาย-แสง" (LSEd Running 2569) 🏃‍♂️ วันอาทิตย์ที่ 24 มกราคม 2570`;
        const previewUrl = await sendEmail(runner.email, subject, html, {
          type: "reminder",
          recipientName: `${runner.firstName} ${runner.lastName}`
        });

        if (previewUrl && !firstPreviewUrl) {
          firstPreviewUrl = previewUrl;
        }

        // Record reminderSentAt in Firestore
        const nowIso = new Date().toISOString();
        runner.reminderSentAt = nowIso;
        await updateDoc(doc(db, "registrations", runner.id), {
          reminderSentAt: nowIso
        });

        sentCount++;
        results.push(`${runner.firstName} ${runner.lastName} (${runner.email})`);
      } catch (err) {
        console.error(`Failed to send reminder to ${runner.email}:`, err);
        failedCount++;
      }
    }

    res.json({
      success: true,
      count: sentCount,
      failed: failedCount,
      recipients: results,
      emailPreviewUrl: firstPreviewUrl,
      message: `ส่งอีเมลแจ้งเตือนล่วงหน้า 3 วันสำเร็จทั้งหมด ${sentCount} ท่าน${failedCount > 0 ? ` (ไม่สำเร็จ ${failedCount} รายการ)` : ""}`
    });

  } catch (err: any) {
    console.error("Error in batch reminder:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการส่งอีเมลแจ้งเตือนแบบกลุ่ม: " + err.message });
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
      const id = `LSEd-MOCK0${i + 1}`;
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
