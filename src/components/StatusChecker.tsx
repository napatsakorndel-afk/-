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
  ExternalLink
} from "lucide-react";
import { Registration, DistanceType, EventStats } from "../types.js";
import { generatePromptPayPayload } from "../lib/promptpay.js";

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
      const res = await fetch("/api/registrations/shipping");
      if (res.ok) {
        const data = await res.json();
        setShippingList(data);
      }
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
      const response = await fetch(`/api/registrations/lookup?query=${encodeURIComponent(query.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "ไม่พบข้อมูลการลงทะเบียน");
      }

      setRegistrations(data);
      // Auto-select first item if matches found
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
      const response = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedReg.id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "อนุมัติไม่สำเร็จ");
      }

      const approvedReg = await response.json();
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
        
        const response = await fetch("/api/upload-slip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: selectedReg.id,
            slipUrl: base64Data
          }),
        });

        const updatedData = await response.json();

        if (!response.ok) {
          throw new Error(updatedData.error || "อัปโหลดสลิปไม่สำเร็จ");
        }

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
          <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5" /> รอชำระเงิน
          </span>
        );
      case "pending_verification":
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full animate-pulse">
            <Clock className="w-3.5 h-3.5 animate-spin" /> ตรวจสอบสลิป
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> ชำระเงินสำเร็จ
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
            <XCircle className="w-3.5 h-3.5" /> สลิปไม่ถูกต้อง
          </span>
        );
    }
  };

  const getDistanceColor = (dist: DistanceType) => {
    switch (dist) {
      case "REGULAR":
      case "5K": return "bg-blue-600/20 border-blue-500 text-blue-400";
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
      <div className="flex border-b border-slate-200 dark:border-white/5 gap-6 mb-2">
        <button
          onClick={() => setActiveTab("lookup")}
          className={`pb-3 text-xs md:text-sm font-black tracking-wider uppercase transition cursor-pointer flex items-center gap-2 ${
            activeTab === "lookup"
              ? "text-blue-400 border-b-2 border-blue-500"
              : "text-slate-400 dark:text-slate-900 dark:text-white/40 hover:text-slate-600 dark:text-slate-900 dark:text-white/70"
          }`}
        >
          <SearchCheck className="w-4 h-4 text-blue-400" /> ตรวจสอบสิทธิ์ & แจ้งชำระเงิน
        </button>
        <button
          onClick={() => setActiveTab("shipping")}
          className={`pb-3 text-xs md:text-sm font-black tracking-wider uppercase transition cursor-pointer flex items-center gap-2 ${
            activeTab === "shipping"
              ? "text-blue-400 border-b-2 border-blue-500"
              : "text-slate-400 dark:text-slate-900 dark:text-white/40 hover:text-slate-600 dark:text-slate-900 dark:text-white/70"
          }`}
        >
          <Truck className="w-4 h-4 text-blue-400" /> ตรวจสอบเลขจัดส่งไปรษณีย์
        </button>
      </div>

      {activeTab === "lookup" && (
        <>
          {/* Search Bar section */}
      <section className="bg-gradient-to-br from-neutral-950 via-zinc-900 to-indigo-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 max-w-2xl space-y-4">
          <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-wider flex items-center gap-2 text-slate-900 dark:text-slate-900 dark:text-white">
            <SearchCheck className="w-6 h-6 text-blue-500" /> ตรวจสอบสถานะและชำระเงินออนไลน์ <Sparkles className="w-5 h-5 text-[#E25B45] animate-pulse" />
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-900 dark:text-white/50 leading-relaxed font-light">
            กรอกข้อมูลสืบค้น เช่น **เลขบัตรประชาชน / อีเมล / เบอร์โทรศัพท์** หรือ **รหัสอ้างอิงการสมัคร** (เช่น LSED-XXXXXX) เพื่อตรวจสอบสิทธิ์หรือแนบหลักฐานการโอนเงิน
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-900 dark:text-white/40" />
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="กรอกเบอร์โทร, เลขบัตรประชาชน หรือ รหัสลงทะเบียน..."
                className="w-full pl-11 pr-4 py-3.5 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                id="search-input"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20 min-w-[120px]"
              id="search-submit"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-slate-900 dark:text-slate-900 dark:text-white" fill="none" viewBox="0 0 24 24">
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
        <div className="p-5 bg-red-500/10 border border-red-500/20 text-red-200 rounded-2xl flex items-start gap-3.5 shadow-sm max-w-2xl mx-auto">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">ตรวจสอบข้อมูลไม่สำเร็จ</p>
            <p className="text-xs text-red-300/80">{error}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-900 dark:text-white/40 mt-2 pt-2 border-t border-slate-200 dark:border-white/5 font-light">
              * โปรดตรวจสอบตัวสะกดหรือกรอกเบอร์โทรและรหัสผู้สมัครให้ตรงตามที่ลงทะเบียนไว้ครั้งแรก หรือสมัครใหม่อีกครั้งผ่านหน้าหลัก
            </p>
          </div>
        </div>
      )}

      {/* Results Selection Grid */}
      {registrations.length > 1 && (
        <div className="space-y-3 max-w-2xl mx-auto">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-900 dark:text-white/50 uppercase tracking-widest">พบข้อมูลลงทะเบียนซ้ำซ้อน ({registrations.length} รายการ)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {registrations.map((reg) => (
              <button
                key={reg.id}
                onClick={() => { setSelectedReg(reg); setUploadSuccess(false); setUploadError(null); }}
                className={`p-4 rounded-xl border text-left transition flex justify-between items-center ${
                  selectedReg?.id === reg.id
                    ? "border-blue-500 bg-blue-500/10 text-slate-900 dark:text-white"
                    : "border-slate-200 dark:border-white/10 hover:border-white/20 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-900 dark:text-white/80"
                }`}
              >
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-900 dark:text-white/40 font-mono">{reg.id}</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-900 dark:text-white mt-0.5">{reg.firstName} {reg.lastName}</p>
                  <p className="text-[10px] text-blue-400 font-bold mt-1 uppercase tracking-wider">{getDistanceLabel(reg.distance)}</p>
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
            <div className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 text-slate-900 dark:text-white">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 dark:border-white/5 pb-5">
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-900 dark:text-white/40 font-bold tracking-widest uppercase font-mono">{selectedReg.id}</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-slate-900 dark:text-white mt-1 uppercase tracking-tight">
                    {selectedReg.firstName} {selectedReg.lastName}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-900 dark:text-white/50 font-semibold mt-1 font-mono">เลขบัตร ปชช./พาสปอร์ต: {selectedReg.nationalId}</p>
                </div>
                <div className="flex flex-col sm:items-end gap-2">
                  {getStatusBadge(selectedReg.status)}
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-wider ${getDistanceColor(selectedReg.distance)}`}>
                    {getDistanceLabel(selectedReg.distance)}
                  </span>
                </div>
              </div>

              {/* Sandbox Bypass Action */}
              {selectedReg.status !== "approved" && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-200 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3 text-xs leading-relaxed">
                  <div className="flex items-start gap-2.5 text-left">
                    <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 animate-pulse mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-300">🧪 ข้ามขั้นตอนตรวจสอบ (โหมดทดสอบ)</p>
                      <p className="text-slate-500 dark:text-slate-900 dark:text-white/60 mt-0.5">กดปุ่มด้านขวาเพื่อทำการอนุมัติสลิปและออกหมายเลข BIB จำลองอัตโนมัติทันที เพื่อทดลองระบบดาวน์โหลด E-Ticket และ E-BIB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSandboxApprove}
                    disabled={sandboxApproving}
                    className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/40 text-black font-black text-[11px] uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-lg shadow-amber-500/15"
                  >
                    {sandboxApproving ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-black" fill="none" viewBox="0 0 24 24">
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
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-2xl flex items-start gap-3 text-xs leading-relaxed">
                  <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-300">สาเหตุที่หลักฐานไม่ผ่านการอนุมัติ:</p>
                    <p className="text-red-200 mt-1 font-medium">{selectedReg.rejectionReason}</p>
                    <p className="text-slate-400 dark:text-slate-900 dark:text-white/40 mt-2">กรุณาดาวน์โหลดหรือสแกนคิวอาร์โค้ด และแนบไฟล์หลักฐานสลิปการโอนเงินฉบับแก้ไขที่อ่างอิงยอดโอนตรงกันด้านล่างใหม่อีกครั้ง</p>
                  </div>
                </div>
              )}

              {selectedReg.status === "pending_verification" && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 text-blue-200 rounded-2xl flex items-start gap-3 text-xs leading-relaxed font-light">
                  <Clock className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5 animate-spin" />
                  <div>
                    <p className="font-bold text-blue-300">อยู่ระหว่างรอดำเนินการตรวจสอบข้อมูลหลักฐานสลิป</p>
                    <p className="text-slate-500 dark:text-slate-900 dark:text-white/60 mt-1">เจ้าหน้าที่จะเร่งดำเนินการตรวจเช็คยอดเงินและอัปเดตหมายเลข BIB ของท่านโดยด่วนที่สุด (ปกติภายใน 12-24 ชั่วโมง) หากผ่านการอนุมัติ บัตรรันเนอร์การ์ด BIB และบาร์โค้ดทางการจะแสดงผลด้านขวาทันที</p>
                  </div>
                </div>
              )}

              {selectedReg.status === "approved" && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-200 rounded-2xl flex items-start gap-3 text-xs leading-relaxed font-light">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-green-300">ยืนยันความถูกต้องและชำระเงินเรียบร้อยแล้ว!</p>
                    <p className="text-slate-500 dark:text-slate-900 dark:text-white/60 mt-1">ระบบได้อนุมัติหมายเลขบิ๊บวิ่งทางการให้แก่คุณเรียบร้อยแล้ว ท่านสามารถกดบันทึกหรือพิมพ์บัตรรันเนอร์การ์ดเพื่อนำมาเป็นหลักฐานยื่นรับเสื้อวิ่งจริงและบิ๊บจริงในวันจัดกิจกรรม ณ มธ. รังสิต</p>
                  </div>
                </div>
              )}

              {/* Personal specs breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-xs font-light">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-900 dark:text-white/40 block font-bold uppercase tracking-wider">เบอร์โทรศัพท์</span>
                  <span className="font-bold text-slate-900 dark:text-slate-900 dark:text-white text-sm">{selectedReg.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-900 dark:text-white/40 block font-bold uppercase tracking-wider">อีเมลผู้สมัคร</span>
                  <span className="font-bold text-slate-900 dark:text-slate-900 dark:text-white text-sm">{selectedReg.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-900 dark:text-white/40 block font-bold uppercase tracking-wider">ขนาดเสื้อวิ่ง</span>
                  <span className="font-black text-blue-400 text-sm">{selectedReg.shirtSize}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-900 dark:text-white/40 block font-bold uppercase tracking-wider">อายุ / กรุ๊ปเลือด</span>
                  <span className="font-bold text-slate-900 dark:text-slate-900 dark:text-white text-sm">{selectedReg.age} ปี / กรุ๊ป {selectedReg.bloodType}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-900 dark:text-white/40 block font-bold uppercase tracking-wider">ผู้ติดต่อฉุกเฉิน</span>
                  <span className="font-bold text-slate-900 dark:text-slate-900 dark:text-white text-sm">
                    {selectedReg.emergencyContactName} ({selectedReg.emergencyContactPhone})
                  </span>
                </div>
              </div>
            </div>

            {/* PAYMENT BOX (Only if status is pending_payment or rejected) */}
            {selectedReg.status === "pending_payment" && paymentExpired ? (
              <div className="bg-red-950/40 border border-red-500/20 rounded-3xl p-6 md:p-8 shadow-xl text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-900 dark:text-white">หมดเวลาชำระเงิน</h3>
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
              <div className="bg-white dark:bg-neutral-950/40 border border-slate-200 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 text-slate-900 dark:text-slate-900 dark:text-white" id="payment-gateway">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-base font-black italic uppercase tracking-wider flex items-center gap-2 text-slate-900 dark:text-slate-900 dark:text-white">
                    <CreditCard className="w-5 h-5 text-blue-500" /> ชำระเงินค่าสมัครวิ่ง
                  </h3>
                  {selectedReg.status === "pending_payment" && paymentTimeLeft && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl">
                      <Clock className="w-4 h-4 text-red-400 animate-pulse" />
                      <span className="text-red-400 font-mono font-bold text-sm">
                        เหลือเวลา {String(paymentTimeLeft.minutes).padStart(2, '0')}:{String(paymentTimeLeft.seconds).padStart(2, '0')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                  
                  {/* PromptPay QR Simulation Card / Uploaded Slip */}
                  <div className="sm:col-span-5 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden flex flex-col items-center shadow-2xl relative" id="ttb-promptpay-slip">
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
                          <span className="text-[10px] font-black tracking-widest text-[#004684] uppercase font-mono">
                            REF ID: {selectedReg.id}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Thai QR Payment header */}
                        <div className="w-full bg-[#004684] py-3 px-4 flex items-center justify-between text-slate-900 dark:text-slate-900 dark:text-white border-b border-blue-900">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-[9px] font-black tracking-widest uppercase font-mono text-slate-900 dark:text-slate-900 dark:text-white/95">THAI QR PAYMENT</span>
                          </div>
                          <QrCode className="w-3.5 h-3.5 text-slate-900 dark:text-slate-900 dark:text-white/80" />
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
                          <div className="mt-3 w-full max-w-[240px]">
                            <a 
                              href={`/api/qr-download?payload=${encodeURIComponent(selectedReg.qrPayload || generatePromptPayPayload("0830131768", selectedReg.price))}`} download="PromptPay_QR.png"
                              className="flex items-center justify-center gap-1.5 w-full bg-[#004684] text-slate-900 dark:text-slate-900 dark:text-white py-2 rounded-xl text-xs font-bold hover:bg-[#002d63] transition shadow shadow-blue-900/20"
                            >
                              <Download className="w-3.5 h-3.5" /> บันทึกคิวอาร์โค้ด
                            </a>
                          </div>
    
                          {/* Account Owner Details */}
                          <div className="mt-4 text-center space-y-0.5">
                            <p className="text-xs font-black text-[#002d63] tracking-wide max-w-[180px] truncate mx-auto">
                              {selectedReg.paymentAccountName || selectedReg.qrAccountName || "นาย นภัสกร กลิ่นเฟื่อง"}
                            </p>
                            <p className="text-[9px] font-bold text-slate-500 dark:text-slate-900 dark:text-white/60 uppercase tracking-wider font-mono">
                              {selectedReg.paymentBankName || "PROMPTPAY MERCHANT"}
                            </p>
                          </div>
    
                          {/* Price and reference details */}
                          <div className="mt-3 pt-2.5 border-t border-dashed border-slate-200 w-full text-center">
                            <p className="text-xl font-black text-[#004684] font-mono tracking-tight">{selectedReg.price.toFixed(2)} THB</p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-900 dark:text-white/40 font-bold font-mono tracking-wider">REF ID: {selectedReg.id}</p>
                          </div>
                        </div>
    
                        {/* Footer */}
                        <div className="w-full bg-[#004684] py-2.5 px-4 flex items-center justify-between text-slate-900 dark:text-slate-900 dark:text-white text-[10px] border-t border-blue-900/40">
                          <span className="font-semibold text-slate-800 dark:text-slate-900 dark:text-white/90">ชำระผ่าน {selectedReg.paymentBankName || "PromptPay"}</span>
                          {/* Custom styled bank badge */}
                          <div className="flex items-center gap-1.5">
                            <span className="font-black tracking-tighter text-xs uppercase text-slate-900 dark:text-slate-900 dark:text-white bg-[#002d63] px-2 py-0.5 rounded border border-white/20">THAI QR</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Payment Details & Upload */}
                  <div className="sm:col-span-7 space-y-4 text-xs text-slate-600 dark:text-slate-900 dark:text-white/70 leading-relaxed font-light">
                    <div className="space-y-1 bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                      <p className="font-bold text-slate-900 dark:text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2">
                        รายละเอียดบัญชี {selectedReg.taxDeduction || selectedReg.distance === "donation" ? "(ลดหย่อนภาษี e-Donation)" : "(บัญชีทั่วไป)"}:
                      </p>
                      <p className="text-slate-500 dark:text-slate-900 dark:text-white/60">
                        บัญชีรับเงิน: <strong className="text-slate-900 dark:text-slate-900 dark:text-white font-bold">{selectedReg.paymentAccountName || "นาย นภัสกร กลิ่นเฟื่อง"}</strong>
                      </p>
                      <p className="text-slate-500 dark:text-slate-900 dark:text-white/60">
                        ธนาคาร: <strong className="text-slate-900 dark:text-slate-900 dark:text-white font-bold">{selectedReg.paymentBankName || "ทหารไทยธนชาต (ttb)"}</strong>
                      </p>
                      <p className="text-slate-500 dark:text-slate-900 dark:text-white/60">
                        เลขที่บัญชีโอนตรง: <strong className="text-blue-400 font-black font-mono text-sm tracking-wider block mt-1">
                          {selectedReg.paymentAccountNo || "ttb PromptPay QR"}
                        </strong>
                      </p>
                    </div>

                    {/* File Upload interactive zone */}
                    <div className="space-y-2 pt-2">
                      <p className="font-bold text-slate-900 dark:text-slate-900 dark:text-white text-[10px] uppercase tracking-widest">แนบหลักฐานสลิปโอนเงิน:</p>
                      
                      <label className="border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-blue-500 bg-slate-50 dark:bg-white/5 hover:bg-blue-500/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center aspect-video relative overflow-hidden group">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleFileChange}
                          disabled={uploading}
                          className="sr-only"
                        />
                        {uploading ? (
                          <div className="space-y-2 flex flex-col items-center">
                            <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <p className="text-xs text-slate-400 dark:text-slate-900 dark:text-white/50 font-bold animate-pulse">กำลังตรวจสอบและส่งรูปภาพสลิป...</p>
                          </div>
                        ) : (
                          <div className="space-y-2 flex flex-col items-center">
                            <UploadCloud className="w-8 h-8 text-slate-400 dark:text-slate-900 dark:text-white/40 group-hover:text-blue-500 group-hover:scale-110 transition duration-200" />
                            <p className="text-xs font-black text-slate-900 dark:text-slate-900 dark:text-white">คลิกเพื่ออัปโหลด หรือ ลากไฟล์สลิปมาวางที่นี่</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-900 dark:text-white/40">รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB</p>
                          </div>
                        )}
                      </label>

                      {uploadError && (
                        <p className="text-xs font-bold text-red-400 flex items-center gap-1 mt-1.5">
                          <AlertCircle className="w-3.5 h-3.5" /> {uploadError}
                        </p>
                      )}

                      {uploadSuccess && (
                        <p className="text-xs font-bold text-green-400 flex items-center gap-1 mt-1.5 animate-bounce">
                          <CheckCircle2 className="w-3.5 h-3.5" /> อัปโหลดสำเร็จแล้ว! กำลังส่งเรื่องให้เจ้าหน้าที่ตรวจสอบ
                        </p>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: HIGH-FIDELITY BIB ONLINE CARD PREVIEW & E-TICKET */}
          <div className="lg:col-span-5 space-y-6 text-slate-900 dark:text-slate-900 dark:text-white" id="runner-pass-preview">
            
            {/* Tab switch buttons */}
            <div className="flex bg-white dark:bg-zinc-900/90 p-1 border border-slate-200 dark:border-white/5 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => setCardType("bib")}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  cardType === "bib" 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10" 
                    : "text-slate-400 dark:text-slate-900 dark:text-white/40 hover:text-slate-600 dark:text-slate-900 dark:text-white/70"
                }`}
              >
                บัตรประจำตัววิ่ง (E-BIB)
              </button>
              <button
                type="button"
                onClick={() => setCardType("ticket")}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  cardType === "ticket" 
                    ? "bg-orange-600 text-white shadow-lg shadow-orange-500/10" 
                    : "text-slate-400 dark:text-slate-900 dark:text-white/40 hover:text-slate-600 dark:text-slate-900 dark:text-white/70"
                }`}
              >
                <QrCode className="w-3.5 h-3.5" /> บัตรเข้างาน (E-Ticket)
              </button>
            </div>

            {cardType === "ticket" ? (
              /* E-Ticket Preview */
              <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-neutral-950 border border-orange-500/10 shadow-2xl p-6 flex flex-col justify-between aspect-[3/4] text-slate-900 dark:text-slate-100 max-w-sm mx-auto">
                {/* Punch out holes */}
                <div className="absolute top-[65%] -left-3.5 w-7 h-7 rounded-full bg-[#030712] border-r border-slate-200 dark:border-white/10 z-20"></div>
                <div className="absolute top-[65%] -right-3.5 w-7 h-7 rounded-full bg-[#030712] border-l border-slate-200 dark:border-white/10 z-20"></div>

                {/* E-Ticket Header */}
                <div className="text-center pb-3 border-b border-slate-200 dark:border-white/5">
                  {logoImage ? (
                    <img src={logoImage} alt="Event Logo" className="h-8 w-auto object-contain" />
                  ) : (
                    <>
                      <h4 className="text-xs font-black tracking-widest text-orange-500 uppercase italic">LSEd Running 2569</h4>
                      <p className="text-[8px] text-slate-300 dark:text-slate-900 dark:text-white/30 uppercase tracking-widest mt-0.5 font-mono">Learning Sciences & Education TU</p>
                    </>
                  )}
                </div>

                {/* Badge */}
                <div className="my-2.5 text-center">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-[10px] font-black tracking-wider uppercase">
                    <Sparkles className="w-3 h-3 text-orange-500 animate-pulse" /> EVENT ENTRANCE PASS
                  </span>
                </div>

                {/* QR Code container */}
                <div className="bg-white p-3 rounded-2xl mx-auto flex items-center justify-center shadow-lg border border-slate-200 dark:border-white/5 w-44 h-44">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(selectedReg.id)}`}
                    alt="Entry QR Code"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Registration text ID */}
                <div className="text-center mt-2.5 pb-2 border-b border-dashed border-slate-200 dark:border-white/10">
                  <span className="text-[8px] text-slate-300 dark:text-slate-900 dark:text-white/30 font-black tracking-wider uppercase block">REGISTRATION ID</span>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-900 dark:text-white/80 font-mono mt-0.5 tracking-wider">{selectedReg.id}</p>
                </div>

                {/* Info block */}
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 pt-2.5 text-xs">
                  <div className="col-span-2">
                    <span className="text-[8px] text-slate-400 dark:text-slate-900 dark:text-white/40 font-bold uppercase block">Runner Name</span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-900 dark:text-white text-sm truncate block">{selectedReg.firstName} {selectedReg.lastName}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 dark:text-slate-900 dark:text-white/40 font-bold uppercase block">BIB Number</span>
                    <span className="font-black text-orange-400 font-mono text-base block">{selectedReg.bibNumber || "PENDING"}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 dark:text-slate-900 dark:text-white/40 font-bold uppercase block">Distance</span>
                    <span className="font-bold text-blue-400 block">{getDistanceLabel(selectedReg.distance)}</span>
                  </div>
                </div>

                {/* Footer text info */}
                <div className="text-center text-[8px] text-slate-900 dark:text-slate-900 dark:text-white/20 border-t border-slate-200 dark:border-white/5 pt-2">
                  โปรดนำคิวอาร์โค้ดนี้แสดงแก่เจ้าหน้าที่ ณ จุดลงทะเบียนเข้างาน
                </div>
              </div>
            ) : (
              /* BIB Card Frame */
              <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-neutral-950 border border-slate-200 dark:border-white/10 shadow-2xl p-6 flex flex-col justify-between aspect-[3/4] text-slate-900 dark:text-slate-900 dark:text-white max-w-sm mx-auto">
                
                {/* Event Watermark behind */}
                <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center select-none font-black text-slate-900 dark:text-slate-900 dark:text-white text-9xl">
                  {selectedReg.distance}
                </div>

                {/* BIB HEADER */}
                <div className="relative z-10 bg-white dark:bg-neutral-950 border-b border-slate-200 dark:border-white/10 p-4 -mx-6 -mt-6 flex justify-between items-center text-slate-900 dark:text-slate-900 dark:text-white">
                  <div>
                    {logoImage ? (
                      <img src={logoImage} alt="Event Logo" className="h-8 w-auto object-contain" />
                    ) : (
                      <>
                        <h4 className="text-xs font-black tracking-widest text-blue-400 uppercase italic">LSEd Running</h4>
                        <p className="text-[8px] text-slate-400 dark:text-slate-900 dark:text-white/50 uppercase font-black tracking-wider mt-0.5 font-mono">Learning Sciences & Education TU</p>
                      </>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">2569 BE</span>
                  </div>
                </div>

                {/* BIB MAIN AREA (White card panel resembling physical running BIB) */}
                <div className="relative z-10 bg-white border border-slate-100 rounded-2xl p-4 md:p-6 my-4 flex-grow flex flex-col justify-between shadow-lg">
                  
                  {referrals >= 3 && (
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-slate-900 dark:text-slate-900 dark:text-white text-[8px] font-black px-2.5 py-1 rounded-full shadow-md border border-amber-300 animate-bounce flex items-center gap-1 z-30">
                      <Sparkles className="w-2.5 h-2.5 animate-pulse text-amber-100" /> LSEd Light-Bringer
                    </div>
                  )}
                  
                  {/* Distance stripe */}
                  <div className="absolute top-0 left-0 right-0 h-3 rounded-t-2xl overflow-hidden flex">
                    <div className={`w-full h-full ${
                      selectedReg.distance === "10K" ? "bg-indigo-600" : selectedReg.distance === "5K" ? "bg-blue-600" : "bg-zinc-800"
                    }`}></div>
                  </div>

                  {/* Status/Verified Watermark overlay */}
                  {selectedReg.status !== "approved" && (
                    <div className="absolute inset-0 z-25 bg-white/70 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-2xl">
                      <div className="border-4 border-dashed border-amber-500/70 text-amber-600 font-black text-center text-lg p-2.5 uppercase tracking-widest rounded-xl transform -rotate-12 animate-pulse">
                        รออนุมัติสลิป<br/><span className="text-[10px]">PENDING APPROVE</span>
                      </div>
                    </div>
                  )}

                  {/* Runner details inside BIB */}
                  <div className="flex justify-between items-start pt-2">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                      selectedReg.distance === "10K" ? "bg-indigo-100 text-indigo-700" : selectedReg.distance === "5K" ? "bg-blue-100 text-blue-700" : "bg-zinc-100 text-zinc-700"
                    }`}>
                      {selectedReg.distance === "10K" ? "Mini Marathon" : selectedReg.distance === "5K" ? "Micro Marathon" : "Fun Run"}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-900 dark:text-white/40 font-bold uppercase tracking-wider">BIB CARD</span>
                  </div>

                                    

                  {/* BIB NUMBER DISPLAY */}
                  <div className="text-center py-4">
                    <h2 className="text-5xl md:text-6xl font-black font-mono tracking-tighter text-slate-900 dark:text-slate-900 dark:text-white leading-none">
                      {selectedReg.bibNumber || "LXX-XXXX"}
                    </h2>
                  </div>

                  {/* Runner Name & Info inside BIB */}
                  <div className="border-t border-slate-100 pt-3 flex justify-between items-end">
                    <div className="space-y-0.5 text-left">
                      <p className="text-[8px] text-slate-400 dark:text-slate-900 dark:text-white/40 uppercase font-bold tracking-wider">Runner Name</p>
                      <p className="text-sm font-black text-slate-900 dark:text-slate-900 dark:text-white leading-tight uppercase tracking-tight">
                        {selectedReg.firstName} {selectedReg.lastName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] text-slate-400 dark:text-slate-900 dark:text-white/40 uppercase font-bold tracking-wider">Shirt Size</p>
                      <p className="text-sm font-black text-blue-600">{selectedReg.shirtSize}</p>
                    </div>
                  </div>

                  {/* Barcode representation */}
                  <div className="border-t border-dashed border-slate-200 pt-3 flex flex-col items-center">
                    <div className="flex gap-0.5 justify-center h-6 w-full items-center">
                      {[1,3,1,2,1,4,1,2,3,1,1,2,1,4,1,3,1,2,1,2,3,1,4,1,1,2].map((w, idx) => (
                        <div 
                          key={idx} 
                          className="bg-white dark:bg-slate-900 h-full" 
                          style={{ width: `${w * 1.5}px`, opacity: idx % 2 === 0 ? 1 : 0 }}
                        ></div>
                      ))}
                    </div>
                    <p className="text-[8px] text-slate-400 dark:text-slate-900 dark:text-white/40 font-bold font-mono mt-1 tracking-widest">{selectedReg.id}</p>
                  </div>
                </div>

                {/* BIB FOOTER (Emergency Contact Details) */}
                <div className="relative z-10 flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-900 dark:text-white/40 border-t border-slate-200 dark:border-white/5 pt-3 -mx-2 mb-0">
                  <div className="space-y-0.5 text-left">
                    <p className="text-[8px] text-slate-300 dark:text-slate-900 dark:text-white/30 font-bold uppercase tracking-wider">Emergency Contact</p>
                    <p className="text-slate-900 dark:text-slate-900 dark:text-white font-bold truncate max-w-[150px]">
                      {selectedReg.emergencyContactName || "N/A"}
                    </p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="text-[8px] text-slate-300 dark:text-slate-900 dark:text-white/30 font-bold uppercase tracking-wider">Phone / Blood</p>
                    <p className="text-slate-900 dark:text-slate-900 dark:text-white font-bold">
                      {selectedReg.emergencyContactPhone || "N/A"} ({selectedReg.bloodType || "N/A"})
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* Print and Share helper triggers */}
            {selectedReg.status === "approved" && (
              <div className="flex flex-col gap-2.5 sm:flex-row justify-center items-center">
                {cardType === "ticket" ? (
                  <button
                    type="button"
                    onClick={handleDownloadTicket}
                    disabled={downloadingTicket}
                    className="w-full sm:w-auto px-5 py-3 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-500/10"
                  >
                    {downloadingTicket ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-slate-900 dark:text-slate-900 dark:text-white" fill="none" viewBox="0 0 24 24">
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
                      className="w-full sm:w-auto px-4 py-2.5 bg-white text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer hover:bg-slate-200"
                    >
                      <Printer className="w-3.5 h-3.5" /> สั่งพิมพ์บัตรวิ่ง
                    </button>
                    <a
                      href={`data:text/plain;charset=utf-8,LSEd Running 2569 BIB Confirmation: ${selectedReg.id} BIB: ${selectedReg.bibNumber} Runner: ${selectedReg.firstName} ${selectedReg.lastName}`}
                      download={`BIB_${selectedReg.bibNumber}_LSED.txt`}
                      className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-blue-500/20"
                    >
                      <Download className="w-3.5 h-3.5" /> บันทึกข้อมูล
                    </a>
                  </>
                )}
              </div>
            )}

            {/* Postal shipping tracking system check */}
            {selectedReg.status === "approved" && selectedReg.deliveryMethod === "shipping" && (
              <div className="bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-white/10 rounded-3xl p-5 space-y-4 text-slate-900 dark:text-white mt-4">
                <h3 className="text-xs font-black italic uppercase tracking-wider flex items-center gap-2 text-slate-900 dark:text-slate-900 dark:text-white">
                  <Truck className="w-4 h-4 text-orange-400 animate-pulse" /> ข้อมูลการจัดส่งเสื้อยืดและของที่ระลึกทางไปรษณีย์
                </h3>
                <div className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl p-4 space-y-3 text-xs leading-relaxed">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-2">
                    <span className="text-slate-400 dark:text-slate-900 dark:text-white/50">สถานะการจัดส่ง:</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                      selectedReg.shippingTrackingNumber 
                        ? "bg-orange-500/10 border border-orange-500/20 text-orange-400" 
                        : "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                    }`}>
                      {selectedReg.shippingTrackingNumber ? "จัดส่งพัสดุเรียบร้อยแล้ว" : "กำลังเตรียมการจัดส่ง"}
                    </span>
                  </div>

                  {selectedReg.shippingTrackingNumber && (
                    <>
                      <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-2">
                        <span className="text-slate-400 dark:text-slate-900 dark:text-white/50">ผู้จัดส่งพัสดุ (Carrier):</span>
                        <span className="font-extrabold text-slate-900 dark:text-slate-900 dark:text-white text-[11px] bg-slate-50 dark:bg-white/5 px-2 py-0.5 rounded border border-slate-200 dark:border-white/10">
                          {selectedReg.shippingCarrier === "flash" ? "Flash Express" :
                           selectedReg.shippingCarrier === "kerry" ? "Kerry Express" :
                           selectedReg.shippingCarrier === "jandt" ? "J&T Express" :
                           "ไปรษณีย์ไทย (EMS)"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-2">
                        <span className="text-slate-400 dark:text-slate-900 dark:text-white/50">เลขพัสดุ (Tracking Number):</span>
                        <strong className="text-orange-400 font-black font-mono text-sm tracking-widest bg-orange-500/5 px-2 py-0.5 rounded border border-orange-500/15">
                          {selectedReg.shippingTrackingNumber}
                        </strong>
                      </div>

                      {selectedReg.shippedAt && (
                        <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-2">
                          <span className="text-slate-400 dark:text-slate-900 dark:text-white/50">วันเวลาจัดส่ง (Shipped At):</span>
                          <span className="font-bold text-slate-900 dark:text-slate-900 dark:text-white/75 font-mono">
                            {selectedReg.shippedAt}
                          </span>
                        </div>
                      )}

                      {/* Visual Timeline Stepper */}
                      <div className="py-4 border-b border-slate-200 dark:border-white/5">
                        <p className="text-[9px] text-slate-300 dark:text-slate-900 dark:text-white/30 uppercase font-black tracking-wider text-center mb-3">สถานะเรียลไทม์ (Real-time Timeline)</p>
                        <div className="relative flex items-center justify-between max-w-xs mx-auto">
                          {/* Background Line */}
                          <div className="absolute left-0 right-0 top-2 h-0.5 bg-slate-100 dark:bg-white/10 z-0"></div>
                          {/* Active Progress Line */}
                          <div className="absolute left-0 right-1/2 top-2 h-0.5 bg-orange-500 z-0"></div>
                          
                          {/* Step 1: Packing */}
                          <div className="z-10 flex flex-col items-center text-center space-y-1">
                            <div className="w-4 h-4 rounded-full bg-orange-500 border border-neutral-900 flex items-center justify-center font-black text-[8px] text-slate-900 dark:text-white shadow">✓</div>
                            <span className="text-[9px] text-slate-900 dark:text-slate-900 dark:text-white/80 font-bold block">เตรียมส่ง</span>
                          </div>
                          
                          {/* Step 2: Shipped */}
                          <div className="z-10 flex flex-col items-center text-center space-y-1">
                            <div className="w-4 h-4 rounded-full bg-orange-500 border border-neutral-900 flex items-center justify-center font-black text-[8px] text-slate-900 dark:text-white shadow">✓</div>
                            <span className="text-[9px] text-orange-400 font-bold block">จัดส่งแล้ว</span>
                          </div>

                          {/* Step 3: Delivering */}
                          <div className="z-10 flex flex-col items-center text-center space-y-1">
                            <div className="w-4 h-4 rounded-full bg-neutral-800 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 dark:text-white/40 font-bold text-[8px]"></div>
                            <span className="text-[9px] text-slate-400 dark:text-slate-900 dark:text-white/40 block">นำจ่าย</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-1 pt-1 border-b border-slate-200 dark:border-white/5 pb-3">
                    <span className="text-slate-400 dark:text-slate-900 dark:text-white/50 block">ที่อยู่จัดส่ง:</span>
                    <p className="text-slate-900 dark:text-slate-900 dark:text-white bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5 text-[11px] leading-relaxed">
                      {selectedReg.shippingAddress || "ไม่พบข้อมูลที่อยู่จัดส่ง กรุณาติดต่อแอดมินเพื่อแก้ไขข้อมูล"}
                    </p>
                  </div>

                  {selectedReg.shippingTrackingNumber && (
                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedReg.shippingTrackingNumber || "");
                          alert("คัดลอกเลขพัสดุเรียบร้อยแล้ว: " + selectedReg.shippingTrackingNumber);
                        }}
                        className="px-3.5 py-2 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-slate-900 dark:text-white font-bold rounded-xl border border-slate-200 dark:border-white/10 transition text-[10px] uppercase tracking-wider cursor-pointer"
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
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl transition text-[10px] uppercase tracking-widest flex items-center gap-1 cursor-pointer shadow-lg shadow-orange-500/20"
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
          <section className="bg-gradient-to-br from-neutral-950 via-zinc-900 to-indigo-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-900 dark:text-white rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
            <div className="relative z-10 max-w-2xl space-y-4">
              <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-wider flex items-center gap-2 text-slate-900 dark:text-slate-900 dark:text-white">
                <Truck className="w-6 h-6 text-blue-500" /> ตรวจสอบเลขพัสดุจัดส่งไปรษณีย์
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-900 dark:text-white/50 leading-relaxed font-light">
                ค้นหารายชื่อผู้จัดส่งเสื้อและของที่ระลึกที่เลือกรับทางไปรษณีย์ โดยสามารถค้นหาด้วย **ชื่อ, นามสกุล, หมายเลข BIB หรือ เลขพัสดุ**
              </p>

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-900 dark:text-white/40" />
                <input 
                  type="text" 
                  value={shippingSearchQuery}
                  onChange={(e) => setShippingSearchQuery(e.target.value)}
                  placeholder="ค้นหารายชื่อจัดส่ง, เลข BIB..."
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                />
              </div>
              <div className="pt-2">
                <a 
                  href="https://track.thailandpost.co.th/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 font-bold text-xs uppercase tracking-wider rounded-xl border border-red-500/20 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> ระบบติดตามพัสดุไปรษณีย์ไทย (Track & Trace)
                </a>
              </div>
            </div>
          </section>

          {shippingLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500 dark:text-slate-900 dark:text-white/60">
              <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-xs">กำลังโหลดข้อมูลการจัดส่ง...</span>
            </div>
          ) : filteredShipping.length === 0 ? (
            <div className="bg-white dark:bg-neutral-950/40 border border-slate-200 dark:border-white/5 rounded-3xl p-12 text-center text-slate-400 dark:text-slate-900 dark:text-white/40 space-y-2">
              <Truck className="w-12 h-12 text-slate-900 dark:text-slate-900 dark:text-white/10 mx-auto" />
              <p className="text-sm font-bold">ไม่พบข้อมูลการจัดส่ง</p>
              <p className="text-xs max-w-md mx-auto">เฉพาะผู้สมัครสถานะอนุมัติ (ชำระเงินเรียบร้อย) ที่เลือกจัดส่งทางไปรษณีย์เท่านั้นที่จะแสดงผลในระบบนี้</p>
            </div>
          ) : (
            <div className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 bg-black/35 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-white/40">
                      <th className="px-6 py-4">หมายเลขสมัคร / รันเนอร์</th>
                      <th className="px-6 py-4">เบอร์โทร</th>
                      <th className="px-6 py-4">หมายเลข BIB</th>
                      <th className="px-6 py-4">เลขพัสดุ (Tracking)</th>
                      <th className="px-6 py-4 text-right">ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-slate-900 dark:text-slate-900 dark:text-white">
                    {filteredShipping.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:bg-white/5 transition">
                        <td className="px-6 py-4">
                          <span className="text-[10px] text-slate-400 dark:text-slate-900 dark:text-white/40 font-mono block">{item.id}</span>
                          <span className="font-bold text-slate-900 dark:text-slate-900 dark:text-white text-sm">{item.firstName} {item.lastName}</span>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-900 dark:text-white/60">{item.phone}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg font-black font-mono text-xs">
                            {item.bibNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {item.shippingTrackingNumber ? (
                            <div className="space-y-1">
                              <span className="font-mono font-bold text-orange-400 text-sm tracking-wider bg-orange-500/5 px-2 py-1 rounded border border-orange-500/10 block w-fit">
                                {item.shippingTrackingNumber}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-900 dark:text-white/40 block">
                                ขนส่ง: {item.shippingCarrier === "flash" ? "Flash Express" :
                                       item.shippingCarrier === "kerry" ? "Kerry Express" :
                                       item.shippingCarrier === "jandt" ? "J&T Express" :
                                       "ไปรษณีย์ไทย (EMS)"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-900 dark:text-white/30 italic">กำลังเตรียมพัสดุ</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {item.shippingTrackingNumber ? (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(item.shippingTrackingNumber);
                                  alert("คัดลอกเลขพัสดุเรียบร้อยแล้ว: " + item.shippingTrackingNumber);
                                }}
                                className="px-2.5 py-1.5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-slate-900 dark:text-white font-bold rounded-lg border border-slate-200 dark:border-white/10 transition text-[10px] uppercase tracking-wider cursor-pointer"
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
                                className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                              >
                                ติดตามพัสดุ
                              </a>
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-900 dark:text-white/40 text-[10px]">เตรียมจัดส่งใน 1-2 วัน</span>
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
