const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

code = code.replace(
  'const [medalImage, setMedalImage] = useState<string>("");',
  'const [medalImage, setMedalImage] = useState<string>("");\n  const [souvenirImage, setSouvenirImage] = useState<string>("");'
);

code = code.replace(
  'if (data.medalImage) setMedalImage(data.medalImage);',
  'if (data.medalImage) setMedalImage(data.medalImage);\n        if (data.souvenirImage) setSouvenirImage(data.souvenirImage);'
);

// We need to inject the Medal section back, right before the Souvenir section.
// Souvenir section starts with `{/* Finisher Souvenir inside the event & Tax Deduction */}`

const medalSectionHTML = `      {/* Finisher Medal Showcase Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center bg-gradient-to-br from-amber-50 via-white to-amber-50 dark:from-neutral-950 dark:via-zinc-900 dark:to-amber-950/40 border border-slate-200 dark:border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl" id="medals">
        {/* High fidelity medal mockup SVG */}
        <div className="lg:col-span-6 flex flex-col items-center space-y-6 order-last lg:order-first">
          {medalImage ? (
            <div className="relative bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl w-full max-w-sm flex flex-col items-center justify-center aspect-square shadow-inner p-2 group overflow-hidden">
              <img src={medalImage} alt="Medal Image" className="w-full h-full object-contain rounded-xl drop-shadow-[0_12px_24px_rgba(245,158,11,0.35)] group-hover:scale-105 transition-transform duration-300" />
            </div>
          ) : (
            <div className="relative bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 border-dashed rounded-2xl p-6 md:p-10 w-full max-w-sm flex flex-col items-center justify-center aspect-square shadow-inner group overflow-hidden">
              <Award className="w-12 h-12 mb-3 opacity-30 text-slate-900 dark:text-white" />
              <span className="text-xs text-slate-400 dark:text-white/40 font-black uppercase tracking-wider text-center">รออัปโหลดภาพเหรียญที่ระลึก</span>
            </div>
          )}
        </div>

        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" /> Finisher Souvenir Medal <Sparkles className="w-3 h-3 text-orange-400" />
          </div>
          <h2 className="text-4xl font-black italic tracking-tight uppercase text-slate-900 dark:text-white leading-tight">
            เหรียญที่ระลึกผู้พิชิต <br /><span className="text-orange-400">ลดหย่อนภาษีได้ตามกฎหมาย</span>
          </h2>
          <p className="text-slate-600 dark:text-white/70 leading-relaxed font-light text-sm">
            เหรียญที่ระลึกสุโขทัยซีรีส์ (Sukhothai Signature Series) หล่อด้วยโลหะสังกะสีผสมพิเศษ (Zinc Alloy) เกรดพรีเมียมหนา 4 มม. ชุบผิวทองโบราณสไตล์แชมเปญแฮร์ไลน์สวยงาม สลักลวดลายฉลุวิจิตรศิลป์แห่งอาณาจักรสุโขทัยโบราณที่ออกแบบผสมผสานความร่วมสมัย
          </p>
          <div className="p-5 rounded-2xl bg-orange-500/5 border border-orange-500/10 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-orange-400 flex items-center gap-2">
              <FileText className="w-4 h-4" /> สิทธิ์ลดหย่อนภาษี (Tax Deduction Eligible)
            </h4>
            <p className="text-xs text-slate-600 dark:text-white/70 leading-relaxed">
              สำหรับผู้บริจาคหรือสั่งซื้อของที่ระลึกสำหรับงานนี้ รายได้ทั้งหมดหลังหักค่าใช้จ่ายจะนำไปสนับสนุนเข้ากองทุนพัฒนาวิชาการและทุนการศึกษา คณะวิทยาการเรียนรู้และศึกษาศาสตร์ มหาวิทยาลัยธรรมศาสตร์ โดยท่านสามารถระบุ <strong className="text-orange-300">"ขอใช้สิทธิ์ลดหย่อนภาษี"</strong> ในระบบได้ทันที ทางสถาบันจะนำส่งข้อมูลผ่านระบบ e-Donation สรรพากรเพื่ออำนวยความสะดวกให้แก่ท่านอย่างรวดเร็ว
            </p>
          </div>
        </div>
      </section>

`;

const souvenirIndex = code.indexOf('{/* Finisher Souvenir inside the event & Tax Deduction */}');

if (souvenirIndex !== -1) {
  code = code.substring(0, souvenirIndex) + medalSectionHTML + code.substring(souvenirIndex);
}

// In the Souvenir section, we must change `medalImage` to `souvenirImage`.
// Let's do a replace within the Souvenir block.
const souvenirEndIndex = code.indexOf('{/* General Rules & Routes */}');
if (souvenirIndex !== -1 && souvenirEndIndex !== -1) {
    let block = code.substring(souvenirIndex, souvenirEndIndex);
    block = block.replace(/medalImage/g, "souvenirImage");
    code = code.substring(0, souvenirIndex) + block + code.substring(souvenirEndIndex);
}

fs.writeFileSync('src/components/LandingPage.tsx', code);
