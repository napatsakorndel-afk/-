const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Reverse Footer
code = code.replace(/text-\[\#00CFCF\]\/60/g, 'text-slate-400');
code = code.replace(/text-\[\#00CFCF\]\/80/g, 'text-slate-600');
code = code.replace(/bg-white border-t-8 border-\[\#00CFCF\] text-\[\#00CFCF\]/g, 'bg-slate-100 border-t border-slate-200 text-slate-500');

// Reverse Header
code = code.replace(/ring-\[\#FF6B1A\]/g, 'ring-blue-500');
code = code.replace(/bg-\[\#00CFCF\] text-white hover:bg-\[\#00CFCF\]\/90/g, 'bg-slate-950 text-white hover:bg-slate-800');
code = code.replace(/text-\[\#FF6B1A\]/g, 'text-blue-600');
code = code.replace(/hover:text-\[\#FF6B1A\]/g, 'hover:text-blue-600');
code = code.replace(/text-\[\#00CFCF\]\/70/g, 'text-slate-600');
code = code.replace(/text-\[\#00CFCF\]/g, 'text-slate-900');
code = code.replace(/bg-white sticky top-0 z-50 border-b-4 border-\[\#FF6B1A\] shadow-xl/g, 'bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 shadow-sm');

// Reverse Global
code = code.replace(/selection:bg-\[\#FF6B1A\]\/30/g, 'selection:bg-blue-500/20');
code = code.replace(/bg-\[\#00CFCF\]/g, 'bg-slate-50');

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx theme reverted');
