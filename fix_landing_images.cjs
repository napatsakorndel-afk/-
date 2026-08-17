const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// Fix Shirt
code = code.replace(
  '<div className="relative bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl p-2 w-full max-w-sm flex flex-col items-center justify-center aspect-[3/4] shadow-inner">',
  '<div className="relative w-full max-w-sm flex flex-col items-center justify-center rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/5 group">'
);
code = code.replace(
  '<img src={shirtImage} alt="Shirt Image" className="w-full h-full object-contain rounded-xl" />',
  '<img src={shirtImage} alt="Shirt Image" className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" />'
);

// Fix Medal
code = code.replace(
  '<div className="relative bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl w-full max-w-sm flex flex-col items-center justify-center aspect-square shadow-inner p-2 group overflow-hidden">',
  '<div className="relative w-full max-w-sm flex flex-col items-center justify-center rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/5 group">'
);
// We might have multiple aspect-square containers, but the replace only replaces the first one (Medal) if they are identical, wait they are identical. Let's do a global replace for all instances in LandingPage.
