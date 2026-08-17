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
  QrCode
, Image, Save, CheckCircle2, ShieldCheck, LogOut, Package, CreditCard } from "lucide-react";
import { Registration, EventStats, DistanceType, ShirtSizeType, RegistrationStatus } from "../types.js";
import { generatePromptPayPayload } from "../lib/promptpay.js";

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

  // Sub tab: runners vs shipping vs payment
  const [subTab, setSubTab] = useState<"runners" | "shipping" | "payment" | "assets">("runners");
  const [filterShippingStatus, setFilterShippingStatus] = useState<string>("all");

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
      const response = await fetch("/api/payment/settings");
      if (response.ok) {
        const data = await response.json();
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
      }
    } catch (err) {
      console.error("Error fetching payment settings:", err);
    }
  };

  // Load registrations
  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const url = `/api/registrations?search=${encodeURIComponent(filterSearch)}&distance=${filterDistance}&status=${filterStatus}`;
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
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
      }
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
      const response = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      
      if (!response.ok) {
        alert(data.error || "ไม่สามารถอนุมัติได้");
        return;
      }

      if (data.emailPreviewUrl) {
        setLastEmailPreview({
          type: "approve",
          url: data.emailPreviewUrl,
          recipient: data.email,
          runnerName: `${data.firstName} ${data.lastName}`
        });
      }

      // Close modal if open
      setSelectedReg(null);
      
      // Refresh local list and metrics
      fetchRegistrations();
      onRefresh();
    } catch (err) {
      console.error("Approve error:", err);
    }
  };

  // Quick Action: Reject Runner with Reason
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReg || !rejectionReason.trim()) return;

    try {
      const response = await fetch("/api/admin/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedReg.id, reason: rejectionReason.trim() }),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "ไม่สามารถส่งคำปฏิเสธได้");
        return;
      }

      if (data.emailPreviewUrl) {
        setLastEmailPreview({
          type: "reject",
          url: data.emailPreviewUrl,
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
    } catch (err) {
      console.error("Reject error:", err);
    }
  };

  // Quick Action: Save Inline Edits
  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReg) return;

    try {
      const response = await fetch("/api/admin/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingReg),
      });
      
      if (response.ok) {
        setEditingReg(null);
        fetchRegistrations();
        onRefresh();
      } else {
        const errData = await response.json();
        alert(errData.error || "ไม่สามารถแก้ไขข้อมูลได้");
      }
    } catch (err) {
      console.error("Edit error:", err);
    }
  };

  // Quick Action: Delete registration
  const handleDelete = async (id: string) => {
    if (!confirm("คุณต้องการลบผู้สมัครรายนี้ออกจากระบบถาวรใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้")) return;

    try {
      const response = await fetch("/api/admin/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      
      if (response.ok) {
        fetchRegistrations();
        onRefresh();
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleCopyAddress = (id: string, address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
      return <span className="bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">เช็คอินแล้ว</span>;
    }
    const status = reg.status;
    switch (status) {
      case "approved": 
        return <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">อนุมัติแล้ว</span>;
      case "pending_verification": 
        return <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full animate-pulse">ยืนยันสลิป</span>;
      case "pending_payment": 
        return <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">รอชำระเงิน</span>;
      case "rejected": 
        return <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">ไม่ผ่าน</span>;
    }
  };

  const getDistanceBadge = (dist: DistanceType) => {
    switch (dist) {
      case "5K": return <span className="bg-blue-600/20 text-blue-400 font-extrabold text-xs px-2.5 py-0.5 rounded-md border border-blue-500/30">Standard 5K</span>;
      case "vip": return <span className="bg-yellow-500/20 text-yellow-400 font-extrabold text-xs px-2.5 py-0.5 rounded-md border border-yellow-500/30">VIP 5K</span>;
      case "vip_duo": return <span className="bg-amber-500/20 text-amber-400 font-extrabold text-xs px-2.5 py-0.5 rounded-md border border-amber-500/30">VIP Duo 5K</span>;
      case "vip_trio": return <span className="bg-orange-500/20 text-orange-400 font-extrabold text-xs px-2.5 py-0.5 rounded-md border border-orange-500/30">VIP Trio 5K</span>;
      case "donation": return <span className="bg-purple-600/20 text-purple-400 font-extrabold text-xs px-2.5 py-0.5 rounded-md border border-purple-500/30">บริจาค</span>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto bg-white/90 dark:bg-neutral-950/90 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 md:p-8 space-y-6 text-center animate-fade-in text-slate-900 dark:text-slate-900 dark:text-white" id="admin-login-card">
        <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-900 dark:text-white">พื้นที่หลังบ้าน (Admin Console)</h2>
          <p className="text-xs text-slate-400 dark:text-slate-900 dark:text-white/50 leading-relaxed font-light">
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
              className="w-full px-4 py-3 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl text-center text-sm font-semibold tracking-wider placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
              id="admin-password-input"
            />
          </div>

          {authError && (
            <p className="text-xs text-red-400 font-bold flex items-center gap-1.5 justify-center">
              <AlertCircle className="w-3.5 h-3.5" /> {authError}
            </p>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition cursor-pointer shadow-lg shadow-blue-500/20"
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
    <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 p-4 md:p-8 font-sans flex flex-col">
      <div className="max-w-[1400px] w-full mx-auto bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col flex-1 h-full min-h-[calc(100vh-4rem)]">
        
        {/* HEADER */}
        <div className="bg-slate-900 dark:bg-black px-6 md:px-10 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">Admin Console</h1>
              <p className="text-[10px] md:text-xs text-blue-200 font-medium uppercase tracking-widest mt-1 opacity-80">LSEd Running 2569 Management</p>
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <button
              onClick={() => setIsAuthenticated(false)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>

        {/* TOP TAB NAVIGATION */}
        <div className="flex flex-col md:flex-row border-b border-slate-200 dark:border-white/5 bg-slate-950 dark:bg-neutral-900 overflow-x-auto shrink-0 hide-scrollbar">
          <button
            type="button"
            onClick={() => setSubTab("runners")}
            className={`flex-1 md:flex-initial px-6 py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition ${
              subTab === "runners"
                ? "border-blue-500 text-blue-400 bg-white/[0.02]"
                : "border-transparent text-slate-400 dark:text-white/50 hover:text-white/80 hover:bg-white/[0.01]"
            }`}
          >
            <Users className="w-4 h-4" /> จัดการนักวิ่ง
          </button>
          <button
            type="button"
            onClick={() => setSubTab("shipping")}
            className={`flex-1 md:flex-initial px-6 py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition ${
              subTab === "shipping"
                ? "border-purple-500 text-purple-400 bg-white/[0.02]"
                : "border-transparent text-slate-400 dark:text-white/50 hover:text-white/80 hover:bg-white/[0.01]"
            }`}
          >
            <Package className="w-4 h-4" /> แพ็คของ/จัดส่ง
          </button>
          <button
            type="button"
            onClick={() => setSubTab("payment")}
            className={`flex-1 md:flex-initial px-6 py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition ${
              subTab === "payment"
                ? "border-emerald-500 text-emerald-400 bg-white/[0.02]"
                : "border-transparent text-slate-400 dark:text-white/50 hover:text-white/80 hover:bg-white/[0.01]"
            }`}
          >
            <CreditCard className="w-4 h-4" /> บัญชีรับเงิน
          </button>
          <button
            type="button"
            onClick={() => setSubTab("assets")}
            className={`flex-1 md:flex-initial px-6 py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition ${
              subTab === "assets"
                ? "border-amber-500 text-amber-400 bg-white/[0.02]"
                : "border-transparent text-slate-400 dark:text-white/50 hover:text-white/80 hover:bg-white/[0.01]"
            }`}
          >
            <Image className="w-4 h-4" /> ภาพประกอบ
          </button>
        </div>

        {/* MAIN CONTENT AREA */}
        <section className="flex-1 bg-white dark:bg-black relative overflow-hidden flex flex-col h-full">
        {subTab === "runners" ? (
          <>
            {/* Table Filter Options */}
            <div className="p-5 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="font-bold text-slate-900 dark:text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-blue-500" /> บัญชีรายชื่อผู้สมัครวิ่งและร่วมบริจาคทั้งหมด
                </h3>

                {/* Quick Export Button */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={registrations.length === 0}
                  className="px-4 py-2 bg-green-600/20 border border-green-500/30 hover:bg-green-600/30 text-green-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileSpreadsheet className="w-4 h-4" /> ส่งออกไฟล์รายชื่อนักวิ่ง (CSV / Excel)
                </button>
              </div>

              {/* Interactive filter widgets */}
              <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-5 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-900 dark:text-white/40" />
                  <input 
                    type="text" 
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    placeholder="ค้นหาตามชื่อ, รหัสสมัคร, BIB, เบอร์โทร..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={filterDistance}
                    onChange={(e) => setFilterDistance(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121214] border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-slate-900 dark:text-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition text-slate-900 dark:text-slate-900 dark:text-white"
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
                    className="w-full px-3 py-2 bg-[#121214] border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-slate-900 dark:text-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition text-slate-900 dark:text-slate-900 dark:text-white"
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
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl transition cursor-pointer"
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
                  <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-xs text-slate-400 dark:text-slate-900 dark:text-white/40 font-bold">กำลังดึงข้อมูลรายชื่อจากหลังบ้าน...</p>
                </div>
              ) : registrations.length === 0 ? (
                <div className="p-16 text-center space-y-3 text-slate-400 dark:text-slate-900 dark:text-white/40">
                  <AlertCircle className="w-10 h-10 text-slate-900 dark:text-slate-900 dark:text-white/20 mx-auto" />
                  <p className="text-sm font-semibold">ไม่พบข้อมูลรายชื่อนักวิ่งในระบบ</p>
                  <p className="text-xs font-light">ทดลองคลิกปุ่ม **"จำลองผู้สมัครวิ่ง"** ด้านบน เพื่อสุ่มตัวอย่างนักวิ่งจำลองมาทดลองเล่น</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm text-slate-900 dark:text-slate-900 dark:text-white/80">
                  <thead className="bg-slate-100 dark:bg-black/40 text-[10px] text-slate-400 dark:text-white/40 uppercase tracking-widest font-bold border-b border-slate-200 dark:border-white/5">
                    <tr>
                      <th scope="col" className="px-5 py-4">ผู้สมัคร / รหัสอ้างอิง</th>
                      <th scope="col" className="px-5 py-4">ระยะวิ่ง</th>
                      <th scope="col" className="px-5 py-4">ขนาดเสื้อ</th>
                      <th scope="col" className="px-5 py-4">เบอร์โทรศัพท์</th>
                      <th scope="col" className="px-5 py-4 text-center">การจัดส่ง</th>
                      <th scope="col" className="px-5 py-4 text-center">สถานะ</th>
                      <th scope="col" className="px-5 py-4 text-center">หมายเลข BIB</th>
                      <th scope="col" className="px-5 py-4 text-right">ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {registrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-slate-50 dark:bg-white/5 transition">
                        
                        {/* User Profile Info */}
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-900 dark:text-white text-sm">{reg.firstName} {reg.lastName}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-900 dark:text-white/40 font-bold font-mono tracking-wider mt-0.5">{reg.id}</p>
                          </div>
                        </td>

                        {/* Distance Category */}
                        <td className="px-5 py-4">
                          {getDistanceBadge(reg.distance)}
                        </td>

                        {/* Sizing */}
                        <td className="px-5 py-4">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-slate-900 dark:text-white">{reg.shirtSize}</span>
                        </td>

                        {/* Phone Number */}
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs text-slate-500 dark:text-slate-900 dark:text-white/60 font-medium">{reg.phone}</span>
                        </td>

                        {/* Delivery Method */}
                        <td className="px-5 py-4 text-center">
                          {reg.deliveryMethod === "shipping" ? (
                            <span className="text-[10px] font-black tracking-wide text-orange-400 bg-orange-500/10 px-2 py-1 rounded-md border border-orange-500/20 inline-flex items-center gap-1">
                              <Truck className="w-3 h-3" /> ไปรษณีย์
                            </span>
                          ) : (
                            <span className="text-[10px] font-black tracking-wide text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20">
                              รับเองหน้างาน
                            </span>
                          )}
                        </td>

                        {/* Payment status badge */}
                        <td className="px-5 py-4 text-center">
                          {getStatusLabel(reg)}
                        </td>

                        {/* Assigned BIB number badge */}
                        <td className="px-5 py-4 text-center">
                          {reg.bibNumber ? (
                            <span className="bg-white text-black font-mono font-black text-xs px-2.5 py-1 rounded-md tracking-tight border border-white/20">
                              {reg.bibNumber}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-900 dark:text-slate-900 dark:text-white/20 font-semibold">-</span>
                          )}
                        </td>

                        {/* Actions dropdown/buttons */}
                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex gap-1.5">
                            
                            {/* View Slip Trigger */}
                            {reg.slipUrl && (
                              <button
                                type="button"
                                onClick={() => { setSelectedReg(reg); setIsRejecting(false); }}
                                className="p-1.5 bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 text-blue-400 rounded-lg transition cursor-pointer"
                                title="ตรวจสอบรูปสลิป / อนุมัติสิทธิ์วิ่ง"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}

                            {/* Direct edit trigger */}
                            <button
                              type="button"
                              onClick={() => setEditingReg({ ...reg })}
                              className="p-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-900 dark:text-white/70 rounded-lg transition cursor-pointer"
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
            <div className="p-5 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <Truck className="w-5 h-5 text-orange-500" /> จัดการเลขพัสดุสำหรับผู้สมัครทางไปรษณีย์
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-900 dark:text-white/50 mt-0.5">ค้นหาที่อยู่จัดส่งเสื้อ บันทึกเลข tracking เพื่อให้ผู้สมัครตรวจสอบจากหน้าหลักได้ทันที</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Shipping Status filters */}
                  <div className="flex gap-1.5 bg-slate-50 dark:bg-neutral-900 p-1.5 border border-slate-200 dark:border-white/5 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFilterShippingStatus("all")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${filterShippingStatus === 'all' ? 'bg-orange-600 text-white' : 'text-slate-500 dark:text-slate-900 dark:text-white/60 hover:text-slate-800 dark:text-slate-900 dark:text-white/90'}`}
                    >
                      ทั้งหมด ({registrations.filter(r => r.deliveryMethod === 'shipping').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterShippingStatus("pending")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${filterShippingStatus === 'pending' ? 'bg-amber-500 text-black' : 'text-slate-500 dark:text-slate-900 dark:text-white/60 hover:text-slate-800 dark:text-slate-900 dark:text-white/90'}`}
                    >
                      ยังไม่ใส่เลขพัสดุ ({registrations.filter(r => r.deliveryMethod === 'shipping' && !r.shippingTrackingNumber).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterShippingStatus("shipped")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${filterShippingStatus === 'shipped' ? 'bg-emerald-600 text-white' : 'text-slate-500 dark:text-slate-900 dark:text-white/60 hover:text-slate-800 dark:text-slate-900 dark:text-white/90'}`}
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
                <div className="p-16 text-center space-y-4 text-slate-400 dark:text-slate-900 dark:text-white/40 max-w-md mx-auto">
                  <Truck className="w-12 h-12 text-orange-500/30 mx-auto animate-pulse" />
                  <div className="space-y-1">
                    <p className="text-sm font-black text-slate-900 dark:text-slate-900 dark:text-white">ไม่มีผู้สมัครคนใดเลือกจัดส่งทางไปรษณีย์</p>
                    <p className="text-xs text-slate-400 dark:text-slate-900 dark:text-white/40 leading-relaxed font-light">ยังไม่มีผู้ลงทะเบียนที่เลือกช่องทางจัดส่งไปรษณีย์ไทยในระบบ คุณสามารถคลิกปุ่มด้านล่างเพื่อทำการสร้างข้อมูลตัวอย่างสำหรับการจัดส่งและจำลองที่อยู่ได้ทันที!</p>
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
                <div className="p-16 text-center space-y-2 text-slate-400 dark:text-slate-900 dark:text-white/40">
                  <AlertCircle className="w-8 h-8 text-slate-900 dark:text-slate-900 dark:text-white/10 mx-auto" />
                  <p className="text-xs font-semibold">ไม่พบผู้สมัครที่ตรงตามตัวกรองนี้</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm text-slate-900 dark:text-slate-900 dark:text-white/80">
                  <thead className="bg-slate-100 dark:bg-black/40 text-[10px] text-slate-400 dark:text-white/40 uppercase tracking-widest font-bold border-b border-slate-200 dark:border-white/5">
                    <tr>
                      <th scope="col" className="px-5 py-4">ผู้รับพัสดุ / รหัส BIB</th>
                      <th scope="col" className="px-5 py-4">แพ็กเกจ & เสื้อ</th>
                      <th scope="col" className="px-5 py-4">ที่อยู่สำหรับจัดส่งพัสดุ</th>
                      <th scope="col" className="px-5 py-4">สถานะเงิน</th>
                      <th scope="col" className="px-5 py-4">หมายเลขพัสดุ (Tracking Number)</th>
                      <th scope="col" className="px-5 py-4 text-right">บันทึก</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {registrations.filter(r => {
                      if (r.deliveryMethod !== "shipping") return false;
                      if (filterShippingStatus === "pending") return !r.shippingTrackingNumber;
                      if (filterShippingStatus === "shipped") return !!r.shippingTrackingNumber;
                      return true;
                    }).map((reg) => (
                      <tr key={reg.id} className="hover:bg-slate-50 dark:bg-white/5 transition">
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-900 dark:text-white text-sm">{reg.firstName} {reg.lastName}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-900 dark:text-white/40 font-bold font-mono tracking-wider mt-0.5">REF: {reg.id}</p>
                            {reg.bibNumber ? (
                              <span className="inline-block mt-1 bg-white text-black font-mono font-black text-[9px] px-2 py-0.5 rounded tracking-tight">
                                BIB: {reg.bibNumber}
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-400 font-semibold mt-1 block">⚠️ รออนุมัติเงินเพื่อออก BIB</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="space-y-0.5">
                            {getDistanceBadge(reg.distance)}
                            <div className="text-xs text-slate-500 dark:text-slate-900 dark:text-white/60">เสื้อไซส์: <span className="font-extrabold text-slate-900 dark:text-slate-900 dark:text-white">{reg.shirtSize}</span></div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-2 max-w-xs">
                            <span className="text-xs break-words text-slate-600 dark:text-slate-900 dark:text-white/70 block bg-black/25 p-2 rounded-lg border border-slate-200 dark:border-white/5 flex-grow font-light leading-relaxed">
                              {reg.shippingAddress || "ไม่ได้ระบุที่อยู่จัดส่ง"}
                            </span>
                            {reg.shippingAddress && (
                              <button
                                type="button"
                                onClick={() => handleCopyAddress(reg.id, reg.shippingAddress || "")}
                                className={`p-1.5 rounded-lg transition text-[10px] font-black uppercase tracking-wider flex-shrink-0 border cursor-pointer ${
                                  copiedId === reg.id 
                                    ? "bg-green-500/20 text-green-400 border-green-500/30" 
                                    : "bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-900 dark:text-white/60 border-slate-200 dark:border-white/10"
                                }`}
                              >
                                {copiedId === reg.id ? "คัดลอกแล้ว" : "คัดลอก"}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {getStatusLabel(reg)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1.5 w-48">
                            <div className="text-[10px] font-black text-orange-400 bg-orange-500/10 border border-orange-500/25 px-2.5 py-1.5 rounded-xl w-full flex items-center gap-1.5">
                              <Truck className="w-3.5 h-3.5 animate-pulse" /> ไปรษณีย์ไทย (EMS) เท่านั้น
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
                              className="px-3 py-2 bg-black/50 border border-slate-200 dark:border-white/10 focus:border-orange-500 focus:outline-none rounded-xl text-xs text-slate-900 dark:text-white font-mono tracking-wide transition"
                            />
                            {reg.shippedAt && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-900 dark:text-white/40 block font-mono">
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
                                <svg className="animate-spin h-3.5 w-3.5 text-slate-900 dark:text-slate-900 dark:text-white" fill="none" viewBox="0 0 24 24">
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
                                className="w-full px-2 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-slate-900 dark:text-slate-900 dark:text-white font-black text-[10px] rounded-xl transition cursor-pointer flex items-center justify-center gap-1 uppercase tracking-wider"
                              >
                                {simulatingNotificationId === reg.id ? (
                                  <svg className="animate-spin h-3 w-3 text-slate-900 dark:text-slate-900 dark:text-white" fill="none" viewBox="0 0 24 24">
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
          <div className="p-8 space-y-8 animate-fade-in text-slate-900 dark:text-slate-900 dark:text-white max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-white/5 pb-5">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-900 dark:text-white flex items-center gap-2">
                  <Coins className="w-6 h-6 text-emerald-400" /> ตั้งค่าระบบบัญชีรับเงินโอน (Payment Configuration)
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-900 dark:text-white/40 mt-1">
                  ตั้งค่าบัญชีโอนเงินสำหรับผู้ลงทะเบียน ปัจจุบันระบบใช้บัญชีเดียวในการรับเงินร่วมกันทั้งหมด
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePaymentSettings} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
                {/* ACCOUNT 1: REGULAR */}
                <div className="bg-white/[0.02] border border-slate-200 dark:border-white/5 p-6 rounded-3xl space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-400 px-4 py-1 rounded-bl-2xl text-[10px] font-black uppercase tracking-wider">
                    บัญชีหลัก
                  </div>
                  <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest border-b border-slate-200 dark:border-white/5 pb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> 1. บัญชีรับเงินทั่วไป (Regular Account)
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-900 dark:text-white/40 block">ธนาคารรับเงิน (Bank Name)</label>
                      <input 
                        type="text"
                        value={regBankName}
                        onChange={(e) => setRegBankName(e.target.value)}
                        placeholder="เช่น ทหารไทยธนชาต (ttb)"
                        required
                        className="w-full px-4 py-2.5 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white placeholder-white/20 focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-900 dark:text-white/40 block">เลขที่บัญชี / หมายเลขโทรศัพท์พร้อมเพย์ (Account No / PromptPay ID)</label>
                      <input 
                        type="text"
                        value={regAccountNo}
                        onChange={(e) => setRegAccountNo(e.target.value)}
                        placeholder="เช่น 083-013-1768"
                        required
                        className="w-full px-4 py-2.5 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono text-slate-900 dark:text-white placeholder-white/20 focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-900 dark:text-white/40 block">ชื่อบัญชีรับเงิน (Account Name)</label>
                      <input 
                        type="text"
                        value={regAccountName}
                        onChange={(e) => setRegAccountName(e.target.value)}
                        placeholder="เช่น นาย นภัสกร กลิ่นเฟื่อง"
                        required
                        className="w-full px-4 py-2.5 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white placeholder-white/20 focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-900 dark:text-white/40 block">อัปโหลดภาพ QR Code สแกนจ่าย (QR Code Upload)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                        <div className="sm:col-span-8">
                          <label className="border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-emerald-500 bg-slate-50 dark:bg-white/5 hover:bg-emerald-500/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[110px] relative overflow-hidden group">
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handleQrUpload(e, "regular")}
                              className="sr-only"
                            />
                            <div className="space-y-1 flex flex-col items-center">
                              <span className="text-[11px] font-black text-emerald-400">คลิกเพื่อเลือกไฟล์รูปคิวอาร์โค้ด</span>
                              <span className="text-[9px] text-slate-300 dark:text-slate-900 dark:text-white/30">แนะนำขนาดสี่เหลี่ยมจัตุรัสไม่เกิน 1.2MB</span>
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
                            <div className="w-24 h-24 rounded-xl border border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-[9px] text-slate-300 dark:text-slate-900 dark:text-white/30 p-2 text-center bg-black/10">
                              <QrCode className="w-6 h-6 text-slate-900 dark:text-slate-900 dark:text-white/20 mb-1" />
                              <span>(ระบบจะสร้าง QR จำลองให้จากเลขบัญชี)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>


              </div>
              <div className="bg-white/[0.01] border border-slate-200 dark:border-white/5 p-6 rounded-3xl space-y-4">
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
                      <svg className="animate-spin h-4 w-4 text-slate-900 dark:text-slate-900 dark:text-white" fill="none" viewBox="0 0 24 24">
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-white/5 pb-6">
              <div>
                <h3 className="text-xl font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                  <Image className="w-5 h-5" /> อัปโหลดภาพของที่ระลึก
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-900 dark:text-white/50 mt-1.5">
                  อัปโหลดภาพเสื้อและเหรียญที่ระลึกเพื่อให้ผู้สมัครเห็นภาพของจริงในหน้าฟอร์ม
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveAssetsSettings} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* SHIRT ASSET */}
                <div className="bg-white/[0.02] border border-slate-200 dark:border-white/5 p-6 rounded-3xl space-y-6 relative overflow-hidden">
                  <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest border-b border-slate-200 dark:border-white/5 pb-2">
                    เสื้อที่ระลึก (Shirt)
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-900 dark:text-white/40 block">
                      อัปโหลดภาพเสื้อคอกลม (Crew Neck Shirt)
                    </label>
                    <label className="border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-amber-500 bg-slate-50 dark:bg-white/5 hover:bg-amber-500/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[200px] relative overflow-hidden group">
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
                        <div className="space-y-2 flex flex-col items-center justify-center h-full text-slate-300 dark:text-slate-900 dark:text-white/30">
                          <Image className="w-8 h-8 text-slate-900 dark:text-slate-900 dark:text-white/20 mb-2" />
                          <span className="text-[12px] font-black text-amber-400">คลิกเพื่อเลือกไฟล์เสื้อคอกลม</span>
                          <span className="text-[10px]">รองรับ JPG, PNG ไม่เกิน 2MB</span>
                        </div>
                      )}
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-900 dark:text-white/40 block">
                      อัปโหลดภาพเสื้อโปโล (Polo Shirt)
                    </label>
                    <label className="border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-amber-500 bg-slate-50 dark:bg-white/5 hover:bg-amber-500/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[200px] relative overflow-hidden group">
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
                        <div className="space-y-2 flex flex-col items-center justify-center h-full text-slate-300 dark:text-slate-900 dark:text-white/30">
                          <Image className="w-8 h-8 text-slate-900 dark:text-slate-900 dark:text-white/20 mb-2" />
                          <span className="text-[12px] font-black text-amber-400">คลิกเพื่อเลือกไฟล์เสื้อโปโล</span>
                          <span className="text-[10px]">รองรับ JPG, PNG ไม่เกิน 2MB</span>
                        </div>
                      )}
                    </label>
                  </div>
                  </div>
                </div>

                {/* MEDAL ASSET */}
                <div className="bg-white/[0.02] border border-slate-200 dark:border-white/5 p-6 rounded-3xl space-y-6 relative overflow-hidden">
                  <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest border-b border-slate-200 dark:border-white/5 pb-2">
                    เหรียญที่ระลึก (Medal)
                  </h4>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-white/40 block">
                      อัปโหลดภาพเหรียญ (Medal Image Upload)
                    </label>
                    <label className="border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-amber-500 bg-slate-50 dark:bg-white/5 hover:bg-amber-500/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[200px] relative overflow-hidden group">
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
                        <div className="space-y-2 flex flex-col items-center justify-center h-full text-slate-300 dark:text-white/30">
                          <Image className="w-8 h-8 text-white/20 mb-2" />
                          <span className="text-[12px] font-black text-amber-400">คลิกเพื่อเลือกไฟล์รูปเหรียญ</span>
                          <span className="text-[10px]">รองรับ JPG, PNG ไม่เกิน 2MB</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* SOUVENIR ASSET */}
                <div className="bg-white/[0.02] border border-slate-200 dark:border-white/5 p-6 rounded-3xl space-y-6 relative overflow-hidden">
                  <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest border-b border-slate-200 dark:border-white/5 pb-2">
                    ของที่ระลึก (Souvenir)
                  </h4>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-white/40 block">
                      อัปโหลดภาพของที่ระลึก (Souvenir Image Upload)
                    </label>
                    <label className="border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-amber-500 bg-slate-50 dark:bg-white/5 hover:bg-amber-500/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[200px] relative overflow-hidden group">
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
                        <div className="space-y-2 flex flex-col items-center justify-center h-full text-slate-300 dark:text-white/30">
                          <Image className="w-8 h-8 text-white/20 mb-2" />
                          <span className="text-[12px] font-black text-amber-400">คลิกเพื่อเลือกไฟล์ของที่ระลึก</span>
                          <span className="text-[10px]">รองรับ JPG, PNG ไม่เกิน 2MB</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* ROUTE MAP ASSET */}
                <div className="bg-white/[0.02] border border-slate-200 dark:border-white/5 p-6 rounded-3xl space-y-6 relative overflow-hidden">
                  <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest border-b border-slate-200 dark:border-white/5 pb-2">
                    แผนที่เส้นทางวิ่ง (Route Map)
                  </h4>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-900 dark:text-white/40 block">
                      อัปโหลดภาพแผนที่ (Route Map Image Upload)
                    </label>
                    <label className="border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-amber-500 bg-slate-50 dark:bg-white/5 hover:bg-amber-500/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[200px] relative overflow-hidden group">
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
                        <div className="space-y-2 flex flex-col items-center justify-center h-full text-slate-300 dark:text-slate-900 dark:text-white/30">
                          <Image className="w-8 h-8 text-slate-900 dark:text-slate-900 dark:text-white/20 mb-2" />
                          <span className="text-[12px] font-black text-amber-400">คลิกเพื่อเลือกไฟล์รูปแผนที่เส้นทางวิ่ง</span>
                          <span className="text-[10px]">รองรับ JPG, PNG ไม่เกิน 2MB</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* LOGO ASSET */}
                <div className="bg-white/[0.02] border border-slate-200 dark:border-white/5 p-6 rounded-3xl space-y-6 relative overflow-hidden">
                  <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest border-b border-slate-200 dark:border-white/5 pb-2">
                    โลโก้งานวิ่ง (Logo)
                  </h4>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-900 dark:text-white/40 block">
                      อัปโหลดโลโก้ (Logo Image Upload)
                    </label>
                    <label className="border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-amber-500 bg-slate-50 dark:bg-white/5 hover:bg-amber-500/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[200px] relative overflow-hidden group">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleAssetUpload(e, "logo")}
                        className="sr-only"
                      />
                      {logoImage ? (
                        <div className="relative group w-full h-auto min-h-[100px] bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-center">
                          <img src={logoImage} alt="Logo Preview" className="w-auto h-24 object-contain" />
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
                        <div className="space-y-2 flex flex-col items-center justify-center h-full text-slate-300 dark:text-slate-900 dark:text-white/30">
                          <Image className="w-8 h-8 text-slate-900 dark:text-slate-900 dark:text-white/20 mb-2" />
                          <span className="text-[12px] font-black text-amber-400">คลิกเพื่อเลือกไฟล์รูปโลโก้</span>
                          <span className="text-[10px]">รองรับ JPG, PNG ไม่เกิน 2MB</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

              </div>

              {/* ACTION ROW */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-white/5">
                <div className="text-xs">
                  {assetsError && <p className="text-red-400 flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5"/> {assetsError}</p>}
                  {assetsSuccess && <p className="text-emerald-400 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5"/> บันทึกข้อมูลรูปภาพของที่ระลึกสำเร็จ!</p>}
                </div>
                <button
                  type="submit"
                  disabled={savingAssets}
                  className="w-full sm:w-auto px-10 py-3.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-900 dark:text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest rounded-xl transition shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
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
        ) : null}
      </section>


      {/* MODAL 1: SLIP LIGHTBOX & APPROVAL CONSOLE */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in" id="slip-lightbox">
          <div className="bg-white dark:bg-neutral-950 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 max-h-[90vh] text-slate-900 dark:text-slate-900 dark:text-white">
            
            {/* Left Col: slip visual representation */}
            <div className="md:col-span-6 bg-black p-6 flex flex-col justify-between items-center relative min-h-[300px]">
              <p className="text-[10px] text-slate-400 dark:text-slate-900 dark:text-white/40 font-bold uppercase tracking-widest absolute top-4 left-4 font-mono">SLIP ATTACHMENT</p>
              
              <button 
                onClick={() => setSelectedReg(null)}
                className="md:hidden absolute top-4 right-4 bg-slate-100 dark:bg-white/10 hover:bg-white/20 text-slate-900 dark:text-slate-900 dark:text-white rounded-full p-1.5 transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-full flex-grow flex items-center justify-center py-6">
                {selectedReg.slipUrl?.startsWith("data:image/") ? (
                  <img 
                    src={selectedReg.slipUrl} 
                    alt="Runner Payment Slip" 
                    className="max-h-[380px] object-contain rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl"
                  />
                ) : (
                  /* Safe fallback representation if image not structured */
                  <div className="bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 text-center text-slate-400 dark:text-slate-900 dark:text-white/40 w-full max-w-xs space-y-3">
                    <AlertCircle className="w-10 h-10 text-blue-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-900 dark:text-white">พบหลักฐานแบบข้อความจำลอง</p>
                    <p className="text-[10px] opacity-80 leading-relaxed font-mono truncate">{selectedReg.slipUrl}</p>
                  </div>
                )}
              </div>

              <div className="w-full text-center border-t border-slate-200 dark:border-white/5 pt-4">
                <p className="text-[10px] text-slate-400 dark:text-slate-900 dark:text-white/40 font-mono">SUBMITTED: {new Date(selectedReg.createdAt).toLocaleString("th-TH")}</p>
              </div>
            </div>

            {/* Right Col: verification details & decisions */}
            <div className="md:col-span-6 p-6 md:p-8 flex flex-col justify-between overflow-y-auto bg-slate-50 dark:bg-neutral-900">
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-900 dark:text-white/40 font-bold uppercase tracking-wider font-mono">{selectedReg.id}</span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-900 dark:text-white leading-tight mt-0.5 uppercase tracking-tight">{selectedReg.firstName} {selectedReg.lastName}</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedReg(null)}
                    className="hidden md:block bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white rounded-full p-1.5 transition cursor-pointer"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Runner data card summary */}
                <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 text-xs space-y-2.5 text-slate-600 dark:text-slate-900 dark:text-white/70 border border-slate-200 dark:border-white/5">
                  <div className="flex justify-between">
                    <span>ระยะวิ่งที่สมัคร:</span>
                    <strong className="text-slate-900 dark:text-slate-900 dark:text-white font-bold">{selectedReg.distance} ({selectedReg.distance === "10K" ? "Mini" : selectedReg.distance === "5K" ? "Micro" : "Fun Run"})</strong>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span>ยอดโอนค่าสมัคร:</span>
                    <strong className="text-blue-400 font-black text-sm">{selectedReg.price} THB</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>เบอร์โทรศัพท์:</span>
                    <strong className="text-slate-900 dark:text-slate-900 dark:text-white font-mono font-semibold">{selectedReg.phone}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>อีเมลสมัคร:</span>
                    <strong className="text-slate-900 dark:text-slate-900 dark:text-white font-semibold">{selectedReg.email}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>เพศ / อายุ / ขนาดเสื้อ:</span>
                    <strong className="text-slate-900 dark:text-slate-900 dark:text-white font-semibold">{selectedReg.gender === "male" ? "ชาย" : "หญิง"} / {selectedReg.age} ปี / ไซส์ {selectedReg.shirtSize}</strong>
                  </div>
                </div>

                {/* AI SLIP CHECKER CONSOLE */}
                <div className="bg-blue-950/20 border border-blue-500/20 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-blue-400 flex items-center gap-1.5">
                      ✨ ระบบ AI ตรวจสลิปอัตโนมัติ
                    </span>
                    <button
                      type="button"
                      disabled={analyzingSlipId !== null}
                      onClick={() => handleAnalyzeSlip(selectedReg.id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/40 text-white font-black text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {analyzingSlipId === selectedReg.id ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-slate-900 dark:text-slate-900 dark:text-white" fill="none" viewBox="0 0 24 24">
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
                    <div className="space-y-2.5 animate-fade-in text-[11px] border-t border-blue-500/10 pt-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-100 dark:bg-black/30 p-2 border border-slate-200 dark:border-white/5 rounded-xl">
                          <span className="text-slate-400 dark:text-slate-900 dark:text-white/40 block text-[9px] uppercase font-black">ความแท้ของสลิป</span>
                          <span className={`font-black text-xs ${aiAnalysisResult.isValidSlip ? 'text-green-400' : 'text-red-400'}`}>
                            {aiAnalysisResult.isValidSlip ? "✅ สลิปธนาคารของจริง" : "❌ สลิปไม่สมบูรณ์ / ไม่ใช่สลิป"}
                          </span>
                        </div>
                        <div className="bg-slate-100 dark:bg-black/30 p-2 border border-slate-200 dark:border-white/5 rounded-xl">
                          <span className="text-slate-400 dark:text-slate-900 dark:text-white/40 block text-[9px] uppercase font-black">ยอดโอนบนสลิป</span>
                          <span className={`font-black text-xs ${aiAnalysisResult.isAmountCorrect ? 'text-green-400' : 'text-yellow-400'}`}>
                            {aiAnalysisResult.amount} บาท {aiAnalysisResult.isAmountCorrect ? "(ครบถ้วน)" : `(ไม่ตรงกับ ${selectedReg.price})`}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-100 dark:bg-black/30 p-2.5 border border-slate-200 dark:border-white/5 rounded-xl space-y-1.5">
                        <span className="text-slate-400 dark:text-slate-900 dark:text-white/40 block text-[9px] uppercase font-black">รายละเอียดสลิปที่ตรวจพบ</span>
                        <div className="flex justify-between text-slate-900 dark:text-slate-900 dark:text-white/80">
                          <span>วัน-เวลาโอน:</span>
                          <span className="font-semibold font-mono">{aiAnalysisResult.date} {aiAnalysisResult.time}</span>
                        </div>
                        <div className="flex justify-between text-slate-900 dark:text-slate-900 dark:text-white/80">
                          <span>ชื่อบัญชีผู้โอน:</span>
                          <span className="font-semibold text-right truncate max-w-[150px]">{aiAnalysisResult.senderName || "ไม่ระบุ"}</span>
                        </div>
                        <div className="flex justify-between text-slate-900 dark:text-slate-900 dark:text-white/80">
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
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-emerald-600/20"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> อนุมัติสิทธิ์ทันทีตามคำแนะนำของ AI
                        </button>
                      )}
                    </div>
                  ) : aiAnalysisError ? (
                    <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[11px] font-semibold">
                      ❌ {aiAnalysisError}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 dark:text-slate-900 dark:text-white/40 leading-relaxed font-light">
                      ยังไม่ได้ทำการตรวจสอบสลิปนี้ด้วย AI คุณสามารถคลิกปุ่มด้านบนเพื่อใช้ AI ตรวจสอบความถูกต้องของสลิป วันที่โอน ยอดเงินที่โอน และชื่อบัญชีได้ทันที
                    </p>
                  )}
                </div>

                {/* REJECT INPUT SUB-FORM */}
                {isRejecting ? (
                  <form onSubmit={handleRejectSubmit} className="space-y-3.5 animate-fade-in border-t border-slate-200 dark:border-white/5 pt-4">
                    <label className="text-xs font-bold text-red-400 block">ระบุเหตุผลในการไม่ผ่านสลิป:</label>
                    <input 
                      type="text"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="เช่น ยอดโอนไม่ครบตามจำนวนจริง, ส่งภาพผิด..."
                      required
                      className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition bg-slate-100 dark:bg-black/40 text-slate-900 dark:text-white"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsRejecting(false)}
                        className="px-3.5 py-2 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-900 dark:text-white/70 font-semibold text-xs rounded-lg transition"
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
                    <div className="flex flex-col gap-2 border-t border-slate-200 dark:border-white/5 pt-5">
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-900 dark:text-white/50 uppercase tracking-wider">ตรวจสอบความถูกต้องสลิปโอนเงิน:</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setIsRejecting(true)}
                          className="py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" /> สลิปไม่ถูกต้อง / ปฏิเสธ
                        </button>
                        
                        <button
                          onClick={() => handleApprove(selectedReg.id)}
                          className="py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition cursor-pointer"
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
              <div className="pt-4 mt-6 border-t border-slate-200 dark:border-white/5 flex justify-between items-center text-xs text-slate-400 dark:text-slate-900 dark:text-white/40">
                <button
                  onClick={() => { onSearchLookup(selectedReg.id); setSelectedReg(null); }}
                  className="hover:text-blue-400 font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  ค้นหาในหน้าแรก <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono">REF: {selectedReg.id}</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: EDIT RUNNER DETAILS PANEL */}
      {editingReg && (
        <div className="fixed inset-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in" id="edit-runner-modal">
          <form onSubmit={handleEditSave} className="bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full p-6 md:p-8 space-y-6 text-slate-900 dark:text-white">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-900 dark:text-white">แก้ไขข้อมูลผู้เข้าร่วมงานวิ่ง</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-900 dark:text-white/40 font-mono">EDIT RUNNER: {editingReg.id}</p>
              </div>
              <button 
                type="button"
                onClick={() => setEditingReg(null)}
                className="bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-slate-900 dark:text-white rounded-full p-1 transition cursor-pointer border border-slate-200 dark:border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-400 dark:text-slate-900 dark:text-white/50 block text-[10px] uppercase tracking-wider">ชื่อจริง</label>
                <input 
                  type="text"
                  value={editingReg.firstName}
                  onChange={(e) => setEditingReg({ ...editingReg, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400 dark:text-slate-900 dark:text-white/50 block text-[10px] uppercase tracking-wider">นามสกุล</label>
                <input 
                  type="text"
                  value={editingReg.lastName}
                  onChange={(e) => setEditingReg({ ...editingReg, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400 dark:text-slate-900 dark:text-white/50 block text-[10px] uppercase tracking-wider">เบอร์มือถือ</label>
                <input 
                  type="text"
                  value={editingReg.phone}
                  onChange={(e) => setEditingReg({ ...editingReg, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400 dark:text-slate-900 dark:text-white/50 block text-[10px] uppercase tracking-wider">อีเมล</label>
                <input 
                  type="email"
                  value={editingReg.email}
                  onChange={(e) => setEditingReg({ ...editingReg, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400 dark:text-slate-900 dark:text-white/50 block text-[10px] uppercase tracking-wider">ระยะวิ่ง</label>
                <select
                  value={editingReg.distance}
                  onChange={(e) => setEditingReg({ ...editingReg, distance: e.target.value as DistanceType })}
                  className="w-full px-3 py-2 bg-[#121214] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                >
                  <option value="5K">Standard 5KM</option>
                  <option value="vip">VIP 5KM</option>
                  <option value="vip_duo">VIP Duo 5KM</option>
                  <option value="vip_trio">VIP Trio 5KM</option>
                  <option value="donation">ร่วมบริจาคสนับสนุน</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400 dark:text-slate-900 dark:text-white/50 block text-[10px] uppercase tracking-wider">ขนาดเสื้อยืด</label>
                <select
                  value={editingReg.shirtSize}
                  onChange={(e) => setEditingReg({ ...editingReg, shirtSize: e.target.value as ShirtSizeType })}
                  className="w-full px-3 py-2 bg-[#121214] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
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
                <label className="font-bold text-slate-400 dark:text-slate-900 dark:text-white/50 block text-[10px] uppercase tracking-wider">หมายเลขบิ๊บวิ่ง (BIB Number)</label>
                <input 
                  type="text"
                  value={editingReg.bibNumber || ""}
                  onChange={(e) => setEditingReg({ ...editingReg, bibNumber: e.target.value || undefined })}
                  placeholder="ระบบจะสุ่มเมื่อกดอนุมัติ หรือกรอกเพื่อแต่งบิ๊บแบบแมนนวล"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="font-bold text-slate-400 dark:text-slate-900 dark:text-white/50 block text-[10px] uppercase tracking-wider">สิทธิ์ลดหย่อนภาษี</label>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={editingReg.taxDeduction || false}
                    onChange={(e) => setEditingReg({ ...editingReg, taxDeduction: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-200 dark:border-white/10 bg-[#121214]"
                  />
                  <span className="text-slate-900 dark:text-slate-900 dark:text-white text-xs">ขอใช้สิทธิ์ลดหย่อนภาษี 2 เท่า (e-Donation)</span>
                </label>
              </div>

              <div className="col-span-2 sm:col-span-1 space-y-1">
                <label className="font-bold text-slate-400 dark:text-slate-900 dark:text-white/50 block text-[10px] uppercase tracking-wider">ช่องทางการรับเสื้อ</label>
                <select
                  value={editingReg.deliveryMethod || "pickup"}
                  onChange={(e) => setEditingReg({ ...editingReg, deliveryMethod: e.target.value as "pickup" | "shipping" })}
                  className="w-full px-3 py-2 bg-[#121214] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                >
                  <option value="pickup">รับหน้างานเอง</option>
                  <option value="shipping">จัดส่งไปรษณีย์ (+60 บาท)</option>
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1 space-y-1">
                <label className="font-bold text-slate-400 dark:text-slate-900 dark:text-white/50 block text-[10px] uppercase tracking-wider">เลขพัสดุ (Tracking Number)</label>
                <input
                  type="text"
                  value={editingReg.shippingTrackingNumber || ""}
                  onChange={(e) => setEditingReg({ ...editingReg, shippingTrackingNumber: e.target.value })}
                  placeholder="เช่น TH123456789TH"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                />
              </div>

              {editingReg.deliveryMethod === "shipping" && (
                <div className="col-span-2 space-y-1">
                  <label className="font-bold text-slate-400 dark:text-slate-900 dark:text-white/50 block text-[10px] uppercase tracking-wider">ที่อยู่จัดส่ง</label>
                  <textarea
                    value={editingReg.shippingAddress || ""}
                    onChange={(e) => setEditingReg({ ...editingReg, shippingAddress: e.target.value })}
                    placeholder="ระบุบ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-slate-200 dark:border-white/5">
              <button
                type="button"
                onClick={() => setEditingReg(null)}
                className="px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-900 dark:text-white/70 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl transition cursor-pointer shadow-md shadow-blue-500/20"
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
          <div className="bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl max-w-4xl w-full text-slate-900 dark:text-white grid grid-cols-1 lg:grid-cols-12 max-h-[90vh]">
            
            {/* Left Column: Information Panel (5 cols) */}
            <div className="lg:col-span-5 p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-neutral-900/50 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-indigo-500/20">
                  ⚡ จำลองการแจ้งเตือนพัสดุเรียบร้อย!
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-900 dark:text-white leading-tight">
                  ระบบแจ้งเลขพัสดุสำหรับ คุณ {simulationData.recipientName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-900 dark:text-white/60 leading-relaxed font-light">
                  ระบบได้เตรียมและจัดส่งข้อความจำลองไปยังผู้สมัครสำเร็จ เพื่ออำนวยความสะดวกในการใช้งานจริงใน Sandbox คุณสามารถคลิกแถบต่าง ๆ บนโทรศัพท์ด้านข้างเพื่อตรวจเช็คหน้าตาการแจ้งเตือนจริงของลูกค้าได้ทันที
                </p>
                
                <div className="space-y-2 pt-2 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl space-y-1">
                    <p className="text-slate-400 dark:text-slate-900 dark:text-white/40 font-bold font-mono text-[9px] uppercase tracking-wider">Recipient Name (ผู้รับ)</p>
                    <p className="text-slate-900 dark:text-slate-900 dark:text-white font-semibold">{simulationData.recipientName}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl space-y-1">
                    <p className="text-slate-400 dark:text-slate-900 dark:text-white/40 font-bold font-mono text-[9px] uppercase tracking-wider">Email (อีเมลผู้รับ)</p>
                    <p className="text-slate-900 dark:text-slate-900 dark:text-white font-mono break-all">{simulationData.email}</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 space-y-2.5">
                {simulationData.emailPreviewUrl && (
                  <a 
                    href={simulationData.emailPreviewUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest rounded-xl transition text-center cursor-pointer shadow-lg shadow-indigo-600/20"
                  >
                    เปิดดูอีเมลฉบับเต็ม ↗
                  </a>
                )}
                <button 
                  onClick={() => setSimulationData(null)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-slate-900 dark:text-white font-bold text-xs rounded-xl border border-slate-200 dark:border-white/10 transition cursor-pointer"
                >
                  ปิดหน้าต่างจำลอง
                </button>
              </div>
            </div>

            {/* Right Column: Smartphone Mockup Container (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-neutral-950 p-6 md:p-8 flex flex-col items-center justify-center relative overflow-y-auto">
              <div className="w-full max-w-sm space-y-4">
                <div className="flex justify-center gap-1.5 p-1 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
                  {["sms", "line"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveNotifyTab(tab as "sms" | "line")}
                      className={`flex-1 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition cursor-pointer ${
                        activeNotifyTab === tab
                          ? "bg-white text-black shadow-md"
                          : "text-slate-400 dark:text-slate-900 dark:text-white/50 hover:text-slate-900 dark:hover:text-slate-900 dark:text-white"
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
                  <div className="flex-grow flex flex-col p-4 pt-10 font-sans text-xs bg-[#111113]">
                    {activeNotifyTab === "sms" ? (
                      /* SMS PREVIEW DISPLAY */
                      <div className="space-y-4 flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-slate-400 dark:text-slate-900 dark:text-white/40 text-[9px] pb-3 border-b border-slate-200 dark:border-white/5 mb-3 font-mono">
                            <span>LSEd-RUNNING</span>
                            <span>ตอนนี้</span>
                          </div>
                          
                          <div className="bg-[#242426] border border-slate-200 dark:border-white/5 p-3 rounded-2xl rounded-tl-none space-y-2 shadow-lg max-w-[90%]">
                            <p className="text-slate-900 dark:text-slate-900 dark:text-white text-[11px] leading-relaxed whitespace-pre-wrap">
                              {simulationData.smsText}
                            </p>
                          </div>
                        </div>
                        <div className="text-center pb-2">
                          <span className="text-[9px] text-slate-900 dark:text-slate-900 dark:text-white/25">จำลองรูปแบบการแจ้งเตือนผ่าน SMS ข้อความสั้น</span>
                        </div>
                      </div>
                    ) : (
                      /* LINE OA PREVIEW DISPLAY */
                      <div className="space-y-4 flex-grow flex flex-col justify-between">
                        <div>
                          {/* LINE Header */}
                          <div className="flex items-center gap-2 bg-[#1b1b1d] border border-slate-200 dark:border-white/5 p-2 rounded-xl mb-3">
                            <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center font-black text-[9px] text-slate-900 dark:text-white">
                              LS
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-900 dark:text-slate-900 dark:text-white">LSEd Running 2569</p>
                              <p className="text-[8px] text-green-400 flex items-center gap-0.5 font-bold">● LINE Official Account</p>
                            </div>
                          </div>

                          {/* LINE Rich Bubble */}
                          <div className="bg-[#1c2c3c] border border-indigo-500/20 p-3 rounded-2xl rounded-tl-none space-y-3 shadow-lg max-w-[95%]">
                            <div className="border-b border-indigo-500/10 pb-2 flex justify-between items-center">
                              <span className="text-[8px] bg-indigo-500/20 text-indigo-300 font-black px-1.5 py-0.5 rounded uppercase tracking-wider">พัสดุถูกจัดส่งแล้ว</span>
                              <span className="text-[8px] text-slate-400 dark:text-slate-900 dark:text-white/40 font-mono">10:30</span>
                            </div>
                            <p className="text-slate-800 dark:text-slate-900 dark:text-white/90 text-[11px] leading-relaxed whitespace-pre-wrap font-light">
                              {simulationData.lineText}
                            </p>
                            <div className="bg-slate-100 dark:bg-black/30 rounded-xl p-2.5 border border-slate-200 dark:border-white/5 flex items-center justify-between gap-1">
                              <div className="space-y-0.5">
                                <p className="text-[8px] text-slate-400 dark:text-slate-900 dark:text-white/40">เลขพัสดุของคุณ</p>
                                <p className="text-[11px] font-mono font-bold text-orange-400 tracking-wider">
                                  {simulationData.smsText.split("เลขพัสดุ ")[1]?.split(" ")[0] || "ตรวจสอบในระบบ"}
                                </p>
                              </div>
                              <span className="text-[8px] bg-orange-500/10 text-orange-400 font-extrabold px-2 py-1 rounded-lg">คัดลอก</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-center pb-2">
                          <span className="text-[9px] text-slate-900 dark:text-slate-900 dark:text-white/25">จำลองรูปแบบการแจ้งเตือนผ่านบัญชีทางการ LINE OA</span>
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

      </div>
    </div>
  );
}
