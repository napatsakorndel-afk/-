import { db } from "../lib/firebaseClient.js";
import { doc, getDoc } from "firebase/firestore";
import React, { useState, useEffect } from "react";
import { 
  User, 
  Mail, 
  Phone, 
  Dna, 
  Heart, 
  HelpCircle, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  AlertCircle, 
  CreditCard,
  MapPin,
  Truck,
  Sparkles,
  Sparkle,
  FileText,
  Award
, Shirt } from "lucide-react";
import { DistanceType, ShirtSizeType, Registration } from "../types.js";
import { registerRunner } from "../lib/dataService.js";

interface RegistrationFormProps {
  onSuccess: (reg: Registration) => void;
  onCancel: () => void;
  preselectedDistance?: DistanceType | null;
}

const SHIRT_SIZES: { size: ShirtSizeType; desc: string }[] = [
  { size: "XS", desc: "รอบอก 34\" ยาว 25\"" },
  { size: "S", desc: "รอบอก 36\" ยาว 26\"" },
  { size: "M", desc: "รอบอก 38\" ยาว 27\"" },
  { size: "L", desc: "รอบอก 40\" ยาว 28\"" },
  { size: "XL", desc: "รอบอก 42\" ยาว 29\"" },
  { size: "XXL", desc: "รอบอก 44\" ยาว 30\"" },
  { size: "3XL", desc: "รอบอก 46\" ยาว 31\"" },
  { size: "4XL", desc: "รอบอก 48\" ยาว 32\"" },
  { size: "5XL", desc: "รอบอก 50\" ยาว 33\"" },
  { size: "6XL", desc: "รอบอก 52\" ยาว 33\"" },
  { size: "7XL", desc: "รอบอก 54\" ยาว 34\"" },
];

