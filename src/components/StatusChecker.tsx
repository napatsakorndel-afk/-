import React, { useState, useEffect } from "react";
import { 
  Search, 
  SearchCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  UploadCloud, 
  Download, 
  Printer, 
  CreditCard,
  QrCode,
  ShieldAlert,
  ArrowRight,
  Truck,
  Sparkles,
  Sparkle,
  Copy,
  Check,
  Gift,
  Users,
  Share2,
  ExternalLink,
  Mail
} from "lucide-react";
import { Registration, DistanceType, EventStats } from "../types.js";
import { generatePromptPayPayload } from "../lib/promptpay.js";
import { 
  fetchShippingList as apiFetchShippingList, 
  lookupRegistrations, 
  uploadPaymentSlip, 
  adminApproveRunner 
} from "../lib/dataService.js";

interface StatusCheckerProps {
  initialQuery?: string;
  onRefreshStats: () => void;
  initialTab?: "lookup" | "shipping";
  stats?: EventStats | null;
}

export default function StatusChecker({ initialQuery = "", onRefreshStats, initialTab = "lookup", stats }: StatusCheckerProps) {
  const [query, setQuery] = useState<string>(initialQuery);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  
  // Slip upload state
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  // Payment Timer state
  const [paymentExpired, setPaymentExpired] = useState<boolean>(false);
  const [paymentTimeLeft, setPaymentTimeLeft] = useState<{minutes: number, seconds: number} | null>(null);

  useEffect(() => {
    let interval: any;
    if (selectedReg && selectedReg.status === "pending_payment" && selectedReg.createdAt) {
      const checkExpiry = () => {
        const createdDate = new Date(selectedReg.createdAt).getTime();
        const now = new Date().getTime();
        const diffMs = (createdDate + 9 * 60 * 1000) - now;
        
        if (diffMs <= 0) {
          setPaymentExpired(true);
          setPaymentTimeLeft({ minutes: 0, seconds: 0 });
          clearInterval(interval);
        } else {
          setPaymentExpired(false);
          const totalSeconds = Math.floor(diffMs / 1000);
          setPaymentTimeLeft({
            minutes: Math.floor(totalSeconds / 60),
            seconds: totalSeconds % 60
          });
        }
      };
      
      checkExpiry();
      interval = setInterval(checkExpiry, 1000);
    } else {
      setPaymentTimeLeft(null);
      setPaymentExpired(false);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedReg]);

  // Sandbox state
  const [sandboxApproving, setSandboxApproving] = useState<boolean>(false);

  // Tab State & Shipping State
  const [activeTab, setActiveTab] = useState<"lookup" | "shipping">(initialTab);
  const [shippingList, setShippingList] = useState<any[]>([]);
  const [shippingSearchQuery, setShippingSearchQuery] = useState<string>("");
  const [shippingLoading, setShippingLoading] = useState<boolean>(false);

  // Referral Gamification state
  const [referrals, setReferrals] = useState<number>(0);

  // Card type toggle for E-BIB vs QR E-Ticket & download states
  const [cardType, setCardType] = useState<"bib" | "ticket">("bib");
  const [downloadingTicket, setDownloadingTicket] = useState<boolean>(false);
  const [logoImage, setLogoImage] = useState<string>("");

  // Auto switch card type to ticket when registration is approved
  useEffect(() => {
    if (selectedReg) {
      if (selectedReg.status === "approved") {
        setCardType("ticket");
      } else {
        setCardType("bib");
      }
    }
  }, [selectedReg]);

  // Sync referrals when selectedReg changes
  useEffect(() => {
    if (selectedReg) {
      const saved = localStorage.getItem(`referrals_${selectedReg.id}`);
      setReferrals(saved ? parseInt(saved, 10) : 0);
    }
  }, [selectedReg]);

  // Keep activeTab in sync with initialTab prop when it changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const fetchShippingList = async () => {
    setShippingLoading(true);
    try {
      const data = await apiFetchShippingList();
      setShippingList(data);
    } catch (err) {
      console.error("Error fetching shipping list", err);
    } finally {
      setShippingLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "shipping") {
      fetchShippingList();
    }
  }, [activeTab]);

  // Run search automatically if initialQuery exists
  useEffect(() => {
    if (initialQuery) {
      handleSearch(new Event("submit") as any);
    }
  }, [initialQuery]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSelectedReg(null);
    setUploadSuccess(false);
    setUploadError(null);

    try {
      const data = await lookupRegistrations(query.trim());
      setRegistrations(data);
      if (data.length > 0) {
        setSelectedReg(data[0]);
      }
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการตรวจสอบข้อมูล");
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSandboxApprove = async () => {
    if (!selectedReg) return;
    setSandboxApproving(true);
    setUploadError(null);
    try {
      const approvedReg = await adminApproveRunner(selectedReg.id);
      setSelectedReg(approvedReg);
      setRegistrations(prev => prev.map(r => r.id === approvedReg.id ? approvedReg : r));
      if (onRefreshStats) {
        onRefreshStats();
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "เกิดข้อผิดพลาดในการทดสอบอนุมัติ");
    } finally {
      setSandboxApproving(false);
    }
  };

  const handleDownloadTicket = async () => {
    if (!selectedReg) return;
    setDownloadingTicket(true);

    try {
      // Create a canvas element
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 920;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create canvas context");

      // Draw background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, "#09090b"); // Zinc 950
      grad.addColorStop(0.3, "#111827"); // Gray 900
      grad.addColorStop(1, "#030712"); // Gray 950
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw neon border accent
      ctx.strokeStyle = "rgba(249, 115, 22, 0.2)"; // Orange-500/20
      ctx.lineWidth = 16;
      ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

      // Ticket Cutout Punch Holes (Solid black circles on left/right edge)
      ctx.fillStyle = "#030712"; // Match external page bg
      ctx.beginPath();
      ctx.arc(0, canvas.height / 2 + 100, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(canvas.width, canvas.height / 2 + 100, 24, 0, Math.PI * 2);
      ctx.fill();

      // Header Text
      ctx.textAlign = "center";
      ctx.fillStyle = "#f97316"; // Orange 500
      ctx.font = "italic bold 36px sans-serif";
      ctx.fillText("LSEd RUNNING 2569", canvas.width / 2, 75);

      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "bold 13px monospace";
      ctx.fillText("LEARNING SCIENCES & EDUCATION, TU", canvas.width / 2, 105);

      // Inner divider
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, 130);
      ctx.lineTo(canvas.width - 40, 130);
      ctx.stroke();

      // Badge: EVENT ENTRANCE PASS
      ctx.fillStyle = "rgba(249, 115, 22, 0.1)";
      // Draw rounded rect for badge
      const badgeX = canvas.width / 2 - 140;
      const badgeY = 155;
      const badgeW = 280;
      const badgeH = 44;
      const r = 22;
      ctx.beginPath();
      ctx.moveTo(badgeX + r, badgeY);
      ctx.arcTo(badgeX + badgeW, badgeY, badgeX + badgeW, badgeY + badgeH, r);
      ctx.arcTo(badgeX + badgeW, badgeY + badgeH, badgeX, badgeY + badgeH, r);
      ctx.arcTo(badgeX, badgeY + badgeH, badgeX, badgeY, r);
      ctx.arcTo(badgeX, badgeY, badgeX + badgeW, badgeY, r);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#f97316"; // Orange 500
      ctx.font = "bold 15px sans-serif";
      ctx.fillText("EVENT ENTRANCE PASS", canvas.width / 2, 182);

      // Draw pure white QR code canvas panel
      const qrPanelX = canvas.width / 2 - 140;
      const qrPanelY = 225;
      const qrPanelW = 280;
      const qrPanelH = 280;
      const qrPanelR = 24;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(qrPanelX + qrPanelR, qrPanelY);
      ctx.arcTo(qrPanelX + qrPanelW, qrPanelY, qrPanelX + qrPanelW, qrPanelY + qrPanelH, qrPanelR);
      ctx.arcTo(qrPanelX + qrPanelW, qrPanelY + qrPanelH, qrPanelX, qrPanelY + qrPanelH, qrPanelR);
      ctx.arcTo(qrPanelX, qrPanelY + qrPanelH, qrPanelX, qrPanelY, qrPanelR);
      ctx.arcTo(qrPanelX, qrPanelY, qrPanelX + qrPanelW, qrPanelY, qrPanelR);
      ctx.closePath();
      ctx.fill();

      // Load QR Code Image
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(selectedReg.id)}`;
      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";
      qrImg.src = qrUrl;
      await new Promise((resolve) => {
        qrImg.onload = resolve;
        qrImg.onerror = resolve;
      });

      if (qrImg.complete && qrImg.naturalWidth > 0) {
        ctx.drawImage(qrImg, canvas.width / 2 - 110, 255, 220, 220);
      }

      // Registration ID underneath QR Code
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "bold 13px monospace";
      ctx.fillText("REGISTRATION ID", canvas.width / 2, 540);
      
      ctx.fillStyle = "#ffffff";
      ctx.font = "black 18px monospace";
      ctx.fillText(selectedReg.id, canvas.width / 2, 565);

      // Dash ticket tear line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(40, 605);
      ctx.lineTo(canvas.width - 40, 605);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // Info Labels and Values
      ctx.textAlign = "left";

      // Runner Name
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("RUNNER NAME", 55, 645);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText(`${selectedReg.firstName} ${selectedReg.lastName}`, 55, 680);

      // BIB Number & Category
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("BIB NUMBER", 55, 735);
      ctx.fillText("DISTANCE CATEGORY", 325, 735);

      ctx.fillStyle = "#f97316"; // Bright Orange
      ctx.font = "black 32px monospace";
      ctx.fillText(selectedReg.bibNumber || "WAIT_BIB", 55, 775);

      ctx.fillStyle = "#60a5fa"; // Sky Blue 400
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(getDistanceLabel(selectedReg.distance), 325, 770);

      // Shirt Size & Payment Status
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("SHIRT SIZE", 55, 825);
      ctx.fillText("VERIFICATION STATUS", 325, 825);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText(selectedReg.shirtSize || "-", 55, 860);

      ctx.fillStyle = "#10b981"; // Emerald Green
      ctx.font = "bold 18px sans-serif";
      ctx.fillText("PAID & APPROVED ✓", 325, 858);

      // Footer disclaimer / message
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.font = "11px sans-serif";
      ctx.fillText("Please present this ticket on your phone at check-in counter", canvas.width / 2, 900);

      // Trigger download
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `LSEd_Running_E_Ticket_${selectedReg.bibNumber || selectedReg.id}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error("Error drawing and downloading ticket card:", err);
      alert("ไม่สามารถสร้างรูปภาพได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setDownloadingTicket(false);
    }
  };

  // Convert uploaded file to base64
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedReg) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("ขนาดไฟล์สลิปต้องไม่เกิน 5MB");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async (event) => {
        // Compress image using Canvas
        const img = new window.Image();
        img.src = event.target?.result as string;
        
        await new Promise((resolve) => (img.onload = resolve));
        
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
        const base64Data = canvas.toDataURL("image/jpeg", 0.6);
        
        const updatedData = await uploadPaymentSlip(selectedReg.id, base64Data);

        setSelectedReg(updatedData);
        setUploadSuccess(true);
        onRefreshStats();

        // Update in list too
        setRegistrations(prev => 
          prev.map(r => r.id === updatedData.id ? updatedData : r)
        );
      };
      
      reader.onerror = () => {
        throw new Error("ล้มเหลวระหว่างเปิดอ่านไฟล์รูปภาพ");
      };

    } catch (err: any) {
      setUploadError(err.message || "ล้มเหลวในการส่งข้อมูลรูปภาพสลิป");
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status: Registration["status"]) => {
    switch (status) {
      case "pending_payment":
        return (
          <span className="inline-flex items-center justify-center whitespace-nowrap gap-1.5 bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
            <Clock className="w-3.5 h-3.5" /> รอชำระเงิน
          </span>
        );
      case "pending_verification":
        return (
          <span className="inline-flex items-center justify-center whitespace-nowrap gap-1.5 bg-teal-100 border border-teal-300 text-teal-800 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs animate-pulse">
            <Clock className="w-3.5 h-3.5 animate-spin" /> ตรวจสอบสลิป
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center justify-center whitespace-nowrap gap-1.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5" /> ชำระเงินสำเร็จ
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center justify-center whitespace-nowrap gap-1.5 bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
            <XCircle className="w-3.5 h-3.5" /> สลิปไม่ถูกต้อง
          </span>
        );
    }
  };

  const getDistanceColor = (dist: DistanceType) => {
    switch (dist) {
      case "REGULAR":
      case "5K": return "bg-teal-600/20 border-teal-500 text-teal-700";
      case "vip": return "bg-yellow-500/20 border-yellow-500 text-yellow-400";
      case "vip_duo": return "bg-amber-500/20 border-amber-500 text-amber-400";
      case "vip_trio": return "bg-orange-500/20 border-orange-500 text-orange-400";
      case "donation": return "bg-purple-600/20 border-purple-500 text-purple-400";
    }
  };

  const getDistanceLabel = (dist: DistanceType): string => {
    switch (dist) {
      case "REGULAR": return "REGULAR 5KM";
      case "5K": return "REGULAR 5KM";
      case "vip": return "VIP 5KM";
      case "vip_duo": return "VIP Duo 5KM";
      case "vip_trio": return "VIP Trio 5KM";
      case "donation": return "บริจาคสนับสนุน";
    }
  };

  const filteredShipping = shippingList.filter((item) => {
    const q = shippingSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.id.toLowerCase().includes(q) ||
      `${item.firstName} ${item.lastName}`.toLowerCase().includes(q) ||
      item.bibNumber.toLowerCase().includes(q) ||
      item.shippingTrackingNumber.toLowerCase().includes(q) ||
      item.phone.includes(q)
    );
  });

  return (
    <div className="space-y-8 animate-fade-in" id="status-checker">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 gap-6 mb-2">
        <button
          onClick={() => setActiveTab("lookup")}
          className={`pb-3.5 text-sm sm:text-base font-black tracking-wider uppercase transition cursor-pointer flex items-center gap-2 ${
            activeTab === "lookup"
              ? "text-teal-700 border-b-2 border-teal-500"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <SearchCheck className="w-5 h-5 text-teal-700" /> ตรวจสอบสิทธิ์ & แจ้งชำระเงิน
        </button>
        <button
          onClick={() => setActiveTab("shipping")}
          className={`pb-3.5 text-sm sm:text-base font-black tracking-wider uppercase transition cursor-pointer flex items-center gap-2 ${
            activeTab === "shipping"
              ? "text-teal-700 border-b-2 border-teal-500"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <Truck className="w-5 h-5 text-teal-700" /> ตรวจสอบเลขจัดส่งไปรษณีย์
        </button>
      </div>

      {activeTab === "lookup" && (
        <>
          {/* Search Bar section */}
      <section className="bg-gradient-to-br from-teal-50/80 via-white to-orange-50/60 border border-teal-500/20 text-slate-900 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 max-w-2xl space-y-4">
          <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-wider flex items-center gap-2 text-slate-900">
            <SearchCheck className="w-6 h-6 text-teal-700" /> ตรวจสอบสถานะและชำระเงินออนไลน์ <Sparkles className="w-5 h-5 text-orange-500 animate-pulse" />
          </h2>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
            กรอกข้อมูลสืบค้น เช่น <strong>เลขบัตรประชาชน, อีเมล หรือเบอร์โทรศัพท์</strong> หรือ <strong>รหัสอ้างอิงการสมัคร</strong> (เช่น LSEd-XXXXXX) เพื่อตรวจสอบสิทธิ์หรือแนบหลักฐานการโอนเงิน
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="กรอกเบอร์โทร, เลขบัตรประชาชน หรือ รหัสลงทะเบียน..."
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-300 text-slate-900 rounded-xl text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition shadow-xs"
                id="search-input"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-black uppercase tracking-widest text-sm rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 min-w-[130px]"
              id="search-submit"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <>ค้นหาข้อมูล <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* Error State */}
      {error && (
        <div className="p-5 bg-red-500/10 border border-red-500/20 text-red-900 rounded-2xl flex items-start gap-3.5 shadow-sm max-w-2xl mx-auto">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-black text-red-800 text-base">ตรวจสอบข้อมูลไม่สำเร็จ</p>
            <p className="text-sm sm:text-base text-red-700 font-medium">{error}</p>
            <p className="text-sm text-slate-700 mt-2 pt-2 border-t border-slate-200 font-normal">
              * โปรดตรวจสอบตัวสะกดหรือกรอกเบอร์โทรและรหัสผู้สมัครให้ตรงตามที่ลงทะเบียนไว้ครั้งแรก หรือสมัครใหม่อีกครั้งผ่านหน้าหลัก
            </p>
          </div>
        </div>
      )}

      {/* Results Selection Grid */}
      {registrations.length > 1 && (
        <div className="space-y-3 max-w-2xl mx-auto">
          <p className="text-sm font-black text-slate-800 uppercase tracking-widest">พบข้อมูลลงทะเบียนซ้ำซ้อน <span className="text-xs font-normal text-slate-500 ml-1">({registrations.length} รายการ)</span></p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {registrations.map((reg) => (
              <button
                key={reg.id}
                onClick={() => { setSelectedReg(reg); setUploadSuccess(false); setUploadError(null); }}
                className={`p-4 rounded-xl border text-left transition flex justify-between items-center ${
                  selectedReg?.id === reg.id
                    ? "border-teal-500 bg-teal-500/10 text-slate-900 shadow-sm"
                    : "border-slate-200 hover:border-teal-300 bg-slate-50 text-slate-900"
                }`}
              >
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-600">{reg.id}</p>
                  <p className="text-base font-extrabold text-slate-900 mt-0.5">{reg.firstName} {reg.lastName}</p>
                  <p className="text-xs sm:text-sm text-teal-700 font-black mt-1 uppercase tracking-wider">{getDistanceLabel(reg.distance)}</p>
                </div>
                <div>
                  {getStatusBadge(reg.status)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Selection Details & Action Flow */}
      {selectedReg && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Registration info & Payment/Upload Portal */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Participant Card */}
            <div className="bg-slate-100 border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 text-slate-900">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-5">
                <div>
                  <p className="text-sm font-black text-slate-600 tracking-widest uppercase">{selectedReg.id}</p>
                  <h3 className="text-2xl md:text-3xl font-black text-slate-900 mt-1 uppercase tracking-tight">
                    {selectedReg.firstName} {selectedReg.lastName}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-700 font-bold mt-1.5">เลขประจำตัวบัตร: <span className="font-mono text-slate-900">{selectedReg.nationalId}</span></p>
                </div>
                <div className="flex flex-col sm:items-end gap-2.5">
                  {getStatusBadge(selectedReg.status)}
                  <span className={`text-xs sm:text-sm font-black px-3.5 py-1.5 rounded-full border uppercase tracking-wider ${getDistanceColor(selectedReg.distance)}`}>
                    {getDistanceLabel(selectedReg.distance)}
                  </span>
                </div>
              </div>

              {/* Sandbox Bypass Action */}
              {selectedReg.status !== "approved" && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/25 text-amber-950 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3 text-sm leading-relaxed">
                  <div className="flex items-start gap-3 text-left">
                    <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 animate-pulse mt-0.5" />
                    <div>
                      <p className="font-black text-amber-900 text-base">🧪 ข้ามขั้นตอนตรวจสอบ <span className="text-xs font-semibold text-amber-800 ml-1">(โหมดทดสอบ)</span></p>
                      <p className="text-slate-700 mt-0.5 font-medium">กดปุ่มด้านขวาเพื่อทำการอนุมัติสลิปและออกหมายเลข BIB จำลองอัตโนมัติทันที เพื่อทดลองระบบดาวน์โหลด E-Ticket และ E-BIB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSandboxApprove}
                    disabled={sandboxApproving}
                    className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/40 text-slate-900 font-black text-sm uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-amber-500/15"
                  >
                    {sandboxApproving ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-slate-900" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        กำลังอนุมัติ...
                      </>
                    ) : (
                      "อนุมัติทันที ⚡"
                    )}
                  </button>
                </div>
              )}

              {/* Dynamic instruction or rejection alerts */}
              {selectedReg.status === "rejected" && selectedReg.rejectionReason && (
                <div className="p-4 bg-red-500/10 border border-red-500/25 text-red-950 rounded-2xl flex items-start gap-3.5 text-sm sm:text-base leading-relaxed">
                  <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black text-red-900 text-base">สาเหตุที่หลักฐานไม่ผ่านการอนุมัติ:</p>
                    <p className="text-red-800 mt-1 font-bold">{selectedReg.rejectionReason}</p>
                    <p className="text-slate-700 mt-2 font-medium">กรุณาดาวน์โหลดหรือสแกนคิวอาร์โค้ด และแนบไฟล์หลักฐานสลิปการโอนเงินฉบับแก้ไขที่อ้างอิงยอดโอนตรงกันด้านล่างใหม่อีกครั้ง</p>
                  </div>
                </div>
              )}

              {selectedReg.status === "pending_verification" && (
                <div className="p-4 bg-teal-500/10 border border-teal-500/25 text-teal-950 rounded-2xl flex items-start gap-3.5 text-sm sm:text-base leading-relaxed font-normal">
                  <Clock className="w-5 h-5 text-teal-700 flex-shrink-0 mt-0.5 animate-spin" />
                  <div>
                    <p className="font-black text-teal-800 text-base">อยู่ระหว่างรอดำเนินการตรวจสอบข้อมูลหลักฐานสลิป</p>
                    <p className="text-slate-700 mt-1 font-normal">เจ้าหน้าที่จะเร่งดำเนินการตรวจเช็คยอดเงินและอัปเดตหมายเลข BIB ของท่านโดยด่วนที่สุด <span className="text-xs font-semibold text-slate-500 ml-1">(ปกติภายใน 12-24 ชั่วโมง)</span> หากผ่านการอนุมัติ บัตรรันเนอร์การ์ด BIB และบาร์โค้ดทางการจะแสดงผลด้านขวาทันที</p>
                  </div>
                </div>
              )}

              {selectedReg.status === "approved" && (
                <div className="p-4 bg-green-500/10 border border-green-500/25 text-green-950 rounded-2xl flex items-start gap-3.5 text-sm sm:text-base leading-relaxed font-normal">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black text-green-900 text-base">ยืนยันความถูกต้องและชำระเงินเรียบร้อยแล้ว!</p>
                    <p className="text-slate-700 mt-1 font-normal">ระบบได้อนุมัติหมายเลขบิ๊บวิ่งทางการให้แก่คุณเรียบร้อยแล้ว ท่านสามารถกดบันทึกหรือพิมพ์บัตรรันเนอร์การ์ดเพื่อนำมาเป็นหลักฐานยื่นรับเสื้อวิ่งจริงและบิ๊บจริงในวันจัดกิจกรรม ณ มธ. รังสิต</p>
                  </div>
                </div>
              )}

              {/* Personal specs breakdown - Structured Data Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                <table className="w-full text-left border-collapse text-sm sm:text-base">
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3.5 bg-slate-50 text-slate-700 font-bold w-1/3 sm:w-1/4 whitespace-nowrap">เบอร์โทรศัพท์</td>
                      <td className="px-5 py-3.5 text-slate-900 font-bold">{selectedReg.phone}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3.5 bg-slate-50 text-slate-700 font-bold whitespace-nowrap">อีเมลผู้สมัคร</td>
                      <td className="px-5 py-3.5 text-slate-900 font-bold">{selectedReg.email}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3.5 bg-slate-50 text-slate-700 font-bold whitespace-nowrap">ขนาดเสื้อวิ่ง</td>
                      <td className="px-5 py-3.5 text-teal-700 font-black">{selectedReg.shirtSize}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3.5 bg-slate-50 text-slate-700 font-bold whitespace-nowrap">อายุ</td>
                      <td className="px-5 py-3.5 text-slate-900 font-bold">{selectedReg.age} ปี</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3.5 bg-slate-50 text-slate-700 font-bold whitespace-nowrap">กรุ๊ปเลือด</td>
                      <td className="px-5 py-3.5 text-slate-900 font-bold">กรุ๊ป {selectedReg.bloodType}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3.5 bg-slate-50 text-slate-700 font-bold whitespace-nowrap">ผู้ติดต่อฉุกเฉิน</td>
                      <td className="px-5 py-3.5 text-slate-900 font-bold">
                        {selectedReg.emergencyContactName} <span className="text-xs sm:text-sm font-semibold text-slate-600 ml-1.5">({selectedReg.emergencyContactPhone})</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* PAYMENT BOX (Only if status is pending_payment or rejected) */}
            {selectedReg.status === "pending_payment" && paymentExpired ? (
              <div className="bg-red-950/40 border border-red-500/20 rounded-3xl p-6 md:p-8 shadow-xl text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                <h3 className="text-xl font-black text-slate-900">หมดเวลาชำระเงิน</h3>
                <p className="text-red-200/80 text-sm">
                  รายการลงทะเบียนนี้เกินกำหนดเวลา 9 นาทีแล้ว กรุณาทำการสมัครใหม่อีกครั้ง
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl mt-4"
                >
                  กลับไปสมัครใหม่
                </button>
              </div>
            ) : (selectedReg.status === "pending_payment" || selectedReg.status === "rejected") && (
              <div className="bg-white border border-slate-200 rounded-3xl shadow-md p-6 md:p-8 shadow-xl space-y-6 text-slate-900" id="payment-gateway">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-base font-black italic uppercase tracking-wider flex items-center gap-2 text-slate-900">
                    <CreditCard className="w-5 h-5 text-teal-700" /> ชำระเงินค่าสมัครวิ่ง
                  </h3>
                  {selectedReg.status === "pending_payment" && paymentTimeLeft && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl">
                      <Clock className="w-4 h-4 text-red-400 animate-pulse" />
                      <span className="text-red-400 font-bold text-sm">
                        เหลือเวลา {String(paymentTimeLeft.minutes).padStart(2, '0')}:{String(paymentTimeLeft.seconds).padStart(2, '0')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                  
                  {/* PromptPay QR Simulation Card / Uploaded Slip */}
                  <div className="sm:col-span-5 bg-slate-100  border border-slate-200 rounded-3xl overflow-hidden flex flex-col items-center shadow-2xl relative" id="ttb-promptpay-slip">
                    {selectedReg.paymentQrImage && !selectedReg.paymentQrImage.includes('api.qrserver.com') ? (
                      <div className="w-full flex items-center justify-center bg-white h-full relative p-2">
                        <img 
                          src={selectedReg.paymentQrImage}
                          alt="Payment Slip"
                          className="w-full h-auto object-contain rounded-2xl"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-slate-100 flex items-center gap-2">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                          </span>
                          <span className="text-xs font-black tracking-widest text-[#004684] uppercase">
                            REF ID: {selectedReg.id}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Thai QR Payment header */}
                        <div className="w-full bg-[#004684] py-3 px-4 flex items-center justify-between text-white border-b border-blue-900">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-[9px] font-black tracking-widest uppercase text-white/95">THAI QR PAYMENT</span>
                          </div>
                          <QrCode className="w-3.5 h-3.5 text-white/80" />
                        </div>
    
                        {/* Slip Body Card */}
                        <div className="w-full p-4 flex flex-col items-center bg-white text-slate-800">
                          {/* PromptPay Logo Frame */}
                          <div className="border border-[#11315B] rounded-xl px-4 py-1 mb-3 flex flex-col items-center justify-center bg-white">
                            <span className="text-[7px] text-[#11315B] font-bold tracking-widest uppercase -mb-0.5">พร้อมเพย์</span>
                            <span className="text-xs font-black text-[#11315B] tracking-tight font-sans">Prompt Pay</span>
                          </div>
    
                          {/* Real Dynamic QR Image */}
                          <div className="bg-white p-2 border border-slate-100 rounded-2xl flex items-center justify-center w-full max-w-[240px] aspect-square shadow-inner relative overflow-hidden">
                            <img 
                              src={selectedReg.paymentQrImage || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=002d63&data=${encodeURIComponent(selectedReg.qrPayload || generatePromptPayPayload("0830131768", selectedReg.price))}`}
                              alt="Payment QR"
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          {/* Save QR Code Button */}
                          <div className="mt-3.5 w-full max-w-[260px]">
                            <a 
                              href={`/api/qr-download?payload=${encodeURIComponent(selectedReg.qrPayload || generatePromptPayPayload("0830131768", selectedReg.price))}`} download="PromptPay_QR.png"
                              className="flex items-center justify-center gap-2 w-full bg-teal-600 hover:bg-teal-500 text-white py-2.5 rounded-xl text-sm font-bold transition shadow-sm"
                            >
                              <Download className="w-4 h-4" /> บันทึกคิวอาร์โค้ด
                            </a>
                          </div>
    
                          {/* Account Owner Details */}
                          <div className="mt-4 text-center space-y-1 w-full px-2">
                            <p className="text-sm sm:text-base font-black text-[#002d63] tracking-wide break-words">
                              {selectedReg.paymentAccountName || selectedReg.qrAccountName || "นาย นภัสกร กลิ่นเฟื่อง"}
                            </p>
                            <p className="text-xs sm:text-sm font-extrabold text-slate-600 uppercase tracking-wider">
                              {selectedReg.paymentBankName || "PROMPTPAY MERCHANT"}
                            </p>
                          </div>
    
                          {/* Price and reference details */}
                          <div className="mt-3.5 pt-3 border-t border-dashed border-slate-200 w-full text-center">
                            <p className="text-3xl sm:text-4xl font-black text-[#004684] tracking-tight font-sans">
                              {selectedReg.price.toFixed(2)} <span className="text-base sm:text-lg font-bold text-slate-500 font-sans">THB</span>
                            </p>
                            <p className="text-xs text-slate-500 font-bold tracking-wider mt-1 font-mono">REF ID: {selectedReg.id}</p>
                          </div>
                        </div>
    
                        {/* Footer */}
                        <div className="w-full bg-[#004684] py-3 px-4 flex items-center justify-between text-white text-xs sm:text-sm border-t border-blue-900/40">
                          <span className="font-bold text-white/95">ชำระผ่าน {selectedReg.paymentBankName || "PromptPay"}</span>
                          {/* Custom styled bank badge */}
                          <div className="flex items-center gap-1.5">
                            <span className="font-black tracking-tighter text-xs uppercase text-white bg-[#002d63] px-2.5 py-1 rounded border border-white/20">THAI QR</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Payment Details & Upload */}
                  <div className="sm:col-span-7 space-y-5 text-sm sm:text-base text-slate-800 leading-relaxed font-normal">
                    <div className="space-y-2 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                      <p className="font-extrabold text-slate-900 text-sm sm:text-base uppercase tracking-wider mb-2">
                        รายละเอียดบัญชี {selectedReg.taxDeduction || selectedReg.distance === "donation" ? "(ลดหย่อนภาษี e-Donation)" : "(บัญชีทั่วไป)"}:
                      </p>
                      <p className="text-slate-700">
                        บัญชีรับเงิน: <strong className="text-slate-900 font-extrabold">{selectedReg.paymentAccountName || "นาย นภัสกร กลิ่นเฟื่อง"}</strong>
                      </p>
                      <p className="text-slate-700">
                        ธนาคาร: <strong className="text-slate-900 font-extrabold">{selectedReg.paymentBankName || "ทหารไทยธนชาต (ttb)"}</strong>
                      </p>
                      <p className="text-slate-700">
                        เลขที่บัญชีโอนตรง: <strong className="text-teal-700 font-black text-base sm:text-lg tracking-wider block mt-1">
                          {selectedReg.paymentAccountNo || "ttb PromptPay QR"}
                        </strong>
                      </p>
                    </div>

                    {/* File Upload interactive zone */}
                    <div className="space-y-2.5 pt-2">
                      <p className="font-black text-slate-900 text-sm sm:text-base uppercase tracking-widest">แนบหลักฐานสลิปโอนเงิน:</p>
                      
                      <label className="border-2 border-dashed border-slate-300 hover:border-teal-500 bg-slate-50 hover:bg-teal-500/5 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[160px] relative overflow-hidden group">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleFileChange}
                          disabled={uploading}
                          className="sr-only"
                        />
                        {uploading ? (
                          <div className="space-y-2.5 flex flex-col items-center">
                            <svg className="animate-spin h-8 w-8 text-teal-700" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <p className="text-sm font-bold text-slate-700 animate-pulse">กำลังตรวจสอบและส่งรูปภาพสลิป...</p>
                          </div>
                        ) : (
                          <div className="space-y-2 flex flex-col items-center">
                            <UploadCloud className="w-10 h-10 text-slate-600 group-hover:text-teal-700 group-hover:scale-110 transition duration-200" />
                            <p className="text-sm sm:text-base font-extrabold text-slate-900">คลิกเพื่ออัปโหลด หรือ ลากไฟล์สลิปมาวางที่นี่</p>
                            <p className="text-xs sm:text-sm text-slate-600 font-medium">รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB</p>
                          </div>
                        )}
                      </label>

                      {uploadError && (
                        <p className="text-sm font-bold text-red-600 flex items-center gap-1.5 mt-2">
                          <AlertCircle className="w-4 h-4 shrink-0" /> {uploadError}
                        </p>
                      )}

                      {uploadSuccess && (
                        <div className="mt-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-sm space-y-2 animate-fade-in text-left">
                          <p className="font-black text-emerald-800 text-base flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> อัปโหลดหลักฐานสำเร็จเรียบร้อยแล้ว!
                          </p>
                          <p className="text-slate-800 text-sm sm:text-base leading-relaxed">
                            ระบบได้ส่งอีเมลยืนยันการรับหลักฐานชำระเงินไปยัง <strong>{selectedReg.email}</strong> เรียบร้อยแล้ว ขณะนี้เรื่องอยู่ระหว่างรอเจ้าหน้าที่ฝ่ายการเงินตรวจสอบและออกหมายเลข BIB
                          </p>
                          {selectedReg.emailPreviewUrl && (
                            <a
                              href={selectedReg.emailPreviewUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm text-teal-700 hover:text-teal-800 font-bold underline pt-1"
                            >
                              <Mail className="w-4 h-4" /> คลิกเพื่อเปิดดูตัวอย่างอีเมลที่ระบบจัดส่ง ↗
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: HIGH-FIDELITY BIB ONLINE CARD PREVIEW & E-TICKET */}
          <div className="lg:col-span-5 space-y-6 text-slate-900" id="runner-pass-preview">
            
            {/* Tab switch buttons */}
            <div className="flex bg-slate-100 p-1.5 border border-slate-200 rounded-2xl gap-1.5">
              <button
                type="button"
                onClick={() => setCardType("bib")}
                className={`flex-1 py-3 text-sm sm:text-base font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
                  cardType === "bib" 
                    ? "bg-teal-600 text-white shadow-lg shadow-teal-500/10" 
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                บัตรประจำตัววิ่ง (E-BIB)
              </button>
              <button
                type="button"
                onClick={() => setCardType("ticket")}
                className={`flex-1 py-3 text-sm sm:text-base font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
                  cardType === "ticket" 
                    ? "bg-orange-600 text-white shadow-lg shadow-orange-500/10" 
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                <QrCode className="w-4 h-4" /> บัตรเข้างาน (E-Ticket)
              </button>
            </div>

            {cardType === "ticket" ? (
              /* E-Ticket Preview */
              <div className="relative rounded-3xl bg-white border border-orange-200 shadow-xl p-6 sm:p-8 flex flex-col justify-between min-h-[560px] h-auto text-slate-900 max-w-sm sm:max-w-md mx-auto space-y-4">

                {/* E-Ticket Header */}
                <div className="text-center pb-3 border-b border-slate-200">
                  {logoImage ? (
                    <img src={logoImage} alt="Event Logo" className="h-9 w-auto object-contain mx-auto" />
                  ) : (
                    <>
                      <h4 className="text-sm font-black tracking-widest text-orange-600 italic">LSEd Running 2569</h4>
                      <p className="text-xs sm:text-sm text-slate-700 font-bold uppercase tracking-wider mt-0.5">Learning Sciences & Education TU</p>
                    </>
                  )}
                </div>

                {/* Badge */}
                <div className="my-1 text-center">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-600 text-xs sm:text-sm font-black tracking-wider uppercase">
                    <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-pulse" /> EVENT ENTRANCE PASS
                  </span>
                </div>

                {/* QR Code container */}
                <div className="bg-white p-3.5 rounded-2xl mx-auto flex items-center justify-center shadow-lg border border-slate-200 w-48 h-48 sm:w-52 sm:h-52">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedReg.id)}`}
                    alt="Entry QR Code"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Registration text ID */}
                <div className="text-center mt-2 pb-2.5 border-b border-dashed border-slate-200">
                  <span className="text-xs sm:text-sm text-slate-600 font-black tracking-wider uppercase block">REGISTRATION ID</span>
                  <p className="text-sm sm:text-base font-black text-slate-900 mt-0.5 tracking-wider font-mono">{selectedReg.id}</p>
                </div>

                {/* Info block */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-2 text-sm sm:text-base">
                  <div className="col-span-2">
                    <span className="text-xs sm:text-sm text-slate-600 font-black uppercase block">Runner Name</span>
                    <span className="font-black text-slate-900 text-base sm:text-lg block">{selectedReg.firstName} {selectedReg.lastName}</span>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm text-slate-600 font-black uppercase block">BIB Number</span>
                    <span className="font-black text-orange-600 text-lg sm:text-xl block">{selectedReg.bibNumber || "PENDING"}</span>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm text-slate-600 font-black uppercase block">Distance</span>
                    <span className="font-black text-teal-700 text-base sm:text-lg block">{getDistanceLabel(selectedReg.distance)}</span>
                  </div>
                </div>

                {/* Footer text info */}
                <div className="text-center text-xs sm:text-sm text-slate-600 font-bold border-t border-slate-200 pt-3">
                  โปรดนำคิวอาร์โค้ดนี้แสดงแก่เจ้าหน้าที่ ณ จุดลงทะเบียนเข้างาน
                </div>
              </div>
            ) : (
              /* BIB Card Frame */
              <div className="relative rounded-3xl bg-white border border-slate-200 shadow-xl p-6 sm:p-8 flex flex-col justify-between min-h-[560px] h-auto text-slate-900 max-w-sm sm:max-w-md mx-auto space-y-4">
                
                {/* Event Watermark behind */}
                <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center select-none font-black text-slate-900 text-9xl">
                  {selectedReg.distance}
                </div>

                {/* BIB HEADER */}
                <div className="relative z-10 bg-white border-b border-slate-200 pb-3 -mx-2 flex justify-between items-center text-slate-900">
                  <div>
                    {logoImage ? (
                      <img src={logoImage} alt="Event Logo" className="h-9 w-auto object-contain" />
                    ) : (
                      <>
                        <h4 className="text-sm font-black tracking-widest text-teal-700 italic">LSEd Running</h4>
                        <p className="text-xs sm:text-sm text-slate-700 uppercase font-black tracking-wider mt-0.5">Learning Sciences & Education TU</p>
                      </>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-orange-500">2569 BE</span>
                  </div>
                </div>

                {/* BIB MAIN AREA (White card panel resembling physical running BIB) */}
                <div className="relative z-10 bg-white border border-slate-100 rounded-2xl p-4 md:p-6 my-2 flex-grow flex flex-col justify-between shadow-lg space-y-3">
                  
                  {referrals >= 3 && (
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-slate-900 text-xs font-black px-3 py-1 rounded-full shadow-md border border-amber-300 animate-bounce flex items-center gap-1 z-30">
                      <Sparkles className="w-3 h-3 animate-pulse text-amber-100" /> LSEd Light-Bringer
                    </div>
                  )}
                  
                  {/* Distance stripe */}
                  <div className="absolute top-0 left-0 right-0 h-3.5 rounded-t-2xl overflow-hidden flex">
                    <div className={`w-full h-full ${
                      selectedReg.distance === "10K" ? "bg-indigo-600" : selectedReg.distance === "5K" ? "bg-teal-600" : "bg-zinc-800"
                    }`}></div>
                  </div>

                  {/* Status/Verified Watermark overlay */}
                  {selectedReg.status !== "approved" && (
                    <div className="absolute inset-0 z-25 bg-white/75 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-2xl">
                      <div className="border-4 border-dashed border-amber-500/80 text-amber-700 font-black text-center text-xl p-3 uppercase tracking-widest rounded-xl transform -rotate-12 animate-pulse">
                        รออนุมัติสลิป<br/><span className="text-sm">PENDING APPROVE</span>
                      </div>
                    </div>
                  )}

                  {/* Runner details inside BIB */}
                  <div className="flex justify-between items-start pt-2">
                    <span className={`text-xs sm:text-sm font-black px-3 py-1 rounded-full ${
                      selectedReg.distance === "10K" ? "bg-indigo-100 text-indigo-700" : selectedReg.distance === "5K" ? "bg-teal-100 text-teal-800" : "bg-zinc-100 text-zinc-700"
                    }`}>
                      {selectedReg.distance === "10K" ? "Mini Marathon" : selectedReg.distance === "5K" ? "Micro Marathon" : "Fun Run"}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-700 font-bold uppercase tracking-wider">BIB CARD</span>
                  </div>

                  {/* BIB NUMBER DISPLAY */}
                  <div className="text-center py-4">
                    <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-slate-900 leading-none">
                      {selectedReg.bibNumber || "LXX-XXXX"}
                    </h2>
                  </div>

                  {/* Runner Name & Info inside BIB */}
                  <div className="border-t border-slate-100 pt-3 flex justify-between items-end">
                    <div className="space-y-0.5 text-left">
                      <p className="text-xs sm:text-sm text-slate-600 uppercase font-bold tracking-wider">Runner Name</p>
                      <p className="text-base sm:text-lg font-black text-slate-900 leading-tight uppercase tracking-tight">
                        {selectedReg.firstName} {selectedReg.lastName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs sm:text-sm text-slate-600 uppercase font-bold tracking-wider">Shirt Size</p>
                      <p className="text-base sm:text-lg font-black text-teal-700">{selectedReg.shirtSize}</p>
                    </div>
                  </div>

                  {/* Barcode representation */}
                  <div className="border-t border-dashed border-slate-200 pt-3 flex flex-col items-center">
                    <div className="flex gap-0.5 justify-center h-7 w-full items-center">
                      {[1,3,1,2,1,4,1,2,3,1,1,2,1,4,1,3,1,2,1,2,3,1,4,1,1,2].map((w, idx) => (
                        <div 
                          key={idx} 
                          className="bg-slate-900 h-full" 
                          style={{ width: `${w * 1.5}px`, opacity: idx % 2 === 0 ? 1 : 0 }}
                        ></div>
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 font-bold mt-1.5 tracking-widest font-mono">{selectedReg.id}</p>
                  </div>
                </div>

                {/* BIB FOOTER (Emergency Contact Details) */}
                <div className="relative z-10 flex flex-wrap justify-between items-center text-xs sm:text-sm text-slate-700 border-t border-slate-200 pt-3 -mx-1 gap-2">
                  <div className="space-y-0.5 text-left">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Emergency Contact</p>
                    <p className="text-slate-900 font-bold">
                      {selectedReg.emergencyContactName || "N/A"}
                    </p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Phone & Blood</p>
                    <p className="text-slate-900 font-bold">
                      {selectedReg.emergencyContactPhone || "N/A"} ({selectedReg.bloodType || "N/A"})
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* Print and Share helper triggers */}
            {selectedReg.status === "approved" && (
              <div className="flex flex-col gap-3 sm:flex-row justify-center items-center pt-2">
                {cardType === "ticket" ? (
                  <button
                    type="button"
                    onClick={handleDownloadTicket}
                    disabled={downloadingTicket}
                    className="w-full sm:w-auto px-6 py-3.5 bg-orange-600 hover:bg-orange-500 text-white font-black text-sm uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-500/10"
                  >
                    {downloadingTicket ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        กำลังสร้างรูปภาพ...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" /> บันทึกรูปบัตรผ่านเข้างาน (Download)
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => window.print()}
                      className="w-full sm:w-auto px-5 py-3 bg-white text-slate-900 font-black text-sm uppercase tracking-wider rounded-xl border border-slate-300 hover:bg-slate-50 flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                    >
                      <Printer className="w-4 h-4 text-slate-700" /> สั่งพิมพ์บัตรวิ่ง
                    </button>
                    <a
                      href={`data:text/plain;charset=utf-8,LSEd Running 2569 BIB Confirmation: ${selectedReg.id} BIB: ${selectedReg.bibNumber} Runner: ${selectedReg.firstName} ${selectedReg.lastName}`}
                      download={`BIB_${selectedReg.bibNumber}_LSEd.txt`}
                      className="w-full sm:w-auto px-5 py-3 bg-teal-600 hover:bg-teal-500 text-white font-black text-sm uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-teal-500/20"
                    >
                      <Download className="w-4 h-4" /> บันทึกข้อมูล
                    </a>
                  </>
                )}
              </div>
            )}

            {/* Postal shipping tracking system check */}
            {selectedReg.status === "approved" && selectedReg.deliveryMethod === "shipping" && (
              <div className="bg-white border border-slate-200 rounded-3xl shadow-md p-6 space-y-5 text-slate-900 mt-4">
                <h3 className="text-sm sm:text-base font-black italic uppercase tracking-wider flex items-center gap-2 text-slate-900">
                  <Truck className="w-5 h-5 text-orange-500 animate-pulse" /> ข้อมูลการจัดส่งเสื้อยืดและของที่ระลึกทางไปรษณีย์
                </h3>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-sm sm:text-base leading-relaxed">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <span className="text-slate-700 font-bold">สถานะการจัดส่ง:</span>
                    <span className={`px-3 py-1 rounded-full font-black text-xs sm:text-sm ${
                      selectedReg.shippingTrackingNumber 
                        ? "bg-orange-500/10 border border-orange-500/25 text-orange-600" 
                        : "bg-teal-500/10 border border-teal-500/25 text-teal-800"
                    }`}>
                      {selectedReg.shippingTrackingNumber ? "จัดส่งพัสดุเรียบร้อยแล้ว" : "กำลังเตรียมการจัดส่ง"}
                    </span>
                  </div>

                  {selectedReg.shippingTrackingNumber && (
                    <>
                      <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                        <span className="text-slate-700 font-bold">ผู้จัดส่งพัสดุ <span className="text-xs font-normal text-slate-500 ml-1">(Carrier):</span></span>
                        <span className="font-extrabold text-slate-900 text-sm sm:text-base bg-white px-3 py-1 rounded-xl border border-slate-200">
                          {selectedReg.shippingCarrier === "flash" ? "Flash Express" :
                           selectedReg.shippingCarrier === "kerry" ? "Kerry Express" :
                           selectedReg.shippingCarrier === "jandt" ? "J&T Express" :
                           "ไปรษณีย์ไทย (EMS)"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                        <span className="text-slate-700 font-bold">เลขพัสดุ <span className="text-xs font-normal text-slate-500 ml-1">(Tracking Number):</span></span>
                        <strong className="text-orange-600 font-black text-base sm:text-lg tracking-widest bg-orange-500/10 px-3 py-1 rounded-xl border border-orange-500/20 font-mono">
                          {selectedReg.shippingTrackingNumber}
                        </strong>
                      </div>

                      {selectedReg.shippedAt && (
                        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                          <span className="text-slate-700 font-bold">วันเวลาจัดส่ง <span className="text-xs font-normal text-slate-500 ml-1">(Shipped At):</span></span>
                          <span className="font-bold text-slate-900">
                            {selectedReg.shippedAt}
                          </span>
                        </div>
                      )}

                      {/* Visual Timeline Stepper */}
                      <div className="py-4 border-b border-slate-200">
                        <p className="text-xs sm:text-sm text-slate-700 uppercase font-black tracking-wider text-center mb-4">สถานะเรียลไทม์ <span className="text-xs font-semibold text-slate-500 ml-1">(Real-time Timeline)</span></p>
                        <div className="relative flex items-center justify-between max-w-xs mx-auto">
                          {/* Background Line */}
                          <div className="absolute left-4 right-4 top-3.5 h-1 bg-slate-200 z-0"></div>
                          {/* Active Progress Line */}
                          <div className="absolute left-4 right-1/2 top-3.5 h-1 bg-orange-500 z-0"></div>
                          
                          {/* Step 1: Packing */}
                          <div className="z-10 flex flex-col items-center text-center space-y-1.5">
                            <div className="w-7 h-7 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center font-black text-xs text-white shadow">✓</div>
                            <span className="text-xs sm:text-sm text-slate-900 font-bold block">เตรียมส่ง</span>
                          </div>
                          
                          {/* Step 2: Shipped */}
                          <div className="z-10 flex flex-col items-center text-center space-y-1.5">
                            <div className="w-7 h-7 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center font-black text-xs text-white shadow">✓</div>
                            <span className="text-xs sm:text-sm text-orange-600 font-extrabold block">จัดส่งแล้ว</span>
                          </div>

                          {/* Step 3: Delivering */}
                          <div className="z-10 flex flex-col items-center text-center space-y-1.5">
                            <div className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-slate-500 font-bold text-xs">3</div>
                            <span className="text-xs sm:text-sm text-slate-600 font-semibold block">นำจ่าย</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-1.5 pt-1 border-b border-slate-200 pb-3">
                    <span className="text-slate-700 font-bold block">ที่อยู่จัดส่ง:</span>
                    <p className="text-slate-900 bg-white p-3.5 rounded-xl border border-slate-200 text-sm sm:text-base leading-relaxed">
                      {selectedReg.shippingAddress || "ไม่พบข้อมูลที่อยู่จัดส่ง กรุณาติดต่อแอดมินเพื่อแก้ไขข้อมูล"}
                    </p>
                  </div>

                  {selectedReg.shippingTrackingNumber && (
                    <div className="flex gap-2.5 justify-end pt-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedReg.shippingTrackingNumber || "");
                          alert("คัดลอกเลขพัสดุเรียบร้อยแล้ว: " + selectedReg.shippingTrackingNumber);
                        }}
                        className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl border border-slate-300 transition text-xs sm:text-sm uppercase tracking-wider cursor-pointer shadow-xs"
                      >
                        คัดลอกเลขพัสดุ
                      </button>
                      <a
                        href={
                          selectedReg.shippingCarrier === "flash" ? `https://flashexpress.co.th/tracking/?se=${selectedReg.shippingTrackingNumber}` :
                          selectedReg.shippingCarrier === "kerry" ? `https://th.kerryexpress.com/th/track/?track=${selectedReg.shippingTrackingNumber}` :
                          selectedReg.shippingCarrier === "jandt" ? `https://www.jtexpress.co.th/index/query/query.html?billNo=${selectedReg.shippingTrackingNumber}` :
                          `https://track.thailandpost.co.th/?trackNumber=${selectedReg.shippingTrackingNumber}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl transition text-xs sm:text-sm uppercase tracking-widest flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/20"
                      >
                        ติดตามสถานะ ↗
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            
          </div>

        </div>
      )}
        </>
      )}

      {activeTab === "shipping" && (
        <div className="space-y-6">
          {/* Shipping tracking section */}
          <section className="bg-gradient-to-br from-teal-50/80 via-white to-orange-50/60 border border-teal-500/20 text-slate-900 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl"></div>
            <div className="relative z-10 max-w-2xl space-y-4">
              <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-wider flex items-center gap-2 text-slate-900">
                <Truck className="w-6 h-6 text-teal-700" /> ตรวจสอบเลขพัสดุจัดส่งไปรษณีย์
              </h2>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                ค้นหารายชื่อผู้จัดส่งเสื้อและของที่ระลึกที่เลือกรับทางไปรษณีย์ โดยสามารถค้นหาด้วย <strong>ชื่อ, นามสกุล, หมายเลข BIB หรือ เลขพัสดุ</strong>
              </p>

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                <input 
                  type="text" 
                  value={shippingSearchQuery}
                  onChange={(e) => setShippingSearchQuery(e.target.value)}
                  placeholder="ค้นหารายชื่อจัดส่ง, เลข BIB..."
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-300 text-slate-900 rounded-xl text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition shadow-xs"
                />
              </div>
              <div className="pt-2">
                <a 
                  href="https://track.thailandpost.co.th/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600/10 hover:bg-red-600/20 text-red-600 font-bold text-sm uppercase tracking-wider rounded-xl border border-red-500/20 transition"
                >
                  <ExternalLink className="w-4 h-4" /> ระบบติดตามพัสดุไปรษณีย์ไทย (Track & Trace)
                </a>
              </div>
            </div>
          </section>

          {shippingLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-600">
              <svg className="animate-spin h-8 w-8 text-teal-700" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm font-bold">กำลังโหลดข้อมูลการจัดส่ง...</span>
            </div>
          ) : filteredShipping.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl shadow-md p-12 text-center text-slate-600 space-y-2">
              <Truck className="w-12 h-12 text-slate-400 mx-auto" />
              <p className="text-base font-black text-slate-800">ไม่พบข้อมูลการจัดส่ง</p>
              <p className="text-sm text-slate-600 max-w-md mx-auto">เฉพาะผู้สมัครสถานะอนุมัติ <span className="text-xs font-normal text-slate-500 ml-1">(ชำระเงินเรียบร้อย)</span> ที่เลือกจัดส่งทางไปรษณีย์เท่านั้นที่จะแสดงผลในระบบนี้</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">
                      <th className="px-6 py-4 whitespace-nowrap">หมายเลขและชื่อผู้สมัคร</th>
                      <th className="px-6 py-4 whitespace-nowrap">เบอร์โทร</th>
                      <th className="px-6 py-4 whitespace-nowrap">หมายเลข BIB</th>
                      <th className="px-6 py-4 whitespace-nowrap">เลขพัสดุ <span className="text-xs font-normal text-slate-400 ml-1">(Tracking)</span></th>
                      <th className="px-6 py-4 text-right whitespace-nowrap">ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm sm:text-base text-slate-900 bg-white">
                    {filteredShipping.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs text-slate-500 font-bold block">REF: {item.id}</span>
                          <span className="font-black text-slate-900 text-base">{item.firstName} {item.lastName}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-700 font-bold">{item.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.bibNumber ? (
                            <span className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1 bg-slate-900 text-white rounded-lg font-black text-sm shadow-xs font-mono">
                              {item.bibNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-bold">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.shippingTrackingNumber ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center font-black text-orange-800 text-sm tracking-wider bg-orange-100 px-3 py-1 rounded-lg border border-orange-300 shadow-xs font-mono">
                                {item.shippingTrackingNumber}
                              </span>
                              <span className="text-xs sm:text-sm text-slate-600 block font-medium">
                                ขนส่ง: {item.shippingCarrier === "flash" ? "Flash Express" :
                                       item.shippingCarrier === "kerry" ? "Kerry Express" :
                                       item.shippingCarrier === "jandt" ? "J&T Express" :
                                       "ไปรษณีย์ไทย (EMS)"}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center text-amber-800 bg-amber-50 px-3 py-1 rounded-md border border-amber-200 text-xs sm:text-sm font-bold">
                              กำลังเตรียมพัสดุ
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          {item.shippingTrackingNumber ? (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(item.shippingTrackingNumber);
                                  alert("คัดลอกเลขพัสดุเรียบร้อยแล้ว: " + item.shippingTrackingNumber);
                                }}
                                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold rounded-lg border border-slate-200 transition text-xs sm:text-sm uppercase tracking-wider cursor-pointer shadow-xs"
                              >
                                คัดลอก
                              </button>
                              <a
                                href={
                                  item.shippingCarrier === "flash" ? `https://flashexpress.co.th/tracking/?se=${item.shippingTrackingNumber}` :
                                  item.shippingCarrier === "kerry" ? `https://th.kerryexpress.com/th/track/?track=${item.shippingTrackingNumber}` :
                                  item.shippingCarrier === "jandt" ? `https://www.jtexpress.co.th/index/query/query.html?billNo=${item.shippingTrackingNumber}` :
                                  `https://track.thailandpost.co.th/?trackNumber=${item.shippingTrackingNumber}`
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-xs"
                              >
                                ติดตามพัสดุ
                              </a>
                            </div>
                          ) : (
                            <span className="text-slate-600 text-xs sm:text-sm font-medium">เตรียมจัดส่งใน 1-2 วัน</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
