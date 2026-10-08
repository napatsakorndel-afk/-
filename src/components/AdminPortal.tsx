import React, { useState, useEffect } from "react";
import { 
  Users, 
  Coins, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  RefreshCw, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  AlertCircle, 
  Check, 
  X,
  FileSpreadsheet,
  Database,
  Lock,
  Unlock,
  SlidersHorizontal,
  ArrowRight,
  Truck,
  User,
  QrCode,
  Image,
  Save,
  CheckCircle2,
  ShieldCheck,
  LogOut,
  Package,
  CreditCard,
  Mail,
  Send,
  Smartphone,
  Monitor,
  Calendar,
  MapPin,
  Backpack,
  ExternalLink,
  History,
  Sparkles
} from "lucide-react";
import { Registration, EventStats, DistanceType, ShirtSizeType, RegistrationStatus, EmailLog } from "../types.js";
import { generatePromptPayPayload } from "../lib/promptpay.js";
import { 
  adminFetchRegistrations, 
  adminApproveRunner, 
  adminRejectRunner, 
  adminEditRunner, 
  adminDeleteRunner, 
  adminCheckinRunner,
  fetchPaymentSettings as apiFetchPaymentSettings,
  fetchRecentEmails,
  fetchEmailPreview,
  adminSendRunnerEmail,
  fetchReminderStatus,
  sendBatchReminder
} from "../lib/dataService.js";
import { PRESET_LOGOS } from "../lib/presetLogos.js";

interface AdminPortalProps {
  stats: EventStats | null;
  onRefresh: () => void;
  onSearchLookup: (query: string) => void;
}

