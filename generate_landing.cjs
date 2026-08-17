const fs = require('fs');

let backup = fs.readFileSync('backup_LandingPage.tsx', 'utf8');

// I will just use string replacement on the backup, but targeted very carefully.

// Theme Variables
const bgCyan = 'bg-[#00CFCF]';
const textCyan = 'text-[#00CFCF]';
const bgOrange = 'bg-[#FF6B1A]';
const textOrange = 'text-[#FF6B1A]';

// 1. Container
let code = backup.replace('min-h-screen bg-black text-white selection:bg-orange-500/30', `min-h-screen ${bgCyan} text-white selection:bg-white/30`);
code = code.replace('bg-gradient-to-b from-neutral-900 to-black', bgCyan);

// 2. Nav
code = code.replace('bg-black/80', `${bgCyan}/90`);
code = code.replace('hover:text-white/100', `hover:${textOrange}`);
code = code.replace('bg-white text-black hover:bg-gray-100', `${bgOrange} text-white hover:bg-white hover:${textCyan}`);

// 3. Hero
code = code.replace('bg-orange-600/20 blur-[120px]', `${bgOrange}/80 blur-[100px]`);
code = code.replace('bg-amber-600/20 blur-[120px]', `bg-white/40 blur-[120px]`);
code = code.replace('from-orange-400 to-red-500', 'from-white to-white');
code = code.replace('text-orange-400 bg-orange-500/20 border-orange-500/30', 'text-white bg-white/20 border-white/40');
code = code.replace('text-[#E25B45]', textOrange);

// 4. Buttons in hero
code = code.replace('bg-orange-600 hover:bg-orange-500 text-white', `${bgOrange} hover:bg-white hover:${textCyan} text-white`);
code = code.replace('bg-white/5 hover:bg-white/10 text-white border border-white/10', `${bgCyan} border border-white hover:bg-white hover:${textCyan} text-white`);

// 5. Stats
code = code.replace(/bg-white\/5 border border-white\/10/g, 'bg-white text-[#00CFCF] border-none shadow-xl');
// Fix text inside stats
code = code.replace(/<div className="text-white font-black text-3xl mb-1">/g, '<div className="text-[#00CFCF] font-black text-4xl mb-1 tracking-tighter">');
code = code.replace(/<div className="text-white\/60 text-xs font-bold uppercase tracking-wider">/g, '<div className="text-[#00CFCF]/60 text-xs font-bold uppercase tracking-wider">');
code = code.replace(/bg-white\/5 text-white\/60/g, 'bg-[#00CFCF]/10 text-[#00CFCF]/80');
code = code.replace(/<stat\.icon className="w-6 h-6" \/>/g, '<stat.icon className="w-8 h-8" />');

// 6. Distances Section
// Make cards white
code = code.replace(/bg-zinc-900 border border-white\/10/g, 'bg-white text-[#00CFCF] border-none shadow-2xl');
// Fix headings in cards
code = code.replace(/text-white mb-2/g, 'text-[#00CFCF] mb-2 font-black tracking-tight');
code = code.replace(/text-white\/60 text-sm/g, 'text-[#00CFCF]/70 text-sm font-medium');
code = code.replace(/text-white font-black/g, 'text-[#00CFCF] font-black tracking-tighter');
code = code.replace(/text-white\/40 text-sm/g, 'text-[#00CFCF]/50 text-sm');
// Price
code = code.replace(/text-white text-3xl/g, 'text-[#FF6B1A] text-4xl');
code = code.replace(/text-white\/40 text-sm font-normal/g, 'text-[#FF6B1A]/60 text-sm font-bold uppercase tracking-widest');
// Badges
code = code.replace(/from-green-600\/20 to-emerald-600\/5/g, 'from-[#00CFCF]/20 to-[#00CFCF]/5');
code = code.replace(/border-green-500\/20/g, 'border-[#00CFCF]/20');
code = code.replace(/text-green-400/g, 'text-[#00CFCF]');

