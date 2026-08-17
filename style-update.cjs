const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// Global Background & Text
code = code.replace(/bg-black text-white/g, 'bg-[#00CFCF] text-white');
code = code.replace(/bg-gradient-to-b from-neutral-900 to-black/g, 'bg-[#00CFCF]');
code = code.replace(/bg-black\/80/g, 'bg-[#00CFCF]/90'); // Nav background
code = code.replace(/selection:bg-orange-500\/30/g, 'selection:bg-white/30');

// Header
code = code.replace(/bg-white text-black hover:bg-gray-100/g, 'bg-[#FF6B1A] text-white hover:bg-white hover:text-[#00CFCF]');

// Hero Section shapes
code = code.replace(/bg-orange-600\/20/g, 'bg-[#FF6B1A]/60');
code = code.replace(/bg-amber-600\/20/g, 'bg-white/30');
code = code.replace(/bg-blue-600\/20/g, 'bg-[#FF6B1A]/40');

// Text Colors (Hero & Titles)
code = code.replace(/text-orange-400/g, 'text-white');
code = code.replace(/text-orange-500/g, 'text-[#FF6B1A]');
code = code.replace(/text-amber-400/g, 'text-white');
code = code.replace(/text-\[\#E25B45\]/g, 'text-[#FF6B1A]');

// Cards and Containers (change from dark to white or orange)
code = code.replace(/bg-white\/5 border-white\/10/g, 'bg-white text-[#00CFCF] shadow-2xl shadow-black/10 border-transparent'); // Stats cards
code = code.replace(/text-white\/60/g, 'text-[#00CFCF]/60'); // Inside stats mostly
code = code.replace(/text-white\/70/g, 'text-[#00CFCF]/70');
code = code.replace(/text-white\/90/g, 'text-[#00CFCF]/90');
// BUT wait! There's white text on the cyan background. If we change text-white/70 to cyan/70 globally, the hero text will break.