export default function AdminPortal({ stats, onRefresh, onSearchLookup }: AdminPortalProps) {
  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);

  // Registrations state
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Email Notification Preview
  const [lastEmailPreview, setLastEmailPreview] = useState<{
    type: "approve" | "reject";
    url: string;
    recipient: string;
    runnerName: string;
  } | null>(null);

  // Filters
  const [filterSearch, setFilterSearch] = useState<string>("");
  const [filterDistance, setFilterDistance] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Active modals / Drawers
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  
  // Inline edit state
  const [editingReg, setEditingReg] = useState<Registration | null>(null);

  // Sub tab: runners vs shipping vs payment vs assets vs emails
  const [subTab, setSubTab] = useState<"runners" | "shipping" | "payment" | "assets" | "emails">("runners");
  const [filterShippingStatus, setFilterShippingStatus] = useState<string>("all");

  // Email & 3-Day Reminder System State
  const [reminderStatus, setReminderStatus] = useState<{
    totalApproved: number;
    reminderSentCount: number;
    reminderPendingCount: number;
    daysUntilRace: number;
    isThreeDaysBefore: boolean;
    recommendedSendDate: string;
  } | null>(null);
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<string>("reminder");
  const [emailViewport, setEmailViewport] = useState<"desktop" | "mobile">("desktop");
  const [emailPreviewHtml, setEmailPreviewHtml] = useState<string>("");
  const [emailPreviewSubject, setEmailPreviewSubject] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [testEmailAddress, setTestEmailAddress] = useState<string>("Napatsakorn.del@gmail.com");
  const [sendingTestEmail, setSendingTestEmail] = useState<boolean>(false);
  const [sendingBatch, setSendingBatch] = useState<boolean>(false);
  const [batchModalOpen, setBatchModalOpen] = useState<boolean>(false);
  const [batchSkipSent, setBatchSkipSent] = useState<boolean>(true);
  const [recentEmails, setRecentEmails] = useState<EmailLog[]>([]);
  const [loadingRecentEmails, setLoadingRecentEmails] = useState<boolean>(false);
  const [previewRunnerId, setPreviewRunnerId] = useState<string>("sample");
  const [emailSearch, setEmailSearch] = useState<string>("");

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "regular" | "tax") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.2 * 1024 * 1024) {
      alert("ขนาดรูปภาพต้องไม่เกิน 1MB เพื่อป้องกันพื้นที่เต็มในระบบคลาวด์");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        
              // Compress image using Canvas
              const img = new window.Image();
              img.src = reader.result as string;
              img.onload = () => {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;
        
                if (width > height) {
                  if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                  }
                } else {
                  if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                  }
                }
        
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, width, height);
                
                // Compress to JPEG with 0.6 quality (ensures it is well under 1MB)
                const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6);
        
        if (type === "regular") {
          setRegQrImage(compressedBase64);
        } else {
          setTaxQrImage(compressedBase64);
        }
        };
      }
    };
    reader.readAsDataURL(file);
  };

  // Payment Settings State (Two Accounts)
  const [regBankName, setRegBankName] = useState<string>("ทหารไทยธนชาต (ttb)");
  const [regAccountNo, setRegAccountNo] = useState<string>("");
  const [regAccountName, setRegAccountName] = useState<string>("");
  const [regQrImage, setRegQrImage] = useState<string>("");

  const [taxBankName, setTaxBankName] = useState<string>("ธนาคารกรุงไทย (มธ.)");
  const [taxAccountNo, setTaxAccountNo] = useState<string>("");
  const [taxAccountName, setTaxAccountName] = useState<string>("");
  const [taxQrImage, setTaxQrImage] = useState<string>("");

  // Asset Settings State
  const [shirtImage, setShirtImage] = useState<string>("");
  const [poloShirtImage, setPoloShirtImage] = useState<string>("");
  const [medalImage, setMedalImage] = useState<string>("");
  const [souvenirImage, setSouvenirImage] = useState<string>("");
  const [routeMapImage, setRouteMapImage] = useState<string>("");
  const [logoImage, setLogoImage] = useState<string>("");
  const [savingAssets, setSavingAssets] = useState<boolean>(false);
  const [assetsSuccess, setAssetsSuccess] = useState<boolean>(false);
  const [assetsError, setAssetsError] = useState<string | null>(null);


  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [settingsSuccess, setSettingsSuccess] = useState<boolean>(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // AI Slip Analysis State
  const [analyzingSlipId, setAnalyzingSlipId] = useState<string | null>(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);
  const [aiAnalysisError, setAiAnalysisError] = useState<string | null>(null);

  // Shipping Quick Tracking inputs
  const [trackingInputs, setTrackingInputs] = useState<{[id: string]: string}>({});
  const [carrierInputs, setCarrierInputs] = useState<{[id: string]: string}>({});
  const [savingTrackingId, setSavingTrackingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Notification Simulation
  const [simulatingNotificationId, setSimulatingNotificationId] = useState<string | null>(null);
  const [simulationData, setSimulationData] = useState<{
    smsText: string;
    lineText: string;
    emailPreviewUrl?: string;
    recipientName: string;
    email: string;
  } | null>(null);
  const [activeNotifyTab, setActiveNotifyTab] = useState<"sms" | "line">("sms");

  useEffect(() => {
    // Reset AI state when selected registration changes or modal closes
    setAiAnalysisResult(null);
    setAiAnalysisError(null);
  }, [selectedReg]);


  // Fetch Assets Settings
  const fetchAssetsSettings = async () => {
    try {
      const response = await fetch("/api/assets/settings");
      if (response.ok) {
        const data = await response.json();
        setShirtImage(data.shirtImage || "");
        setPoloShirtImage(data.poloShirtImage || "");
        setMedalImage(data.medalImage || "");
        setSouvenirImage(data.souvenirImage || "");
        setRouteMapImage(data.routeMapImage || "");
        setLogoImage(data.logoImage || "");
      }
    } catch (error) {
      console.error("Failed to fetch assets settings:", error);
    }
  };

  const handleAssetUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "shirt" | "poloshirt" | "medal" | "routemap" | "logo" | "souvenir") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("ขนาดรูปภาพต้องไม่เกิน 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        
              // Compress image using Canvas
              const img = new window.Image();
              img.src = reader.result as string;
              img.onload = () => {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;
        
                if (width > height) {
                  if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                  }
                } else {
                  if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                  }
                }
        
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, width, height);
                
                // Compress to JPEG with 0.6 quality (ensures it is well under 1MB)
                const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6);
        
        if (type === "shirt") {
                  setShirtImage(compressedBase64);
                } else if (type === "poloshirt") {
                  setPoloShirtImage(compressedBase64);
                } else if (type === "medal") {
                  setMedalImage(compressedBase64);
                } else if (type === "routemap") {
                  setRouteMapImage(compressedBase64);
                } else if (type === "logo") {
                  setLogoImage(compressedBase64);
                } else if (type === "souvenir") {
                  setSouvenirImage(compressedBase64);
                }
        };
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAssetsSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAssets(true);
    setAssetsSuccess(false);
    setAssetsError(null);
    try {
      const response = await fetch("/api/assets/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shirtImage, poloShirtImage, medalImage, routeMapImage, logoImage, souvenirImage }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save settings");
      setAssetsSuccess(true);
      setTimeout(() => setAssetsSuccess(false), 3000);
    } catch (err: any) {
      setAssetsError(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setSavingAssets(false);
    }
  };

  // Fetch Payment Settings
  const fetchPaymentSettings = async () => {
    try {
      const data = await apiFetchPaymentSettings();
      if (data.regular) {
        setRegBankName(data.regular.bankName || "ทหารไทยธนชาต (ttb)");
        setRegAccountNo(data.regular.accountNo || "");
        setRegAccountName(data.regular.accountName || "");
        setRegQrImage(data.regular.qrImage || "");
      }
      if (data.taxDeduct) {
        setTaxBankName(data.taxDeduct.bankName || "ธนาคารกรุงไทย (มธ.)");
        setTaxAccountNo(data.taxDeduct.accountNo || "");
        setTaxAccountName(data.taxDeduct.accountName || "");
        setTaxQrImage(data.taxDeduct.qrImage || "");
      }
    } catch (err) {
      console.error("Error fetching payment settings:", err);
    }
  };

  // Load registrations
  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const data = await adminFetchRegistrations(filterSearch, filterDistance, filterStatus);
      setRegistrations(data);
      // Pre-populate tracking inputs and carrier inputs
      const inputs: {[id: string]: string} = {};
      const carriers: {[id: string]: string} = {};
      data.forEach((r: Registration) => {
        inputs[r.id] = r.shippingTrackingNumber || "";
        carriers[r.id] = r.shippingCarrier || "thailandpost";
      });
      setTrackingInputs(inputs);
      setCarrierInputs(carriers);
    } catch (err) {
      console.error("Error fetching registrations:", err);
    } finally {
      setLoading(false);
    }
  };

  // AI Slip Analysis trigger
  const handleAnalyzeSlip = async (id: string) => {
    setAnalyzingSlipId(id);
    setAiAnalysisResult(null);
    setAiAnalysisError(null);
    try {
      const response = await fetch("/api/admin/analyze-slip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "ล้มเหลวในการวิเคราะห์สลิป");
      }
      setAiAnalysisResult(data.analysis);
    } catch (err: any) {
      console.error("AI Analysis error:", err);
      setAiAnalysisError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อระบบ AI");
    } finally {
      setAnalyzingSlipId(null);
    }
  };

  // Quick Action: Save Postal Tracking Number
  const handleQuickSaveTracking = async (reg: Registration, trackingNumber: string, carrier: string) => {
    setSavingTrackingId(reg.id);
    try {
      const updatedReg = {
        ...reg,
        shippingTrackingNumber: trackingNumber.trim(),
        shippingCarrier: carrier
      };
      const response = await fetch("/api/admin/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedReg),
      });
      
      if (response.ok) {
        // Refresh local list and stats
        fetchRegistrations();
        onRefresh();
      } else {
        const errData = await response.json();
        alert(errData.error || "ไม่สามารถอัปเดตเลขพัสดุได้");
      }
    } catch (err) {
      console.error("Quick save tracking error:", err);
    } finally {
      setSavingTrackingId(null);
    }
  };

  // Quick Action: Simulate shipping notifications
  const handleSimulateNotification = async (id: string) => {
    setSimulatingNotificationId(id);
    setSimulationData(null);
    try {
      const response = await fetch("/api/admin/simulate-shipping-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (response.ok) {
        setSimulationData({
          smsText: data.smsText,
          lineText: data.lineText,
          emailPreviewUrl: data.emailPreviewUrl,
          recipientName: data.recipientName,
          email: data.email,
        });
      } else {
        alert(data.error || "ไม่สามารถจำลองการส่งการแจ้งเตือนได้");
      }
    } catch (err) {
      console.error("Simulation error:", err);
      alert("เกิดข้อผิดพลาดในการจำลองส่งแจ้งเตือน");
    } finally {
      setSimulatingNotificationId(null);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchRegistrations();
      fetchPaymentSettings();
    }
  }, [isAuthenticated, filterDistance, filterStatus]);

  // Handle Search Debounce or Manual Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRegistrations();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      setIsAuthenticated(true);
      setAuthError(null);
    } else {
      setAuthError("รหัสเข้าสู่ระบบไม่ถูกต้อง โปรดลองอีกครั้ง (ใบ้ให้: admin123)");
    }
  };

  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(false);
    setSettingsError(null);
    try {
      const response = await fetch("/api/payment/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regular: {
            bankName: regBankName,
            accountNo: regAccountNo,
            accountName: regAccountName,
            qrImage: regQrImage
          },
          taxDeduct: {
            bankName: taxBankName,
            accountNo: taxAccountNo,
            accountName: taxAccountName,
            qrImage: taxQrImage
          }
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "ล้มเหลวในการบันทึกค่า");
      }
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err: any) {
      setSettingsError(err.message || "เกิดข้อผิดพลาดในการเซฟ");
    } finally {
      setSavingSettings(false);
    }
  };

  // Quick Action: Approve Runner
  const handleApprove = async (id: string) => {
    try {
      const data = await adminApproveRunner(id);

      if (data && (data as any).emailPreviewUrl) {
        setLastEmailPreview({
          type: "approve",
          url: (data as any).emailPreviewUrl,
          recipient: data.email,
          runnerName: `${data.firstName} ${data.lastName}`
        });
      }

      // Close modal if open
      setSelectedReg(null);
      
      // Refresh local list and metrics
      fetchRegistrations();
      onRefresh();
    } catch (err: any) {
      console.error("Approve error:", err);
      alert(err.message || "ไม่สามารถอนุมัติได้");
    }
  };

  // Quick Action: Reject Runner with Reason
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReg || !rejectionReason.trim()) return;

    try {
      const data = await adminRejectRunner(selectedReg.id, rejectionReason.trim());

      if (data && (data as any).emailPreviewUrl) {
        setLastEmailPreview({
          type: "reject",
          url: (data as any).emailPreviewUrl,
          recipient: data.email,
          runnerName: `${data.firstName} ${data.lastName}`
        });
      }

      // Reset
      setIsRejecting(false);
      setRejectionReason("");
      setSelectedReg(null);

      // Refresh list
      fetchRegistrations();
      onRefresh();
    } catch (err: any) {
      console.error("Reject error:", err);
      alert(err.message || "ไม่สามารถส่งคำปฏิเสธได้");
    }
  };

  // Quick Action: Save Inline Edits
  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReg) return;

    try {
      await adminEditRunner(editingReg);
      setEditingReg(null);
      fetchRegistrations();
      onRefresh();
    } catch (err: any) {
      console.error("Edit error:", err);
      alert(err.message || "ไม่สามารถแก้ไขข้อมูลได้");
    }
  };

  // Quick Action: Delete registration
  const handleDelete = async (id: string) => {
    if (!confirm("คุณต้องการลบผู้สมัครรายนี้ออกจากระบบถาวรใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้")) return;

    try {
      await adminDeleteRunner(id);
      fetchRegistrations();
      onRefresh();
    } catch (err: any) {
      console.error("Delete error:", err);
      alert(err.message || "ไม่สามารถลบข้อมูลผู้สมัครได้");
    }
  };

  // Quick Action: Checkin Toggle
  const handleCheckinToggle = async (reg: Registration) => {
    try {
      if (!reg.checkedIn) {
        await adminCheckinRunner(reg.id);
      } else {
        await adminEditRunner({
          ...reg,
          checkedIn: false,
          checkedInAt: undefined
        });
      }
      fetchRegistrations();
      onRefresh();
    } catch (err: any) {
      console.error("Check-in error:", err);
      alert(err.message || "เกิดข้อผิดพลาดในการปรับสถานะเช็คอิน");
    }
  };

  const handleCopyAddress = (id: string, address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Email & 3-Day Reminder System Handlers
  const loadReminderStats = async () => {
    try {
      const data = await fetchReminderStatus();
      setReminderStatus(data);
    } catch (e) {
      console.error("Error loading reminder status:", e);
    }
  };

  const loadPreview = async (template = selectedEmailTemplate, runnerId = previewRunnerId) => {
    setLoadingPreview(true);
    try {
      const data = await fetchEmailPreview(template, runnerId === "sample" ? undefined : runnerId);
      setEmailPreviewHtml(data.html);
      setEmailPreviewSubject(data.subject);
    } catch (e) {
      console.error("Error loading email preview:", e);
    } finally {
      setLoadingPreview(false);
    }
  };

  const loadRecent = async () => {
    setLoadingRecentEmails(true);
    try {
      const data = await fetchRecentEmails();
      setRecentEmails(data);
    } catch (e) {
      console.error("Error loading recent emails:", e);
    } finally {
      setLoadingRecentEmails(false);
    }
  };

  useEffect(() => {
    if (subTab === "emails") {
      loadReminderStats();
      loadPreview(selectedEmailTemplate, previewRunnerId);
      loadRecent();
    }
  }, [subTab]);

  const handleSendTest = async () => {
    if (!testEmailAddress) {
      alert("กรุณากรอกอีเมลสำหรับรับข้อความทดสอบ");
      return;
    }
    setSendingTestEmail(true);
    try {
      const res = await adminSendRunnerEmail(previewRunnerId === "sample" ? "LSEd-SAMPLE" : previewRunnerId, selectedEmailTemplate, testEmailAddress);
      if (res.success) {
        alert(`ส่งอีเมลทดสอบแม่แบบไปยัง ${testEmailAddress} เรียบร้อยแล้ว!`);
        if (res.emailPreviewUrl) {
          setLastEmailPreview({
            type: selectedEmailTemplate as any,
            url: res.emailPreviewUrl,
            recipient: testEmailAddress,
            runnerName: "ทดสอบระบบ"
          });
        }
        loadRecent();
      } else {
        alert(res.message || "ไม่สามารถส่งอีเมลทดสอบได้");
      }
    } catch (e: any) {
      alert("เกิดข้อผิดพลาด: " + e.message);
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleBatchSendReminder = async () => {
    setSendingBatch(true);
    try {
      const res = await sendBatchReminder({ skipAlreadySent: batchSkipSent });
      setBatchModalOpen(false);
      loadReminderStats();
      loadRecent();
      fetchRegistrations();
      onRefresh();
      alert(`ส่งอีเมลแจ้งเตือนล่วงหน้า 3 วันสำเร็จทั้งหมด ${res.count} ท่าน!`);
    } catch (e: any) {
      alert("เกิดข้อผิดพลาดในการส่ง: " + e.message);
    } finally {
      setSendingBatch(false);
    }
  };

  const handleSendDirectReminder = async (runnerId: string) => {
    try {
      const runner = registrations.find(r => r.id === runnerId);
      const res = await adminSendRunnerEmail(runnerId, "reminder");
      if (res.success) {
        alert(`ส่งอีเมลแจ้งเตือนล่วงหน้า 3 วันให้คุณ ${runner?.firstName || ""} เรียบร้อยแล้ว!`);
        if (res.emailPreviewUrl) {
          setLastEmailPreview({
            type: "reminder",
            url: res.emailPreviewUrl,
            recipient: runner?.email || "",
            runnerName: `${runner?.firstName} ${runner?.lastName}`
          });
        }
        fetchRegistrations();
        onRefresh();
        loadRecent();
      } else {
        alert(res.message || "ไม่สามารถส่งได้");
      }
    } catch (e: any) {
      alert("เกิดข้อผิดพลาด: " + e.message);
    }
  };

  const handleResendTicket = async (runnerId: string) => {
    try {
      const runner = registrations.find(r => r.id === runnerId);
      const res = await adminSendRunnerEmail(runnerId, "approval");
      if (res.success) {
        alert(`ส่งบัตรเข้างาน E-BIB ให้คุณ ${runner?.firstName || ""} ซ้ำเรียบร้อยแล้ว!`);
        if (res.emailPreviewUrl) {
          setLastEmailPreview({
            type: "approval" as any,
            url: res.emailPreviewUrl,
            recipient: runner?.email || "",
            runnerName: `${runner?.firstName} ${runner?.lastName}`
          });
        }
        loadRecent();
      } else {
        alert(res.message || "ไม่สามารถส่งได้");
      }
    } catch (e: any) {
      alert("เกิดข้อผิดพลาด: " + e.message);
    }
  };

  // Sandbox Seeder helper
  const handlePopulateMock = async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/admin/populate-mock", { method: "POST" });
      if (response.ok) {
        await fetchRegistrations();
        onRefresh();
        alert("เพิ่มข้อมูลผู้สมัครจำลอง 14 รายการเรียบร้อยแล้ว! (รวมข้อมูลจัดส่งไปรษณีย์ไทย 4 รายการ)");
      }
    } catch (err) {
      console.error("Mock seeding error:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Sandbox Clear helper
  const handleClearDatabase = async () => {
    if (!confirm("คุณต้องการล้างข้อมูลผู้สมัครทั้งหมดใช่หรือไม่?")) return;

    setRefreshing(true);
    try {
      const response = await fetch("/api/admin/clear", { method: "POST" });
      if (response.ok) {
        await fetchRegistrations();
        onRefresh();
        alert("ล้างฐานข้อมูลผู้สมัครวิ่งทั้งหมดเรียบร้อยแล้ว");
      }
    } catch (err) {
      console.error("Database clear error:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Export CSV generator
  const handleExportCSV = () => {
    if (registrations.length === 0) return;

    // CSV Headers
    const headers = [
      "RegistrationID",
      "FirstName",
      "LastName",
      "Email",
      "Phone",
      "NationalID",
      "Age",
      "Gender",
      "BloodType",
      "Distance",
      "ShirtSize",
      "Price",
      "Status",
      "BIBNumber",
      "RegisteredAt",
      "VerifiedAt"
    ];

    // Map rows
    const rows = registrations.map(r => [
      r.id,
      r.firstName,
      r.lastName,
      r.email,
      r.phone,
      `="${r.nationalId}"`, // Prevent Excel stripping leading zeros
      r.age,
      r.gender,
      r.bloodType,
      r.distance,
      r.shirtSize,
      r.price,
      r.status,
      r.bibNumber || "",
      r.createdAt,
      r.verifiedAt || ""
    ]);

    // Construct CSV String
    const csvContent = "\uFEFF" + [ // UTF-8 BOM for Thai language support
      headers.join(","),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    // Download trigger
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `LSEd_Running_Registrants_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportShippingCSV = () => {
    const shippingRegs = registrations.filter(r => r.deliveryMethod === "shipping");
    if (shippingRegs.length === 0) {
      alert("ไม่มีข้อมูลผู้สมัครจัดส่งทางไปรษณีย์ในขณะนี้");
      return;
    }

    // CSV Headers
    const headers = [
      "ลำดับ (No.)",
      "เลข BIB",
      "ชื่อ (First Name)",
      "นามสกุล (Last Name)",
      "เบอร์โทรศัพท์ (Phone)",
      "อีเมล (Email)",
      "เลขบัตรประชาชน (National ID)",
      "อายุ (Age)",
      "เพศ (Gender)",
      "หมู่เลือด (Blood Type)",
      "ระยะทาง (Distance)",
      "ไซส์เสื้อ (Shirt Size)",
      "ที่อยู่จัดส่ง (Shipping Address)",
      "ผู้จัดส่ง (Carrier)",
      "เลขพัสดุ (Tracking Number)",
      "วันเวลาจัดส่ง (Shipped At)",
      "สถานะการชำระเงิน (Status)",
      "ยอดเงินสุทธิ (Price)",
      "วันที่สมัคร (Registered At)"
    ];

    const getDistanceText = (dist: string) => {
      switch (dist) {
        case "REGULAR": return "Regular 5KM";
        case "vip": return "VIP 5KM";
        case "donation": return "บริจาคสนับสนุน";
        default: return dist;
      }
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case "approved": return "อนุมัติแล้ว";
        case "pending_verification": return "รอตรวจสอบสลิป";
        case "pending_payment": return "รอชำระเงิน";
        case "rejected": return "ปฏิเสธสลิป";
        default: return status;
      }
    };

    // Map rows
    const rows = shippingRegs.map((r, idx) => [
      idx + 1,
      r.bibNumber || "รออนุมัติ",
      r.firstName,
      r.lastName,
      r.phone,
      r.email,
      `="${r.nationalId}"`, // Prevent numeric formatting truncation in Excel
      r.age || "-",
      r.gender === "male" ? "ชาย" : r.gender === "female" ? "หญิง" : "-",
      r.bloodType || "-",
      getDistanceText(r.distance),
      r.shirtSize || "-",
      r.shippingAddress || "",
      "ไปรษณีย์ไทย (EMS)",
      r.shippingTrackingNumber || "",
      r.shippedAt || "",
      getStatusText(r.status),
      r.price,
      r.createdAt ? new Date(r.createdAt).toLocaleString("th-TH") : ""
    ]);

    // Construct CSV String with UTF-8 BOM
    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${String(val ?? "").replace(/"/g, '""').replace(/\n/g, ' ')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `LSEd_Running_Shipping_List_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusLabel = (reg: Registration) => {
    if (reg.checkedIn) {
      return (
        <span className="inline-flex items-center justify-center whitespace-nowrap bg-pink-100 border border-pink-300 text-pink-700 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
          เช็คอินแล้ว
        </span>
      );
    }
    const status = reg.status;
    switch (status) {
      case "approved": 
        return (
          <span className="inline-flex items-center justify-center whitespace-nowrap bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
            อนุมัติแล้ว
          </span>
        );
      case "pending_verification": 
        return (
          <span className="inline-flex items-center justify-center whitespace-nowrap bg-teal-100 border border-teal-300 text-teal-800 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs animate-pulse">
            ยืนยันสลิป
          </span>
        );
      case "pending_payment": 
        return (
          <span className="inline-flex items-center justify-center whitespace-nowrap bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
            รอชำระเงิน
          </span>
        );
      case "rejected": 
        return (
          <span className="inline-flex items-center justify-center whitespace-nowrap bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
            ไม่ผ่าน
          </span>
        );
    }
  };

  const getDistanceBadge = (dist: DistanceType) => {
    switch (dist) {
      case "5K": return <span className="inline-flex items-center justify-center whitespace-nowrap bg-teal-100 text-teal-800 font-extrabold text-xs px-2.5 py-1 rounded-md border border-teal-300 shadow-xs">Standard 5K</span>;
      case "vip": return <span className="inline-flex items-center justify-center whitespace-nowrap bg-amber-100 text-amber-800 font-extrabold text-xs px-2.5 py-1 rounded-md border border-amber-300 shadow-xs">VIP 5K</span>;
      case "vip_duo": return <span className="inline-flex items-center justify-center whitespace-nowrap bg-orange-100 text-orange-800 font-extrabold text-xs px-2.5 py-1 rounded-md border border-orange-300 shadow-xs">VIP Duo 5K</span>;
      case "vip_trio": return <span className="inline-flex items-center justify-center whitespace-nowrap bg-orange-100 text-orange-800 font-extrabold text-xs px-2.5 py-1 rounded-md border border-orange-300 shadow-xs">VIP Trio 5K</span>;
      case "donation": return <span className="inline-flex items-center justify-center whitespace-nowrap bg-purple-100 text-purple-800 font-extrabold text-xs px-2.5 py-1 rounded-md border border-purple-300 shadow-xs">บริจาค</span>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden p-6 md:p-8 space-y-6 text-center animate-fade-in text-slate-900" id="admin-login-card">
        <div className="w-16 h-16 bg-teal-50 border border-teal-200 text-teal-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <Lock className="w-8 h-8" />
        </div>
        
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-slate-900">พื้นที่หลังบ้าน (Admin Console)</h2>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            กรุณาป้อนรหัสผ่านผู้ดูแลระบบงานวิ่ง LSEd Running 2569 เพื่อตรวจสอบสลิป พิมพ์บิ๊บ และจัดการข้อมูลนักวิ่งทุกคน
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="รหัสเข้าใช้สำหรับสาธิต: admin123"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl text-center text-sm font-semibold tracking-wider placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition"
              id="admin-password-input"
            />
          </div>

          {authError && (
            <p className="text-xs text-red-500 font-bold flex items-center gap-1.5 justify-center">
              <AlertCircle className="w-3.5 h-3.5" /> {authError}
            </p>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition cursor-pointer shadow-lg shadow-teal-500/20"
              id="admin-login-submit"
            >
              เข้าสู่ระบบหลังบ้าน
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 p-4 md:p-8 font-sans flex flex-col">
      <div className="max-w-[1400px] w-full mx-auto bg-white border border-slate-200 rounded-[2rem] shadow-xl overflow-hidden flex flex-col flex-1 h-full min-h-[calc(100vh-4rem)]">
        
        {/* HEADER */}
        <div className="bg-white border-b border-slate-200 px-6 md:px-10 py-5 flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden shrink-0">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-600 to-orange-500 text-white rounded-2xl flex items-center justify-center shadow-md shadow-teal-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Admin Console</h1>
              <p className="text-xs md:text-xs text-teal-700 font-bold tracking-wider mt-0.5">LSEd Running 2569 Management</p>
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <button
              onClick={() => setIsAuthenticated(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>

        {/* TOP TAB NAVIGATION */}
        <div className="flex flex-col md:flex-row border-b border-slate-200 bg-slate-50 overflow-x-auto shrink-0 hide-scrollbar px-4 gap-2 pt-2">
          <button
            type="button"
            onClick={() => setSubTab("runners")}
            className={`flex-1 md:flex-initial px-6 py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
              subTab === "runners"
                ? "border-b-2 border-teal-600 text-teal-800 bg-white shadow-xs rounded-t-xl"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60 rounded-t-xl"
            }`}
          >
            <Users className="w-4 h-4 text-teal-600" /> จัดการนักวิ่ง
          </button>
          <button
            type="button"
            onClick={() => setSubTab("shipping")}
            className={`flex-1 md:flex-initial px-6 py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
              subTab === "shipping"
                ? "border-b-2 border-orange-500 text-orange-700 bg-white shadow-xs rounded-t-xl"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60 rounded-t-xl"
            }`}
          >
            <Package className="w-4 h-4 text-orange-500" /> แพ็คของ/จัดส่ง
          </button>
          <button
            type="button"
            onClick={() => setSubTab("payment")}
            className={`flex-1 md:flex-initial px-6 py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
              subTab === "payment"
                ? "border-b-2 border-teal-600 text-teal-800 bg-white shadow-xs rounded-t-xl"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60 rounded-t-xl"
            }`}
          >
            <CreditCard className="w-4 h-4 text-teal-600" /> บัญชีรับเงิน
          </button>
          <button
            type="button"
            onClick={() => setSubTab("assets")}
            className={`flex-1 md:flex-initial px-6 py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
              subTab === "assets"
                ? "border-b-2 border-orange-500 text-orange-700 bg-white shadow-xs rounded-t-xl"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60 rounded-t-xl"
            }`}
          >
            <Image className="w-4 h-4 text-orange-500" /> ภาพประกอบ
          </button>
          <button
            type="button"
            onClick={() => setSubTab("emails")}
            className={`flex-1 md:flex-initial px-6 py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
              subTab === "emails"
                ? "border-b-2 border-orange-500 text-orange-700 bg-white shadow-xs rounded-t-xl"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60 rounded-t-xl"
            }`}
          >
            <Mail className="w-4 h-4 text-orange-500" /> ระบบอีเมล & เตือนล่วงหน้า 3 วัน
          </button>
        </div>

        {/* MAIN CONTENT AREA */}
        <section className="flex-1 bg-white relative overflow-hidden flex flex-col h-full">
        {subTab === "runners" ? (
          <>
            {/* Table Filter Options */}
            <div className="p-5 border-b border-slate-200 bg-white space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-teal-600" /> บัญชีรายชื่อผู้สมัครวิ่งและร่วมบริจาคทั้งหมด
                </h3>

                {/* Quick Export Button */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={registrations.length === 0}
                  className="px-4 py-2 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" /> ส่งออกไฟล์รายชื่อนักวิ่ง (CSV / Excel)
                </button>
              </div>

              {/* Interactive filter widgets */}
              <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-5 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    placeholder="ค้นหาตามชื่อ, รหัสสมัคร, BIB, เบอร์โทร..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition"
                  />
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={filterDistance}
                    onChange={(e) => setFilterDistance(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition"
                  >
                    <option value="all">แพ็กเกจ/ประเภท: ทั้งหมด</option>
                    <option value="REGULAR">Regular 5KM (555 บาท)</option>
                    <option value="vip">VIP 5KM (990 บาท)</option>
                    <option value="donation">ร่วมบริจาคสนับสนุน</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition"
                  >
                    <option value="all">สถานะเงิน: ทั้งหมด</option>
                    <option value="pending_payment">รอชำระเงิน</option>
                    <option value="pending_verification">รอยืนยันสลิป</option>
                    <option value="approved">ชำระเงินสำเร็จ (อนุมัติบิ๊บ)</option>
                    <option value="rejected">สลิปไม่ผ่านอนุมัติ</option>
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <button
                    type="submit"
                    className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white font-black text-xs rounded-xl transition cursor-pointer shadow-xs"
                  >
                    ค้นหา
                  </button>
                </div>
              </form>
            </div>

            {/* DATA GRID */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-16 text-center space-y-3">
                  <svg className="animate-spin h-8 w-8 text-teal-700 mx-auto" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-xs text-slate-600 font-bold">กำลังดึงข้อมูลรายชื่อจากหลังบ้าน...</p>
                </div>
              ) : registrations.length === 0 ? (
                <div className="p-16 text-center space-y-3 text-slate-600">
                  <AlertCircle className="w-10 h-10 text-slate-900/20 mx-auto" />
                  <p className="text-sm font-semibold">ไม่พบข้อมูลรายชื่อนักวิ่งในระบบ</p>
                  <p className="text-xs font-light">ทดลองคลิกปุ่ม **"จำลองผู้สมัครวิ่ง"** ด้านบน เพื่อสุ่มตัวอย่างนักวิ่งจำลองมาทดลองเล่น</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm text-slate-900/90 min-w-[1050px]">
                  <thead className="bg-slate-100 text-xs text-slate-700 uppercase tracking-widest font-black border-b border-slate-200">
                    <tr>
                      <th scope="col" className="px-5 py-4 whitespace-nowrap">ผู้สมัคร / รหัสอ้างอิง</th>
                      <th scope="col" className="px-5 py-4 whitespace-nowrap">ระยะวิ่ง</th>
                      <th scope="col" className="px-5 py-4 whitespace-nowrap">ขนาดเสื้อ</th>
                      <th scope="col" className="px-5 py-4 whitespace-nowrap">เบอร์โทรศัพท์</th>
                      <th scope="col" className="px-5 py-4 text-center whitespace-nowrap">การจัดส่ง</th>
                      <th scope="col" className="px-5 py-4 text-center whitespace-nowrap">สถานะ</th>
                      <th scope="col" className="px-5 py-4 text-center whitespace-nowrap">หมายเลข BIB</th>
                      <th scope="col" className="px-5 py-4 text-center whitespace-nowrap">เช็คอินหน้างาน</th>
                      <th scope="col" className="px-5 py-4 text-right whitespace-nowrap">ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {registrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-teal-50/50 transition">
                        
                        {/* User Profile Info */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{reg.firstName} {reg.lastName}</p>
                            <p className="text-xs text-slate-500 font-bold tracking-wider mt-0.5">{reg.id}</p>
                          </div>
                        </td>

                        {/* Distance Category */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {getDistanceBadge(reg.distance)}
                        </td>

                        {/* Sizing */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-extrabold text-xs text-slate-900">{reg.shirtSize}</span>
                        </td>

                        {/* Phone Number */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-xs text-slate-700 font-semibold">{reg.phone}</span>
                        </td>

                        {/* Delivery Method */}
                        <td className="px-5 py-4 text-center whitespace-nowrap">
                          {reg.deliveryMethod === "shipping" ? (
                            <span className="inline-flex items-center justify-center whitespace-nowrap text-xs font-bold tracking-wide text-orange-800 bg-orange-100 px-3 py-1 rounded-md border border-orange-300 gap-1 shadow-xs">
                              <Truck className="w-3.5 h-3.5" /> ไปรษณีย์
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center whitespace-nowrap text-xs font-bold tracking-wide text-teal-800 bg-teal-100 px-3 py-1 rounded-md border border-teal-300 shadow-xs">
                              รับเองหน้างาน
                            </span>
                          )}
                        </td>

                        {/* Payment status badge */}
                        <td className="px-5 py-4 text-center whitespace-nowrap">
                          {getStatusLabel(reg)}
                        </td>

                        {/* Assigned BIB number badge */}
                        <td className="px-5 py-4 text-center whitespace-nowrap">
                          {reg.bibNumber ? (
                            <span className="inline-flex items-center justify-center whitespace-nowrap bg-slate-900 text-white font-black text-xs px-3 py-1 rounded-md tracking-wider shadow-xs">
                              {reg.bibNumber}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-semibold">-</span>
                          )}
                        </td>

                        {/* Check-in Status & Quick Toggle */}
                        <td className="px-5 py-4 text-center whitespace-nowrap">
                          {reg.status === "approved" ? (
                            <button
                              type="button"
                              onClick={() => handleCheckinToggle(reg)}
                              className={`inline-flex items-center justify-center whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer gap-1.5 mx-auto shadow-xs ${
                                reg.checkedIn
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
                              }`}
                              title={reg.checkedIn ? `เช็คอินแล้วเมื่อ ${reg.checkedInAt ? new Date(reg.checkedInAt).toLocaleTimeString('th-TH') : ''} (คลิกเพื่อยกเลิก)` : "คลิกเพื่อเช็คอิน"}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{reg.checkedIn ? "เช็คอินแล้ว ✓" : "ยังไม่เช็คอิน"}</span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>

                        {/* Actions dropdown/buttons */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="inline-flex gap-1.5">
                            
                            {/* View Slip Trigger */}
                            {reg.slipUrl && (
                              <button
                                type="button"
                                onClick={() => { setSelectedReg(reg); setIsRejecting(false); }}
                                className="p-1.5 bg-teal-50 border border-teal-300 hover:bg-teal-100 text-teal-700 rounded-lg transition cursor-pointer"
                                title="ตรวจสอบรูปสลิป / อนุมัติสิทธิ์วิ่ง"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}

                            {/* Direct 3-day reminder trigger */}
                            {reg.status === "approved" && (
                              <button
                                type="button"
                                onClick={() => handleSendDirectReminder(reg.id)}
                                className={`p-1.5 border rounded-lg transition cursor-pointer ${
                                  reg.reminderSentAt 
                                    ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100" 
                                    : "bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100"
                                }`}
                                title={reg.reminderSentAt ? `ส่งอีเมลเตือนล่วงหน้า 3 วันแล้ว (${new Date(reg.reminderSentAt).toLocaleDateString('th-TH')}) - คลิกเพื่อส่งซ้ำ` : "ส่งอีเมลแจ้งเตือนล่วงหน้า 3 วัน (สถานที่ เวลา สิ่งของที่ต้องนำมา)"}
                              >
                                <Mail className="w-4 h-4" />
                              </button>
                            )}

                            {/* Direct edit trigger */}
                            <button
                              type="button"
                              onClick={() => setEditingReg({ ...reg })}
                              className="p-1.5 bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                              title="แก้ไขข้อมูลผู้สมัครวิ่ง"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Direct delete trigger */}
                            <button
                              type="button"
                              onClick={() => handleDelete(reg.id)}
                              className="p-1.5 bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 text-red-400 rounded-lg transition cursor-pointer"
                              title="ลบผู้สมัครออก"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : subTab === "shipping" ? (
          <>
            {/* SHIPPING QUEUE INTERFACE */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Truck className="w-5 h-5 text-orange-500" /> จัดการเลขพัสดุสำหรับผู้สมัครทางไปรษณีย์
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">ค้นหาที่อยู่จัดส่งเสื้อ บันทึกเลข tracking เพื่อให้ผู้สมัครตรวจสอบจากหน้าหลักได้ทันที</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Shipping Status filters */}
                  <div className="flex gap-1.5 bg-slate-50 p-1.5 border border-slate-200 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFilterShippingStatus("all")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${filterShippingStatus === 'all' ? 'bg-orange-600 text-white' : 'text-slate-600 hover:text-slate-800'}`}
                    >
                      ทั้งหมด ({registrations.filter(r => r.deliveryMethod === 'shipping').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterShippingStatus("pending")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${filterShippingStatus === 'pending' ? 'bg-amber-500 text-black' : 'text-slate-600 hover:text-slate-800'}`}
                    >
                      ยังไม่ใส่เลขพัสดุ ({registrations.filter(r => r.deliveryMethod === 'shipping' && !r.shippingTrackingNumber).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterShippingStatus("shipped")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${filterShippingStatus === 'shipped' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-800'}`}
                    >
                      จัดส่งแล้ว ({registrations.filter(r => r.deliveryMethod === 'shipping' && r.shippingTrackingNumber).length})
                    </button>
                  </div>

                  {/* Export Shipping CSV Button */}
                  <button
                    type="button"
                    onClick={handleExportShippingCSV}
                    disabled={registrations.filter(r => r.deliveryMethod === 'shipping').length === 0}
                    className="px-5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/5"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> ส่งออกไฟล์รายชื่อนักวิ่ง (CSV / Excel)
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-16 text-center">
                  <svg className="animate-spin h-8 w-8 text-orange-500 mx-auto" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : registrations.filter(r => r.deliveryMethod === "shipping").length === 0 ? (
                <div className="p-16 text-center space-y-4 text-slate-600 max-w-md mx-auto">
                  <Truck className="w-12 h-12 text-orange-500/30 mx-auto animate-pulse" />
                  <div className="space-y-1">
                    <p className="text-sm font-black text-slate-900">ไม่มีผู้สมัครคนใดเลือกจัดส่งทางไปรษณีย์</p>
                    <p className="text-xs text-slate-600 leading-relaxed font-light">ยังไม่มีผู้ลงทะเบียนที่เลือกช่องทางจัดส่งไปรษณีย์ไทยในระบบ คุณสามารถคลิกปุ่มด้านล่างเพื่อทำการสร้างข้อมูลตัวอย่างสำหรับการจัดส่งและจำลองที่อยู่ได้ทันที!</p>
                  </div>
                  <button
                    type="button"
                    onClick={handlePopulateMock}
                    className="mt-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black rounded-xl transition cursor-pointer inline-flex items-center gap-1.5 shadow-lg shadow-orange-600/25"
                  >
                    🧪 สร้างข้อมูลจำลองผู้สมัครจัดส่ง (14 รายการ)
                  </button>
                </div>
              ) : registrations.filter(r => {
                if (r.deliveryMethod !== "shipping") return false;
                if (filterShippingStatus === "pending") return !r.shippingTrackingNumber;
                if (filterShippingStatus === "shipped") return !!r.shippingTrackingNumber;
                return true;
              }).length === 0 ? (
                <div className="p-16 text-center space-y-2 text-slate-600">
                  <AlertCircle className="w-8 h-8 text-slate-900/10 mx-auto" />
                  <p className="text-xs font-semibold">ไม่พบผู้สมัครที่ตรงตามตัวกรองนี้</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm text-slate-900/90 min-w-[950px]">
                  <thead className="bg-slate-100 text-xs text-slate-700 uppercase tracking-widest font-bold border-b border-slate-200">
                    <tr>
                      <th scope="col" className="px-5 py-4 whitespace-nowrap">ผู้รับพัสดุ / รหัส BIB</th>
                      <th scope="col" className="px-5 py-4 whitespace-nowrap">แพ็กเกจ & เสื้อ</th>
                      <th scope="col" className="px-5 py-4">ที่อยู่สำหรับจัดส่งพัสดุ</th>
                      <th scope="col" className="px-5 py-4 text-center whitespace-nowrap">สถานะเงิน</th>
                      <th scope="col" className="px-5 py-4 whitespace-nowrap">หมายเลขพัสดุ (Tracking Number)</th>
                      <th scope="col" className="px-5 py-4 text-right whitespace-nowrap">บันทึก</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {registrations.filter(r => {
                      if (r.deliveryMethod !== "shipping") return false;
                      if (filterShippingStatus === "pending") return !r.shippingTrackingNumber;
                      if (filterShippingStatus === "shipped") return !!r.shippingTrackingNumber;
                      return true;
                    }).map((reg) => (
                      <tr key={reg.id} className="hover:bg-slate-50 transition">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{reg.firstName} {reg.lastName}</p>
                            <p className="text-xs text-slate-600 font-bold tracking-wider mt-0.5">REF: {reg.id}</p>
                            {reg.bibNumber ? (
                              <span className="inline-flex items-center justify-center whitespace-nowrap mt-1 bg-slate-900 text-white font-black text-xs px-2.5 py-1 rounded shadow-xs tracking-tight">
                                BIB: {reg.bibNumber}
                              </span>
                            ) : (
                              <span className="text-xs text-amber-600 font-semibold mt-1 block">⚠️ รออนุมัติเงินเพื่อออก BIB</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="space-y-0.5">
                            {getDistanceBadge(reg.distance)}
                            <div className="text-xs text-slate-600">เสื้อไซส์: <span className="font-extrabold text-slate-900">{reg.shirtSize}</span></div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-2 max-w-xs">
                            <span className="text-xs break-words text-slate-700 block bg-slate-50 p-2 rounded-lg border border-slate-200 flex-grow font-normal leading-relaxed">
                              {reg.shippingAddress || "ไม่ได้ระบุที่อยู่จัดส่ง"}
                            </span>
                            {reg.shippingAddress && (
                              <button
                                type="button"
                                onClick={() => handleCopyAddress(reg.id, reg.shippingAddress || "")}
                                className={`p-1.5 rounded-lg transition text-xs font-bold uppercase tracking-wider flex-shrink-0 border cursor-pointer ${
                                  copiedId === reg.id 
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300" 
                                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                                }`}
                              >
                                {copiedId === reg.id ? "คัดลอกแล้ว" : "คัดลอก"}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center whitespace-nowrap">
                          {getStatusLabel(reg)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1.5 w-48">
                            <div className="text-xs font-bold text-orange-700 bg-orange-100 border border-orange-200 px-2.5 py-1.5 rounded-xl w-full flex items-center gap-1.5">
                              <Truck className="w-3.5 h-3.5" /> ไปรษณีย์ไทย (EMS)
                            </div>
                            <input
                              type="text"
                              value={trackingInputs[reg.id] ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTrackingInputs(prev => ({ ...prev, [reg.id]: val }));
                                // Ensure carrier is locked to thailandpost
                                setCarrierInputs(prev => ({ ...prev, [reg.id]: "thailandpost" }));
                              }}
                              placeholder="กรอกเลขพัสดุ (เช่น EF123456789TH)"
                              className="px-3 py-2 bg-white border border-slate-300 focus:border-orange-500 focus:outline-none rounded-xl text-xs text-slate-900 tracking-wide transition shadow-xs"
                            />
                            {reg.shippedAt && (
                              <span className="text-xs text-slate-600 block">
                                📅 ส่ง: {reg.shippedAt}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex flex-col gap-1.5 items-stretch justify-end max-w-[120px] ml-auto">
                            <button
                              type="button"
                              disabled={savingTrackingId === reg.id}
                              onClick={() => handleQuickSaveTracking(reg, trackingInputs[reg.id] || "", carrierInputs[reg.id] || "thailandpost")}
                              className="w-full px-3 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-orange-600/40 text-white font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                            >
                              {savingTrackingId === reg.id ? (
                                <svg className="animate-spin h-3.5 w-3.5 text-slate-900" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              ) : (
                                "💾 บันทึก"
                              )}
                            </button>
                            {reg.shippingTrackingNumber && (
                              <button
                                type="button"
                                disabled={simulatingNotificationId === reg.id}
                                onClick={() => handleSimulateNotification(reg.id)}
                                className="w-full px-2 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:bg-indigo-600/40 text-slate-900 font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1 uppercase tracking-wider"
                              >
                                {simulatingNotificationId === reg.id ? (
                                  <svg className="animate-spin h-3 w-3 text-slate-900" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                ) : (
                                  "🔔 จำลองแจ้งเตือน"
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : subTab === "payment" ? (
          <div className="p-8 space-y-8 animate-fade-in text-slate-900 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Coins className="w-6 h-6 text-emerald-400" /> ตั้งค่าระบบบัญชีรับเงินโอน (Payment Configuration)
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  ตั้งค่าบัญชีโอนเงินสำหรับผู้ลงทะเบียน ปัจจุบันระบบใช้บัญชีเดียวในการรับเงินร่วมกันทั้งหมด
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePaymentSettings} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
                {/* ACCOUNT 1: REGULAR */}
                <div className="bg-white/[0.02] border border-slate-200 p-6 rounded-3xl space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-400 px-4 py-1 rounded-bl-2xl text-xs font-bold uppercase tracking-wider">
                    บัญชีหลัก
                  </div>
                  <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest border-b border-slate-200 pb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> 1. บัญชีรับเงินทั่วไป (Regular Account)
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-700 block">ธนาคารรับเงิน (Bank Name)</label>
                      <input 
                        type="text"
                        value={regBankName}
                        onChange={(e) => setRegBankName(e.target.value)}
                        placeholder="เช่น ทหารไทยธนชาต (ttb)"
                        required
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-white/20 focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-700 block">เลขที่บัญชี / หมายเลขโทรศัพท์พร้อมเพย์ (Account No / PromptPay ID)</label>
                      <input 
                        type="text"
                        value={regAccountNo}
                        onChange={(e) => setRegAccountNo(e.target.value)}
                        placeholder="เช่น 083-013-1768"
                        required
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-white/20 focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-700 block">ชื่อบัญชีรับเงิน (Account Name)</label>
                      <input 
                        type="text"
                        value={regAccountName}
                        onChange={(e) => setRegAccountName(e.target.value)}
                        placeholder="เช่น นาย นภัสกร กลิ่นเฟื่อง"
                        required
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-white/20 focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-700 block">อัปโหลดภาพ QR Code สแกนจ่าย (QR Code Upload)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                        <div className="sm:col-span-8">
                          <label className="border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-500/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[110px] relative overflow-hidden group">
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handleQrUpload(e, "regular")}
                              className="sr-only"
                            />
                            <div className="space-y-1 flex flex-col items-center">
                              <span className="text-xs font-black text-emerald-400">คลิกเพื่อเลือกไฟล์รูปคิวอาร์โค้ด</span>
                              <span className="text-xs text-slate-500">แนะนำขนาดสี่เหลี่ยมจัตุรัสไม่เกิน 1.2MB</span>
                            </div>
                          </label>
                        </div>
                        <div className="sm:col-span-4 flex justify-center">
                          {regQrImage ? (
                            <div className="relative group w-24 h-24 bg-white p-1 rounded-xl border border-slate-200 flex items-center justify-center">
                              <img src={regQrImage} alt="Regular QR Preview" className="w-full h-full object-contain" />
                              <button 
                                type="button"
                                onClick={() => setRegQrImage("")}
                                className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-500 text-white p-1 rounded-full shadow-lg transition"
                                title="ลบรูปภาพ"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="w-24 h-24 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-xs text-slate-500 p-2 text-center bg-black/10">
                              <QrCode className="w-6 h-6 text-slate-900/20 mb-1" />
                              <span>(ระบบจะสร้าง QR จำลองให้จากเลขบัญชี)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>


              </div>
              <div className="bg-white/[0.01] border border-slate-200 p-6 rounded-3xl space-y-4">
                {settingsSuccess && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" /> บันทึกช่องทางการรับเงินสำเร็จเรียบร้อย!
                  </div>
                )}

                {settingsError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in">
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" /> {settingsError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/40 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-1.5"
                >
                  {savingSettings ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-slate-900" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      กำลังบันทึกข้อมูลช่องทางชำระเงิน...
                    </>
                  ) : (
                    "บันทึกช่องทางการรับเงิน (Save Settings)"
                  )}
                </button>
              </div>
            </form>
          </div>

        
        ) : subTab === "assets" ? (
          <div className="p-5 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
              <div>
                <h3 className="text-xl font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                  <Image className="w-5 h-5" /> อัปโหลดภาพของที่ระลึก
                </h3>
                <p className="text-xs text-slate-600 mt-1.5">
                  อัปโหลดภาพเสื้อและเหรียญที่ระลึกเพื่อให้ผู้สมัครเห็นภาพของจริงในหน้าฟอร์ม
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveAssetsSettings} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* SHIRT ASSET */}
                <div className="bg-white/[0.02] border border-slate-200 p-6 rounded-3xl space-y-6 relative overflow-hidden">
                  <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest border-b border-slate-200 pb-2">
                    เสื้อที่ระลึก (Shirt)
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-700 block">
                      อัปโหลดภาพเสื้อคอกลม (Crew Neck Shirt)
                    </label>
                    <label className="border-2 border-dashed border-slate-200 hover:border-amber-500 bg-slate-50 hover:bg-amber-500/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[200px] relative overflow-hidden group">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleAssetUpload(e, "shirt")}
                        className="sr-only"
                      />
                      {shirtImage ? (
                        <div className="relative group w-full h-auto max-w-[200px] mx-auto">
                          <img src={shirtImage} alt="Shirt Preview" className="w-full h-auto object-cover rounded-xl shadow-md border border-slate-200" />
                          <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); setShirtImage(""); }}
                            className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-full shadow-lg transition"
                            title="ลบรูปภาพ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 flex flex-col items-center justify-center h-full text-slate-500">
                          <Image className="w-8 h-8 text-slate-900/20 mb-2" />
                          <span className="text-xs font-black text-amber-400">คลิกเพื่อเลือกไฟล์เสื้อคอกลม</span>
                          <span className="text-xs">รองรับ JPG, PNG ไม่เกิน 2MB</span>
                        </div>
                      )}
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-700 block">
                      อัปโหลดภาพเสื้อโปโล (Polo Shirt)
                    </label>
                    <label className="border-2 border-dashed border-slate-200 hover:border-amber-500 bg-slate-50 hover:bg-amber-500/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[200px] relative overflow-hidden group">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleAssetUpload(e, "poloshirt")}
                        className="sr-only"
                      />
                      {poloShirtImage ? (
                        <div className="relative group w-full h-auto max-w-[200px] mx-auto">
                          <img src={poloShirtImage} alt="Polo Shirt Preview" className="w-full h-auto object-cover rounded-xl shadow-md border border-slate-200" />
                          <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); setPoloShirtImage(""); }}
                            className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-full shadow-lg transition"
                            title="ลบรูปภาพ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 flex flex-col items-center justify-center h-full text-slate-500">
                          <Image className="w-8 h-8 text-slate-900/20 mb-2" />
                          <span className="text-xs font-black text-amber-400">คลิกเพื่อเลือกไฟล์เสื้อโปโล</span>
                          <span className="text-xs">รองรับ JPG, PNG ไม่เกิน 2MB</span>
                        </div>
                      )}
                    </label>
                  </div>
                  </div>
                </div>

                {/* MEDAL ASSET */}
                <div className="bg-white/[0.02] border border-slate-200 p-6 rounded-3xl space-y-6 relative overflow-hidden">
                  <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest border-b border-slate-200 pb-2">
                    เหรียญที่ระลึก (Medal)
                  </h4>
                  
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-700 block">
                      อัปโหลดภาพเหรียญ (Medal Image Upload)
                    </label>
                    <label className="border-2 border-dashed border-slate-200 hover:border-amber-500 bg-slate-50 hover:bg-amber-500/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[200px] relative overflow-hidden group">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleAssetUpload(e, "medal")}
                        className="sr-only"
                      />
                      {medalImage ? (
                        <div className="relative group w-full h-auto max-w-[200px] mx-auto">
                          <img src={medalImage} alt="Medal Preview" className="w-full h-auto object-cover rounded-xl shadow-md border border-slate-200" />
                          <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); setMedalImage(""); }}
                            className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-full shadow-lg transition"
                            title="ลบรูปภาพ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 flex flex-col items-center justify-center h-full text-slate-500">
                          <Image className="w-8 h-8 text-white/20 mb-2" />
                          <span className="text-xs font-black text-amber-400">คลิกเพื่อเลือกไฟล์รูปเหรียญ</span>
                          <span className="text-xs">รองรับ JPG, PNG ไม่เกิน 2MB</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* SOUVENIR ASSET */}
                <div className="bg-white/[0.02] border border-slate-200 p-6 rounded-3xl space-y-6 relative overflow-hidden">
                  <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest border-b border-slate-200 pb-2">
                    ของที่ระลึก (Souvenir)
                  </h4>
                  
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-700 block">
                      อัปโหลดภาพของที่ระลึก (Souvenir Image Upload)
                    </label>
                    <label className="border-2 border-dashed border-slate-200 hover:border-amber-500 bg-slate-50 hover:bg-amber-500/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[200px] relative overflow-hidden group">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleAssetUpload(e, "souvenir")}
                        className="sr-only"
                      />
                      {souvenirImage ? (
                        <div className="relative group w-full h-auto max-w-[200px] mx-auto">
                          <img src={souvenirImage} alt="Souvenir Preview" className="w-full h-auto object-cover rounded-xl shadow-md border border-slate-200" />
                          <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); setSouvenirImage(""); }}
                            className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-full shadow-lg transition"
                            title="ลบรูปภาพ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 flex flex-col items-center justify-center h-full text-slate-500">
                          <Image className="w-8 h-8 text-white/20 mb-2" />
                          <span className="text-xs font-black text-amber-400">คลิกเพื่อเลือกไฟล์ของที่ระลึก</span>
                          <span className="text-xs">รองรับ JPG, PNG ไม่เกิน 2MB</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* ROUTE MAP ASSET */}
                <div className="bg-white/[0.02] border border-slate-200 p-6 rounded-3xl space-y-6 relative overflow-hidden">
                  <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest border-b border-slate-200 pb-2">
                    แผนที่เส้นทางวิ่ง (Route Map)
                  </h4>
                  
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-700 block">
                      อัปโหลดภาพแผนที่ (Route Map Image Upload)
                    </label>
                    <label className="border-2 border-dashed border-slate-200 hover:border-amber-500 bg-slate-50 hover:bg-amber-500/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[200px] relative overflow-hidden group">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleAssetUpload(e, "routemap")}
                        className="sr-only"
                      />
                      {routeMapImage ? (
                        <div className="relative group w-full h-auto min-h-[100px] bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-center">
                          <img src={routeMapImage} alt="Route Map Preview" className="w-full h-auto object-contain max-h-[400px]" />
                          <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); setRouteMapImage(""); }}
                            className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-full shadow-lg transition"
                            title="ลบรูปภาพ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 flex flex-col items-center justify-center h-full text-slate-500">
                          <Image className="w-8 h-8 text-slate-900/20 mb-2" />
                          <span className="text-xs font-black text-amber-400">คลิกเพื่อเลือกไฟล์รูปแผนที่เส้นทางวิ่ง</span>
                          <span className="text-xs">รองรับ JPG, PNG ไม่เกิน 2MB</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* LOGO ASSET */}
                <div className="bg-white/[0.02] border border-slate-200 p-6 rounded-3xl space-y-6 relative overflow-hidden">
                  <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest border-b border-slate-200 pb-2">
                    โลโก้งานวิ่ง (Logo - สัญลักษณ์เดียว)
                  </h4>
                  
                  {/* Preset Single Logo Options */}
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-700 block">
                      เลือกสัญลักษณ์เดี่ยวมาตรฐาน (Run to Shine)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setLogoImage(PRESET_LOGOS.orange)}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                          logoImage === PRESET_LOGOS.orange
                            ? "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30"
                            : "border-slate-200 hover:border-white/20 bg-slate-50"
                        }`}
                      >
                        <img src={PRESET_LOGOS.orange} alt="Orange Logo" className="w-10 h-10 object-contain rounded-lg" />
                        <span className="text-xs font-bold text-slate-800 ">สีส้ม (แนะนำ)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setLogoImage(PRESET_LOGOS.cyan)}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                          logoImage === PRESET_LOGOS.cyan
                            ? "border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/30"
                            : "border-slate-200 hover:border-white/20 bg-slate-50"
                        }`}
                      >
                        <img src={PRESET_LOGOS.cyan} alt="Cyan Logo" className="w-10 h-10 object-contain rounded-lg" />
                        <span className="text-xs font-bold text-slate-800 ">สีฟ้า (Cyan)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setLogoImage(PRESET_LOGOS.white)}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                          logoImage === PRESET_LOGOS.white
                            ? "border-slate-400 bg-white/10 ring-2 ring-white/30"
                            : "border-slate-200 hover:border-white/20 bg-slate-50"
                        }`}
                      >
                        <img src={PRESET_LOGOS.white} alt="White Logo" className="w-10 h-10 object-contain rounded-lg" />
                        <span className="text-xs font-bold text-slate-800 ">สีขาว/ดำ</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-700 block">
                      หรืออัปโหลดโลโก้เอง (Custom Logo Upload)
                    </label>
                    <label className="border-2 border-dashed border-slate-200 hover:border-amber-500 bg-slate-50 hover:bg-amber-500/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[160px] relative overflow-hidden group">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleAssetUpload(e, "logo")}
                        className="sr-only"
                      />
                      {logoImage ? (
                        <div className="relative group w-full h-auto min-h-[100px] bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-center">
                          <img src={logoImage} alt="Logo Preview" className="w-auto h-20 object-contain rounded-lg" />
                          <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); setLogoImage(""); }}
                            className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-full shadow-lg transition"
                            title="ลบรูปภาพ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 flex flex-col items-center justify-center h-full text-slate-500">
                          <Image className="w-8 h-8 text-slate-900/20 mb-2" />
                          <span className="text-xs font-black text-amber-400">คลิกเพื่อเลือกไฟล์รูปโลโก้</span>
                          <span className="text-xs">รองรับ JPG, PNG ไม่เกิน 2MB</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

              </div>

              {/* ACTION ROW */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200">
                <div className="text-xs">
                  {assetsError && <p className="text-red-400 flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5"/> {assetsError}</p>}
                  {assetsSuccess && <p className="text-emerald-400 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5"/> บันทึกข้อมูลรูปภาพของที่ระลึกสำเร็จ!</p>}
                </div>
                <button
                  type="submit"
                  disabled={savingAssets}
                  className="w-full sm:w-auto px-10 py-3.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-900 font-black text-xs uppercase tracking-widest rounded-xl transition shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  {savingAssets ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> กำลังบันทึก...</>
                  ) : (
                    <><Save className="w-4 h-4" /> บันทึกรูปภาพ</>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : subTab === "emails" ? (
          /* ======================================================== */
          /* EMAIL & 3-DAY REMINDER SYSTEM (ศูนย์ควบคุมอีเมลและแจ้งเตือน) */
          /* ======================================================== */
          <div className="space-y-8 animate-fade-in text-slate-900">
            
            {/* Top Hub Banner & Global Controls */}
            <div className="bg-gradient-to-r from-teal-900/40 via-neutral-900 to-orange-950/40 border border-slate-200 rounded-3xl p-6 md:p-8 backdrop-blur-md relative overflow-hidden shadow-2xl">
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold uppercase tracking-widest">
                    <Sparkles className="w-3.5 h-3.5 text-orange-400" /> ระบบแจ้งเตือนอัตโนมัติ • 3 วันก่อนวันงาน
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                    ศูนย์ควบคุมระบบอีเมล & แจ้งเตือนล่วงหน้า 3 วัน
                  </h3>
                  <p className="text-xs md:text-sm text-slate-600  font-light leading-relaxed">
                    ระบบส่งอีเมลอัตโนมัติสำหรับนักวิ่งที่ได้รับการอนุมัติแล้ว เพื่อย้ำเตือนสถานที่จัดงาน (คณะ LSEd มธ.ศูนย์รังสิต), จุดจอดรถ (ยิมเนเซียม 4, 5, 6), เวลาปล่อยตัว 05:00 น. วันอาทิตย์ที่ 24 มกราคม 2570 และเช็คลิสต์สิ่งของที่ต้องนำมาในวันงาน (BIB, เสื้อ, บัตร ปชช., รองเท้า, ยาประจำตัว, กระบอกน้ำ)
                  </p>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      loadReminderStats();
                      loadRecent();
                      loadPreview(selectedEmailTemplate, previewRunnerId);
                    }}
                    className="flex-1 sm:flex-initial px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600  rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    title="รีเฟรชข้อมูลตัวนับและประวัติ"
                  >
                    <RefreshCw className="w-4 h-4" /> รีเฟรชข้อมูล
                  </button>

                  <button
                    type="button"
                    onClick={() => setBatchModalOpen(true)}
                    className="flex-1 sm:flex-initial px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/25"
                  >
                    <Send className="w-4 h-4" /> ส่งแจ้งเตือนทุกคน (Broadcast 3 วัน)
                  </button>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
              
              {/* Event Date Metric */}
              <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-teal-400" /> วันจัดแข่งขัน
                </span>
                <p className="text-base sm:text-lg font-black text-slate-900">
                  24 ม.ค. 2570
                </p>
                <p className="text-xs text-teal-700 font-bold">
                  อีก {reminderStatus ? reminderStatus.daysUntilRace : "..."} วัน
                </p>
              </div>

              {/* Recommended Date Metric */}
              <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-400" /> ส่งเตือนล่วงหน้า 3 วัน
                </span>
                <p className="text-base sm:text-lg font-black text-orange-500">
                  21 ม.ค. 2570
                </p>
                <p className="text-xs text-orange-400 font-bold">
                  {reminderStatus?.isThreeDaysBefore ? "🔥 ถึงกำหนดส่งแล้ว" : "🗓️ ตั้งเวลาล่วงหน้า"}
                </p>
              </div>

              {/* Approved Count */}
              <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-400" /> นักวิ่งอนุมัติแล้ว
                </span>
                <p className="text-xl sm:text-2xl font-black text-slate-900">
                  {reminderStatus?.totalApproved ?? registrations.filter(r => r.status === "approved").length}
                </p>
                <p className="text-xs text-slate-600 font-light">
                  ผู้มีสิทธิ์รับแจ้งเตือน
                </p>
              </div>

              {/* Sent Count */}
              <div className="p-4 sm:p-5 bg-white  border border-emerald-500/20 bg-emerald-500/5 rounded-2xl shadow-sm space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-600  flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> ส่งแจ้งเตือนแล้ว
                </span>
                <p className="text-xl sm:text-2xl font-black text-emerald-600 ">
                  {reminderStatus?.reminderSentCount ?? registrations.filter(r => r.status === "approved" && r.reminderSentAt).length}
                </p>
                <p className="text-xs text-emerald-600/70  font-light">
                  ได้รับอีเมลแล้ว
                </p>
              </div>

              {/* Pending Count */}
              <div className="p-4 sm:p-5 bg-white  border border-amber-500/20 bg-amber-500/5 rounded-2xl shadow-sm space-y-1 col-span-2 sm:col-span-1">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-600  flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> รอส่งแจ้งเตือน
                </span>
                <p className="text-xl sm:text-2xl font-black text-amber-600 ">
                  {reminderStatus?.reminderPendingCount ?? registrations.filter(r => r.status === "approved" && !r.reminderSentAt).length}
                </p>
                <p className="text-xs text-amber-600/70  font-light">
                  รอกดส่ง Broadcast
                </p>
              </div>

            </div>

            {/* LIVE INTERACTIVE EMAIL PREVIEWER & SANDBOX */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                  <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-teal-400" /> ตัวอย่างอีเมลระบบแบบเสมือนจริง (Interactive Live Email Preview)
                  </h4>
                  <p className="text-xs text-slate-600 font-light mt-0.5">
                    เลือกแม่แบบอีเมล สลับมุมมอง Desktop / Mobile และทดสอบส่งอีเมลไปยังที่อยู่อีเมลของคุณ
                  </p>
                </div>

                {/* Viewport switch: Desktop vs Mobile */}
                <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl self-start lg:self-auto">
                  <button
                    type="button"
                    onClick={() => setEmailViewport("desktop")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      emailViewport === "desktop"
                        ? "bg-teal-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-white"
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" /> คอมพิวเตอร์ (Desktop)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailViewport("mobile")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      emailViewport === "mobile"
                        ? "bg-teal-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-white"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> มือถือ (Mobile)
                  </button>
                </div>
              </div>

              {/* Template Tabs & Selection Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                  { id: "reminder", label: "เตือนล่วงหน้า 3 วัน", icon: "⏰", desc: "วัน เวลา สถานที่ สิ่งของที่ต้องนำมา" },
                  { id: "approval", label: "อนุมัติบัตรเข้างาน & BIB", icon: "🎟️", desc: "Runner Pass & QR เช็คอิน" },
                  { id: "payment_received", label: "ได้รับสลิปแล้ว", icon: "💳", desc: "ยืนยันรับเงิน & รอตรวจ" },
                  { id: "registration", label: "ยืนยันการลงทะเบียน", icon: "📝", desc: "ข้อมูลบัญชี & QR โอน" },
                  { id: "shipping", label: "แจ้งเลขพัสดุ", icon: "🚚", desc: "Tracking ไปรษณีย์ไทย" },
                  { id: "rejection", label: "สลิปมีปัญหา", icon: "⚠️", desc: "แจ้งให้อัปโหลดใหม่" }
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      setSelectedEmailTemplate(tpl.id);
                      loadPreview(tpl.id, previewRunnerId);
                    }}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      selectedEmailTemplate === tpl.id
                        ? "border-teal-500 bg-teal-500/10 text-slate-900 shadow-md ring-2 ring-teal-500/20"
                        : "border-slate-200 hover:border-slate-300  bg-slate-50  text-slate-600 "
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <span>{tpl.icon}</span>
                      <span className="truncate">{tpl.label}</span>
                    </div>
                    <span className="text-xs text-slate-600 mt-1 line-clamp-1">{tpl.desc}</span>
                  </button>
                ))}
              </div>

              {/* Controls bar: Runner data source & Test email input */}
              <div className="p-4 bg-slate-50 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                
                {/* Select Runner Data */}
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-600 shrink-0">
                    ข้อมูลผู้สมัครในตัวอย่าง:
                  </span>
                  <select
                    value={previewRunnerId}
                    onChange={(e) => {
                      setPreviewRunnerId(e.target.value);
                      loadPreview(selectedEmailTemplate, e.target.value);
                    }}
                    className="flex-1 max-w-xs px-3 py-2 bg-white  border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="sample">ข้อมูลจำลอง (คุณธนภัทร • BIB: LSE-1024)</option>
                    {registrations.filter(r => r.status === "approved").map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.firstName} {r.lastName} (BIB: {r.bibNumber || r.id}) - {r.distance}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Send Test Email to specific inbox */}
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-600 shrink-0">
                    ทดสอบส่งจริง:
                  </span>
                  <input
                    type="email"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    placeholder="ระบุอีเมลผู้รับทดสอบ"
                    className="flex-1 max-w-xs px-3 py-2 bg-white  border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={handleSendTest}
                    disabled={sendingTestEmail}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
                  >
                    {sendingTestEmail ? (
                      <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> ส่ง...</>
                    ) : (
                      <><Send className="w-3.5 h-3.5" /> ส่งทดสอบ</>
                    )}
                  </button>
                </div>

              </div>

              {/* Subject Bar */}
              <div className="p-3.5 bg-slate-100  border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="font-bold text-slate-600 shrink-0 uppercase tracking-wider text-xs">หัวข้ออีเมล (Subject):</span>
                  <span className="font-bold text-slate-900 truncate">{emailPreviewSubject || "กำลังโหลด..."}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(emailPreviewSubject);
                    alert("คัดลอกหัวข้ออีเมลเรียบร้อยแล้ว");
                  }}
                  className="text-xs text-teal-700 font-bold hover:underline shrink-0"
                >
                  คัดลอกหัวข้อ
                </button>
              </div>

              {/* Live Render Container */}
              <div className="border border-slate-200 rounded-2xl bg-neutral-100  p-4 md:p-8 flex justify-center min-h-[500px] overflow-x-auto relative">
                {loadingPreview && (
                  <div className="absolute inset-0 bg-white/70  backdrop-blur-xs flex items-center justify-center z-10">
                    <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                      <RefreshCw className="w-5 h-5 animate-spin" /> กำลังประมวลผลตัวอย่างอีเมล...
                    </div>
                  </div>
                )}

                <div 
                  className={`transition-all duration-300 w-full ${
                    emailViewport === "mobile" 
                      ? "max-w-[390px] border-4 border-neutral-700 rounded-[32px] p-2 bg-white shadow-2xl" 
                      : "max-w-[650px] shadow-xl rounded-2xl overflow-hidden bg-white"
                  }`}
                >
                  {/* Email Client Header Mockup */}
                  <div className="bg-slate-50 border-b border-slate-200 p-3 text-xs text-slate-500 font-sans space-y-1">
                    <div className="flex justify-between items-center text-slate-600 text-xs">
                      <span>จาก: <strong>LSEd Running 2569</strong> &lt;noreply@lsed-running.web.app&gt;</span>
                      <span>{new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
                    </div>
                    <div className="truncate text-slate-800 font-bold">
                      ถึง: {previewRunnerId === "sample" ? "คุณธนภัทร รุ่งเรืองฉาย (runner.sample@example.com)" : registrations.find(r => r.id === previewRunnerId)?.email || "ผู้สมัคร"}
                    </div>
                  </div>

                  {/* Rendered HTML */}
                  <div 
                    className="overflow-y-auto max-h-[700px] p-2 sm:p-4 bg-white"
                    dangerouslySetInnerHTML={{ __html: emailPreviewHtml }}
                  />
                </div>
              </div>

            </div>

            {/* APPROVED RUNNERS 3-DAY REMINDER DISPATCH TABLE */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-400" /> รายชื่อนักวิ่งที่อนุมัติแล้ว & สถานะการส่งแจ้งเตือน 3 วัน
                  </h4>
                  <p className="text-xs text-slate-600 font-light mt-0.5">
                    ตรวจสอบสถานะการรับอีเมลเตือนล่วงหน้า 3 วันของนักวิ่งแต่ละท่าน หรือคลิกส่งเฉพาะบุคคล
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={emailSearch}
                    onChange={(e) => setEmailSearch(e.target.value)}
                    placeholder="ค้นหาชื่อ, BIB, อีเมล..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50  border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs min-w-[850px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-xs">
                      <th className="py-3.5 px-4 whitespace-nowrap">นักวิ่ง</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">หมายเลข BIB</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">ระยะ / ไซส์</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">วิธีรับอุปกรณ์</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">สถานะแจ้งเตือน 3 วัน</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap">ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                    {registrations
                      .filter(r => r.status === "approved")
                      .filter(r => {
                        if (!emailSearch) return true;
                        const q = emailSearch.toLowerCase();
                        return (
                          r.firstName.toLowerCase().includes(q) ||
                          r.lastName.toLowerCase().includes(q) ||
                          r.email.toLowerCase().includes(q) ||
                          (r.bibNumber && r.bibNumber.toLowerCase().includes(q)) ||
                          r.id.toLowerCase().includes(q)
                        );
                      })
                      .map((runner) => (
                        <tr key={runner.id} className="hover:bg-slate-50/50 transition">
                          
                          {/* Runner Info */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-bold text-slate-900">
                              {runner.firstName} {runner.lastName}
                            </div>
                            <div className="text-xs text-slate-600">
                              {runner.email} • {runner.phone}
                            </div>
                            <span className="text-xs text-slate-500">
                              REF: {runner.id}
                            </span>
                          </td>

                          {/* BIB */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center justify-center whitespace-nowrap font-black text-xs px-2.5 py-1 rounded-md bg-teal-100 border border-teal-300 text-teal-800 shadow-xs">
                              {runner.bibNumber || "-"}
                            </span>
                          </td>

                          {/* Distance & Size */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-bold text-slate-900">
                              {runner.distance === "VIP" ? "VIP 5K" : "Regular 5K"}
                            </div>
                            <div className="text-xs text-slate-600">
                              ไซส์: {runner.shirtSize}
                            </div>
                          </td>

                          {/* Delivery Method */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {runner.deliveryMethod === "shipping" ? (
                              <span className="inline-flex items-center justify-center whitespace-nowrap gap-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
                                <Truck className="w-3.5 h-3.5" /> ไปรษณีย์ ({runner.shippingTrackingNumber || "รอจัดส่ง"})
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center whitespace-nowrap gap-1 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">
                                <MapPin className="w-3.5 h-3.5" /> รับหน้างาน
                              </span>
                            )}
                          </td>

                          {/* Reminder Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {runner.reminderSentAt ? (
                              <span className="inline-flex items-center justify-center whitespace-nowrap gap-1 px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> ส่งแล้ว ({new Date(runner.reminderSentAt).toLocaleDateString('th-TH')})
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center whitespace-nowrap gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold">
                                <Clock className="w-3.5 h-3.5" /> ยังไม่ส่ง
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              
                              {/* Preview this runner's email */}
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewRunnerId(runner.id);
                                  setSelectedEmailTemplate("reminder");
                                  loadPreview("reminder", runner.id);
                                }}
                                className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition cursor-pointer"
                                title="เปิดดูตัวอย่างอีเมลเตือน 3 วันของท่านนี้"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Send direct reminder */}
                              <button
                                type="button"
                                onClick={() => handleSendDirectReminder(runner.id)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                  runner.reminderSentAt
                                    ? "bg-slate-100  hover:bg-orange-500/20 text-slate-700 hover:text-orange-400 border border-slate-200"
                                    : "bg-orange-500 hover:bg-orange-600 text-white shadow-xs"
                                }`}
                                title={runner.reminderSentAt ? "ส่งอีเมลเตือนล่วงหน้า 3 วันซ้ำอีกครั้ง" : "ส่งอีเมลแจ้งเตือนล่วงหน้า 3 วัน"}
                              >
                                <Mail className="w-3.5 h-3.5" />
                                <span>{runner.reminderSentAt ? "ส่งเตือนซ้ำ" : "ส่งเตือน 3 วัน"}</span>
                              </button>

                              {/* Resend E-BIB */}
                              <button
                                type="button"
                                onClick={() => handleResendTicket(runner.id)}
                                className="p-1.5 rounded-lg bg-teal-600/10 hover:bg-teal-600/20 text-teal-700 border border-teal-500/20 transition cursor-pointer"
                                title="ส่งบัตรเข้างาน E-BIB ซ้ำ"
                              >
                                <QrCode className="w-4 h-4" />
                              </button>

                            </div>
                          </td>

                        </tr>
                      ))}
                    {registrations.filter(r => r.status === "approved").length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-600">
                          ยังไม่มีนักวิ่งที่ผ่านการอนุมัติในระบบ
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>

            {/* RECENT EMAIL DELIVERY LOGS */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <History className="w-5 h-5 text-teal-400" /> ประวัติการส่งอีเมลจริงของระบบ (Recent Email Logs)
                  </h4>
                  <p className="text-xs text-slate-600 font-light mt-0.5">
                    บันทึกรายการอีเมลที่ระบบเพิ่งจัดส่งไป เพื่อความโปร่งใสและตรวจสอบได้
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadRecent}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
                  title="รีเฟรชประวัติ"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingRecentEmails ? "animate-spin" : ""}`} />
                </button>
              </div>

              {recentEmails.length > 0 ? (
                <div className="divide-y divide-slate-100  text-xs">
                  {recentEmails.slice(0, 8).map((log) => (
                    <div key={log.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          log.type === "reminder"
                            ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                            : log.type === "approval"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : log.type === "payment_received"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : "bg-slate-100  text-slate-700"
                        }`}>
                          {log.type === "reminder" ? "⏰ เตือน 3 วัน" : log.type === "approval" ? "🎟️ บัตร BIB" : log.type === "payment_received" ? "💳 รับสลิป" : log.type}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900 truncate max-w-md">
                            {log.subject}
                          </p>
                          <p className="text-xs text-slate-600">
                            ถึง: <strong>{log.recipientName || log.recipient}</strong> ({log.recipient})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto text-xs text-slate-600">
                        <span>{new Date(log.sentAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
                        {log.previewUrl && (
                          <a
                            href={log.previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-teal-700 hover:underline font-bold"
                          >
                            <ExternalLink className="w-3 h-3" /> เปิดดูอีเมล
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-slate-600 text-xs">
                  ยังไม่มีประวัติการส่งอีเมลในเซสชันนี้
                </p>
              )}
            </div>

          </div>
        ) : null}
      </section>


      {/* MODAL 1: SLIP LIGHTBOX & APPROVAL CONSOLE */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 bg-white/80 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in" id="slip-lightbox">
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 max-h-[90vh] text-slate-900">
            
            {/* Left Col: slip visual representation */}
            <div className="md:col-span-6 bg-slate-100 border-r border-slate-200 p-6 flex flex-col justify-between items-center relative min-h-[300px]">
              <p className="text-xs text-slate-600 font-bold uppercase tracking-widest absolute top-4 left-4">SLIP ATTACHMENT</p>
              
              <button 
                onClick={() => setSelectedReg(null)}
                className="md:hidden absolute top-4 right-4 bg-slate-100  hover:bg-white/20 text-slate-900 rounded-full p-1.5 transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-full flex-grow flex items-center justify-center py-6">
                {selectedReg.slipUrl?.startsWith("data:image/") ? (
                  <img 
                    src={selectedReg.slipUrl} 
                    alt="Runner Payment Slip" 
                    className="max-h-[380px] object-contain rounded-xl border border-slate-200 shadow-2xl"
                  />
                ) : (
                  /* Safe fallback representation if image not structured */
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-600 w-full max-w-xs space-y-3">
                    <AlertCircle className="w-10 h-10 text-teal-700 mx-auto" />
                    <p className="text-xs font-bold text-slate-900">พบหลักฐานแบบข้อความจำลอง</p>
                    <p className="text-xs opacity-80 leading-relaxed truncate">{selectedReg.slipUrl}</p>
                  </div>
                )}
              </div>

              <div className="w-full text-center border-t border-slate-200 pt-4">
                <p className="text-xs text-slate-600">SUBMITTED: {new Date(selectedReg.createdAt).toLocaleString("th-TH")}</p>
              </div>
            </div>

            {/* Right Col: verification details & decisions */}
            <div className="md:col-span-6 p-6 md:p-8 flex flex-col justify-between overflow-y-auto bg-slate-50">
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">{selectedReg.id}</span>
                    <h3 className="text-lg font-black text-slate-900 leading-tight mt-0.5 uppercase tracking-tight">{selectedReg.firstName} {selectedReg.lastName}</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedReg(null)}
                    className="hidden md:block bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 rounded-full p-1.5 transition cursor-pointer"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Runner data card summary */}
                <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2.5 text-slate-700 border border-slate-200">
                  <div className="flex justify-between">
                    <span>ระยะวิ่งที่สมัคร:</span>
                    <strong className="text-slate-900 font-bold">{selectedReg.distance} ({selectedReg.distance === "10K" ? "Mini" : selectedReg.distance === "5K" ? "Micro" : "Fun Run"})</strong>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span>ยอดโอนค่าสมัคร:</span>
                    <strong className="text-teal-700 font-black text-sm">{selectedReg.price} THB</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>เบอร์โทรศัพท์:</span>
                    <strong className="text-slate-900 font-semibold">{selectedReg.phone}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>อีเมลสมัคร:</span>
                    <strong className="text-slate-900 font-semibold">{selectedReg.email}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>เพศ / อายุ / ขนาดเสื้อ:</span>
                    <strong className="text-slate-900 font-semibold">{selectedReg.gender === "male" ? "ชาย" : "หญิง"} / {selectedReg.age} ปี / ไซส์ {selectedReg.shirtSize}</strong>
                  </div>
                </div>

                {/* AI SLIP CHECKER CONSOLE */}
                <div className="bg-teal-950/20 border border-teal-500/20 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-teal-700 flex items-center gap-1.5">
                      ✨ ระบบ AI ตรวจสลิปอัตโนมัติ
                    </span>
                    <button
                      type="button"
                      disabled={analyzingSlipId !== null}
                      onClick={() => handleAnalyzeSlip(selectedReg.id)}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-600/40 text-white font-black text-xs uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {analyzingSlipId === selectedReg.id ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-slate-900" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          กำลังตรวจ...
                        </>
                      ) : (
                        "ตรวจสอบด้วย AI"
                      )}
                    </button>
                  </div>

                  {aiAnalysisResult ? (
                    <div className="space-y-2.5 animate-fade-in text-xs border-t border-teal-500/10 pt-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-100 bg-slate-50 p-2 border border-slate-200 rounded-xl">
                          <span className="text-slate-700 block text-xs uppercase font-bold">ความแท้ของสลิป</span>
                          <span className={`font-black text-xs ${aiAnalysisResult.isValidSlip ? 'text-green-400' : 'text-red-400'}`}>
                            {aiAnalysisResult.isValidSlip ? "✅ สลิปธนาคารของจริง" : "❌ สลิปไม่สมบูรณ์ / ไม่ใช่สลิป"}
                          </span>
                        </div>
                        <div className="bg-slate-100 bg-slate-50 p-2 border border-slate-200 rounded-xl">
                          <span className="text-slate-700 block text-xs uppercase font-bold">ยอดโอนบนสลิป</span>
                          <span className={`font-black text-xs ${aiAnalysisResult.isAmountCorrect ? 'text-green-400' : 'text-yellow-400'}`}>
                            {aiAnalysisResult.amount} บาท {aiAnalysisResult.isAmountCorrect ? "(ครบถ้วน)" : `(ไม่ตรงกับ ${selectedReg.price})`}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-100 bg-slate-50 p-2.5 border border-slate-200 rounded-xl space-y-1.5">
                        <span className="text-slate-700 block text-xs uppercase font-bold">รายละเอียดสลิปที่ตรวจพบ</span>
                        <div className="flex justify-between text-slate-900/80">
                          <span>วัน-เวลาโอน:</span>
                          <span className="font-semibold">{aiAnalysisResult.date} {aiAnalysisResult.time}</span>
                        </div>
                        <div className="flex justify-between text-slate-900/80">
                          <span>ชื่อบัญชีผู้โอน:</span>
                          <span className="font-semibold text-right truncate max-w-[150px]">{aiAnalysisResult.senderName || "ไม่ระบุ"}</span>
                        </div>
                        <div className="flex justify-between text-slate-900/80">
                          <span>บัญชีผู้รับ:</span>
                          <span className="font-semibold text-right truncate max-w-[150px]">{aiAnalysisResult.receiverName || "ไม่ระบุ"}</span>
                        </div>
                      </div>

                      <div className={`p-2.5 rounded-xl text-xs font-bold leading-relaxed ${aiAnalysisResult.isAmountCorrect && aiAnalysisResult.isValidSlip ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        🤖 AI สรุปผล: {aiAnalysisResult.message}
                      </div>

                      {aiAnalysisResult.isAmountCorrect && aiAnalysisResult.isValidSlip && selectedReg.status !== "approved" && (
                        <button
                          type="button"
                          onClick={() => {
                            handleApprove(selectedReg.id);
                          }}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-emerald-600/20"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> อนุมัติสิทธิ์ทันทีตามคำแนะนำของ AI
                        </button>
                      )}
                    </div>
                  ) : aiAnalysisError ? (
                    <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold">
                      ❌ {aiAnalysisError}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 leading-relaxed font-light">
                      ยังไม่ได้ทำการตรวจสอบสลิปนี้ด้วย AI คุณสามารถคลิกปุ่มด้านบนเพื่อใช้ AI ตรวจสอบความถูกต้องของสลิป วันที่โอน ยอดเงินที่โอน และชื่อบัญชีได้ทันที
                    </p>
                  )}
                </div>

                {/* REJECT INPUT SUB-FORM */}
                {isRejecting ? (
                  <form onSubmit={handleRejectSubmit} className="space-y-3.5 animate-fade-in border-t border-slate-200 pt-4">
                    <label className="text-xs font-bold text-red-400 block">ระบุเหตุผลในการไม่ผ่านสลิป:</label>
                    <input 
                      type="text"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="เช่น ยอดโอนไม่ครบตามจำนวนจริง, ส่งภาพผิด..."
                      required
                      className="w-full px-3 py-2 border border-slate-200 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition bg-white text-slate-900"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsRejecting(false)}
                        className="px-3.5 py-2 bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-lg transition"
                      >
                        ยืนยันปฏิเสธสลิป
                      </button>
                    </div>
                  </form>
                ) : (
                  selectedReg.status !== "approved" && (
                    <div className="flex flex-col gap-2 border-t border-slate-200 pt-5">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">ตรวจสอบความถูกต้องสลิปโอนเงิน:</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setIsRejecting(true)}
                          className="py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" /> สลิปไม่ถูกต้อง / ปฏิเสธ
                        </button>
                        
                        <button
                          onClick={() => handleApprove(selectedReg.id)}
                          className="py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/20 transition cursor-pointer"
                        >
                          <CheckCircle className="w-4 h-4" /> อนุมัติสิทธิ์ & ออกบิ๊บวิ่ง
                        </button>
                      </div>
                    </div>
                  )
                )}

                {selectedReg.status === "approved" && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-2.5 text-xs text-green-400 font-bold border-t">
                    <Check className="w-4 h-4 text-green-400" /> ยืนยันสิทธิ์เรียบร้อยแล้ว (บิ๊บ: {selectedReg.bibNumber})
                  </div>
                )}
              </div>

              {/* Lookup helper */}
              <div className="pt-4 mt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-600">
                <button
                  onClick={() => { onSearchLookup(selectedReg.id); setSelectedReg(null); }}
                  className="hover:text-teal-700 font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  ค้นหาในหน้าแรก <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <span className="">REF: {selectedReg.id}</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: EDIT RUNNER DETAILS PANEL */}
      {editingReg && (
        <div className="fixed inset-0 z-50 bg-white/80 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in" id="edit-runner-modal">
          <form onSubmit={handleEditSave} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full p-6 md:p-8 space-y-6 text-slate-900">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">แก้ไขข้อมูลผู้เข้าร่วมงานวิ่ง</h3>
                <p className="text-xs text-slate-600">EDIT RUNNER: {editingReg.id}</p>
              </div>
              <button 
                type="button"
                onClick={() => setEditingReg(null)}
                className="bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-full p-1 transition cursor-pointer border border-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block text-xs uppercase tracking-wider">ชื่อจริง</label>
                <input 
                  type="text"
                  value={editingReg.firstName}
                  onChange={(e) => setEditingReg({ ...editingReg, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block text-xs uppercase tracking-wider">นามสกุล</label>
                <input 
                  type="text"
                  value={editingReg.lastName}
                  onChange={(e) => setEditingReg({ ...editingReg, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block text-xs uppercase tracking-wider">เบอร์มือถือ</label>
                <input 
                  type="text"
                  value={editingReg.phone}
                  onChange={(e) => setEditingReg({ ...editingReg, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block text-xs uppercase tracking-wider">อีเมล</label>
                <input 
                  type="email"
                  value={editingReg.email}
                  onChange={(e) => setEditingReg({ ...editingReg, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block text-xs uppercase tracking-wider">ระยะวิ่ง</label>
                <select
                  value={editingReg.distance}
                  onChange={(e) => setEditingReg({ ...editingReg, distance: e.target.value as DistanceType })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                >
                  <option value="5K">Standard 5KM</option>
                  <option value="vip">VIP 5KM</option>
                  <option value="vip_duo">VIP Duo 5KM</option>
                  <option value="vip_trio">VIP Trio 5KM</option>
                  <option value="donation">ร่วมบริจาคสนับสนุน</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block text-xs uppercase tracking-wider">ขนาดเสื้อยืด</label>
                <select
                  value={editingReg.shirtSize}
                  onChange={(e) => setEditingReg({ ...editingReg, shirtSize: e.target.value as ShirtSizeType })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                >
                  <option value="XS">XS (รอบอก 34\")</option>
                  <option value="S">S (รอบอก 36\")</option>
                  <option value="M">M (รอบอก 38\")</option>
                  <option value="L">L (รอบอก 40\")</option>
                  <option value="XL">XL (รอบอก 42\")</option>
                  <option value="XXL">XXL (รอบอก 44\")</option>
                  <option value="3XL">3XL (รอบอก 46\")</option>
                  <option value="4XL">4XL (รอบอก 48\")</option>
                  <option value="5XL">5XL (รอบอก 50\")</option>
                  <option value="6XL">6XL (รอบอก 52\")</option>
                  <option value="7XL">7XL (รอบอก 54\")</option>
                </select>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="font-bold text-slate-600 block text-xs uppercase tracking-wider">หมายเลขบิ๊บวิ่ง (BIB Number)</label>
                <input 
                  type="text"
                  value={editingReg.bibNumber || ""}
                  onChange={(e) => setEditingReg({ ...editingReg, bibNumber: e.target.value || undefined })}
                  placeholder="ระบบจะสุ่มเมื่อกดอนุมัติ หรือกรอกเพื่อแต่งบิ๊บแบบแมนนวล"
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="font-bold text-slate-600 block text-xs uppercase tracking-wider">สิทธิ์ลดหย่อนภาษี</label>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={editingReg.taxDeduction || false}
                    onChange={(e) => setEditingReg({ ...editingReg, taxDeduction: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-700 focus:ring-teal-500 border-slate-200 bg-white"
                  />
                  <span className="text-slate-900 text-xs">ขอใช้สิทธิ์ลดหย่อนภาษี 2 เท่า (e-Donation)</span>
                </label>
              </div>

              <div className="col-span-2 sm:col-span-1 space-y-1">
                <label className="font-bold text-slate-600 block text-xs uppercase tracking-wider">ช่องทางการรับเสื้อ</label>
                <select
                  value={editingReg.deliveryMethod || "pickup"}
                  onChange={(e) => setEditingReg({ ...editingReg, deliveryMethod: e.target.value as "pickup" | "shipping" })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                >
                  <option value="pickup">รับหน้างานเอง</option>
                  <option value="shipping">จัดส่งไปรษณีย์ (+60 บาท)</option>
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1 space-y-1">
                <label className="font-bold text-slate-600 block text-xs uppercase tracking-wider">เลขพัสดุ (Tracking Number)</label>
                <input
                  type="text"
                  value={editingReg.shippingTrackingNumber || ""}
                  onChange={(e) => setEditingReg({ ...editingReg, shippingTrackingNumber: e.target.value })}
                  placeholder="เช่น TH123456789TH"
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                />
              </div>

              {editingReg.deliveryMethod === "shipping" && (
                <div className="col-span-2 space-y-1">
                  <label className="font-bold text-slate-600 block text-xs uppercase tracking-wider">ที่อยู่จัดส่ง</label>
                  <textarea
                    value={editingReg.shippingAddress || ""}
                    onChange={(e) => setEditingReg({ ...editingReg, shippingAddress: e.target.value })}
                    placeholder="ระบุบ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingReg(null)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-black text-xs rounded-xl transition cursor-pointer shadow-md shadow-teal-500/20"
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: SHIPPED NOTIFICATION SIMULATOR MOCKUP (SMARTPHONE VIEWER) */}
      {simulationData && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl max-w-4xl w-full text-slate-900 grid grid-cols-1 lg:grid-cols-12 max-h-[90vh]">
            
            {/* Left Column: Information Panel (5 cols) */}
            <div className="lg:col-span-5 p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-indigo-500/20">
                  ⚡ จำลองการแจ้งเตือนพัสดุเรียบร้อย!
                </span>
                <h3 className="text-xl font-black text-slate-900 leading-tight">
                  ระบบแจ้งเลขพัสดุสำหรับ คุณ {simulationData.recipientName}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-light">
                  ระบบได้เตรียมและจัดส่งข้อความจำลองไปยังผู้สมัครสำเร็จ เพื่ออำนวยความสะดวกในการใช้งานจริงใน Sandbox คุณสามารถคลิกแถบต่าง ๆ บนโทรศัพท์ด้านข้างเพื่อตรวจเช็คหน้าตาการแจ้งเตือนจริงของลูกค้าได้ทันที
                </p>
                
                <div className="space-y-2 pt-2 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <p className="text-slate-700 font-bold text-xs uppercase tracking-wider">Recipient Name (ผู้รับ)</p>
                    <p className="text-slate-900 font-semibold">{simulationData.recipientName}</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <p className="text-slate-700 font-bold text-xs uppercase tracking-wider">Email (อีเมลผู้รับ)</p>
                    <p className="text-slate-900 break-all">{simulationData.email}</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 space-y-2.5">
                {simulationData.emailPreviewUrl && (
                  <a 
                    href={simulationData.emailPreviewUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-slate-900 font-black text-xs uppercase tracking-widest rounded-xl transition text-center cursor-pointer shadow-lg shadow-teal-600/20"
                  >
                    เปิดดูอีเมลฉบับเต็ม ↗
                  </a>
                )}
                <button 
                  onClick={() => setSimulationData(null)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl border border-slate-200 transition cursor-pointer"
                >
                  ปิดหน้าต่างจำลอง
                </button>
              </div>
            </div>

            {/* Right Column: Smartphone Mockup Container (7 cols) */}
            <div className="lg:col-span-7 bg-white  p-6 md:p-8 flex flex-col items-center justify-center relative overflow-y-auto">
              <div className="w-full max-w-sm space-y-4">
                <div className="flex justify-center gap-1.5 p-1 bg-slate-50 rounded-2xl border border-slate-200">
                  {["sms", "line"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveNotifyTab(tab as "sms" | "line")}
                      className={`flex-1 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer ${
                        activeNotifyTab === tab
                          ? "bg-white text-black shadow-md"
                          : "text-slate-600 hover:text-slate-900 "
                      }`}
                    >
                      {tab === "sms" ? "💬 SMS Preview" : "🟢 LINE Official"}
                    </button>
                  ))}
                </div>

                {/* Smartphone Device Frame */}
                <div className="border-[6px] border-neutral-800 rounded-[38px] bg-black shadow-2xl relative overflow-hidden aspect-[9/18] w-full max-w-[280px] mx-auto flex flex-col min-h-[440px]">
                  {/* Speaker and Notch */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-neutral-800 rounded-full z-20 flex items-center justify-center">
                    <div className="w-10 h-1 bg-black rounded-full" />
                  </div>

                  {/* Device Content Area */}
                  <div className="flex-grow flex flex-col p-4 pt-10 font-sans text-xs bg-slate-100">
                    {activeNotifyTab === "sms" ? (
                      /* SMS PREVIEW DISPLAY */
                      <div className="space-y-4 flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-slate-600 text-xs pb-3 border-b border-slate-200 mb-3">
                            <span>LSEd-RUNNING</span>
                            <span>ตอนนี้</span>
                          </div>
                          
                          <div className="bg-white border border-slate-200 p-3.5 rounded-2xl rounded-tl-none space-y-2 shadow-md max-w-[90%] text-slate-800">
                            <p className="text-slate-900 text-xs leading-relaxed whitespace-pre-wrap">
                              {simulationData.smsText}
                            </p>
                          </div>
                        </div>
                        <div className="text-center pb-2">
                          <span className="text-xs text-slate-900/25">จำลองรูปแบบการแจ้งเตือนผ่าน SMS ข้อความสั้น</span>
                        </div>
                      </div>
                    ) : (
                      /* LINE OA PREVIEW DISPLAY */
                      <div className="space-y-4 flex-grow flex flex-col justify-between">
                        <div>
                          {/* LINE Header */}
                          <div className="flex items-center gap-2 bg-[#06c755] text-white p-2.5 rounded-xl mb-3 shadow-sm">
                            <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center font-black text-xs text-slate-900">
                              LS
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">LSEd Running 2569</p>
                              <p className="text-xs text-green-400 flex items-center gap-0.5 font-bold">● LINE Official Account</p>
                            </div>
                          </div>

                          {/* LINE Rich Bubble */}
                          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl rounded-tl-none space-y-3 shadow-sm max-w-[95%] text-slate-800">
                            <div className="border-b border-indigo-500/10 pb-2 flex justify-between items-center">
                              <span className="text-xs bg-indigo-500/20 text-indigo-300 font-black px-1.5 py-0.5 rounded uppercase tracking-wider">พัสดุถูกจัดส่งแล้ว</span>
                              <span className="text-xs text-slate-600">10:30</span>
                            </div>
                            <p className="text-slate-800 text-xs leading-relaxed whitespace-pre-wrap font-light">
                              {simulationData.lineText}
                            </p>
                            <div className="bg-slate-100 bg-slate-50 rounded-xl p-2.5 border border-slate-200 flex items-center justify-between gap-1">
                              <div className="space-y-0.5">
                                <p className="text-xs text-slate-600">เลขพัสดุของคุณ</p>
                                <p className="text-xs font-bold text-orange-400 tracking-wider">
                                  {simulationData.smsText.split("เลขพัสดุ ")[1]?.split(" ")[0] || "ตรวจสอบในระบบ"}
                                </p>
                              </div>
                              <span className="text-xs bg-orange-500/10 text-orange-400 font-extrabold px-2 py-1 rounded-lg">คัดลอก</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-center pb-2">
                          <span className="text-xs text-slate-900/25">จำลองรูปแบบการแจ้งเตือนผ่านบัญชีทางการ LINE OA</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 4: 3-DAY REMINDER BROADCAST CONFIRMATION MODAL */}
      {batchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl max-w-xl w-full text-slate-900 p-6 md:p-8 space-y-6">
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-500 shrink-0">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-orange-500">
                  Broadcast Reminder System
                </span>
                <h3 className="text-xl font-black text-slate-900 leading-tight">
                  ยืนยันส่งอีเมลแจ้งเตือนล่วงหน้า 3 วัน
                </h3>
              </div>
            </div>

            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-xs space-y-2 text-slate-700 ">
              <p className="font-bold text-orange-500 text-sm">
                🏃‍♂️ สู่วันวิ่งฉายแสง วันอาทิตย์ที่ 24 มกราคม 2570
              </p>
              <p className="text-xs leading-relaxed text-slate-700">
                ระบบจะสร้างและส่งอีเมลแจ้งเตือนพร้อมบัตรประจำตัวนักวิ่ง (E-BIB), QR Code สแกนเข้างาน, แผนที่และจุดจอดรถฟรี (ยิมเนเซียม 4, 5, 6), กำหนดการปล่อยตัว 05:00 น. และเช็คลิสต์สิ่งของที่ต้องนำมาในวันงาน ไปยังกล่องข้อความอีเมลของนักวิ่งทุกคนที่ได้รับการอนุมัติแล้ว
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={batchSkipSent}
                  onChange={(e) => setBatchSkipSent(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 border-slate-300 "
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">
                    ข้ามผู้ที่ได้รับอีเมลแจ้งเตือนไปแล้ว (แนะนำ)
                  </span>
                  <span className="text-xs text-slate-600">
                    ป้องกันการส่งอีเมลซ้ำซ้อนไปยังนักวิ่งที่เคยได้รับแจ้งเตือนแล้ว
                  </span>
                </div>
              </label>

              <div className="p-3 bg-slate-50 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-600">จำนวนผู้ที่จะได้รับอีเมลรอบนี้:</span>
                <span className="font-black text-sm text-orange-500">
                  {batchSkipSent 
                    ? registrations.filter(r => r.status === "approved" && !r.reminderSentAt).length 
                    : registrations.filter(r => r.status === "approved").length} ท่าน
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setBatchModalOpen(false)}
                disabled={sendingBatch}
                className="px-5 py-2.5 rounded-xl bg-slate-100  hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleBatchSendReminder}
                disabled={sendingBatch}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-orange-500/25 flex items-center gap-2 cursor-pointer"
              >
                {sendingBatch ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> กำลังส่งอีเมลแจ้งเตือน...</>
                ) : (
                  <><Send className="w-4 h-4" /> ยืนยันส่งอีเมลแจ้งเตือนทันที</>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FLOATING TOAST: LAST SENT EMAIL PREVIEW */}
      {lastEmailPreview && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 border border-teal-500/40 rounded-2xl p-4 text-white shadow-2xl animate-fade-in space-y-2">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-wider border border-teal-500/30">
              <CheckCircle2 className="w-3 h-3 text-teal-400" /> ส่งอีเมลสำเร็จ
            </span>
            <button
              type="button"
              onClick={() => setLastEmailPreview(null)}
              className="text-slate-400 hover:text-white text-xs p-1"
            >
              ✕
            </button>
          </div>
          <p className="text-xs font-bold text-white">
            ส่งไปยัง: {lastEmailPreview.runnerName || lastEmailPreview.recipient}
          </p>
          <p className="text-xs text-slate-600 truncate">
            {lastEmailPreview.recipient}
          </p>
          {lastEmailPreview.url && (
            <a
              href={lastEmailPreview.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-bold underline pt-1"
            >
              <ExternalLink className="w-3.5 h-3.5" /> เปิดดูหน้าตาอีเมลจริงที่เพิ่งส่งไป ↗
            </a>
          )}
        </div>
      )}

      </div>
    </div>
  );
}
