import React, { useState, useEffect } from "react";
import { 
  Activity, 
  UserPlus, 
  Search, 
  Settings, 
  Home, 
  PhoneCall, 
  GraduationCap,
  Sparkles
} from "lucide-react";
import LandingPage from "./components/LandingPage.js";
import RegistrationForm from "./components/RegistrationForm.js";
import StatusChecker from "./components/StatusChecker.js";
import AdminPortal from "./components/AdminPortal.js";
import { EventStats, DistanceType } from "./types.js";
import { fetchEventStats } from "./lib/dataService.js";
import { db } from "./lib/firebaseClient.js";
import { doc, getDoc } from "firebase/firestore";

type TabType = "home" | "register" | "status" | "admin";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [preselectedDistance, setPreselectedDistance] = useState<DistanceType | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [initialSearchQuery, setInitialSearchQuery] = useState<string>("");
  const [statusInitialTab, setStatusInitialTab] = useState<"lookup" | "shipping">("lookup");
  const [logoImage, setLogoImage] = useState<string>("");

  // Enforce pure light theme
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    try {
      localStorage.setItem("theme", "light");
    } catch (e) {
      // ignore
    }
  }, []);

  const fetchStats = async () => {
    try {
      const data = await fetchEventStats();
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  useEffect(() => {
    fetchStats();

    // Fetch logo image from settings/assets
    const fetchLogo = async () => {
      try {
        const docRef = doc(db, "settings", "assets");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().logoImage) {
          setLogoImage(docSnap.data().logoImage);
        }
      } catch (err) {
        console.warn("Failed to load logo from Firestore:", err);
      }
    };
    fetchLogo();
  }, []);

  const handleNavigateToStatus = (query: string) => {
    setInitialSearchQuery(query);
    setStatusInitialTab("lookup");
    setActiveTab("status");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFB] text-slate-800 flex flex-col font-sans selection:bg-teal-500/25 selection:text-teal-950 relative overflow-hidden" id="main-app">
      
      {/* Background Decorative Ambient Glows in Turquoise & Warm Orange */}
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-teal-400/12 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute top-[35%] left-[-150px] w-[450px] h-[450px] bg-orange-400/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-150px] right-[10%] w-[500px] h-[500px] bg-teal-300/10 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Sticky Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-teal-500/15 shadow-xs" id="app-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* LOGO AND TITLE */}
          <div 
            onClick={() => { setActiveTab("home"); setInitialSearchQuery(""); }}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            {logoImage ? (
              <img 
                src={logoImage} 
                alt="Run to Shine Logo" 
                className="h-11 w-11 rounded-xl object-cover shadow-xs border border-teal-500/20 transition-transform duration-300 group-hover:scale-105" 
              />
            ) : (
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-teal-500 to-orange-500 flex items-center justify-center text-white font-black text-sm shadow-xs transition-transform duration-300 group-hover:scale-105">
                TU
              </div>
            )}
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5 leading-none mb-1">
                <span className="text-2xl font-black tracking-tight italic text-teal-600 transition-colors">LSEd</span>
                <span className="text-sm font-black tracking-wider text-slate-900 uppercase">RUNNING 2569</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 leading-none">
                <span className="text-[11px] font-extrabold tracking-wider text-orange-600 uppercase flex items-center gap-1">
                  Run to Shine <Sparkles className="w-3 h-3 text-orange-500 animate-pulse" />
                </span>
                <span className="text-[10px] font-medium text-slate-400">• โครงการวิ่งฉายแสง</span>
              </div>
            </div>
          </div>

          {/* DESKTOP TABS */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold tracking-wider uppercase">
            <button
              onClick={() => { setActiveTab("home"); setInitialSearchQuery(""); }}
              className={`transition-all duration-200 cursor-pointer flex items-center gap-1.5 py-1.5 relative ${
                activeTab === "home" 
                  ? "text-teal-700 font-extrabold" 
                  : "text-slate-600 hover:text-teal-700"
              }`}
            >
              <Home className="w-3.5 h-3.5" /> หน้าแรก
              {activeTab === "home" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-500 to-orange-500 rounded-full"></span>
              )}
            </button>
            <button
              onClick={() => { setPreselectedDistance(null); setActiveTab("register"); setInitialSearchQuery(""); }}
              className={`transition-all duration-200 cursor-pointer flex items-center gap-1.5 py-1.5 relative ${
                activeTab === "register" 
                  ? "text-teal-700 font-extrabold" 
                  : "text-slate-600 hover:text-teal-700"
              }`}
              id="nav-register-btn"
            >
              <UserPlus className="w-3.5 h-3.5" /> สมัครวิ่งออนไลน์
              {activeTab === "register" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-500 to-orange-500 rounded-full"></span>
              )}
            </button>
            <button
              onClick={() => { setStatusInitialTab("lookup"); setActiveTab("status"); }}
              className={`transition-all duration-200 cursor-pointer flex items-center gap-1.5 py-1.5 relative ${
                activeTab === "status" 
                  ? "text-teal-700 font-extrabold" 
                  : "text-slate-600 hover:text-teal-700"
              }`}
              id="nav-status-btn"
            >
              <Search className="w-3.5 h-3.5" /> ตรวจสอบสิทธิ์ / ส่งสลิป
              {activeTab === "status" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-500 to-orange-500 rounded-full"></span>
              )}
            </button>
            
            <button
              onClick={() => { setActiveTab("admin"); }}
              className={`transition-all duration-200 cursor-pointer px-4 py-2 rounded-xl text-xs font-bold border ${
                activeTab === "admin" 
                  ? "bg-teal-50 border-teal-500 text-teal-800 ring-2 ring-teal-500/20" 
                  : "border-slate-300 hover:border-teal-500 text-slate-700 hover:text-teal-700 bg-white shadow-xs"
              }`}
              id="nav-admin-btn"
            >
              <Settings className="w-3.5 h-3.5 inline mr-1 text-orange-500" /> Admin Portal
            </button>
          </nav>

          {/* MOBILE FAST ACTION (Register) */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => { setPreselectedDistance(null); setActiveTab(activeTab === "register" ? "home" : "register"); }}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-orange-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center gap-1 shadow-sm shadow-teal-500/20 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" /> {activeTab === "register" ? "กลับหน้าหลัก" : "สมัครวิ่ง"}
            </button>
          </div>

        </div>
      </header>

      {/* MOBILE LOWER SYSTEM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 shadow-xl flex justify-around p-3 text-slate-600">
        <button 
          onClick={() => { setActiveTab("home"); setInitialSearchQuery(""); }}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${activeTab === "home" ? "text-teal-600 font-extrabold" : "hover:text-slate-900"}`}
        >
          <Home className="w-4 h-4" />
          <span>หน้าหลัก</span>
        </button>
        <button 
          onClick={() => { setPreselectedDistance(null); setActiveTab("register"); setInitialSearchQuery(""); }}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${activeTab === "register" ? "text-teal-600 font-extrabold" : "hover:text-slate-900"}`}
        >
          <UserPlus className="w-4 h-4" />
          <span>สมัครวิ่ง</span>
        </button>
        <button 
          onClick={() => { setStatusInitialTab("lookup"); setActiveTab("status"); }}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${activeTab === "status" ? "text-teal-600 font-extrabold" : "hover:text-slate-900"}`}
        >
          <Search className="w-4 h-4" />
          <span>เช็คสิทธิ์</span>
        </button>
        <button 
          onClick={() => { setActiveTab("admin"); }}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${activeTab === "admin" ? "text-teal-600 font-extrabold" : "hover:text-slate-900"}`}
        >
          <Settings className="w-4 h-4" />
          <span>หลังบ้าน</span>
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
      <footer className="bg-white border-t border-slate-200 text-slate-600 py-10 text-xs text-center z-10" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <div className="flex justify-center items-center gap-2 text-slate-900">
            <GraduationCap className="w-5 h-5 text-teal-600" />
            <span className="font-bold">คณะวิทยาการเรียนรู้และศึกษาศาสตร์ มหาวิทยาลัยธรรมศาสตร์</span>
          </div>
          <p className="max-w-xl mx-auto leading-relaxed text-slate-600 font-medium">
            โครงการเดิน-วิ่งการกุศล LSEd Running 2569 ประจำปีการศึกษา 2569<br/>
            ณ จุดปล่อยตัวอาคารสิริวิทยาลักษณ์ คณะวิทยาการเรียนรู้และศึกษาศาสตร์ มหาวิทยาลัยธรรมศาสตร์ ศูนย์รังสิต
          </p>
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 max-w-2xl mx-auto text-[11px] text-slate-500">
            <div className="text-center sm:text-left">
              <p>© 2026 LSEd TU. All rights reserved.</p>
              <p className="text-[11px] text-orange-600 font-bold mt-0.5">ผู้พัฒนาเว็บ: คณะกรรมการนักศึกษา กน.วรศ. ปี 2569</p>
            </div>
            <div className="flex gap-4">
              <a href="https://lsed.tu.ac.th/" target="_blank" rel="noopener noreferrer" className="text-teal-700 hover:text-teal-800 font-semibold transition">ติดต่อคณะวิทยาการเรียนรู้ฯ</a>
              <span>•</span>
              <a href="#" className="text-teal-700 hover:text-teal-800 font-semibold transition">สายด่วนทางการแพทย์</a>
              <span>•</span>
              <a href="mailto:Napatsakorn.del@gmail.com" className="text-teal-700 hover:text-teal-800 font-semibold transition">แจ้งปัญหาลงทะเบียน</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
