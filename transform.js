const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// Container
code = code.replace(/min-h-screen bg-black text-white selection:bg-orange-500\/30/g, 'min-h-screen bg-[#00CFCF] text-white selection:bg-[#FF6B1A]/30');
code = code.replace(/bg-gradient-to-b from-neutral-900 to-black/g, 'bg-[#00CFCF]');

// Nav
code = code.replace(/bg-black\/80/g, 'bg-[#00CFCF]/90');
code = code.replace(/hover:text-white\/100/g, 'hover:text-[#FF6B1A]');
code = code.replace(/bg-white text-black hover:bg-gray-100/g, 'bg-[#FF6B1A] text-white hover:bg-[#FF6B1A]/90');
code = code.replace(/border-white\/10/g, 'border-white/30');

// Hero Shapes
code = code.replace(/bg-orange-600\/20/g, 'bg-[#FF6B1A]/40');
code = code.replace(/bg-amber-600\/20/g, 'bg-white/30');

// Hero Text
code = code.replace(/from-orange-400 to-red-500/g, 'from-white to-white');
code = code.replace(/text-orange-400/g, 'text-[#FF6B1A]');
code = code.replace(/bg-orange-500\/20/g, 'bg-[#FF6B1A]/20');
code = code.replace(/border-orange-500\/30/g, 'border-[#FF6B1A]/30');
code = code.replace(/bg-orange-600 hover:bg-orange-500 text-white/g, 'bg-[#FF6B1A] hover:bg-white hover:text-[#00CFCF] text-white');
code = code.replace(/bg-white\/5 hover:bg-white\/10 text-white border border-white\/10/g, 'bg-white text-[#00CFCF] hover:bg-gray-100 border border-white');

// Stats
code = code.replace(/bg-white\/5/g, 'bg-white');
code = code.replace(/text-white\/60/g, 'text-[#00CFCF]/70');
code = code.replace(/text-white\/70/g, 'text-[#00CFCF]/80');
code = code.replace(/text-white\/90/g, 'text-[#00CFCF]');
code = code.replace(/text-white/g, 'text-[#00CFCF]'); // Wait, this will change ALL text-white. I should be careful.
// Let's not do global text-white replace yet.
