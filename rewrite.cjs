const fs = require('fs');

let content = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// 1. App container
content = content.replace('min-h-screen bg-black text-white selection:bg-orange-500/30 font-sans', 'min-h-screen bg-[#00CFCF] text-white selection:bg-[#FF6B1A]/30 font-sans');

// 2. Nav
content = content.replace('bg-black/80 backdrop-blur-xl border-b border-white/10', 'bg-[#00CFCF]/90 backdrop-blur-xl border-b border-white/20');
content = content.replace('bg-white text-black hover:bg-gray-100', 'bg-[#FF6B1A] text-white hover:bg-white hover:text-[#00CFCF]');

// 3. Hero background
content = content.replace('bg-gradient-to-b from-neutral-900 to-black', 'bg-[#00CFCF]');
content = content.replace('bg-orange-600/20 blur-[120px]', 'bg-[#FF6B1A]/40 blur-[100px]');
content = content.replace('bg-amber-600/20 blur-[120px]', 'bg-white/30 blur-[100px]');

// 4. Hero text
content = content.replace('from-orange-400 to-red-500', 'from-white to-white');
content = content.replace('text-orange-400 bg-orange-500/20 border-orange-500/30', 'text-[#FF6B1A] bg-white border-white');
content = content.replace('bg-orange-600 hover:bg-orange-500 text-white', 'bg-[#FF6B1A] hover:bg-white hover:text-[#00CFCF] text-white');
content = content.replace('bg-white/5 hover:bg-white/10 text-white border border-white/10', 'bg-[#00CFCF] hover:bg-white hover:text-[#00CFCF] text-white border border-white');

// 5. Stats blocks
content = content.replace(/bg-white\/5 border border-white\/10/g, 'bg-white text-[#00CFCF] border-transparent shadow-xl');
content = content.replace(/text-white\/60/g, 'text-[#00CFCF]/60');
content = content.replace(/text-white/g, 'text-white'); // keep white text where it hasn't been changed

// We need to carefully replace text-white in stats blocks
// The stats blocks map has: <div className="text-white font-black text-3xl"> 
// We should use regex to target the stats render
let statsRegex = /<div key=\{index\} className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white text-\[\#00CFCF\] border-transparent shadow-xl backdrop-blur-sm">\s*<div className="flex items-center justify-center w-12 h-12 rounded-full bg-\[\#FF6B1A\]\/20 text-\[\#FF6B1A\] mb-4">\s*<stat\.icon className="w-6 h-6" \/>\s*<\/div>\s*<div className="text-white font-black text-3xl mb-1">/g;
// Actually, it's easier to use a targeted replacement for the whole map function

fs.writeFileSync('src/components/LandingPage.tsx', content);