code = code.replace(/from-blue-600\/20 to-indigo-600\/5/g, 'from-[#FF6B1A]/20 to-[#FF6B1A]/5');
code = code.replace(/border-blue-500\/20/g, 'border-[#FF6B1A]/20');
code = code.replace(/text-blue-400/g, 'text-[#FF6B1A]');

// 7. Shirt Section
code = code.replace(/bg-gradient-to-br from-neutral-950 via-zinc-900 to-amber-950\/40 border border-white\/10/g, 'bg-white text-[#00CFCF] shadow-2xl border-none');
// Inside shirt section, there's `text-white` for headers
code = code.replace(/text-white leading-tight flex items-center/g, 'text-[#00CFCF] leading-tight flex items-center tracking-tighter');
code = code.replace(/<strong className="text-white block">/g, '<strong className="text-[#00CFCF] block text-lg uppercase tracking-tight">');
code = code.replace(/text-white\/60/g, 'text-[#00CFCF]/70');
code = code.replace(/text-white\/90/g, 'text-[#00CFCF]');
// Table
code = code.replace(/bg-black\/40/g, 'bg-[#00CFCF]/5');
code = code.replace(/text-white uppercase bg-white\/5/g, 'text-[#00CFCF] uppercase bg-[#00CFCF]/10');
code = code.replace(/divide-white\/5/g, 'divide-[#00CFCF]/10');
code = code.replace(/hover:bg-white\/5/g, 'hover:bg-[#00CFCF]/10');
code = code.replace(/<td className="px-4 py-3 text-white font-black">/g, '<td className="px-4 py-3 text-[#FF6B1A] font-black text-lg">');

// 8. Medal Section
// It shares the same gradient class, so it became bg-white.
code = code.replace(/<h2 className="text-4xl font-black italic tracking-tight uppercase text-white leading-tight">\s*เหรียญที่ระลึกผู้พิชิต\s*<\/h2>/, '<h2 className="text-4xl font-black italic tracking-tight uppercase text-[#00CFCF] leading-tight">\n            เหรียญที่ระลึกผู้พิชิต\n          </h2>');
code = code.replace(/<p className="text-white\/70 leading-relaxed font-light text-sm">/g, '<p className="text-[#00CFCF]/70 leading-relaxed font-medium text-sm">');
code = code.replace(/text-white\/90 font-black uppercase tracking-widest/g, 'text-[#00CFCF] font-black uppercase tracking-widest');

// 9. Info Section
code = code.replace(/bg-neutral-950\/60 border border-white\/5/g, 'bg-white border-none shadow-2xl');
code = code.replace(/text-white flex items-center/g, 'text-[#00CFCF] flex items-center font-black tracking-tighter');
code = code.replace(/text-white\/40 leading-relaxed text-center/g, 'text-[#00CFCF]/50 leading-relaxed text-center');

// 10. Map Details
code = code.replace(/bg-black\/30/g, 'bg-[#00CFCF]/5');
code = code.replace(/text-white font-bold mb-4/g, 'text-[#00CFCF] font-black mb-4 text-xl tracking-tight');
// For map text, it was using text-white/70, which we already replaced globally or via previous regex.
code = code.replace(/<p className="text-sm text-white\/70 font-light leading-relaxed">/g, '<p className="text-sm text-[#00CFCF]/80 font-medium leading-relaxed">');

// 11. Other small fixes
// Replace any lingering text-white that should be cyan inside white cards
// Specifically, check the shirt section title which is "text-4xl font-black italic tracking-tight uppercase text-[#00CFCF] leading-tight flex items-center gap-2"
// and "text-white/70 leading-relaxed font-light text-sm space-y-4" -> "text-[#00CFCF]/70 leading-relaxed font-medium text-sm space-y-4"

// Let's write to a new file and then we can check it
fs.writeFileSync('src/components/LandingPage.tsx', code);
console.log('Done generating landing page.');
