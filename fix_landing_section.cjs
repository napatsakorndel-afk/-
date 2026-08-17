const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// Find the duplicate sections. They start with `{/* Finisher Souvenir inside the event & Tax Deduction */}`
// Let's replace the whole block from the first occurrence to the end of the second occurrence.

const startString = '{/* Finisher Souvenir inside the event & Tax Deduction */}';
const endString = '{/* General Rules & Routes */}';

const startIndex = code.indexOf(startString);
const endIndex = code.indexOf(endString);

if (startIndex !== -1 && endIndex !== -1) {
  const newSection = `      {/* Finisher Souvenir inside the event & Tax Deduction */}
      <section className="bg-white/90 dark:bg-neutral-950/60 border border-slate-200 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-xl mt-8">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
          <FileText className="w-5 h-5 text-orange-500 dark:text-orange-400" /> ของที่ระลึกภายในงาน & สิทธิ์ลดหย่อนภาษี
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Image */}
          <div className="md:col-span-5 flex justify-center">
            {medalImage ? (
              <div className="relative bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl w-full max-w-sm flex flex-col items-center justify-center aspect-square shadow-inner p-2 group overflow-hidden">
                <img src={medalImage} alt="Souvenir Image" className="w-full h-full object-contain rounded-xl drop-shadow-[0_12px_24px_rgba(245,158,11,0.35)] group-hover:scale-105 transition-transform duration-300" />
              </div>
            ) : (
              <div className="relative bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 border-dashed rounded-2xl p-6 md:p-10 w-full max-w-sm flex flex-col items-center justify-center aspect-square shadow-inner group overflow-hidden">
                <Award className="w-12 h-12 mb-3 opacity-30 text-slate-900 dark:text-white" />
                <span className="text-xs text-slate-400 dark:text-white/40 font-black uppercase tracking-wider text-center">รออัปโหลดภาพของที่ระลึก</span>
              </div>
            )()}
          </div>

          {/* Info & Button */}
          <div className="md:col-span-7 space-y-6">
            <div className="p-5 rounded-2xl bg-orange-500/5 border border-orange-500/10 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-orange-500 dark:text-orange-400 flex items-center gap-2">
                 สิทธิ์ลดหย่อนภาษี (Tax Deduction Eligible)
              </h4>
              <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed font-light">
                สำหรับผู้บริจาคหรือสั่งซื้อของที่ระลึกสำหรับงานนี้ รายได้ทั้งหมดหลังหักค่าใช้จ่ายจะนำไปสนับสนุนเข้ากองทุนพัฒนาวิชาการและทุนการศึกษา คณะวิทยาการเรียนรู้และศึกษาศาสตร์ มหาวิทยาลัยธรรมศาสตร์ โดยท่านสามารถระบุ <strong className="text-orange-500 dark:text-orange-400 font-bold">"ขอใช้สิทธิ์ลดหย่อนภาษี"</strong> ในระบบได้ทันที ทางสถาบันจะนำส่งข้อมูลผ่านระบบ e-Donation สรรพากรเพื่ออำนวยความสะดวกให้แก่ท่านอย่างรวดเร็ว
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={() => onRegisterClick("souvenir")}
                className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-orange-500/25 transition duration-200 cursor-pointer text-center flex items-center justify-center gap-2"
              >
                สั่งซื้อของที่ระลึก (฿390) <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      `;

  code = code.substring(0, startIndex) + newSection + code.substring(endIndex);
  fs.writeFileSync('src/components/LandingPage.tsx', code);
  console.log("Successfully replaced duplicate section with new layout.");
} else {
  console.log("Could not find start or end strings.", startIndex, endIndex);
}
