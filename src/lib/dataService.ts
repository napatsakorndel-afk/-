import { db } from "./firebaseClient.js";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc 
} from "firebase/firestore";
import { Registration, EventStats, DistanceType, ShirtSizeType, RegistrationStatus } from "../types.js";
import { generatePromptPayPayload } from "./promptpay.js";

// Price Map for client calculations
export const PRICE_MAP: Record<DistanceType, number> = {
  "REGULAR": 555,
  "5K": 555,
  "vip": 990,
  "vip_duo": 2800,
  "vip_trio": 3900,
  "donation": 0,
  "souvenir": 390,
};

export const DEFAULT_PAYMENT_SETTINGS = {
  regular: {
    bankName: "ทหารไทยธนชาต (ttb)",
    accountNo: "0830131768",
    accountName: "นาย นภัสกร กลิ่นเฟื่อง",
    qrImage: ""
  },
  taxDeduct: {
    bankName: "ธนาคารกรุงไทย (มธ.)",
    accountNo: "022-0-12345-6",
    accountName: "มธ.คณะวิทยาการเรียนรู้และศึกษาศาสตร์ (เงินบริจาค e-Donation)",
    qrImage: ""
  }
};

// Unique Ref ID generator
export const generateRefID = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const timestampPart = Date.now().toString(36).toUpperCase().slice(-4);
  return `LSEd-${timestampPart}${result}`;
};

// Generate BIB
export const generateBIB = (registrations: Registration[], distance: DistanceType): string => {
  if (distance === "donation") {
    const approvedDonors = registrations.filter(r => r.distance === "donation" && r.status === "approved");
    const startNum = 9001;
    const currentMax = approvedDonors.reduce((max, r) => {
      if (r.bibNumber && r.bibNumber.startsWith("DONOR-")) {
        const numPart = parseInt(r.bibNumber.split("-")[1], 10);
        if (!isNaN(numPart) && numPart > max) return numPart;
      }
      return max;
    }, startNum - 1);
    return `DONOR-${currentMax + 1}`;
  }

  if (distance === "souvenir") {
    const approvedSouvenirs = registrations.filter(r => r.distance === "souvenir" && r.status === "approved");
    const startNum = 5001;
    const currentMax = approvedSouvenirs.reduce((max, r) => {
      if (r.bibNumber && r.bibNumber.startsWith("SVN-")) {
        const numPart = parseInt(r.bibNumber.split("-")[1], 10);
        if (!isNaN(numPart) && numPart > max) return numPart;
      }
      return max;
    }, startNum - 1);
    return `SVN-${currentMax + 1}`;
  }

  const approvedRunners = registrations.filter(r => r.distance !== "donation" && r.distance !== "souvenir" && r.status === "approved");
  const prefix = "LSE";
  const startNum = 1001;
  const currentMax = approvedRunners.reduce((max, r) => {
    if (r.bibNumber && r.bibNumber.startsWith("LSE-")) {
      const parts = r.bibNumber.split("-");
      if (parts.length > 1) {
        const numPart = parseInt(parts[1], 10);
        if (!isNaN(numPart) && numPart > max) return numPart;
      }
    }
    return max;
  }, startNum - 1);
  return `${prefix}-${currentMax + 1}`;
};

