const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const oldHeading = `<h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
          <FileText className="w-5 h-5 text-orange-500 dark:text-orange-400" /> ของที่ระลึกภายในงาน & สิทธิ์ลดหย่อนภาษี
        </h3>`;

const newHeading = `<h3 className="text-3xl font-black italic tracking-tight uppercase text-slate-900 dark:text-white flex items-center gap-3 mb-8">
          <FileText className="w-8 h-8 text-orange-500 dark:text-orange-400" /> ของที่ระลึกภายในงาน <span className="text-orange-400 text-2xl">& สิทธิ์ลดหย่อนภาษี</span>
        </h3>`;

if (code.includes(oldHeading)) {
  code = code.replace(oldHeading, newHeading);
  fs.writeFileSync('src/components/LandingPage.tsx', code);
  console.log("Patched souvenir heading");
} else {
  console.log("Could not find exact heading block.");
}
