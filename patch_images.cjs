const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// The pattern for medal and souvenir:
const oldContainer = '<div className="relative bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl w-full max-w-sm flex flex-col items-center justify-center aspect-square shadow-inner p-2 group overflow-hidden">';
const newContainer = '<div className="relative w-full max-w-sm flex flex-col items-center justify-center rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/5 group">';

// The pattern for images:
const oldMedalImg = '<img src={medalImage} alt="Medal Image" className="w-full h-full object-contain rounded-xl drop-shadow-[0_12px_24px_rgba(245,158,11,0.35)] group-hover:scale-105 transition-transform duration-300" />';
const newMedalImg = '<img src={medalImage} alt="Medal Image" className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" />';

const oldSouvenirImg = '<img src={souvenirImage} alt="Souvenir Image" className="w-full h-full object-contain rounded-xl drop-shadow-[0_12px_24px_rgba(245,158,11,0.35)] group-hover:scale-105 transition-transform duration-300" />';
const newSouvenirImg = '<img src={souvenirImage} alt="Souvenir Image" className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" />';

code = code.split(oldContainer).join(newContainer);
code = code.split(oldMedalImg).join(newMedalImg);
code = code.split(oldSouvenirImg).join(newSouvenirImg);

fs.writeFileSync('src/components/LandingPage.tsx', code);
console.log("Patched LandingPage");
