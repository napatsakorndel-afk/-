const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// Global Container
code = code.replace(/min-h-screen bg-black text-white selection:bg-orange-500\/30/g, 'min-h-screen bg-[#00CFCF] text-white selection:bg-[#FF6B1A]/30');
code = code.replace(/bg-gradient-to-b from-neutral-900 to-black/g, 'bg-[#00CFCF]');

// Header
code = code.replace(/bg-black\/80/g, 'bg-[#00CFCF]/90');
code = code.replace(/hover:text-white\/100/g, 'hover:text-[#FF6B1A]');
code = code.replace(/bg-white text-black hover:bg-gray-100/g, 'bg-[#FF6B1A] text-white hover:bg-white hover:text-[#00CFCF]');

// Hero Section
code = code.replace(/bg-orange-600\/20/g, 'bg-[#FF6B1A]/60');
code = code.replace(/bg-amber-600\/20/g, 'bg-white/30');
code = code.replace(/from-orange-400 to-red-500/g, 'from-white to-white');
code = code.replace(/text-orange-400/g, 'text-white');
code = code.replace(/bg-orange-500\/20/g, 'bg-white/20');
code = code.replace(/border-orange-500\/30/g, 'border-white/30');

// Typography / accents (General)
// Replace E25B45 with FF6B1A
code = code.replace(/text-\[\#E25B45\]/g, 'text-[#FF6B1A]');
code = code.replace(/bg-\[\#E25B45\]/g, 'bg-[#FF6B1A]');
// Replace orange buttons
code = code.replace(/bg-orange-600 hover:bg-orange-500 text-white/g, 'bg-[#FF6B1A] hover:bg-white hover:text-[#00CFCF] text-white transition-colors');
// Replace dark buttons
code = code.replace(/bg-zinc-900 border border-white\/10 hover:border-white\/20 hover:bg-zinc-800 text-white\/90/g, 'bg-[#00CFCF] border border-white hover:bg-white hover:text-[#00CFCF] text-white transition-colors');

// Cards: Distances, Stats, Sections
// Convert bg-zinc-900 to white card
code = code.replace(/bg-zinc-900 border border-white\/10/g, 'bg-white text-[#00CFCF] border-none shadow-2xl');
// Convert bg-neutral-950/60 to white card
code = code.replace(/bg-neutral-950\/60 border border-white\/5/g, 'bg-white text-[#00CFCF] border-none shadow-2xl');

// Gradients for sections
code = code.replace(/bg-gradient-to-br from-neutral-950 via-zinc-900 to-amber-950\/40/g, 'bg-white text-[#00CFCF] shadow-2xl');

// Inner elements inside cards (need to make sure text is visible on white)
// This is tricky using simple regex because text-white is used everywhere.
// For now, let's inject a CSS rule in index.css that forces child text to be cyan inside these white cards, 
// OR just replace `text-white` with `text-inherit` in those sections if possible.
// Actually, Tailwind makes it easy: `text-[#00CFCF]` on the parent container will cascade to children UNLESS they specify `text-white`.
// Since they specify `text-white`, we MUST change them.

fs.writeFileSync('src/components/LandingPage.tsx', code);
console.log('Theme updated (Phase 1)');