// Helper: Enrich payment details
export const enrichPaymentDetails = (reg: Registration, settings: any) => {
  const acct = settings.regular || DEFAULT_PAYMENT_SETTINGS.regular;
  let qrImage = acct.qrImage || "";
  const cleanNo = acct.accountNo.replace(/[^0-9]/g, "");
  const payload = generatePromptPayPayload(cleanNo, reg.price);

  if (!qrImage) {
    qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=002d63&data=${encodeURIComponent(payload)}`;
  }

  return {
    ...reg,
    paymentBankName: acct.bankName,
    paymentAccountNo: acct.accountNo,
    paymentAccountName: acct.accountName,
    paymentQrImage: qrImage,
    qrPayload: payload,
    qrAccountName: acct.accountName
  };
};

/**
 * Safe fetch helper that detects if response is not JSON (e.g. 404 HTML on Vercel)
 */
async function tryApiJson(url: string, options?: RequestInit): Promise<any> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      return await res.json();
    }
    // If not ok or returned HTML (static server fallback), return null to trigger client fallback
    return null;
  } catch {
    return null;
  }
}

// 1. Fetch Payment Settings
export async function fetchPaymentSettings(): Promise<typeof DEFAULT_PAYMENT_SETTINGS> {
  const apiData = await tryApiJson("/api/payment/settings");
  if (apiData) return apiData;

  try {
    const docSnap = await getDoc(doc(db, "settings", "payment"));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        regular: {
          bankName: data.regular?.bankName || DEFAULT_PAYMENT_SETTINGS.regular.bankName,
          accountNo: data.regular?.accountNo || DEFAULT_PAYMENT_SETTINGS.regular.accountNo,
          accountName: data.regular?.accountName || DEFAULT_PAYMENT_SETTINGS.regular.accountName,
          qrImage: data.regular?.qrImage || DEFAULT_PAYMENT_SETTINGS.regular.qrImage
        },
        taxDeduct: {
          bankName: data.taxDeduct?.bankName || DEFAULT_PAYMENT_SETTINGS.taxDeduct.bankName,
          accountNo: data.taxDeduct?.accountNo || DEFAULT_PAYMENT_SETTINGS.taxDeduct.accountNo,
          accountName: data.taxDeduct?.accountName || DEFAULT_PAYMENT_SETTINGS.taxDeduct.accountName,
          qrImage: data.taxDeduct?.qrImage || DEFAULT_PAYMENT_SETTINGS.taxDeduct.qrImage
        }
      };
    }
  } catch (err) {
    console.warn("Firestore fetchPaymentSettings fallback failed:", err);
  }
  return DEFAULT_PAYMENT_SETTINGS;
}

// 2. Fetch Event Stats
export async function fetchEventStats(): Promise<EventStats> {
  const apiData = await tryApiJson("/api/stats");
  if (apiData) return apiData;

  try {
    const querySnapshot = await getDocs(collection(db, "registrations"));
    const list: Registration[] = [];
    querySnapshot.forEach(docSnap => list.push(docSnap.data() as Registration));

    const totalRegistered = list.length;
    const totalApproved = list.filter(r => r.status === "approved").length;
    const totalPendingVerification = list.filter(r => r.status === "pending_verification").length;
    const totalPendingPayment = list.filter(r => r.status === "pending_payment").length;
    const totalRejected = list.filter(r => r.status === "rejected").length;
    const totalIncome = list.filter(r => r.status === "approved").reduce((sum, r) => sum + (r.price || 0), 0);

    const byDistance: Record<DistanceType, number> = { "REGULAR": 0, "5K": 0, "vip": 0, "vip_duo": 0, "vip_trio": 0, "donation": 0, "souvenir": 0 };
    const byShirtSize: Record<ShirtSizeType, number> = {
      XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, "3XL": 0, "4XL": 0, "5XL": 0, "6XL": 0, "7XL": 0, NONE: 0
    };
    const byStatus: Record<RegistrationStatus, number> = {
      pending_payment: 0,
      pending_verification: 0,
      approved: 0,
      rejected: 0
    };

    list.forEach(r => {
      if (byDistance[r.distance] !== undefined) byDistance[r.distance]++;
      if (byShirtSize[r.shirtSize] !== undefined) byShirtSize[r.shirtSize]++;
      if (byStatus[r.status] !== undefined) byStatus[r.status]++;
    });

    return {
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
  } catch (err) {
    console.error("Firestore fetchEventStats failed:", err);
    return {
      totalRegistered: 0,
      totalApproved: 0,
      totalPendingVerification: 0,
      totalPendingPayment: 0,
      totalRejected: 0,
      totalIncome: 0,
      byDistance: { "REGULAR": 0, "5K": 0, "vip": 0, "vip_duo": 0, "vip_trio": 0, "donation": 0, "souvenir": 0 },
      byShirtSize: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, "3XL": 0, "4XL": 0, "5XL": 0, "6XL": 0, "7XL": 0, NONE: 0 },
      byStatus: { pending_payment: 0, pending_verification: 0, approved: 0, rejected: 0 }
    };
  }
}

// 3. Register Runner
export async function registerRunner(formData: any): Promise<Registration> {
  const isDonation = formData.distance === "donation";
  let finalPrice = isDonation ? Number(formData.donationAmount || 500) : (PRICE_MAP[formData.distance as DistanceType] || 0);
  if (!isDonation && formData.deliveryMethod === "shipping") {
    finalPrice += 60;
  }

  // Try API first
  const apiRes = await tryApiJson("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData)
  });
  if (apiRes && apiRes.id) return apiRes;

  // Fallback to direct Firestore
  const newReg: Registration = {
    id: generateRefID(),
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    email: formData.email.trim(),
    phone: formData.phone.trim(),
    nationalId: formData.nationalId.trim(),
    age: isDonation ? Number(formData.age || 0) : Number(formData.age),
    gender: isDonation ? (formData.gender || "other") : formData.gender,
    bloodType: formData.bloodType || "Unknown",
    emergencyContactName: formData.emergencyContactName ? formData.emergencyContactName.trim() : "",
    emergencyContactPhone: formData.emergencyContactPhone ? formData.emergencyContactPhone.trim() : "",
    distance: formData.distance,
    shirtSize: isDonation ? (formData.shirtSize || "NONE") : formData.shirtSize,
    deliveryMethod: formData.deliveryMethod || "pickup",
    shippingAddress: formData.deliveryMethod === "shipping" ? (formData.shippingAddress || "").trim() : "",
    shippingCarrier: formData.deliveryMethod === "shipping" ? "thailandpost" : undefined,
    taxDeduction: !!formData.taxDeduction,
    donorType: formData.donorType,
    donorName: formData.donorName,
    taxId: formData.taxId,
    receiptAddress: formData.receiptAddress,
    receiptDeliveryType: formData.receiptDeliveryType,
    receiptDeliveryAddress: formData.receiptDeliveryAddress,
    donationObjective: formData.donationObjective,
    donationObjectiveDetail: formData.donationObjectiveDetail,
    status: "pending_payment",
    price: finalPrice,
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(db, "registrations", newReg.id), newReg);
  const paymentSettings = await fetchPaymentSettings();
  return enrichPaymentDetails(newReg, paymentSettings);
}

// 4. Lookup Registrations
export async function lookupRegistrations(searchQuery: string): Promise<Registration[]> {
  const q = searchQuery.trim().toLowerCase();
  const apiRes = await tryApiJson(`/api/registrations/lookup?query=${encodeURIComponent(q)}`);
  if (apiRes && Array.isArray(apiRes) && apiRes.length > 0) return apiRes;

  // Fallback to Firestore
  const querySnapshot = await getDocs(collection(db, "registrations"));
  const found: Registration[] = [];
  querySnapshot.forEach(docSnap => {
    const r = docSnap.data() as Registration;
    if (
      r.id.toLowerCase() === q ||
      (r.nationalId && r.nationalId.toLowerCase() === q) ||
      (r.email && r.email.toLowerCase() === q) ||
      (r.phone && r.phone.replace(/[^0-9]/g, "") === q.replace(/[^0-9]/g, ""))
    ) {
      found.push(r);
    }
  });

  if (found.length === 0) {
    throw new Error("ไม่พบข้อมูลการลงทะเบียนสำหรับข้อมูลที่ระบุ");
  }

  const settings = await fetchPaymentSettings();
  return found.map(r => enrichPaymentDetails(r, settings));
}

// 5. Upload Slip
export async function uploadPaymentSlip(id: string, slipUrl: string): Promise<Registration> {
  const apiRes = await tryApiJson("/api/upload-slip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, slipUrl })
  });
  if (apiRes && apiRes.id) return apiRes;

  // Fallback to Firestore
  const regRef = doc(db, "registrations", id);
  const docSnap = await getDoc(regRef);
  if (!docSnap.exists()) {
    throw new Error("ไม่พบข้อมูลการลงทะเบียนที่อ้างอิง");
  }

  const regData = docSnap.data() as Registration;
  regData.slipUrl = slipUrl;
  regData.status = "pending_verification";
  regData.rejectionReason = undefined;

  await setDoc(regRef, regData);
  const settings = await fetchPaymentSettings();
  return enrichPaymentDetails(regData, settings);
}

// 6. Fetch Shipping List
export async function fetchShippingList(): Promise<any[]> {
  const apiRes = await tryApiJson("/api/registrations/shipping");
  if (apiRes && Array.isArray(apiRes)) return apiRes;

  // Fallback to Firestore
  const querySnapshot = await getDocs(collection(db, "registrations"));
  const approvedShipped: Registration[] = [];
  querySnapshot.forEach(docSnap => {
    const r = docSnap.data() as Registration;
    if (r.status === "approved" && r.deliveryMethod === "shipping") {
      approvedShipped.push(r);
    }
  });

  return approvedShipped.map(r => ({
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName.substring(0, 1) + ".",
    bibNumber: r.bibNumber || "รออนุมัติ",
    shippingTrackingNumber: r.shippingTrackingNumber || "",
    shippingCarrier: r.shippingCarrier || "",
    phone: r.phone.length >= 9 
      ? r.phone.substring(0, 3) + "-XXX-" + r.phone.substring(r.phone.length - 4)
      : r.phone,
  }));
}

// 7. Admin Fetch Registrations
export async function adminFetchRegistrations(search = "", distance = "all", status = "all"): Promise<Registration[]> {
  const url = `/api/registrations?search=${encodeURIComponent(search)}&distance=${distance}&status=${status}`;
  const apiRes = await tryApiJson(url);
  if (apiRes && Array.isArray(apiRes)) return apiRes;

  // Fallback to Firestore
  const querySnapshot = await getDocs(collection(db, "registrations"));
  let list: Registration[] = [];
  querySnapshot.forEach(docSnap => list.push(docSnap.data() as Registration));

  if (distance && distance !== "all") {
    list = list.filter(r => r.distance === distance);
  }
  if (status && status !== "all") {
    list = list.filter(r => r.status === status);
  }
  if (search) {
    const q = search.toLowerCase().trim();
    list = list.filter(r => 
      r.id.toLowerCase().includes(q) ||
      `${r.firstName} ${r.lastName}`.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.phone.includes(q) ||
      (r.nationalId && r.nationalId.includes(q)) ||
      (r.bibNumber && r.bibNumber.toLowerCase().includes(q))
    );
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return list;
}

// 8. Admin Approve Runner
export async function adminApproveRunner(id: string): Promise<Registration> {
  const apiRes = await tryApiJson("/api/admin/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  });
  if (apiRes && apiRes.id) return apiRes;

  // Fallback to Firestore
  const regRef = doc(db, "registrations", id);
  const docSnap = await getDoc(regRef);
  if (!docSnap.exists()) throw new Error("ไม่พบข้อมูลผู้สมัคร");

  const reg = docSnap.data() as Registration;
  const allSnapshot = await getDocs(collection(db, "registrations"));
  const allRegs: Registration[] = [];
  allSnapshot.forEach(d => allRegs.push(d.data() as Registration));

  const bib = generateBIB(allRegs, reg.distance);
  reg.status = "approved";
  reg.bibNumber = bib;
  reg.verifiedAt = new Date().toISOString();
  reg.rejectionReason = undefined;

  await setDoc(regRef, reg);
  return reg;
}

// 9. Admin Reject Runner
export async function adminRejectRunner(id: string, reason: string): Promise<Registration> {
  const apiRes = await tryApiJson("/api/admin/reject", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, reason })
  });
  if (apiRes && apiRes.id) return apiRes;

  // Fallback to Firestore
  const regRef = doc(db, "registrations", id);
  const docSnap = await getDoc(regRef);
  if (!docSnap.exists()) throw new Error("ไม่พบข้อมูลผู้สมัคร");

  const reg = docSnap.data() as Registration;
  reg.status = "rejected";
  reg.rejectionReason = reason;
  reg.bibNumber = undefined;

  await setDoc(regRef, reg);
  return reg;
}

// 10. Admin Edit Runner
export async function adminEditRunner(regData: Registration): Promise<Registration> {
  const apiRes = await tryApiJson("/api/admin/edit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(regData)
  });
  if (apiRes && apiRes.id) return apiRes;

  // Fallback to Firestore
  const regRef = doc(db, "registrations", regData.id);
  await setDoc(regRef, regData);
  return regData;
}

// 11. Admin Delete Runner
export async function adminDeleteRunner(id: string): Promise<void> {
  const apiRes = await tryApiJson("/api/admin/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  });
  if (apiRes && apiRes.success) return;

  // Fallback to Firestore
  await deleteDoc(doc(db, "registrations", id));
}

// 12. Admin Checkin Runner
export async function adminCheckinRunner(id: string): Promise<{ success: boolean; checkedInAt: string; runner: Registration }> {
  const apiRes = await tryApiJson("/api/admin/checkin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  });
  if (apiRes && apiRes.success) return apiRes;

  // Fallback to Firestore
  const regRef = doc(db, "registrations", id);
  const docSnap = await getDoc(regRef);
  if (!docSnap.exists()) throw new Error("ไม่พบข้อมูลการลงทะเบียน");

  const reg = docSnap.data() as Registration;
  if (reg.status !== "approved") throw new Error("ไม่สามารถเช็คอินได้เนื่องจากสถานะยังไม่ได้รับการอนุมัติ");
  if (reg.checkedIn) throw new Error("ผู้เข้าร่วมนี้ได้ทำการเช็คอินไปแล้ว");

  const checkedInAt = new Date().toISOString();
  await updateDoc(regRef, {
    checkedIn: true,
    checkedInAt
  });
  reg.checkedIn = true;
  reg.checkedInAt = checkedInAt;

  return { success: true, checkedInAt, runner: reg };
}

// 13. Fetch Recent Email Logs
export async function fetchRecentEmails(): Promise<any[]> {
  const apiRes = await tryApiJson("/api/emails/recent");
  if (apiRes && Array.isArray(apiRes)) return apiRes;
  return [];
}

// 14. Preview Email Template
export async function fetchEmailPreview(type: string, id?: string): Promise<{ subject: string; html: string }> {
  const apiRes = await tryApiJson("/api/emails/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, id })
  });
  if (apiRes && apiRes.html) return apiRes;
  return { subject: "ตัวอย่างอีเมล", html: "<p>ไม่สามารถโหลดตัวอย่างอีเมลได้</p>" };
}

// 15. Admin Send Runner Email
export async function adminSendRunnerEmail(id: string, type: string, testEmail?: string): Promise<{ success: boolean; emailPreviewUrl?: string; message?: string }> {
  const apiRes = await tryApiJson("/api/admin/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, type, testEmail })
  });
  if (apiRes) return apiRes;
  return { success: false, message: "ไม่สามารถส่งคำขอไปยังเซิร์ฟเวอร์ได้" };
}

// 16. Fetch Reminder Status
export async function fetchReminderStatus(): Promise<{
  totalApproved: number;
  reminderSentCount: number;
  reminderPendingCount: number;
  daysUntilRace: number;
  isThreeDaysBefore: boolean;
  recommendedSendDate: string;
}> {
  const apiRes = await tryApiJson("/api/admin/reminder-status");
  if (apiRes && typeof apiRes.totalApproved === "number") return apiRes;
  return {
    totalApproved: 0,
    reminderSentCount: 0,
    reminderPendingCount: 0,
    daysUntilRace: 0,
    isThreeDaysBefore: false,
    recommendedSendDate: "21 มกราคม 2570"
  };
}

// 17. Send Batch Reminder Emails
export async function sendBatchReminder(params: {
  testEmail?: string;
  dryRun?: boolean;
  targetId?: string;
  skipAlreadySent?: boolean;
}): Promise<{
  success: boolean;
  count: number;
  recipients?: string[];
  failed?: number;
  emailPreviewUrl?: string;
  message?: string;
}> {
  const apiRes = await tryApiJson("/api/admin/send-batch-reminder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  if (apiRes) return apiRes;
  return { success: false, count: 0, message: "ไม่สามารถส่งคำขอไปยังเซิร์ฟเวอร์ได้" };
}


