import React, { useState, useEffect } from "react";
import { 
  Activity, 
  UserPlus, 
  Search, 
  Settings, 
  Home, 
  PhoneCall, 
  GraduationCap,
  Sparkles,
  Sun,
  Moon
} from "lucide-react";
import LandingPage from "./components/LandingPage.js";
import RegistrationForm from "./components/RegistrationForm.js";
import StatusChecker from "./components/StatusChecker.js";
import AdminPortal from "./components/AdminPortal.js";
import { EventStats, DistanceType } from "./types.js";

type TabType = "home" | "register" | "status" | "admin";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [preselectedDistance, setPreselectedDistance] = useState<DistanceType | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [initialSearchQuery, setInitialSearchQuery] = useState<string>("");
  const [statusInitialTab, setStatusInitialTab] = useState<"lookup" | "shipping">("lookup");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark" || 
        (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);
  const [logoImage, setLogoImage] = useState<string>("");

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/stats");
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto-populate mock data on very first boot if db is completely empty
    const checkAndInitDB = async () => {
      try {
        const response = await fetch("/api/registrations");
        const list = await response.json();
        if (response.ok && list.length === 0) {
          // DB is clean. Let's pre-populate mock runners for a gorgeous first view!
          await fetch("/api/admin/populate-mock", { method: "POST" });
          fetchStats();
        }
      } catch (err) {
        console.error("Auto-init DB failed:", err);
      }
    };
    checkAndInitDB();
  }, []);

  const handleNavigateToStatus = (query: string) => {
    setInitialSearchQuery(query);
    setStatusInitialTab("lookup");
    setActiveTab("status");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white flex flex-col font-sans selection:bg-blue-600/30 dark:selection:bg-orange-500/30 relative overflow-hidden" id="main-app">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-blue-500 rounded-full blur-[120px] opacity-10 pointer-events-none"></div>
      <div className="absolute bottom-[-150px] left-[-150px] w-[600px] h-[600px] bg-indigo-300 rounded-full blur-[150px] opacity-10 pointer-events-none"></div>

      {/* Sticky Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-neutral-950/85 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 shadow-sm" id="app-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* LOGO AND TITLE */}
          <div 
            onClick={() => { setActiveTab("home"); setInitialSearchQuery(""); }}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            {logoImage ? (
              <img src={logoImage} alt="Event Logo" className="h-12 w-auto object-contain transition duration-200 group-hover:scale-105" />
            ) : (
              <>
                <div className="flex items-center gap-1.5 bg-[#E25B45]/10 px-3 py-1.5 rounded-xl border border-[#E25B45]/20">
                  <span className="text-2xl font-black tracking-wide italic text-blue-600 dark:text-orange-500 transition duration-200 group-hover:scale-105">LSEd</span>
                  <span className="text-sm font-black tracking-wider text-slate-950 dark:text-white uppercase">RUNNING 2569</span>
                </div>
                <div className="hidden sm:flex flex-col text-left border-l border-slate-200 dark:border-white/10 pl-2.5">
                  <span className="text-xs font-extrabold tracking-wider text-[#7F1D1D] uppercase flex items-center gap-1">
                    Run to Shine <Sparkles className="w-3.5 h-3.5 text-[#E25B45] animate-pulse" />
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-white/60">โครงการวิ่งฉายแสง</span>
                </div>
              </>
            )}
          </div>

          {/* DESKTOP TABS */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold tracking-widest uppercase">
            <button
              onClick={() => { setActiveTab("home"); setInitialSearchQuery(""); }}
              className={`transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "home" ? "text-blue-600 dark:text-orange-500" : "text-slate-600 dark:text-white/70 hover:text-blue-600 dark:hover:text-orange-400"
              }`}
            >
              <Home className="w-3.5 h-3.5" /> หน้าแรก
            </button>
            <button
              onClick={() => { setPreselectedDistance(null); setActiveTab("register"); setInitialSearchQuery(""); }}
              className={`transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "register" ? "text-blue-600 dark:text-orange-500" : "text-slate-600 dark:text-white/70 hover:text-blue-600 dark:hover:text-orange-400"
              }`}
              id="nav-register-btn"
            >
              <UserPlus className="w-3.5 h-3.5" /> สมัครวิ่งออนไลน์
            </button>
            <button
              onClick={() => { setStatusInitialTab("lookup"); setActiveTab("status"); }}
              className={`transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "status" ? "text-blue-600 dark:text-orange-500" : "text-slate-600 dark:text-white/70 hover:text-blue-600 dark:hover:text-orange-400"
              }`}
              id="nav-status-btn"
            >
              <Search className="w-3.5 h-3.5" /> ตรวจสอบสิทธิ์ / ส่งสลิป
            </button>
            <button
              onClick={() => { setActiveTab("admin"); }}
              className={`transition cursor-pointer bg-slate-950 dark:bg-white text-white dark:text-black px-4 py-2 rounded-full hover:bg-slate-800 dark:hover:bg-white/90 text-xs font-black ${
                activeTab === "admin" ? "ring-2 ring-blue-500 dark:ring-orange-500" : ""
              }`}
              id="nav-admin-btn"
            >
              <Settings className="w-3.5 h-3.5 inline mr-1" /> Admin Portal
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 ml-4 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 transition"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </nav>

          {/* MOBILE FAST ACTION (Register) */}
          <div className="md:hidden">
            <button
              onClick={() => { setPreselectedDistance(null); setActiveTab(activeTab === "register" ? "home" : "register"); }}
              className="px-4 py-2 bg-orange-600 text-white font-black text-xs uppercase tracking-widest rounded-full flex items-center gap-1 shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" /> {activeTab === "register" ? "กลับหน้าหลัก" : "สมัครวิ่ง"}
            </button>
          </div>

        </div>
      </header>

      {/* MOBILE LOWER SYSTEM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-black/90 backdrop-blur-md border-t border-slate-200 dark:border-white/10 z-40 shadow-xl flex justify-around p-3.5 text-slate-500 dark:text-white/60">
        <button 
          onClick={() => { setActiveTab("home"); setInitialSearchQuery(""); }}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${activeTab === "home" ? "text-blue-600 dark:text-orange-500" : "hover:text-slate-900 dark:hover:text-white"}`}
        >
          <Home className="w-4.5 h-4.5" />
          <span>หน้าหลัก</span>
        </button>
        <button 
          onClick={() => { setPreselectedDistance(null); setActiveTab("register"); setInitialSearchQuery(""); }}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${activeTab === "register" ? "text-blue-600 dark:text-orange-500" : "hover:text-slate-900 dark:hover:text-white"}`}
        >
          <UserPlus className="w-4.5 h-4.5" />
          <span>สมัครวิ่ง</span>
        </button>
        <button 
          onClick={() => { setStatusInitialTab("lookup"); setActiveTab("status"); }}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${activeTab === "status" ? "text-blue-600 dark:text-orange-500" : "hover:text-slate-900 dark:hover:text-white"}`}
        >
          <Search className="w-4.5 h-4.5" />
          <span>เช็คสิทธิ์</span>
        </button>
        <button 
          onClick={() => { setActiveTab("admin"); }}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${activeTab === "admin" ? "text-blue-600 dark:text-orange-500" : "hover:text-slate-900 dark:hover:text-white"}`}
        >
          <Settings className="w-4.5 h-4.5" />
          <span>หลังบ้าน</span>
        </button>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider hover:text-slate-900 dark:hover:text-white"
        >
          {isDarkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          <span>{isDarkMode ? 'Light' : 'Dark'}</span>
        </button>
      </nav>

      {/* Main Content Render Frame */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 mb-16 md:mb-0 z-10">
        
        {/* LANDING TAB */}
        {activeTab === "home" && (
          <LandingPage 
            onRegisterClick={(dist) => { setPreselectedDistance(dist || null); setActiveTab("register"); }} 
            onCheckStatusClick={() => { setStatusInitialTab("lookup"); setActiveTab("status"); }} 
            onCheckShippingClick={() => { setStatusInitialTab("shipping"); setActiveTab("status"); }} 
            stats={stats}
          />
        )}

        {/* REGISTRATION FORM TAB */}
        {activeTab === "register" && (
          <RegistrationForm 
            onSuccess={(reg) => handleNavigateToStatus(reg.id)} 
            onCancel={() => setActiveTab("home")}
            preselectedDistance={preselectedDistance}
          />
        )}

        {/* STATUS CHECKER & PAYMENT TAB */}
        {activeTab === "status" && (
          <StatusChecker 
            initialQuery={initialSearchQuery} 
            onRefreshStats={fetchStats}
            initialTab={statusInitialTab}
            stats={stats}
          />
        )}

        {/* ADMIN PORTAL TAB */}
        {activeTab === "admin" && (
          <AdminPortal 
            stats={stats} 
            onRefresh={fetchStats} 
            onSearchLookup={handleNavigateToStatus}
          />
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-slate-100 dark:bg-neutral-950 border-t border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/60 py-10 text-xs text-center z-10" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <div className="flex justify-center items-center gap-2 text-white">
            <GraduationCap className="w-5 h-5 text-blue-600 dark:text-orange-500" />
            <span className="font-bold">คณะวิทยาการเรียนรู้และศึกษาศาสตร์ มหาวิทยาลัยธรรมศาสตร์</span>
          </div>
          <p className="max-w-xl mx-auto leading-relaxed text-white/70">
            โครงการเดิน-วิ่งการกุศล LSEd Running 2569 ประจำปีการศึกษา 2569<br/>
            ณ จุดปล่อยตัวอาคารสิริวิทยาลักษณ์ คณะวิทยาการเรียนรู้และศึกษาศาสตร์ มหาวิทยาลัยธรรมศาสตร์ ศูนย์รังสิต
          </p>
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3 max-w-2xl mx-auto text-[10px] text-slate-400 dark:text-white/40">
            <div className="text-center sm:text-left">
              <p>© 2026 LSEd TU. All rights reserved.</p>
              <p className="text-[10px] text-[#E25B45] font-black mt-1">ผู้พัฒนาเว็บ: คณะกรรมการนักศึกษา กน.วรศ. ปี 2569</p>
            </div>
            <div className="flex gap-4">
              <a href="https://lsed.tu.ac.th/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 dark:hover:text-orange-400 font-medium transition">ติดต่อคณะวิทยาการเรียนรู้ฯ</a>
              <span>•</span>
              <a href="#" className="text-blue-500 hover:text-blue-700 dark:hover:text-orange-400 font-medium transition">สายด่วนช่วยเหลือทางการแพทย์</a>
              <span>•</span>
              <a href="mailto:Napatsakorn.del@gmail.com" className="text-blue-500 hover:text-blue-700 dark:hover:text-orange-400 font-medium transition">แจ้งปัญหาด้านระบบลงทะเบียน</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
