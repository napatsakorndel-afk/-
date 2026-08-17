const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Global Background
code = code.replace(/bg-slate-50/g, 'bg-[#00CFCF]');
code = code.replace(/text-slate-900/g, 'text-[#00CFCF]');
code = code.replace(/selection:bg-blue-500\/20/g, 'selection:bg-[#FF6B1A]/30');

// Header
code = code.replace(/bg-white\/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 shadow-sm/g, 'bg-white sticky top-0 z-50 border-b-4 border-[#FF6B1A] shadow-xl');
code = code.replace(/text-slate-800/g, 'text-[#00CFCF]');
code = code.replace(/text-slate-600/g, 'text-[#00CFCF]/70');
code = code.replace(/hover:text-blue-600/g, 'hover:text-[#FF6B1A]');
code = code.replace(/text-blue-600/g, 'text-[#FF6B1A]');
code = code.replace(/bg-slate-950 text-white hover:bg-slate-800/g, 'bg-[#00CFCF] text-white hover:bg-[#00CFCF]/90');
code = code.replace(/ring-blue-500/g, 'ring-[#FF6B1A]');

// Footer
code = code.replace(/bg-slate-100 border-t border-slate-200 text-slate-500/g, 'bg-white border-t-8 border-[#00CFCF] text-[#00CFCF]');
code = code.replace(/text-slate-900/g, 'text-[#00CFCF]');
code = code.replace(/text-slate-600/g, 'text-[#00CFCF]/80');
code = code.replace(/text-slate-400/g, 'text-[#00CFCF]/60');

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx theme updated');
