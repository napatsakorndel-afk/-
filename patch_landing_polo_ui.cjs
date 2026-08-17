const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const oldShirtRender = `<div className="lg:col-span-6 flex flex-col items-center justify-center p-4">
          {shirtImage ? (
            <div className="relative w-full max-w-sm flex flex-col items-center justify-center rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/5 group">
              <img src={shirtImage} alt="Shirt Image" className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
          ) : (
            <div className="relative bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 border-dashed rounded-2xl p-6 md:p-10 w-full max-w-sm flex flex-col items-center justify-center aspect-square shadow-inner">
              <Shirt className="w-12 h-12 mb-3 opacity-30 text-slate-900 dark:text-white" />
              <span className="text-xs text-slate-400 dark:text-white/40 font-black uppercase tracking-wider text-center">รออัปโหลดภาพเสื้อที่ระลึก</span>
            </div>
          )}
        </div>`;

const newShirtRender = `<div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start justify-center p-4">
          <div className="flex flex-col items-center space-y-3">
            <h4 className="font-bold text-slate-700 dark:text-white/80">แบบคอกลม (Crew Neck)</h4>
            {shirtImage ? (
              <div className="relative w-full max-w-xs flex flex-col items-center justify-center rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/5 group">
                <img src={shirtImage} alt="Crew Neck Shirt" className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
            ) : (
              <div className="relative bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 border-dashed rounded-2xl p-6 w-full max-w-xs flex flex-col items-center justify-center aspect-square shadow-inner">
                <Shirt className="w-10 h-10 mb-3 opacity-30 text-slate-900 dark:text-white" />
                <span className="text-xs text-slate-400 dark:text-white/40 font-black uppercase tracking-wider text-center">รออัปโหลดภาพเสื้อคอกลม</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-center space-y-3">
            <h4 className="font-bold text-slate-700 dark:text-white/80">แบบโปโล (Polo Shirt)</h4>
            {poloShirtImage ? (
              <div className="relative w-full max-w-xs flex flex-col items-center justify-center rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/5 group">
                <img src={poloShirtImage} alt="Polo Shirt" className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
            ) : (
              <div className="relative bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 border-dashed rounded-2xl p-6 w-full max-w-xs flex flex-col items-center justify-center aspect-square shadow-inner">
                <Shirt className="w-10 h-10 mb-3 opacity-30 text-slate-900 dark:text-white" />
                <span className="text-xs text-slate-400 dark:text-white/40 font-black uppercase tracking-wider text-center">รออัปโหลดภาพเสื้อโปโล</span>
              </div>
            )}
          </div>
        </div>`;

if (code.includes(oldShirtRender)) {
  code = code.replace(oldShirtRender, newShirtRender);
  fs.writeFileSync('src/components/LandingPage.tsx', code);
  console.log("Patched landing page shirt UI");
} else {
  console.log("Could not find exact shirt block.");
}
