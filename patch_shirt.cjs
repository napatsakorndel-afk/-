const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const oldShirtBlock = `<div className="relative bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl p-2 w-full max-w-sm flex flex-col items-center justify-center aspect-[3/4] shadow-inner">
              <img src={shirtImage} alt="Shirt Image" className="w-full h-full object-contain rounded-xl" />
            </div>`;

const newShirtBlock = `<div className="relative w-full max-w-sm flex flex-col items-center justify-center rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/5 group">
              <img src={shirtImage} alt="Shirt Image" className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>`;

if (code.includes(oldShirtBlock)) {
  code = code.replace(oldShirtBlock, newShirtBlock);
  fs.writeFileSync('src/components/LandingPage.tsx', code);
  console.log("Patched shirt image");
} else {
  console.log("Could not find exact shirt block.");
}
