const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const medalRegex = /<div className="relative bg-black\/40 border border-white\/5 rounded-2xl p-6 md:p-10 w-full max-w-sm flex flex-col items-center justify-center aspect-square shadow-inner group overflow-hidden">[\s\S]*?<\/div>(\s*)<\/div>(\s*)<div className="lg:col-span-6 space-y-6">/;

if (medalRegex.test(code)) {
    code = code.replace(medalRegex, `<div className="relative bg-black/40 border border-white/5 border-dashed rounded-2xl p-6 md:p-10 w-full max-w-sm flex flex-col items-center justify-center aspect-square shadow-inner group overflow-hidden">
            <Award className="w-12 h-12 mb-3 opacity-30 text-white" />
            <span className="text-xs text-white/40 font-black uppercase tracking-wider text-center">รออัปโหลดภาพเหรียญที่ระลึก</span>
          </div>
        </div>
        <div className="lg:col-span-6 space-y-6">`);
    fs.writeFileSync('src/components/LandingPage.tsx', code);
    console.log("Success");
} else {
    console.log("Failed");
}
