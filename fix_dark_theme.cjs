const fs = require('fs');

// Fix App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(/bg-slate-50 text-slate-900/g, 'bg-black text-white');
appCode = appCode.replace(/selection:bg-blue-600 selection:text-white/g, 'selection:bg-orange-500/30');

// Header
appCode = appCode.replace(/bg-white sticky top-0 z-50 border-b-4 border-\[\#FF6B1A\] shadow-xl/g, 'bg-black/90 backdrop-blur-md sticky top-0 z-50 border-b border-white/10 shadow-sm');
appCode = appCode.replace(/bg-white\/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 shadow-sm/g, 'bg-black/90 backdrop-blur-md sticky top-0 z-50 border-b border-white/10 shadow-sm');
appCode = appCode.replace(/text-slate-950/g, 'text-white');
appCode = appCode.replace(/text-slate-500/g, 'text-white/60');
appCode = appCode.replace(/text-slate-600/g, 'text-white/70');
appCode = appCode.replace(/text-slate-800/g, 'text-white/90');
appCode = appCode.replace(/text-slate-900/g, 'text-white');
appCode = appCode.replace(/hover:text-blue-600/g, 'hover:text-orange-400');
appCode = appCode.replace(/text-blue-600/g, 'text-orange-500');
appCode = appCode.replace(/bg-blue-600/g, 'bg-orange-600');
appCode = appCode.replace(/ring-blue-500/g, 'ring-orange-500');
appCode = appCode.replace(/bg-slate-950/g, 'bg-white');
appCode = appCode.replace(/text-white px-4 py-2 rounded-full hover:bg-slate-800/g, 'text-black px-4 py-2 rounded-full hover:bg-white/90');

// Footer
appCode = appCode.replace(/bg-slate-100 border-t border-slate-200/g, 'bg-neutral-950 border-t border-white/10');
appCode = appCode.replace(/bg-white border-t-8 border-\[\#00CFCF\]/g, 'bg-neutral-950 border-t border-white/10');
appCode = appCode.replace(/text-slate-400/g, 'text-white/40');

// Mobile Nav
appCode = appCode.replace(/bg-white\/95 backdrop-blur-md border-t border-slate-200/g, 'bg-black/90 backdrop-blur-md border-t border-white/10');

fs.writeFileSync('src/App.tsx', appCode);