export default function RegistrationForm({ onSuccess, onCancel, preselectedDistance }: RegistrationFormProps) {
  const [step, setStep] = useState<number>(preselectedDistance ? 2 : 1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [agreedToRules, setAgreedToRules] = useState<boolean>(false);
  const [acceptedRisks, setAcceptedRisks] = useState<boolean>(false);

  // Auto-fill tax deduction defaults when reaching step 3
  useEffect(() => {
    if (step === 3) {
      setFormData(prev => ({
        ...prev,
        donorName: prev.donorName || `${prev.firstName} ${prev.lastName}`.trim(),
        taxId: prev.taxId || prev.nationalId || "",
      }));
    }
  }, [step]);


  const [shirtImage, setShirtImage] = useState<string>("");
  const [medalImage, setMedalImage] = useState<string>("");
  const [souvenirImage, setSouvenirImage] = useState<string>("");
  const [poloShirtImage, setPoloShirtImage] = useState<string>("");

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
          
        }
      } catch (err) {
        console.error("Failed to load assets from Firestore", err);
      }
    };
    fetchAssets();
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    nationalId: "",
    age: "",
    gender: "male" as "male" | "female" | "other",
    bloodType: "Unknown" as "A" | "B" | "AB" | "O" | "Unknown",
    emergencyContactName: "",
    emergencyContactPhone: "",
    distance: "REGULAR" as DistanceType,
    shirtSize: "M" as ShirtSizeType,
    donationAmount: "1",
    taxDeduction: false,
    donorType: "personal" as "personal" | "corporate",
    donorName: "",
    taxId: "",
    receiptAddress: "",
    receiptDeliveryType: "same" as "same" | "custom",
    receiptDeliveryAddress: "",
    donationObjective: "fund" as "education" | "fund" | "project" | "other",
    donationObjectiveDetail: "",
    deliveryMethod: "pickup" as "pickup" | "shipping",
    shippingAddress: "",
  });

  const getPrice = (distance: DistanceType): string => {
    if (distance === "donation") {
      return (parseInt(formData.donationAmount) || 0).toLocaleString();
    }
    const prices: Record<string, number> = {
      "REGULAR": 555,
      "5K": 555,
      "vip": 990,
      "vip_duo": 2800,
      "vip_trio": 3900,
      "souvenir": 390,
    };
    let basePrice = prices[distance] || 0;
    if (formData.deliveryMethod === "shipping") {
      basePrice += 60;
    }
    return basePrice.toLocaleString();
  };

  // Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFillMockDataAndSkip = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setFormData({
      firstName: "สมชาย (ทดสอบ)",
      lastName: "รักวิ่งมั่นคง",
      email: `somchai.test${randomSuffix}@example.com`,
      phone: "0812345678",
      nationalId: "1101234567890",
      age: "25",
      gender: "male",
      bloodType: "O",
      emergencyContactName: "สมหมาย รักวิ่งมั่นคง",
      emergencyContactPhone: "0898765432",
      distance: formData.distance || "REGULAR",
      shirtSize: formData.shirtSize || "M",
      donationAmount: formData.donationAmount || "100",
      taxDeduction: formData.taxDeduction,
      donorType: "personal",
      donorName: "นาย สมชาย รักวิ่งมั่นคง",
      taxId: "1101234567890",
      receiptAddress: "99 หมู่ 18 ต.คลองหนึ่ง อ.คลองหลวง จ.ปทุมธานี 12120",
      receiptDeliveryType: "same",
      receiptDeliveryAddress: "",
      donationObjective: "fund",
      donationObjectiveDetail: "",
      deliveryMethod: formData.deliveryMethod || "pickup",
      shippingAddress: formData.deliveryMethod === "shipping" ? "123/45 ถ.วิภาวดีรังสิต แขวงดินแดง เขตดินแดง กรุงเทพฯ 10400" : "",
    });
    setAgreedToRules(true);
    setAcceptedRisks(true);
    setError(null);
    setStep(5);
  };

  const validateStep = (currentStep: number): boolean => {
    setError(null);
    if (currentStep === 1) {
      if (formData.distance === "donation") {
        const amt = parseInt(formData.donationAmount, 10);
        if (isNaN(amt) || amt <= 0) {
          return setError("กรุณาระบุจำนวนเงินบริจาคที่ต้องการสนับสนุน"), false;
        }
      }
      return true;
    }
    
    if (currentStep === 2) {
      if (!formData.firstName.trim()) return setError("กรุณากรอกชื่อจริง"), false;
      if (!formData.lastName.trim()) return setError("กรุณากรอกนามสกุล"), false;
      if (!formData.nationalId.trim()) return setError("กรุณากรอกเลขบัตรประชาชนหรือหนังสือเดินทาง"), false;
      if (formData.nationalId.trim().length < 5) return setError("เลขบัตรประชาชน/หนังสือเดินทางไม่ถูกต้อง"), false;
      
      if (formData.distance !== "donation") {
        const ageNum = parseInt(formData.age, 10);
        if (isNaN(ageNum) || ageNum <= 0 || ageNum > 120) return setError("กรุณากรอกอายุที่ถูกต้อง"), false;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) return setError("กรุณากรอกอีเมลที่ถูกต้อง"), false;
      
      const phoneClean = formData.phone.replace(/[^0-9]/g, "");
      if (phoneClean.length < 9) return setError("กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง"), false;
      
      return true;
    }

    if (currentStep === 3) {
      if (formData.taxDeduction) {
        if (!formData.donorName.trim()) return setError("กรุณากรอกชื่อผู้บริจาค (ออกในใบเสร็จ)"), false;
        if (!formData.taxId.trim()) return setError("กรุณากรอกเลขประจำตัวผู้เสียภาษี"), false;
        if (formData.taxId.trim().replace(/[^0-9]/g, "").length < 13) {
          return setError("กรุณากรอกเลขประจำตัวผู้เสียภาษีให้ครบ 13 หลัก"), false;
        }
        if (!formData.receiptAddress.trim()) return setError("กรุณากรอกที่อยู่สำหรับออกใบเสร็จรับเงิน"), false;
        if (formData.receiptDeliveryType === "custom" && !formData.receiptDeliveryAddress?.trim()) {
          return setError("กรุณากรอกที่อยู่จัดส่งใบเสร็จรับเงิน"), false;
        }
        if ((formData.donationObjective === "project" || formData.donationObjective === "other") && !formData.donationObjectiveDetail?.trim()) {
          return setError("กรุณากรอกรายละเอียดวัตถุประสงค์ในการบริจาค"), false;
        }
      }
      if (formData.distance === "donation") return true;
      if (formData.distance !== "souvenir") {
        if (!formData.emergencyContactName.trim()) return setError("กรุณากรอกชื่อผู้ติดต่อฉุกเฉิน"), false;
        if (!formData.emergencyContactPhone.trim()) return setError("กรุณากรอกเบอร์โทรศัพท์ติดต่อฉุกเฉิน"), false;
        if (formData.emergencyContactPhone.replace(/[^0-9]/g, "").length < 9) {
          return setError("กรุณากรอกเบอร์ติดต่อฉุกเฉินที่ถูกต้อง"), false;
        }
      }
      if (formData.deliveryMethod === "shipping" && !formData.shippingAddress?.trim()) {
        return setError("กรุณากรอกที่อยู่สำหรับจัดส่งเสื้อวิ่งและของที่ระลึก"), false;
      }
      return true;
    }

    if (currentStep === 4) {
      if (formData.distance === "donation" || formData.distance === "souvenir") {
        if (!agreedToRules) {
          return setError("กรุณากดยอมรับเงื่อนไขในการสนับสนุนบริจาคหรือสั่งซื้อของที่ระลึกเพื่อดำเนินขั้นตอนต่อไป"), false;
        }
      } else {
        if (!agreedToRules) {
          return setError("กรุณากดยินยอมปฏิบัติตามกฎกติกาและมาตรการของคณะผู้จัดงาน"), false;
        }
        if (!acceptedRisks) {
          return setError("กรุณากดยอมรับความเสี่ยงและข้อตกลงเพื่อความปลอดภัยในการเข้าร่วมกิจกรรมวิ่ง"), false;
        }
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setError(null);
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) return;

    setLoading(true);
    setError(null);

    try {
      const submissionData = {
        ...formData,
        shirtSize: formData.distance === "donation" ? "NONE" : formData.shirtSize,
        age: formData.distance === "donation" ? (formData.age || "0") : formData.age,
        gender: formData.distance === "donation" ? (formData.gender || "other") : formData.gender,
      };

      const result = await registerRunner(submissionData);
      onSuccess(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "เกิดข้อผิดพลาดทางเทคนิค กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl" id="registration-form-container">
      <form onSubmit={handleSubmit}>
        <div className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 p-6 md:p-8 relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-32 h-32 ${formData.distance === "donation" ? "bg-orange-500/10" : "bg-teal-500/10"} rounded-full filter blur-xl`} />
          {/* Progress bar */}
          <div className="w-full bg-slate-100 dark:bg-white/10 h-1.5 rounded-full overflow-hidden flex">
            <div 
              className={`bg-gradient-to-r ${formData.distance === "donation" ? "from-teal-500 to-orange-500" : "from-teal-500 to-orange-500"} transition-all duration-500 h-full`}
              style={{ 
                width: `${(step / 5) * 100}%` 
              }}
            ></div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 md:p-8">
          {/* Test Sandbox Banner */}
          {step < 5 && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-start gap-3 text-left">
                <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 animate-pulse mt-0.5" />
                <div>
                  <h4 className="text-xs font-black tracking-wider text-amber-300 uppercase">โหมดทดลองระบบ (Sandbox Mode)</h4>
                  <p className="text-[10.5px] text-slate-500 dark:text-white/60 mt-0.5 leading-relaxed">ต้องการทดลองลงทะเบียนโดยไม่ต้องกรอกข้อมูลจริง? กดปุ่มเพื่อใส่ข้อมูลทดสอบและข้ามไปยังขั้นตอนตรวจสอบเพื่อส่งข้อมูลทันที</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleFillMockDataAndSkip}
                className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/15 shrink-0"
              >
                กรอกข้อมูลจำลอง & ข้ามขั้นตอน 🧪
              </button>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400 text-sm flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0"></span>
              <p>{error}</p>
            </div>
          )}

          {/* STEP 1: DISTANCE / PACKAGE */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-200 dark:border-white/5 pb-2">
                <h3 className="text-base font-black italic uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  เลือกระยะทาง / รูปแบบการสมัคร <Sparkles className="w-4 h-4 text-orange-500" />
                </h3>
                <p className="text-xs text-slate-400 dark:text-white/50">เลือกประเภทที่ต้องการร่วมกิจกรรม</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-4">
                {[
                  { type: "REGULAR" as DistanceType, title: "REGULAR 5KM", price: "555 บาท", desc: "เดิน-วิ่งเพื่อสุขภาพ ได้รับเสื้อยืดและเหรียญที่ระลึกเมื่อเข้าเส้นชัย", accentColor: "border-teal-500", radioColor: "accent-teal-500", badgeStyle: "text-teal-600 dark:text-teal-400 bg-teal-500/10 border-teal-500/20" },
                  { type: "vip" as DistanceType, title: "VIP 5KM", price: "990 บาท", desc: "สิทธิพิเศษ VIP เลือกลายเสื้อวิ่งพิเศษ พร้อมรับเกียรติบัตรพิเศษและของสมนาคุณ", accentColor: "border-yellow-500", radioColor: "accent-yellow-500", badgeStyle: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
                  { type: "souvenir" as DistanceType, title: "ของที่ระลึกสะสม", price: "390 บาท", desc: "รับเหรียญรางวัลพรีเมียม สุโขทัย ซีรีส์ + เสื้อยืด 1 ตัว (จัดส่งถึงบ้าน ไม่เข้าร่วมวิ่ง)", accentColor: "border-orange-500", radioColor: "accent-orange-500", badgeStyle: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
                  { type: "donation" as DistanceType, title: "ร่วมบริจาคสนับสนุน", price: "ตามความประสงค์", desc: "ร่วมสมทบทุนบริจาคสนับสนุนเพื่อการกุศลตามประสงค์ (ไม่มีสิทธิ์วิ่งและเสื้อที่ระลึก) ลดหย่อนภาษีเงินได้ 2 เท่า", accentColor: "border-purple-500", radioColor: "accent-purple-500", badgeStyle: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
                ].map((item) => (
                  <label 
                    key={item.type}
                    className={`border rounded-2xl p-5 flex flex-col justify-between cursor-pointer transition-all duration-200 relative ${
                      formData.distance === item.type 
                        ? `${item.type === 'donation' ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500' : item.type === 'souvenir' ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500' : item.type.startsWith('vip') ? 'border-yellow-500 bg-yellow-500/10 ring-1 ring-yellow-500' : 'border-teal-500 bg-teal-500/10 ring-1 ring-teal-500'}` 
                        : "border-slate-200 dark:border-white/10 hover:border-white/20 bg-slate-50 dark:bg-white/5"
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="distance" 
                      value={item.type}
                      checked={formData.distance === item.type}
                      onChange={handleChange}
                      className={`absolute top-5 right-5 ${item.radioColor} w-4 h-4 cursor-pointer`}
                    />
                    <div>
                      <span className={`text-[9px] font-black tracking-widest uppercase border px-2.5 py-0.5 rounded-full ${item.badgeStyle}`}>
                        {item.type === 'donation' ? 'Donation' : item.type === 'souvenir' ? 'Souvenir' : item.type}
                      </span>
                      <h4 className="text-sm font-black tracking-tight text-slate-900 dark:text-white mt-4">{item.title}</h4>
                      <p className="text-[11px] text-slate-400 dark:text-white/50 mt-1.5 leading-relaxed">{item.desc}</p>
                    </div>
                    <div className="pt-3 border-t border-slate-200 dark:border-white/5 mt-4 flex items-baseline justify-between">
                      <span className="text-[9px] text-slate-400 dark:text-white/40 font-bold uppercase tracking-wider">{item.type === 'donation' ? 'ยอดบริจาค' : 'ราคา'}</span>
                      <span className="text-base font-black text-slate-900 dark:text-white font-sans">{item.price}</span>
                    </div>
                  </label>
                ))}
              </div>

            {["REGULAR", "5K", "vip", "souvenir"].includes(formData.distance) && (
              <div className={`bg-slate-50 dark:bg-white/5 border rounded-2xl p-5 mt-4 flex flex-col items-center justify-center gap-4 animate-fade-in text-center min-h-[160px] ${formData.distance === 'vip' ? 'border-yellow-500/20' : formData.distance === 'souvenir' ? 'border-orange-500/20' : 'border-teal-500/20'}`}> 
                <div className="flex gap-4 items-center justify-center flex-wrap">
                  {formData.distance === 'souvenir' ? (
                    souvenirImage ? (
                      <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 flex items-center justify-center p-2 shadow-inner relative group">
                        <img src={souvenirImage} alt="Souvenir" className="w-full h-full object-contain rounded-lg drop-shadow-md group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    ) : (
                      <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-xl bg-slate-100 dark:bg-black/40 border border-dashed border-white/20 flex flex-col items-center justify-center text-slate-300 dark:text-white/30">
                        <Award className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-xs uppercase font-black tracking-wider">รออัปโหลดภาพของที่ระลึก</span>
                      </div>
                    )
                  ) : (
                    <>
                      {formData.distance.startsWith("vip") ? (
                        <>
                          {shirtImage ? (
                            <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 flex items-center justify-center p-2 shadow-inner relative group">
                              <img src={shirtImage} alt="Shirt" className="w-full h-full object-contain rounded-lg drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
                            </div>
                          ) : (
                            <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-xl bg-slate-100 dark:bg-black/40 border border-dashed border-white/20 flex flex-col items-center justify-center text-slate-300 dark:text-white/30">
                              <Shirt className="w-6 h-6 mb-1 opacity-50" />
                              <span className="text-[9px] uppercase font-black tracking-wider">รออัปโหลดภาพเสื้อวิ่ง</span>
                            </div>
                          )}
                          {poloShirtImage ? (
                            <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 flex items-center justify-center p-2 shadow-inner relative group">
                              <img src={poloShirtImage} alt="VIP Polo Shirt" className="w-full h-full object-contain rounded-lg drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
                            </div>
                          ) : (
                            <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-xl bg-slate-100 dark:bg-black/40 border border-dashed border-white/20 flex flex-col items-center justify-center text-slate-300 dark:text-white/30">
                              <Shirt className="w-6 h-6 mb-1 opacity-50" />
                              <span className="text-[9px] uppercase font-black tracking-wider">รออัปโหลดภาพเสื้อโปโล</span>
                            </div>
                          )}
                        </>
                      ) : (
                        shirtImage ? (
                          <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 flex items-center justify-center p-2 shadow-inner relative group">
                            <img src={shirtImage} alt="Shirt" className="w-full h-full object-contain rounded-lg drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
                          </div>
                        ) : (
                          <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-xl bg-slate-100 dark:bg-black/40 border border-dashed border-white/20 flex flex-col items-center justify-center text-slate-300 dark:text-white/30">
                            <Shirt className="w-6 h-6 mb-1 opacity-50" />
                            <span className="text-[9px] uppercase font-black tracking-wider">รออัปโหลดภาพ</span>
                          </div>
                        )
                      )}

                      {medalImage ? (
                        <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 flex items-center justify-center p-2 shadow-inner relative group">
                          <img src={medalImage} alt="Medal" className="w-full h-full object-contain rounded-lg drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      ) : (
                        <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-xl bg-slate-100 dark:bg-black/40 border border-dashed border-white/20 flex flex-col items-center justify-center text-slate-300 dark:text-white/30">
                          <Award className="w-6 h-6 mb-1 opacity-50" />
                          <span className="text-[9px] uppercase font-black tracking-wider">รออัปโหลดภาพ</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                <div className="space-y-1 text-left w-full max-w-sm mx-auto">
                  {formData.distance === "REGULAR" || formData.distance === "5K" ? (
                    <>
                      <h4 className="text-sm font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 text-center">
                        แพ็กเกจ REGULAR 5KM
                      </h4>
                      <ul className="text-xs text-slate-500 dark:text-white/60 space-y-1 pt-3 list-disc list-inside">
                        <li>เข้าร่วมกิจกรรมเดิน-วิ่ง ระยะ 5 กิโลเมตร</li>
                        <li>เสื้อวิ่ง LSEd Running 1 ตัว (ระบุไซส์ในขั้นตอนถัดไป)</li>
                        <li>เหรียญรางวัลเมื่อเข้าเส้นชัย 1 เหรียญ</li>
                        <li>สิทธิ์ขอลดหย่อนภาษีจากการสมทบทุน 1 เท่า</li>
                      </ul>
                    </>
                  ) : formData.distance === "vip" ? (
                    <>
                      <h4 className="text-sm font-black uppercase tracking-wider text-yellow-400 text-center">
                        แพ็กเกจ VIP 5KM
                      </h4>
                      <ul className="text-xs text-slate-500 dark:text-white/60 space-y-1 pt-3 list-disc list-inside">
                        <li>เข้าร่วมกิจกรรมเดิน-วิ่ง ระยะ 5 กิโลเมตร</li>
                        <li>เลือกลายเสื้อวิ่ง VIP พิเศษ 1 ตัว (ระบุไซส์ในขั้นตอนถัดไป)</li>
                        <li>เหรียญรางวัลพรีเมียม 1 เหรียญ</li>
                        <li>เกียรติบัตรพิเศษและของสมนาคุณ</li>
                        <li>สิทธิ์ขอลดหย่อนภาษีจากการสมทบทุน 2 เท่า</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <h4 className="text-sm font-black uppercase tracking-wider text-orange-400 text-center">
                        แพ็กเกจของที่ระลึกสะสม (Souvenir Package)
                      </h4>
                      <ul className="text-xs text-slate-500 dark:text-white/60 space-y-1 pt-3 list-disc list-inside">
                        <li>เสื้อวิ่งพรีเมียม LSEd Running 1 ตัว (ระบุไซส์ในขั้นตอนถัดไป)</li>
                        <li>เหรียญรางวัลพรีเมียม สุโขทัย ซิกเนเจอร์ ซีรีส์ 1 เหรียญ</li>
                        <li>สิทธิ์ขอลดหย่อนภาษีจากการสมทบทุน 1 เท่า</li>
                      </ul>
                    </>
                  )}
                </div>
              </div>
            )}

            {formData.distance === "donation" && (
              <div className="bg-slate-50 dark:bg-white/5 border border-orange-500/20 rounded-2xl p-6 mt-4 space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-orange-400 block">ระบุจำนวนเงินที่ต้องการบริจาคสนับสนุน (บาท)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400 font-bold text-lg">฿</span>
                  <input
                    type="number"
                    name="donationAmount"
                    value={formData.donationAmount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      setFormData(prev => ({ ...prev, donationAmount: val }));
                    }}
                    placeholder="1"
                    min={1}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-orange-500/30 bg-slate-100 dark:bg-black/40 text-lg font-black tracking-wide focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-white/40 leading-relaxed font-light">
                  * ท่านสามารถร่วมบริจาคสนับสนุนได้ไม่มีขั้นต่ำตามความประสงค์ เพื่อร่วมสมทบทุนสนับสนุนกิจกรรมและสามารถนำไปลดหย่อนภาษีได้
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: RUNNER DETAILS */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-200 dark:border-white/5 pb-2">
              <h3 className="text-base font-black italic uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                ข้อมูลส่วนบุคคลของผู้สมัคร <Sparkles className="w-4 h-4 text-orange-500" />
              </h3>
              <p className="text-xs text-slate-400 dark:text-white/50">กรุณากรอกข้อมูลส่วนตัวตามจริงเพื่อผลประโยชน์ของท่าน</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 block">ชื่อจริง (ภาษาไทย หรือ อังกฤษ)</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/40" />
                  <input 
                    type="text" 
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="กรอกชื่อจริง"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 block">นามสกุล</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/40" />
                  <input 
                    type="text" 
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="กรอกนามสกุล"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 block">เลขบัตรประชาชน / เลขหนังสือเดินทาง</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/40" />
                  <input 
                    type="text" 
                    name="nationalId"
                    value={formData.nationalId}
                    onChange={handleChange}
                    placeholder="เลขบัตรประชาชน 13 หลัก หรือเลขที่พาสปอร์ต"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 block">อีเมลสำหรับติดต่อ</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/40" />
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@mail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 block">เบอร์โทรศัพท์มือถือ</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/40" />
                  <input 
                    type="tel" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="081XXXXXXX"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {formData.distance !== "donation" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 block">อายุ (ปี)</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/40" />
                      <input 
                        type="number" 
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        placeholder="ระบุอายุเป็นตัวเลข"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 block">เพศ</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition text-slate-900 dark:text-white"
                    >
                      <option value="male" className="bg-slate-50 dark:bg-neutral-900">ชาย</option>
                      <option value="female" className="bg-slate-50 dark:bg-neutral-900">หญิง</option>
                      <option value="other" className="bg-slate-50 dark:bg-neutral-900">อื่นๆ</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 block">หมู่โลหิต (กรุ๊ปเลือด)</label>
                    <select
                      name="bloodType"
                      value={formData.bloodType}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition text-slate-900 dark:text-white"
                    >
                      <option value="Unknown" className="bg-slate-50 dark:bg-neutral-900">ไม่ทราบ / ไม่ระบุ</option>
                      <option value="A" className="bg-slate-50 dark:bg-neutral-900">A</option>
                      <option value="B" className="bg-slate-50 dark:bg-neutral-900">B</option>
                      <option value="AB" className="bg-slate-50 dark:bg-neutral-900">AB</option>
                      <option value="O" className="bg-slate-50 dark:bg-neutral-900">O</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: EMERGENCY & SHIRT (OR TAX DEDUCTION FOR DONATIONS) */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-200 dark:border-white/5 pb-2">
              <h3 className="text-base font-black italic uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                {formData.distance === "donation" ? (
                  <>การลดหย่อนภาษี & รายละเอียดผู้บริจาค <Sparkles className="w-4 h-4 text-orange-500" /></>
                ) : (
                  <>ผู้ติดต่อฉุกเฉิน, รับเสื้อวิ่ง & สิทธิ์ลดหย่อนภาษี <Sparkles className="w-4 h-4 text-orange-500" /></>
                )}
              </h3>
              <p className="text-xs text-slate-400 dark:text-white/50">
                {formData.distance === "donation" 
                  ? "ระบุรายละเอียดข้อมูลผู้บริจาคและวัตถุประสงค์เพื่อออกใบลดหย่อนภาษีตามระบบของสถาบัน"
                  : "กรุณาระบุเพื่อความปลอดภัยสูงสุดในการบริการด้านพยาบาล, สิทธิ์รับเสื้อวิ่ง และการกรอกข้อมูลลดหย่อนภาษี"
                }
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
              {/* Only show emergency contacts if NOT a pure donation or souvenir order */}
              {formData.distance !== "donation" && formData.distance !== "souvenir" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 block">ชื่อผู้ติดต่อฉุกเฉิน</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/40" />
                      <input 
                        type="text" 
                        name="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={handleChange}
                        placeholder="ชื่อ-นามสกุล ผู้ติดต่อกรณีฉุกเฉิน"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 block">เบอร์โทรศัพท์ติดต่อฉุกเฉิน</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/40" />
                      <input 
                        type="text" 
                        name="emergencyContactPhone"
                        value={formData.emergencyContactPhone}
                        onChange={handleChange}
                        placeholder="เบอร์โทรศัพท์ผู้ติดต่อฉุกเฉิน"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Show shirt size and delivery details for all distance packages except pure donation */}
              {formData.distance !== "donation" && (
                <>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 block">ไซส์เสื้อที่ระลึก (กรุณาตรวจสอบขนาดตามตาราง)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {SHIRT_SIZES.map((sizeObj) => (
                        <button
                          key={sizeObj.size}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, shirtSize: sizeObj.size }))}
                          className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                            formData.shirtSize === sizeObj.size
                              ? "border-teal-500 bg-teal-500/10 text-slate-900 dark:text-white"
                              : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-white/60 hover:border-white/20 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          <span className="block text-sm font-black tracking-wider">{sizeObj.size}</span>
                          <span className="block text-[10px] opacity-70 mt-0.5">{sizeObj.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-4 pt-4 border-t border-slate-200 dark:border-white/5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 block">ช่องทางการรับเสื้อยืดและของที่ระลึก</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, deliveryMethod: "pickup" }))}
                          className={`p-4 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                            formData.deliveryMethod === "pickup"
                              ? "border-teal-500 bg-teal-500/10 text-slate-900 dark:text-white"
                              : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-white/60 hover:border-white/20 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          <span className="block text-xs font-black tracking-wider">รับหน้างานเอง (ไม่มีค่าใช้จ่าย)</span>
                          <span className="block text-[10px] opacity-70">รับด้วยตนเอง ณ คณะ LSEd มธ. รังสิต ในวันงาน</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, deliveryMethod: "shipping" }))}
                          className={`p-4 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                            formData.deliveryMethod === "shipping"
                              ? "border-orange-500 bg-orange-500/10 text-slate-900 dark:text-white"
                              : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-white/60 hover:border-white/20 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          <Truck className="w-4 h-4 text-orange-500" />
                          <span className="block text-xs font-black tracking-wider text-orange-400">จัดส่งโดยไปรษณีย์ไทย (EMS) (+60 บาท)</span>
                          <span className="block text-[10px] opacity-70">จัดส่งเสื้อยืดและเหรียญด่วนพิเศษถึงที่อยู่ท่าน</span>
                        </button>
                      </div>
                    </div>

                    {formData.deliveryMethod === "shipping" && (
                      <div className="space-y-1.5 pt-2 animate-fade-in">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 block">ที่อยู่ในการจัดส่งโดยละเอียด</label>
                        <textarea
                          name="shippingAddress"
                          value={formData.shippingAddress}
                          onChange={(e) => setFormData(prev => ({ ...prev, shippingAddress: e.target.value }))}
                          placeholder="ระบุ บ้านเลขที่ หมู่บ้าน/อาคาร ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition text-slate-900 dark:text-white"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Tax Deduction Request section (for BOTH Runner and Donation) */}
              <div className="md:col-span-2 space-y-4 pt-4 border-t border-slate-200 dark:border-white/5">
                <div className="space-y-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl p-4">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 block">การขอใบลดหย่อนภาษีประจำปี (ใบแสดงวัตถุประสงค์ในการบริจาคเงิน)</label>
                  <div className="flex items-start gap-3">
                    <input 
                      type="checkbox"
                      name="taxDeduction"
                      id="taxDeduction"
                      checked={formData.taxDeduction}
                      onChange={(e) => setFormData(prev => ({ ...prev, taxDeduction: e.target.checked }))}
                      className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 mt-1 cursor-pointer"
                    />
                    <div className="text-xs">
                      <label htmlFor="taxDeduction" className="text-slate-900 dark:text-white font-bold cursor-pointer block">ต้องการขอใช้สิทธิ์ลดหย่อนภาษีประจำปี (e-Donation)</label>
                      <p className="text-slate-400 dark:text-white/50 mt-0.5 leading-relaxed">
                        หักลดหย่อนภาษีได้ตามกฎหมายของคณะวิทยาการเรียนรู้และศึกษาศาสตร์ มหาวิทยาลัยธรรมศาสตร์
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sub-form of Tax Deduction matching the uploaded PDF */}
                {formData.taxDeduction && (
                  <div className="p-5 rounded-2xl bg-orange-500/5 border border-orange-500/10 space-y-5 animate-fade-in">
                    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/5 pb-2">
                      <FileText className="w-4 h-4 text-orange-400" />
                      <span className="text-xs font-black tracking-wider text-orange-400 uppercase">กรอกข้อมูลแสดงวัตถุประสงค์ในการบริจาคเงิน</span>
                    </div>

                    {/* Donor Type selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 block">ประเภทผู้บริจาค</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, donorType: "personal" }))}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl border transition ${
                              formData.donorType === "personal"
                                ? "border-orange-500 bg-orange-500/10 text-slate-900 dark:text-white"
                                : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-white/50 hover:border-white/20"
                            }`}
                          >
                            บุคคลธรรมดา
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, donorType: "corporate" }))}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl border transition ${
                              formData.donorType === "corporate"
                                ? "border-orange-500 bg-orange-500/10 text-slate-900 dark:text-white"
                                : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-white/50 hover:border-white/20"
                            }`}
                          >
                            นิติบุคคล (บริษัท/ห้างฯ)
                          </button>
                        </div>
                      </div>

                      {/* Tax ID */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 block">
                          {formData.donorType === "personal" ? "เลขประจำตัวผู้เสียภาษี (เลขบัตรประชาชน)" : "เลขประจำตัวผู้เสียภาษีอากรนิติบุคคล"} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={13}
                          placeholder="ระบุตัวเลข 13 หลัก"
                          value={formData.taxId}
                          onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value.replace(/[^0-9]/g, "") }))}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Donor Name override */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 block">
                        {formData.donorType === "personal" ? "ชื่อ - นามสกุล ผู้บริจาค (ตามบัตรประชาชน)" : "ชื่อนิติบุคคล (บริษัท/ห้างหุ้นส่วน/ห้างหุ้นส่วนจำกัด)"} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder={formData.donorType === "personal" ? "ระบุ นาย / นาง / นางสาว พร้อมชื่อ-นามสกุล" : "ระบุชื่อนิติบุคคลเพื่อจัดทำใบเสร็จให้ถูกต้อง"}
                        value={formData.donorName}
                        onChange={(e) => setFormData(prev => ({ ...prev, donorName: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Receipt Address */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 block">ที่อยู่ในการออกใบเสร็จรับเงิน <span className="text-red-500">*</span></label>
                      <textarea
                        placeholder="ระบุที่อยู่ในการออกใบเสร็จรับเงินให้ละเอียดและถูกต้องเพื่อประโยชน์ทางภาษีของท่าน"
                        value={formData.receiptAddress}
                        onChange={(e) => setFormData(prev => ({ ...prev, receiptAddress: e.target.value }))}
                        rows={2.5}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Receipt Delivery Method */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 block">ที่อยู่ในการจัดส่งใบเสร็จรับเงิน</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, receiptDeliveryType: "same" }))}
                          className={`py-3 text-xs font-bold rounded-xl border transition text-left px-4 flex items-center gap-2.5 ${
                            formData.receiptDeliveryType === "same"
                              ? "border-orange-500 bg-orange-500/10 text-slate-900 dark:text-white"
                              : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-white/50 hover:border-white/20"
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full border border-orange-500 flex-shrink-0 flex items-center justify-center`}>
                            {formData.receiptDeliveryType === "same" && <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>}
                          </span>
                          ตามที่อยู่ในการออกใบเสร็จรับเงิน
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, receiptDeliveryType: "custom" }))}
                          className={`py-3 text-xs font-bold rounded-xl border transition text-left px-4 flex items-center gap-2.5 ${
                            formData.receiptDeliveryType === "custom"
                              ? "border-orange-500 bg-orange-500/10 text-slate-900 dark:text-white"
                              : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-white/50 hover:border-white/20"
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full border border-orange-500 flex-shrink-0 flex items-center justify-center`}>
                            {formData.receiptDeliveryType === "custom" && <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>}
                          </span>
                          ระบุที่อยู่จัดส่งใบเสร็จใหม่
                        </button>
                      </div>
                    </div>

                    {formData.receiptDeliveryType === "custom" && (
                      <div className="space-y-1.5 pt-1 animate-fade-in">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 block">ที่อยู่จัดส่งใบเสร็จรับเงิน <span className="text-red-500">*</span></label>
                        <textarea
                          placeholder="ระบุที่อยู่จัดส่งใบเสร็จรับเงินปลายทางอย่างละเอียด"
                          value={formData.receiptDeliveryAddress}
                          onChange={(e) => setFormData(prev => ({ ...prev, receiptDeliveryAddress: e.target.value }))}
                          rows={2}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 dark:text-white"
                        />
                      </div>
                    )}

                    {/* Donation Objective */}
                    <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 block">วัตถุประสงค์ในการบริจาคเงิน (ระบุในใบแสดงวัตถุประสงค์)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { key: "education", label: "เพื่อการศึกษาทั่วไป" },
                          { key: "fund", label: 'เพื่อ "กองทุนคณะวิทยาการเรียนรู้และศึกษาศาสตร์"' },
                          { key: "project", label: "เพื่อสนับสนุนโครงการ (ระบุโครงการ)" },
                          { key: "other", label: "วัตถุประสงค์อื่นๆ (ระบุ)" },
                        ].map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, donationObjective: item.key as any }))}
                            className={`py-3 text-xs font-bold rounded-xl border transition text-left px-4 flex items-center gap-2.5 ${
                              formData.donationObjective === item.key
                                ? "border-orange-500 bg-orange-500/10 text-slate-900 dark:text-white"
                                : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-white/50 hover:border-white/20"
                            }`}
                          >
                            <span className={`w-2.5 h-2.5 rounded-full border border-orange-500 flex-shrink-0 flex items-center justify-center`}>
                              {formData.donationObjective === item.key && <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>}
                            </span>
                            <span className="truncate">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {(formData.donationObjective === "project" || formData.donationObjective === "other") && (
                      <div className="space-y-1.5 pt-1 animate-fade-in">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 block">ระบุรายละเอียดวัตถุประสงค์ในการบริจาค <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          placeholder={formData.donationObjective === "project" ? "เช่น โครงการพัฒนาอาคารนวัตกรรมการเรียนรู้" : "ระบุวัตถุประสงค์อื่นๆ ตามประสงค์ของท่าน"}
                          value={formData.donationObjectiveDetail}
                          onChange={(e) => setFormData(prev => ({ ...prev, donationObjectiveDetail: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 dark:text-white"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: WAIVER & CONSENT */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-200 dark:border-white/5 pb-2">
              <h3 className="text-base font-black italic uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                หนังสือยินยอมปฏิบัติตามกฎกติกาและยอมรับความเสี่ยง <FileText className="w-4 h-4 text-orange-500" />
              </h3>
              <p className="text-xs text-slate-400 dark:text-white/50">กรุณาอ่านและทำความเข้าใจข้อตกลงและเงื่อนไขการเข้าร่วมกิจกรรมเพื่อความปลอดภัยสูงสุด</p>
            </div>

            <div className="border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 rounded-2xl p-6 space-y-6 max-h-[300px] overflow-y-auto custom-scrollbar text-sm text-slate-900 dark:text-white/80 leading-relaxed font-light">
              {formData.distance === "donation" || formData.distance === "souvenir" ? (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">ข้อตกลงและเงื่อนไขการสนับสนุนบริจาคเพื่อการกุศล</h4>
                  <p>
                    ผู้แสดงเจตจำนงในการร่วมบริจาคสนับสนุนหรือสั่งซื้อของที่ระลึกสำหรับโครงการเดิน-วิ่งการกุศล <strong className="text-slate-900 dark:text-white font-bold">"วิ่ง-ฉาย-แสง" LSEd Running 2569</strong> ตกลงยอมรับเงื่อนไขและข้อบังคับดังต่อไปนี้:
                  </p>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>
                      <strong className="text-slate-900 dark:text-white font-semibold">วัตถุประสงค์ในการสมทบทุน:</strong> รายได้ทั้งหมดหลังหักค่าใช้จ่ายจะถูกนำไปสมทบเข้ากองทุนคณะวิทยาการเรียนรู้และศึกษาศาสตร์ มหาวิทยาลัยธรรมศาสตร์ เพื่อสนับสนุนทุนการศึกษา พัฒนาสิ่งเรียนรู้ และนวัตกรรมเพื่อประโยชน์สาธารณะตามวัตถุประสงค์ของการจัดกิจกรรม
                    </li>
                    <li>
                      <strong className="text-slate-900 dark:text-white font-semibold">สิทธิ์ทางภาษี (e-Donation):</strong> ในกรณีที่ผู้บริจาคเลือกขอใช้สิทธิ์ลดหย่อนภาษี ระบบจะนำส่งข้อมูลการบริจาคตรงไปยังกรมสรรพากรโดยอัตโนมัติตามฐานข้อมูลเลขบัตรประชาชนที่ระบุไว้
                    </li>
                    <li>
                      <strong className="text-slate-900 dark:text-white font-semibold">การไม่เข้าร่วมกิจกรรมวิ่ง:</strong> ผู้สมัครรับทราบและตกลงว่า การเลือกรูปแบบ "ร่วมบริจาคสนับสนุน" หรือ "ของที่ระลึกสะสม" นี้ เป็นเพียงรูปแบบการสนับสนุนการกุศลเท่านั้น และ<span className="text-orange-500 font-bold">ไม่มีสิทธิ์ในการลงทะเบียนวิ่งทางกายภาพในวันจัดกิจกรรมจริง</span>
                    </li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">หนังสือยินยอมเข้าร่วมกิจกรรมและรับทราบความเสี่ยงทางกายภาพ</h4>
                  <p>
                    ข้าพเจ้ามีความประสงค์ในการสมัครเข้าร่วมโครงการเดิน-วิ่งการกุศล <strong className="text-slate-900 dark:text-white font-bold">"วิ่ง-ฉาย-แสง" LSEd Running 2569</strong> จัดโดย คณะวิทยาการเรียนรู้และศึกษาศาสตร์ มหาวิทยาลัยธรรมศาสตร์ ในวันที่ 24 มกราคม พ.ศ. 2570 และตกลงยินยอมปฏิบัติตามกฎกติกาและมาตรการเพื่อความปลอดภัยดังต่อไปนี้:
                  </p>
                  
                  <div className="space-y-3 pt-2">
                    <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                      <h5 className="font-bold text-slate-900 dark:text-white text-xs mb-1">1. การปฏิบัติตามกฎกติกาของคณะผู้จัดงานอย่างเคร่งครัด</h5>
                      <p className="text-[11px] text-slate-600 dark:text-white/70 leading-relaxed">
                        ข้าพเจ้าตกลงที่จะปฏิบัติตามกฎกติกาการแข่งขัน คำแนะนำ ตลอดจนมาตรการความปลอดภัยและคำสั่งการดูแลทางการแพทย์ที่กำหนดโดยคณะผู้จัดงานและเจ้าหน้าที่สนามทุกประการ หากคณะผู้จัดงานพิจารณาเห็นว่าพฤติกรรมหรือสภาวะของข้าพเจ้าอาจก่อให้เกิดอันตราย จะมีสิทธิ์ระงับการเข้าร่วมกิจกรรมของข้าพเจ้าทันทีเพื่อความปลอดภัยสูงสุด
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                      <h5 className="font-bold text-slate-900 dark:text-white text-xs mb-1">2. การยืนยันสุขภาพร่างกายและความพร้อมทางร่างกาย</h5>
                      <p className="text-[11px] text-slate-600 dark:text-white/70 leading-relaxed">
                        ข้าพเจ้าขอรับรองว่าตนเองมีสุขภาพร่างกายที่แข็งแรงสมบูรณ์ มีความพร้อมทั้งทางกายและจิตใจในการเข้าร่วมเดิน-วิ่งตามระยะทางที่สมัคร โดยไม่ได้ตั้งครรภ์ ไม่มีอาการเจ็บป่วยร้ายแรง หรือสภาวะโรคประจำตัวใดๆ (เช่น โรคหัวใจ ความดันโลหิตสูง โรคระบบทางเดินหายใจ) ที่อาจเป็นความเสี่ยงต่อชีวิตหรือก่อให้เกิดอันตรายร้ายแรงในระหว่างการออกกำลังกาย
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                      <h5 className="font-bold text-slate-900 dark:text-white text-xs mb-1">3. การยอมรับความเสี่ยงและการยกเว้นการเรียกร้องค่าชดเชย</h5>
                      <p className="text-[11px] text-slate-600 dark:text-white/70 leading-relaxed">
                        ข้าพเจ้ารับทราบว่าการเข้าร่วมกิจกรรมเดิน-วิ่งในระยะทางดังกล่าวมีความเสี่ยงที่อาจทำให้เกิดอุบัติเหตุ การบาดเจ็บของกล้ามเนื้อหรือกระดูก หรืออันตรายทางสุขภาพอื่นๆ ข้าพเจ้าตกลงยินยอมยอมรับความเสี่ยงที่อาจเกิดขึ้นทั้งหมดนี้ด้วยความสมัครใจ และตกลงสละสิทธิ์ในการเรียกร้องค่าเสียหาย ค่าชดเชย หรือดำเนินคดีทางกฎหมายใดๆ ต่อคณะผู้จัดงาน คณะกรรมการ สตาฟ อาสาสมัคร หรือหน่วยงานร่วมจัด หากเกิดเหตุสุดวิสัย อุบัติเหตุ หรือการบาดเจ็บใดๆ แก่ตัวข้าพเจ้า ยกเว้นกรณีที่เป็นการพิสูจน์ได้ว่าเกิดจากความประมาทเลินเล่ออย่างร้ายแรงของคณะผู้จัดงานโดยตรง
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                      <h5 className="font-bold text-slate-900 dark:text-white text-xs mb-1">4. การอนุญาตให้ใช้ภาพถ่ายภาพเคลื่อนไหวและสื่อ (PDPA)</h5>
                      <p className="text-[11px] text-slate-600 dark:text-white/70 leading-relaxed">
                        ข้าพเจ้ายินยอมและอนุญาตให้คณะผู้จัดงาน บันทึกภาพนิ่ง ภาพเคลื่อนไหว หรือเสียงของข้าพเจ้าในระหว่างเข้าร่วมกิจกรรม และนำภาพหรือเสียงดังกล่าวไปจัดทำสื่อประชาสัมพันธ์ รายงานผลการจัดงาน หรือสื่อสารกิจกรรมของคณะวิทยาการเรียนรู้และศึกษาศาสตร์ มธ. ในช่องทางต่างๆ เพื่อประโยชน์สาธารณะโดยไม่มีค่าตอบแทนใดๆ
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Checkbox fields */}
            <div className="space-y-4 pt-2">
              {formData.distance === "donation" || formData.distance === "souvenir" ? (
                <div className="flex items-start gap-3 bg-orange-500/5 border border-orange-500/10 rounded-2xl p-4 transition-all duration-200">
                  <input 
                    type="checkbox"
                    name="agreedToRules"
                    id="agreedToRules"
                    checked={agreedToRules}
                    onChange={(e) => setAgreedToRules(e.target.checked)}
                    className="w-4.5 h-4.5 rounded text-orange-500 focus:ring-orange-500 border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 mt-1 cursor-pointer"
                  />
                  <div className="text-xs">
                    <label htmlFor="agreedToRules" className="text-slate-900 dark:text-white font-black cursor-pointer block leading-normal text-sm">
                      ข้าพเจ้ายอมรับข้อตกลงและเงื่อนไขการร่วมสมทบทุนสนับสนุน <span className="text-orange-500">*</span>
                    </label>
                    <p className="text-slate-500 dark:text-white/60 mt-1 leading-relaxed text-[11px]">
                      ข้าพเจ้ายินยอมตกลงร่วมบริจาคสนับสนุนและยอมรับว่าแพ็กเกจที่เลือกไม่มีสิทธิ์วิ่งหรือเสื้อวิ่งในวันจัดงานจริง
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 bg-teal-500/5 border border-teal-500/10 rounded-2xl p-4 transition-all duration-200">
                    <input 
                      type="checkbox"
                      name="agreedToRules"
                      id="agreedToRules"
                      checked={agreedToRules}
                      onChange={(e) => setAgreedToRules(e.target.checked)}
                      className="w-4.5 h-4.5 rounded text-teal-600 dark:text-teal-400 focus:ring-teal-500 border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 mt-1 cursor-pointer"
                    />
                    <div className="text-xs">
                      <label htmlFor="agreedToRules" className="text-slate-900 dark:text-white font-black cursor-pointer block leading-normal text-sm">
                        ข้าพเจ้ายินยอมและตกลงปฏิบัติตามกฎกติกาของคณะผู้จัดงานอย่างเคร่งครัด <span className="text-red-500">*</span>
                      </label>
                      <p className="text-slate-500 dark:text-white/60 mt-1 leading-relaxed text-[11px]">
                        ข้าพเจ้าตกลงยินดีที่จะปฏิบัติตามเงื่อนไข กฎระเบียบ และมาตรการเพื่อความปลอดภัยและสุขภาพตามที่กำหนดทุกประการ
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-orange-500/5 border border-orange-500/10 rounded-2xl p-4 transition-all duration-200">
                    <input 
                      type="checkbox"
                      name="acceptedRisks"
                      id="acceptedRisks"
                      checked={acceptedRisks}
                      onChange={(e) => setAcceptedRisks(e.target.checked)}
                      className="w-4.5 h-4.5 rounded text-orange-500 focus:ring-orange-500 border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 mt-1 cursor-pointer"
                    />
                    <div className="text-xs">
                      <label htmlFor="acceptedRisks" className="text-slate-900 dark:text-white font-black cursor-pointer block leading-normal text-sm">
                        ข้าพเจ้ายอมรับความเสี่ยงทางสุขภาพและอุบัติเหตุที่อาจเกิดขึ้น <span className="text-red-500">*</span>
                      </label>
                      <p className="text-slate-500 dark:text-white/60 mt-1 leading-relaxed text-[11px]">
                        ข้าพเจ้าขอปฏิเสธการเรียกร้องค่าชดเชยความเสียหายใดๆ ต่อคณะผู้จัดงาน หากเกิดเหตุอุบัติเหตุหรืออันตรายต่อสุขภาพจากการวิ่ง
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW & CONFIRM */}
        {step === 5 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-200 dark:border-white/5 pb-2">
              <h3 className="text-base font-black italic uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                ตรวจสอบข้อมูลการสมัคร <Sparkles className="w-4 h-4 text-orange-500" />
              </h3>
              <p className="text-xs text-slate-400 dark:text-white/50">กรุณาตรวจสอบข้อมูลของท่านให้ถูกต้องก่อนทำการยืนยันการลงทะเบียน</p>
            </div>

            <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-start pb-4 border-b border-slate-200 dark:border-white/5">
                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">{formData.firstName} {formData.lastName}</h4>
                  <p className="text-xs text-slate-400 dark:text-white/50 mt-1">เลขบัตร/พาสปอร์ต: {formData.nationalId}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider border ${
                    formData.distance === "donation" 
                      ? "text-orange-400 bg-orange-500/10 border-orange-500/20" 
                      : formData.distance === "souvenir"
                        ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                        : "text-teal-600 dark:text-teal-400 bg-teal-500/10 border-teal-500/20"
                  }`}>
                    {formData.distance === "donation" ? "Donation" : formData.distance === "souvenir" ? "Souvenir" : formData.distance}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm text-slate-900 dark:text-white/80 leading-relaxed font-light">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-white/40 block font-bold uppercase tracking-wider">อีเมลผู้สมัคร</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formData.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-white/40 block font-bold uppercase tracking-wider">เบอร์โทรศัพท์</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formData.phone}</span>
                </div>
                <div>
                  {formData.distance === "donation" ? (
                    <>
                      <span className="text-[10px] text-slate-400 dark:text-white/40 block font-bold uppercase tracking-wider">วัตถุประสงค์การสนับสนุน</span>
                      <span className="font-bold text-orange-400">บริจาคสนับสนุนทุนการศึกษา (ไม่เข้าร่วมวิ่ง)</span>
                    </>
                  ) : formData.distance === "souvenir" ? (
                    <>
                      <span className="text-[10px] text-slate-400 dark:text-white/40 block font-bold uppercase tracking-wider">รายละเอียดผู้สั่งซื้อ</span>
                      <span className="font-bold text-slate-900 dark:text-white">สั่งซื้อแพ็กเกจของที่ระลึก (ไม่เข้าร่วมวิ่ง)</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] text-slate-400 dark:text-white/40 block font-bold uppercase tracking-wider">อายุ / เพศ / กรุ๊ปเลือด</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formData.age} ปี / {formData.gender === "male" ? "ชาย" : formData.gender === "female" ? "หญิง" : "อื่นๆ"} / กรุ๊ป {formData.bloodType}
                      </span>
                    </>
                  )}
                </div>
                <div>
                  {formData.distance === "donation" ? (
                    <>
                      <span className="text-[10px] text-slate-400 dark:text-white/40 block font-bold uppercase tracking-wider">สิทธิ์ลดหย่อนภาษี</span>
                      <span className="font-bold text-orange-400">e-Donation (ลดหย่อนภาษีได้ 2 เท่า)</span>
                    </>
                  ) : formData.distance === "souvenir" ? (
                    <>
                      <span className="text-[10px] text-slate-400 dark:text-white/40 block font-bold uppercase tracking-wider">เสื้อที่ระลึกไซส์ & ของที่จะได้รับ</span>
                      <span className="font-black text-amber-400">
                        ไซส์ {formData.shirtSize} + เหรียญทองสุโขทัยพรีเมียม
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] text-slate-400 dark:text-white/40 block font-bold uppercase tracking-wider">เสื้อที่ระลึกไซส์</span>
                      <span className="font-black text-teal-600 dark:text-teal-400">
                        {formData.shirtSize} ({SHIRT_SIZES.find(s => s.size === formData.shirtSize)?.desc.split(" ")[1] || "M"})
                      </span>
                    </>
                  )}
                </div>
                {formData.distance !== "donation" && formData.distance !== "souvenir" && (
                  <div className="sm:col-span-2 pt-2 border-t border-slate-200 dark:border-white/5">
                    <span className="text-[10px] text-slate-400 dark:text-white/40 block font-bold uppercase tracking-wider">กรณีฉุกเฉินติดต่อ</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formData.emergencyContactName} ({formData.emergencyContactPhone})</span>
                  </div>
                )}
                {formData.distance !== "donation" && (
                  <>
                    <div className="pt-2 border-t border-slate-200 dark:border-white/5">
                      <span className="text-[10px] text-slate-400 dark:text-white/40 block font-bold uppercase tracking-wider">สิทธิ์ลดหย่อนภาษี</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formData.taxDeduction ? "ขอใช้สิทธิ์ลดหย่อนภาษีประจำปี (e-Donation)" : "ไม่ขอใช้สิทธิ์"}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-white/5">
                      <span className="text-[10px] text-slate-400 dark:text-white/40 block font-bold uppercase tracking-wider">รูปแบบการรับเสื้อ</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formData.deliveryMethod === "shipping" ? "จัดส่งโดยไปรษณีย์ไทย (EMS) (+60 บาท)" : "รับหน้างานด้วยตนเอง"}
                      </span>
                    </div>
                    {formData.deliveryMethod === "shipping" && (
                      <div className="sm:col-span-2 pt-2 border-t border-slate-200 dark:border-white/5">
                        <span className="text-[10px] text-slate-400 dark:text-white/40 block font-bold uppercase tracking-wider">ที่อยู่ในการจัดส่ง</span>
                        <span className="font-bold text-slate-900 dark:text-white block bg-slate-50 dark:bg-white/5 p-2.5 rounded-lg mt-1 text-xs border border-slate-200 dark:border-white/5 leading-relaxed">{formData.shippingAddress}</span>
                      </div>
                    )}
                  </>
                )}

                {/* Show detailed Tax Deduction Request info in summary */}
                {formData.taxDeduction && (
                  <div className="sm:col-span-2 mt-2 pt-3 border-t border-orange-500/20 bg-orange-500/5 p-4 rounded-xl border border-orange-500/10 space-y-3">
                    <div className="flex items-center gap-1.5 border-b border-orange-500/10 pb-1.5">
                      <FileText className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-xs font-black uppercase tracking-wider text-orange-400">สรุปข้อมูลเพื่อออกใบลดหย่อนภาษี</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-white/40 block font-bold">ชื่อผู้บริจาค (ออกในใบเสร็จ)</span>
                        <span className="font-bold text-slate-900 dark:text-white">{formData.donorName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-white/40 block font-bold">เลขประจำตัวผู้เสียภาษี</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{formData.taxId}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-[10px] text-slate-400 dark:text-white/40 block font-bold">ที่อยู่ในการออกใบเสร็จรับเงิน</span>
                        <span className="font-bold text-slate-900 dark:text-white text-[11px] block mt-0.5 leading-normal">{formData.receiptAddress}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-white/40 block font-bold">วัตถุประสงค์ในการบริจาค</span>
                        <span className="font-bold text-orange-300">
                          {formData.donationObjective === "education" && "เพื่อการศึกษาทั่วไป"}
                          {formData.donationObjective === "fund" && 'เพื่อ "กองทุนคณะวิทยาการเรียนรู้และศึกษาศาสตร์"'}
                          {formData.donationObjective === "project" && `เพื่อสนับสนุนโครงการ: ${formData.donationObjectiveDetail}`}
                          {formData.donationObjective === "other" && `วัตถุประสงค์อื่นๆ: ${formData.donationObjectiveDetail}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-white/40 block font-bold">การจัดส่งใบเสร็จรับเงิน</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formData.receiptDeliveryType === "same" ? "ตามที่อยู่ใบเสร็จ" : "ระบุที่อยู่จัดส่งใหม่"}
                        </span>
                      </div>
                      {formData.receiptDeliveryType === "custom" && (
                        <div className="sm:col-span-2">
                          <span className="text-[10px] text-slate-400 dark:text-white/40 block font-bold">ที่อยู่จัดส่งใบเสร็จรับเงิน</span>
                          <span className="font-bold text-slate-900 dark:text-white text-[11px] block mt-0.5 leading-normal">{formData.receiptDeliveryAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Total price highlight */}
              <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-100 dark:bg-black/40 rounded-xl p-4 mt-4 border border-slate-200 dark:border-white/5">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-white/40 font-bold block uppercase tracking-wider">
                    {formData.distance === "donation" ? "ยอดร่วมบริจาคสนับสนุน" : "อัตราค่าสมัครเข้าร่วมกิจกรรม"}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-white/60 font-medium">
                    {formData.distance === "donation" 
                      ? "สมทบทุนสนับสนุนงานพัฒนาวิชาการและลดหย่อนภาษี" 
                      : `ระยะวิ่ง ${formData.distance === "REGULAR" || formData.distance === "5K" ? "REGULAR 5KM" : formData.distance}`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 dark:text-white/40 block uppercase tracking-wider font-bold">ราคาสุทธิ</span>
                  <span className="text-2xl font-black text-teal-600 dark:text-teal-400 font-mono tracking-tight">
                    {getPrice(formData.distance)} THB
                  </span>
                </div>
              </div>
            </div>

            <div className={`flex items-start gap-2.5 ${formData.distance === "donation" ? "bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-200" : "bg-teal-500/10 border-teal-500/20 text-teal-700 dark:text-teal-200"} border rounded-xl p-4 text-xs leading-relaxed font-light`}>
              <CheckCircle2 className={`w-4 h-4 ${formData.distance === "donation" ? "text-orange-400" : "text-teal-600 dark:text-teal-400"} flex-shrink-0 mt-0.5`} />
              <p>
                {formData.distance === "donation" 
                  ? "ข้าพเจ้าขอรับรองและยืนยันว่าข้อมูลทั้งหมดที่ระบุข้างต้นเป็นความจริงทุกประการ และมีความประสงค์ในการร่วมบริจาคเพื่อสนับสนุนการศึกษาและนวัตกรรมการเรียนรู้ แก่คณะวิทยาการเรียนรู้และศึกษาศาสตร์ มหาวิทยาลัยธรรมศาสตร์ เพื่อร่วมขับเคลื่อนประโยชน์สาธารณะ"
                  : "ข้าพเจ้าขอรับรองและยืนยันว่าข้อมูลทั้งหมดที่ระบุข้างต้นเป็นความจริงทุกประการ และยินดีตกลงปฏิบัติตามเงื่อนไขและกฎกติกาการเข้าร่วมกิจกรรมวิ่งของคณะผู้จัดงานอย่างเคร่งครัด เพื่อความเรียบร้อยและปลอดภัยสูงสุดตลอดระยะเวลาการจัดกิจกรรม"}
              </p>
            </div>
          </div>
        )}

        {/* Form Controls */}
        <div className="pt-6 border-t border-slate-200 dark:border-white/5 flex flex-col-reverse sm:flex-row justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              disabled={loading}
              className="px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> ย้อนกลับ
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white/80 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              ยกเลิก
            </button>
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-3 bg-white text-black font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-1.5 transition ml-auto cursor-pointer hover:bg-slate-200"
            >
              ถัดไป <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition shadow-lg shadow-teal-500/20 ml-auto cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-900 dark:text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  กำลังส่งข้อมูล...
                </>
              ) : (
                <>ยืนยันการลงทะเบียน <CheckCircle2 className="w-4 h-4" /></>
              )}
            </button>
          )}
        </div>
        </div>
      </form>
    </div>
  );
}
