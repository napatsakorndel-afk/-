import { db } from "../lib/firebaseClient.js";
import { doc, getDoc } from "firebase/firestore";
import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  TrendingUp, 
  Award, 
  Shield, 
  ChevronRight, 
  Users, 
  Coins, 
  Activity,
  Shirt,
  Truck,
  Sparkles,
  Sparkle,
  CheckCircle2,
  FileText,
  Medal
} from "lucide-react";
import { DistanceType, EventStats } from "../types.js";

interface LandingPageProps {
  onRegisterClick: (distance?: DistanceType) => void;
  onCheckStatusClick: () => void;
  onCheckShippingClick?: () => void;
  stats: EventStats | null;
}

export default function LandingPage({ onRegisterClick, onCheckStatusClick, onCheckShippingClick, stats }: LandingPageProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [shirtView, setShirtView] = useState<"front" | "back">("front");

  const [shirtImage, setShirtImage] = useState<string>("");
  const [poloShirtImage, setPoloShirtImage] = useState<string>("");
  const [medalImage, setMedalImage] = useState<string>("");
  const [souvenirImage, setSouvenirImage] = useState<string>("");
  const [routeMapImage, setRouteMapImage] = useState<string>("");

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const docRef = doc(db, "settings", "assets");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.shirtImage) setShirtImage(data.shirtImage);
          if (data.poloShirtImage) setPoloShirtImage(data.poloShirtImage);
          if (data.medalImage) setMedalImage(data.medalImage);
          if (data.souvenirImage) setSouvenirImage(data.souvenirImage);
          if (data.routeMapImage && typeof setRouteMapImage === 'function') setRouteMapImage(data.routeMapImage);
        }
      } catch (err) {
        console.error("Failed to load assets from Firestore", err);
      }
    };
    fetchAssets();
  }, []);


  // Calculate Countdown to Event (Jan 24, 2570 / 2027)
  useEffect(() => {
    // 2570 BE is 2027 AD
    const eventDate = new Date("2027-01-24T05:00:00").getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = eventDate - now;

      if (difference <= 0) {
        clearInterval(interval);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const typeLabels: Record<DistanceType, string> = {
    "REGULAR": "REGULAR",
    "5K": "REGULAR",
    "vip": "VIP",
    "vip_duo": "VIP Duo",
    "vip_trio": "VIP Trio",
    "donation": "Donate",
    "souvenir": "Souvenir"
  };

  const distances = [
    {
      type: "REGULAR" as DistanceType,
      title: "REGULAR Package 5 กิโลเมตร",
      subtitle: "เดิน-วิ่งเพื่อสุขภาพและร่วมสมทบทุนการศึกษา",
      price: 555,
      time: "05:45 น.",
      color: "from-teal-50 to-teal-100/40",
      borderColor: "border-teal-300 hover:border-teal-500",
      textColor: "text-teal-700",
      buttonColor: "bg-teal-600 hover:bg-teal-700 shadow-teal-600/20",
      desc: "เส้นทางมาตรฐานระยะทาง 5 กิโลเมตร ปล่อยตัวจากอาคารสิริวิทยาลักษณ์ คณะวิทยาการเรียนรู้ฯ วิ่งออกกำลังกายรับอรุณยามเช้ารอบแกนกลาง มธ. รังสิต",
      gift: "เหรียญรางวัลผู้พิชิต, เสื้อยืดที่ระลึก REGULAR, หมายเลขประจำตัววิ่ง BIB"
    },
    {
      type: "vip" as DistanceType,
      title: "VIP Package / Sponsorship 5 กิโลเมตร",
      subtitle: "ผู้สนับสนุนหลักเดี่ยวและสิทธิพิเศษระดับ VIP",
      price: 990,
      time: "05:45 น.",
      color: "from-amber-50 to-orange-50",
      borderColor: "border-orange-300 hover:border-orange-500",
      textColor: "text-orange-600",
      buttonColor: "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-500/20",
      desc: "ร่วมสนับสนุนเดี่ยวเพื่อรับสิทธิพิเศษเต็มรูปแบบ วิ่งระยะทาง 5 กิโลเมตร พร้อมเลือกลายและขนาดเสื้อยืดพิเศษเฉพาะ VIP และสิทธิพิเศษการต้อนรับในงาน",
      gift: "เหรียญรางวัลผู้พิชิต (ลายพรีเมียม), เสื้อยืด VIP สุดพิเศษ, หมายเลขประจำตัววิ่ง VIP, เกียรติบัตรขอบคุณพิเศษจากคณะ"
    },
    {
      type: "souvenir" as DistanceType,
      title: "Souvenir Package / สั่งซื้อของที่ระลึกสะสม",
      subtitle: "เหรียญที่ระลึก & เสื้อยืดพรีเมียมสุดพิเศษ (ลดหย่อนภาษีได้)",
      price: 390,
      time: "จัดส่งพัสดุ",
      color: "from-orange-50 to-orange-100/60",
      borderColor: "border-orange-300 hover:border-orange-500",
      textColor: "text-orange-600",
      buttonColor: "bg-orange-600 hover:bg-orange-700 shadow-orange-500/20",
      desc: "สำหรับผู้ที่ประสงค์สมทบทุนและสะสมเหรียญรางวัล (Finisher Medal) พร้อมเสื้อที่ระลึกพรีเมียม (ไม่ได้วิ่งหน้างาน) รายได้ทั้งหมดหลังหักค่าใช้จ่ายร่วมสมทบเข้ากองทุนคณะ และสามารถขอลดหย่อนภาษีได้!",
      gift: "เหรียญที่ระลึกผู้พิชิต (Boutique Series), เสื้อวิ่งพรีเมียม LSEd 1 ตัว, สิทธิ์ในการขอลดหย่อนภาษี"
    },
    {
      type: "donation" as DistanceType,
      title: "บริจาคสมทบทุนลดหย่อนภาษี",
      subtitle: "ลดหย่อนภาษีเงินได้ 2 เท่า (e-Donation)",
      price: 500,
      time: "e-Donation",
      color: "from-teal-50 to-emerald-50",
      borderColor: "border-teal-300 hover:border-teal-500",
      textColor: "text-teal-800",
      buttonColor: "bg-teal-700 hover:bg-teal-800 shadow-teal-700/20",
      desc: "สำหรับผู้ที่มีความประสงค์สมทบทุนสนับสนุนงานพัฒนาวิชาการและระบบการศึกษาของคณะ LSEd มธ. โดยไม่ประสงค์เข้าร่วมกิจกรรมวิ่งหรือรับของที่ระลึก",
      gift: "ใบเสร็จลดหย่อนภาษีอิเล็กทรอนิกส์ 2 เท่าส่งตรงกรมสรรพากร, จดหมายขอบคุณขอบพระคุณอย่างสูงจากทางคณะ"
    }
  ];

  return (
    <div className="space-y-16 pb-16 animate-fade-in" id="landing-page">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-50/70 via-white to-orange-50/60 border border-teal-500/20 text-slate-800 rounded-3xl p-8 md:p-16 shadow-xl backdrop-blur-sm">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-teal-400/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-orange-400/12 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="flex flex-wrap gap-2.5 items-center">
            <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/25 text-teal-800 px-4 py-1.5 rounded-full text-sm font-bold tracking-wider uppercase shadow-xs">
              <Activity className="w-4 h-4 text-teal-600" /> วิ่งเพื่อการขับเคลื่อนสังคมและการศึกษา 2569
            </div>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-bold tracking-wider shadow-xs">
              โครงการวิ่ง 12 Years LSEd
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black italic tracking-normal leading-none space-y-2">
            <span className="block text-slate-900 font-black text-5xl sm:text-7xl md:text-8xl leading-none tracking-tight uppercase flex flex-wrap items-center gap-x-4 gap-y-1">
              Run to Shine
              <Sparkles className="w-10 h-10 md:w-14 md:h-14 text-orange-500 animate-pulse shrink-0" />
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-teal-500 to-orange-500 font-extrabold text-4xl sm:text-6xl md:text-7xl leading-none tracking-normal flex flex-wrap items-center">
              <span>วิ่ง</span>
              <span className="text-2xl sm:text-4xl md:text-5xl font-light mx-2.5 sm:mx-3.5 select-none opacity-60 inline-flex items-center justify-center">-</span>
              <span>ฉาย</span>
              <span className="text-2xl sm:text-4xl md:text-5xl font-light mx-2.5 sm:mx-3.5 select-none opacity-60 inline-flex items-center justify-center">-</span>
              <span>แสง</span>
              <Sparkle className="w-6 h-6 text-orange-400 animate-spin shrink-0 ml-2" style={{ animationDuration: '6s' }} />
            </span>
            <span className="text-teal-700 text-2xl sm:text-4xl md:text-5xl font-black italic mt-2 block tracking-wider">
              LSEd <span className="uppercase">RUNNING 2569</span>
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-800 leading-relaxed max-w-2xl font-normal">
            ขอเชิญผู้สนใจ ศิษย์เก่า และนักวิ่งทุกคน ร่วมเป็นส่วนหนึ่งของโครงการเดิน-วิ่งการกุศล <strong className="text-slate-900 font-bold">"วิ่ง - ฉาย - แสง" LSEd Running 2569</strong> โดยคณะวิทยาการเรียนรู้และศึกษาศาสตร์ มหาวิทยาลัยธรรมศาสตร์ เพื่อสมทบทุนพัฒนาการศึกษาและสร้างสรรค์นวัตกรรมการเรียนรู้สู่สังคม
          </p>

          {/* Quick Info Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-slate-800">
            <div className="flex items-center gap-3 bg-white/95 border border-teal-500/25 rounded-2xl p-4 shadow-sm">
              <Calendar className="w-7 h-7 text-orange-500 shrink-0" />
              <div>
                <p className="text-sm text-slate-700 uppercase font-bold tracking-wider">วันจัดกิจกรรม</p>
                <p className="text-lg font-black text-slate-900">24 มกราคม 2570</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white/95 border border-teal-500/25 rounded-2xl p-4 shadow-sm">
              <MapPin className="w-7 h-7 text-teal-600 shrink-0" />
              <div>
                <p className="text-sm text-slate-700 uppercase font-bold tracking-wider">จุดปล่อยตัว & เส้นชัย</p>
                <p className="text-lg font-black text-slate-900">อาคารสิริวิทยาลักษณ์ คณะวิทยาการเรียนรู้ฯ</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white/95 border border-teal-500/25 rounded-2xl p-4 shadow-sm">
              <Clock className="w-7 h-7 text-teal-600 shrink-0" />
              <div>
                <p className="text-sm text-slate-700 uppercase font-bold tracking-wider">ปล่อยตัวเช้าตรู่</p>
                <p className="text-lg font-black text-slate-900">ตั้งแต่เวลา 05:00 น.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 pt-6">
            <button
              onClick={() => onRegisterClick()}
              className="px-8 py-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-black uppercase tracking-wider text-base sm:text-lg rounded-xl shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transition duration-200 cursor-pointer transform hover:scale-[1.02]"
              id="hero-register-btn"
            >
              สมัครวิ่งออนไลน์ตอนนี้ <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={onCheckStatusClick}
              className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-800 font-bold uppercase tracking-wider text-base sm:text-lg rounded-xl border border-slate-300 flex items-center justify-center gap-2 transition duration-200 cursor-pointer hover:border-teal-500/50 hover:text-teal-700 shadow-sm"
              id="hero-status-btn"
            >
              ตรวจสอบสถานะและส่งสลิป
            </button>
            {onCheckShippingClick && (
              <button
                onClick={onCheckShippingClick}
                className="px-8 py-4 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold uppercase tracking-wider text-base sm:text-lg rounded-xl border border-orange-300 flex items-center justify-center gap-2 transition duration-200 cursor-pointer hover:border-orange-500 shadow-sm"
                id="hero-shipping-btn"
              >
                <Truck className="w-5 h-5 text-orange-500" /> ตรวจสอบเลขพัสดุส่งไปรษณีย์
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Countdown Timer */}
      <section className="bg-white border border-teal-500/20 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="text-center space-y-4">
          <p className="text-base font-bold text-teal-800 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Sparkles className="w-5 h-5 text-orange-500" /> นับถอยหลังสู่เวลาปล่อยตัว
          </p>
          <div className="flex justify-center items-center gap-4 md:gap-8 text-center">
            <div className="bg-slate-50 rounded-2xl p-4 w-24 md:w-32 border border-slate-200 shadow-xs">
              <p className="text-4xl md:text-6xl font-black italic text-slate-900 leading-none">{timeLeft.days}</p>
              <p className="text-sm sm:text-base text-slate-700 uppercase tracking-wider font-bold mt-2">วัน</p>
            </div>
            <div className="text-2xl md:text-3xl font-black text-slate-400">:</div>
            <div className="bg-slate-50 rounded-2xl p-4 w-24 md:w-32 border border-slate-200 shadow-xs">
              <p className="text-4xl md:text-6xl font-black italic text-slate-900 leading-none">{timeLeft.hours}</p>
              <p className="text-sm sm:text-base text-slate-700 uppercase tracking-wider font-bold mt-2">ชั่วโมง</p>
            </div>
            <div className="text-2xl md:text-3xl font-black text-slate-400">:</div>
            <div className="bg-slate-50 rounded-2xl p-4 w-24 md:w-32 border border-slate-200 shadow-xs">
              <p className="text-4xl md:text-6xl font-black italic text-slate-900 leading-none">{timeLeft.minutes}</p>
              <p className="text-sm sm:text-base text-slate-700 uppercase tracking-wider font-bold mt-2">นาที</p>
            </div>
            <div className="text-2xl md:text-3xl font-black text-slate-400">:</div>
            <div className="bg-slate-50 rounded-2xl p-4 w-24 md:w-32 border border-slate-200 shadow-xs">
              <p className="text-4xl md:text-6xl font-black italic text-orange-500 leading-none">{timeLeft.seconds}</p>
              <p className="text-sm sm:text-base text-orange-700 uppercase tracking-wider font-bold mt-2">วินาที</p>
            </div>
          </div>
        </div>
      </section>

      {/* Distance Categories */}
      <section className="space-y-8" id="distances">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl sm:text-4xl font-black italic tracking-tight uppercase text-slate-900 flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-teal-600 shrink-0 animate-pulse" /> 
            ประเภทกิจกรรม & สมทบทุนบริจาค 
            <Sparkles className="w-6 h-6 text-orange-500 shrink-0 animate-pulse" />
          </h2>
          <p className="text-slate-700 text-base md:text-lg font-medium">เลือกร่วมวิ่งตามระยะทางที่เหมาะสมกับเป้าหมายสุขภาพ หรือร่วมบริจาคสนับสนุนทุนการศึกษาคณะ</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {distances.map((dist, idx) => (
            <div 
              key={idx} 
              className={`bg-white border rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1 ${dist.borderColor}`}
              id={`distance-card-${dist.type}`}
            >
              <div className={`p-6 bg-gradient-to-b ${dist.color} text-slate-900 space-y-3 border-b border-slate-200/80`}>
                <div className="flex flex-col gap-2 items-start">
                  <span className="text-2xl sm:text-3xl font-black italic tracking-tighter uppercase leading-none">{typeLabels[dist.type]}</span>
                  <span className="bg-white/95 border border-slate-200 text-slate-800 font-extrabold text-sm px-3.5 py-1 rounded-full whitespace-nowrap inline-block shadow-xs">
                    {dist.time}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold tracking-tight min-h-[44px] flex items-center leading-snug text-slate-900">{dist.title}</h3>
                <p className="text-sm text-slate-600 tracking-wide font-medium min-h-[28px] flex items-start">{dist.subtitle}</p>
              </div>

              <div className="p-6 flex-grow flex flex-col justify-between space-y-5 bg-slate-50/70">
                <div className="space-y-3.5 text-sm text-slate-600 leading-relaxed font-normal">
                  <p className="min-h-[64px] leading-relaxed">{dist.desc}</p>
                  
                  <div className="pt-3 border-t border-slate-200 space-y-1">
                    <p className="font-bold text-slate-900 text-xs uppercase tracking-wider">{dist.type === 'donation' ? 'สิทธิประโยชน์ทางภาษี:' : 'สิ่งที่จะได้รับ:'}</p>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium min-h-[50px]">{dist.gift}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex flex-col justify-between gap-4 mt-auto">
                  <div>
                    <span className="text-xs text-slate-500 block font-bold uppercase tracking-wider mb-1">{dist.type === 'donation' ? 'การร่วมสมทบทุน' : 'ค่าสมัครเข้าร่วม'}</span>
                    {dist.type === 'donation' ? (
                      <span className={`text-4xl sm:text-5xl font-black leading-tight tracking-tight block ${dist.textColor}`}>ตามศรัทธา</span>
                    ) : (
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className={`text-5xl sm:text-6xl font-black leading-none tracking-tight font-sans ${dist.textColor}`}>
                          {dist.price}
                        </span>
                        <span className="text-lg sm:text-xl font-bold text-slate-500 font-sans">THB</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onRegisterClick(dist.type)}
                    className={`w-full py-3.5 ${dist.buttonColor} text-white font-extrabold uppercase tracking-wider text-sm sm:text-base rounded-xl shadow-md transition duration-200 cursor-pointer text-center whitespace-nowrap`}
                  >
                    {dist.type === 'donation' ? 'ร่วมบริจาคสนับสนุน' : dist.type === 'souvenir' ? 'สั่งซื้อของที่ระลึก' : 'สมัครประเภทนี้'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Runner Shirt Jersey Section */}
      <section className="flex flex-col gap-12 bg-gradient-to-br from-teal-50/40 via-white to-orange-50/30 border border-teal-500/20 rounded-3xl p-8 md:p-12 shadow-xl" id="shirts">
        <div className="w-full space-y-6">
          <div className="inline-flex items-center gap-1.5 bg-teal-500/10 border border-teal-500/25 text-teal-800 px-3.5 py-1.5 rounded-full text-sm font-bold tracking-wider">
            <Shirt className="w-4 h-4 text-teal-600" /> LSEd Running Jersey 2569 <Sparkle className="w-3.5 h-3.5 text-orange-500 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black italic tracking-tight uppercase text-slate-900 leading-tight flex items-center gap-2">
            เสื้อที่ระลึกสุดพรีเมียม <Sparkles className="w-7 h-7 text-orange-500 shrink-0 animate-pulse" />
          </h2>
          <div className="text-slate-800 leading-relaxed font-normal text-base md:text-lg space-y-4">
            <p>
              เสื้อวิ่งที่ตัดเย็บจาก <strong className="text-slate-900 font-bold">ผ้าดาวกระจาย (หรือผ้าไมโครลายดาวกระจาย)</strong> เป็นตัวเลือกยอดนิยมสำหรับสายวิ่งและคนออกกำลังกาย เนื่องจากเนื้อผ้ามีลายทอเป็นจุดรูตาข่ายเล็กๆ ช่วยระบายอากาศและความร้อนได้ดีเยี่ยม แห้งไว น้ำหนักเบา และสวมใส่สบายในราคาย่อมเยา
            </p>
            <div className="space-y-2">
              <strong className="text-slate-900 block font-bold text-lg">คุณสมบัติเด่นของผ้าดาวกระจาย</strong>
              <ul className="list-disc pl-5 space-y-2 text-slate-800 text-base md:text-lg">
                <li><strong className="text-slate-900 font-bold">ระบายอากาศดี:</strong> มีโครงสร้างลายรูเล็กๆ ช่วยให้ลมผ่านได้ดี ลดความอับชื้นจากเหงื่อ</li>
                <li><strong className="text-slate-900 font-bold">แห้งไว ไม่อับชื้น:</strong> ซับเหงื่อได้ดีและแห้งเร็ว เหมาะกับสภาพอากาศร้อน</li>
                <li><strong className="text-slate-900 font-bold">น้ำหนักเบา:</strong> สวมใส่แล้วรู้สึกสบายตัว ไม่ถ่วงหรืออึดอัดขณะเคลื่อนไหว</li>
                <li><strong className="text-slate-900 font-bold">สัมผัสนุ่มลื่น:</strong> ผิวผ้าไม่ยับง่าย ไม่ย้วย และไม่ระคายเคืองผิว</li>
              </ul>
            </div>
          </div>

          {/* Size Chart Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-base text-left text-slate-800">
              <thead className="text-sm sm:text-base text-slate-900 uppercase bg-slate-100 border-b border-slate-200 font-bold tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3.5">ไซส์</th>
                  <th scope="col" className="px-5 py-3.5">รอบอก <span className="text-xs font-normal text-slate-500 ml-1">(นิ้ว)</span></th>
                  <th scope="col" className="px-5 py-3.5">ความยาวเสื้อ <span className="text-xs font-normal text-slate-500 ml-1">(นิ้ว)</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {[
                  { size: "XS", chest: "34", length: "25" },
                  { size: "S", chest: "36", length: "26" },
                  { size: "M", chest: "38", length: "27" },
                  { size: "L", chest: "40", length: "28" },
                  { size: "XL", chest: "42", length: "29" },
                  { size: "2XL", chest: "44", length: "30" },
                  { size: "3XL", chest: "46", length: "31" },
                ].map((row) => (
                  <tr key={row.size} className="border-b border-slate-200 last:border-0 hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5 text-slate-900 font-black text-lg">{row.size}</td>
                    <td className="px-5 py-3.5 text-slate-900 font-bold text-base md:text-lg">{row.chest}</td>
                    <td className="px-5 py-3.5 text-slate-900 font-bold text-base md:text-lg">{row.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-start justify-center p-4">
          <div className="flex flex-col items-center space-y-3">
            <h4 className="text-xl font-black text-slate-800">แบบคอกลม <span className="text-base font-semibold text-slate-500 ml-1.5">(Crew Neck)</span></h4>
            {shirtImage ? (
              <div className="relative w-full max-w-[500px] flex flex-col items-center justify-center rounded-2xl overflow-hidden shadow-lg border border-slate-200 group bg-white">
                <img src={shirtImage} alt="Crew Neck Shirt" className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
            ) : (
              <div className="relative bg-slate-50 border border-slate-300 border-dashed rounded-2xl p-6 w-full max-w-[500px] flex flex-col items-center justify-center aspect-square shadow-inner">
                <Shirt className="w-10 h-10 mb-3 opacity-30 text-teal-800" />
                <span className="text-sm text-slate-600 font-black uppercase tracking-wider text-center">รออัปโหลดภาพเสื้อคอกลม</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-center space-y-3">
            <h4 className="text-xl font-black text-slate-800">แบบโปโล <span className="text-base font-semibold text-slate-500 ml-1.5">(Polo Shirt)</span></h4>
            {poloShirtImage ? (
              <div className="relative w-full max-w-[500px] flex flex-col items-center justify-center rounded-2xl overflow-hidden shadow-lg border border-slate-200 group bg-white">
                <img src={poloShirtImage} alt="Polo Shirt" className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
            ) : (
              <div className="relative bg-slate-50 border border-slate-300 border-dashed rounded-2xl p-6 w-full max-w-[500px] flex flex-col items-center justify-center aspect-square shadow-inner">
                <Shirt className="w-10 h-10 mb-3 opacity-30 text-teal-800" />
                <span className="text-sm text-slate-600 font-black uppercase tracking-wider text-center">รออัปโหลดภาพเสื้อโปโล</span>
              </div>
            )}
          </div>
        </div>
      </section>


      {/* Finisher Medal Showcase Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center bg-gradient-to-br from-amber-50 via-white to-orange-50 border border-orange-200 rounded-3xl p-8 md:p-12 shadow-xl" id="medals">
        {/* High fidelity medal mockup */}
        <div className="lg:col-span-6 flex flex-col items-center space-y-6 order-last lg:order-first">
          {medalImage ? (
            <div className="relative w-full max-w-sm flex flex-col items-center justify-center rounded-2xl overflow-hidden shadow-lg border border-slate-200 group bg-white">
              <img src={medalImage} alt="Medal Image" className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
          ) : (
            <div className="relative bg-white border border-slate-300 border-dashed rounded-2xl p-6 md:p-10 w-full max-w-sm flex flex-col items-center justify-center aspect-square shadow-inner group overflow-hidden">
              <Award className="w-12 h-12 mb-3 opacity-30 text-orange-600" />
              <span className="text-sm text-slate-600 font-black uppercase tracking-wider text-center">รออัปโหลดภาพเหรียญที่ระลึก</span>
            </div>
          )}
        </div>

        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/25 text-orange-600 px-3.5 py-1.5 rounded-full text-sm font-black uppercase tracking-wider">
            <Award className="w-4 h-4" /> Finisher Souvenir Medal <Sparkles className="w-4 h-4 text-orange-500" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black italic tracking-tight uppercase text-slate-900 leading-tight">
            เหรียญที่ระลึกผู้พิชิต
          </h2>
          <p className="text-slate-800 leading-relaxed font-normal text-base md:text-lg">
            เหรียญที่ระลึกสุโขทัยซีรีส์ <span className="text-sm font-semibold text-slate-500 ml-1">(Sukhothai Signature Series)</span> หล่อด้วยโลหะสังกะสีผสมพิเศษ <span className="text-sm font-semibold text-slate-500 ml-1">(Zinc Alloy)</span> เกรดพรีเมียมหนา 4 มม. ชุบผิวทองโบราณสไตล์แชมเปญแฮร์ไลน์สวยงาม สลักลวดลายฉลุวิจิตรศิลป์แห่งอาณาจักรสุโขทัยโบราณที่ออกแบบผสมผสานความร่วมสมัย
          </p>
        </div>
      </section>

      {/* Finisher Souvenir inside the event & Tax Deduction */}
      <section className="bg-white border border-teal-500/20 rounded-3xl p-6 md:p-8 shadow-xl mt-8">
        <h3 className="text-2xl sm:text-3xl font-black italic tracking-tight uppercase text-slate-900 flex items-center gap-3 mb-8">
          <FileText className="w-8 h-8 text-orange-500" /> ของที่ระลึกภายในงาน <span className="text-orange-500 text-xl sm:text-2xl">& สิทธิ์ลดหย่อนภาษี</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Image */}
          <div className="md:col-span-5 flex justify-center">
            {souvenirImage ? (
              <div className="relative w-full max-w-sm flex flex-col items-center justify-center rounded-2xl overflow-hidden shadow-lg border border-slate-200 group bg-white">
                <img src={souvenirImage} alt="Souvenir Image" className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
            ) : (
              <div className="relative bg-slate-50 border border-slate-300 border-dashed rounded-2xl p-6 md:p-10 w-full max-w-sm flex flex-col items-center justify-center aspect-square shadow-inner group overflow-hidden">
                <Award className="w-12 h-12 mb-3 opacity-30 text-orange-600" />
                <span className="text-sm text-slate-600 font-black uppercase tracking-wider text-center">รออัปโหลดภาพของที่ระลึก</span>
              </div>
            )}
          </div>

          {/* Info & Button */}
          <div className="md:col-span-7 space-y-6">
            <div className="p-5 rounded-2xl bg-orange-50/80 border border-orange-200 space-y-3">
              <h4 className="text-base font-black uppercase tracking-wider text-orange-700 flex items-center gap-2">
                 สิทธิ์ลดหย่อนภาษี <span className="text-xs font-semibold text-orange-600 ml-1">(Tax Deduction Eligible)</span>
              </h4>
              <p className="text-base md:text-lg text-slate-800 leading-relaxed font-normal">
                สำหรับผู้บริจาคหรือสั่งซื้อของที่ระลึกสำหรับงานนี้ รายได้ทั้งหมดหลังหักค่าใช้จ่ายจะนำไปสนับสนุนเข้ากองทุนพัฒนาวิชาการและทุนการศึกษา คณะวิทยาการเรียนรู้และศึกษาศาสตร์ มหาวิทยาลัยธรรมศาสตร์ โดยท่านสามารถระบุ <strong className="text-orange-600 font-bold">"ขอใช้สิทธิ์ลดหย่อนภาษี"</strong> ในระบบได้ทันที ทางสถาบันจะนำส่งข้อมูลผ่านระบบ e-Donation สรรพากรเพื่ออำนวยความสะดวกให้แก่ท่านอย่างรวดเร็ว
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={() => onRegisterClick("souvenir")}
                className="px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-wider text-sm sm:text-base rounded-xl shadow-lg shadow-orange-500/25 transition duration-200 cursor-pointer text-center flex items-center justify-center gap-2"
              >
                สั่งซื้อของที่ระลึก <span className="text-xs font-bold opacity-90 ml-1">(฿390)</span> <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* General Rules & Routes */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8" id="info">
        <div className="bg-white border border-teal-500/20 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
          <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-teal-600" /> กฎกติกาและการเข้าร่วมกิจกรรม
          </h3>
          <ul className="space-y-4 text-base md:text-lg text-slate-800 leading-relaxed font-normal">
            <li className="flex items-start gap-3">
              <span className="inline-block mt-2.5 w-2.5 h-2.5 bg-teal-500 rounded-full flex-shrink-0"></span>
              <span>ผู้เข้าร่วมแข่งขันจะต้องวิ่งไปตามแนวเส้นทางการแข่งขันที่ผู้จัดกำหนดไว้เท่านั้น ห้ามใช้เส้นทางลัด</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-block mt-2.5 w-2.5 h-2.5 bg-teal-500 rounded-full flex-shrink-0"></span>
              <span>ผู้เข้าแข่งขันต้องติดหมายเลขประจำตัววิ่ง <span className="text-sm font-semibold text-slate-600 ml-0.5">(บิ๊บ)</span> ไว้ที่หน้าอกด้านหน้าให้เห็นได้อย่างชัดเจนตลอดการแข่งขัน</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-block mt-2.5 w-2.5 h-2.5 bg-orange-500 rounded-full flex-shrink-0"></span>
              <span>บริการซุ้มน้ำดื่มทุกๆ ระยะ 2 กิโลเมตร และซุ้มเครื่องดื่มเกลือแร่ ผลไม้ บริเวณเส้นชัย</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-block mt-2.5 w-2.5 h-2.5 bg-orange-500 rounded-full flex-shrink-0"></span>
              <span>มีหน่วยพยาบาลเคลื่อนที่เร็วและรถฉุกเฉินสแตนด์บายดูแลตลอดระยะเวลาการดำเนินกิจกรรม</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-block mt-2.5 w-2.5 h-2.5 bg-teal-500 rounded-full flex-shrink-0"></span>
              <span>เงินค่าสมัครหลังหักค่าใช้จ่ายจะสมทบเข้ากองทุนคณะวิทยาการเรียนรู้และศึกษาศาสตร์ มธ. เพื่อช่วยเหลือเป็นทุนการศึกษาและสนับสนุนการเรียนรู้ให้นักศึกษาในคณะ</span>
            </li>
          </ul>
        </div>

        <div className="bg-white border border-teal-500/20 rounded-3xl p-6 md:p-8 shadow-xl space-y-4">
          <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-orange-500" /> เส้นทางวิ่งและจุดปล่อยตัว/เข้าเส้นชัย
          </h3>
          
          {routeMapImage ? (
            <div className="relative rounded-xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
              <img src={routeMapImage} alt="Route Map 5KM" className="w-full h-auto object-contain max-h-[500px]" />
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-slate-50 border border-slate-200 aspect-video flex items-center justify-center shadow-inner">
            {/* Visual Route Representation via Clean Bright SVG in Turquoise & Orange */}
            <svg className="w-full h-full" viewBox="0 0 400 220">
              <rect width="400" height="220" fill="#f8fafc" />
              {/* Subtle grid lines */}
              <path d="M0,50 L400,50 M0,100 L400,100 M0,150 L400,150 M0,200 L400,200 M50,0 L50,220 M100,0 L100,220 M150,0 L150,220 M200,0 L200,220 M250,0 L250,220 M300,0 L300,220 M350,0 L350,220" stroke="#e2e8f0" strokeWidth="0.8" />
              
              {/* TU Buildings & Parks (represented nicely in Turquoise & Orange) */}
              <rect x="25" y="25" width="120" height="48" rx="8" fill="#0d9488" stroke="#115e59" strokeWidth="1" />
              <text x="85" y="54" fontSize="12" fill="#ffffff" fontWeight="bold" textAnchor="middle">อาคารเรียนรวม (SC3)</text>

              <rect x="220" y="135" width="165" height="58" rx="8" fill="#f97316" stroke="#c2410c" strokeWidth="1" />
              <text x="302" y="159" fontSize="13" fill="#ffffff" fontWeight="900" textAnchor="middle">จุดปล่อยตัว & เส้นชัย</text>
              <text x="302" y="177" fontSize="11" fill="#fff7ed" fontWeight="bold" textAnchor="middle">อาคารสิริวิทยาลักษณ์ LSEd</text>

              {/* Park Lake */}
              <ellipse cx="200" cy="105" rx="46" ry="28" fill="#ccfbf1" stroke="#0d9488" strokeWidth="1.5" />
              <text x="200" y="110" fontSize="11" fill="#0f766e" fontWeight="bold" textAnchor="middle">สวนป๋วยฯ และแกนกลาง</text>

              {/* Running Route path */}
              <path d="M 85,73 L 85,140 Q 85,185 180,185 L 250,185 L 250,105 L 170,105 L 170,73 Z" fill="none" stroke="#0d9488" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="6 4" />
              
              {/* Release badges */}
              <circle cx="85" cy="73" r="6" fill="#0d9488" stroke="#ffffff" strokeWidth="2" />
              <circle cx="250" cy="185" r="6" fill="#ea580c" stroke="#ffffff" strokeWidth="2" />
              <text x="85" y="20" fontSize="11" fill="#0f766e" fontWeight="bold" textAnchor="middle">CHECKPOINT (SC3)</text>
              <text x="302" y="125" fontSize="12" fill="#c2410c" fontWeight="900" textAnchor="middle">START - FINISH</text>
            </svg>
            <div className="absolute bottom-2 right-2 bg-white/95 text-sm text-slate-800 font-bold px-3 py-1 rounded-md border border-slate-200 shadow-xs">
              MAP: Siriwiyhalai Building Loop, TU RANGSIT
            </div>
          </div>
          )}

          {/* 11 Checkpoints Text Instructions */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mt-6">
            <h4 className="text-slate-900 font-bold mb-4 text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-500" />
              รายละเอียดจุดเช็คพอยต์ 11 จุด (5 KM)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5">
              {[
                "จุดที่ 1: จุดปล่อยตัว (Start) ป้ายคณะวิทยาการเรียนรู้และศึกษาศาสตร์ (อาคารสิริวิทยาลักษณ์)",
                "จุดที่ 2: วิ่งไปตามเส้นทาง วงเวียนคณะวิทยาศาสตร์",
                "จุดที่ 3: ผ่านหน้าอาคารบรรยายรวม 3 (SC3)",
                "จุดที่ 4: เลี้ยวเข้าสู่ถนนแกนกลางมหาวิทยาลัย",
                "จุดที่ 5: ผ่านศูนย์กีฬาธรรมศาสตร์ (ยิมเนเซียม)",
                "จุดที่ 6: วิ่งเลียบทางเดินริมสระน้ำ (ทิศตะวันตก)",
                "จุดที่ 7: ผ่านหน้าอุทยานการเรียนรู้ป๋วย อึ๊งภากรณ์",
                "จุดที่ 8: วิ่งวนขวารอบสวนป๋วยฯ (Puey Park)",
                "จุดที่ 9: เลี้ยวกลับเข้าสู่ถนนเมนหลัก (Main Road)",
                "จุดที่ 10: วิ่งตรงมุ่งหน้ากลับมายังซอยอาคารสิริวิทยาลักษณ์",
                "จุดที่ 11: เข้าเส้นชัย (Finish) ที่ลานหน้าคณะวิทยาการเรียนรู้ฯ"
              ].map((text, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-teal-100 border border-teal-300 text-teal-800 flex items-center justify-center text-sm font-black flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-base text-slate-800 font-medium leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm sm:text-base text-slate-700 leading-relaxed text-center font-medium">
            * จุดปล่อยตัวและเข้าเส้นชัย ณ อาคารสิริวิทยาลักษณ์ คณะวิทยาการเรียนรู้และศึกษาศาสตร์ มธ. วิ่งเป็นเส้นทางลูปผ่านสวนป๋วยฯ และแกนกลางมหาวิทยาลัยธรรมศาสตร์
          </p>
        </div>
      </section>

    </div>
  );
}
