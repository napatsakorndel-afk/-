const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// Global changes
code = code.replace(/bg-black/g, 'bg-[#00CFCF]');
code = code.replace(/bg-neutral-900/g, 'bg-[#00CFCF]');
code = code.replace(/bg-neutral-950\/60/g, 'bg-white');
code = code.replace(/bg-neutral-950/g, 'bg-white');
code = code.replace(/bg-zinc-900/g, 'bg-white');
code = code.replace(/bg-gradient-to-br from-neutral-950 via-zinc-900 to-amber-950\/40/g, 'bg-[#FF6B1A]');
code = code.replace(/bg-gradient-to-b from-neutral-900 to-black/g, 'bg-[#00CFCF]');
code = code.replace(/bg-black\/40/g, 'bg-[#00CFCF]/10');
code = code.replace(/bg-black\/80/g, 'bg-[#00CFCF]/90');

// Borders
code = code.replace(/border-white\/10/g, 'border-white/30');
code = code.replace(/border-white\/5/g, 'border-white/30');

// Text Colors
code = code.replace(/text-white\/70/g, 'text-white/90');
code = code.replace(/text-white\/60/g, 'text-white/80');
code = code.replace(/text-\[\#E25B45\]/g, 'text-[#FF6B1A]');
code = code.replace(/text-orange-500/g, 'text-[#FF6B1A]');
code = code.replace(/text-orange-400/g, 'text-[#FF6B1A]');
code = code.replace(/text-orange-300/g, 'text-[#FF6B1A]');
code = code.replace(/text-amber-400/g, 'text-[#FF6B1A]');

// Background Colors
code = code.replace(/bg-orange-600/g, 'bg-[#FF6B1A]');
code = code.replace(/bg-orange-500/g, 'bg-[#FF6B1A]');
code = code.replace(/hover:bg-orange-500/g, 'hover:bg-[#FF6B1A]/80');
code = code.replace(/bg-white\/5/g, 'bg-white/20');
code = code.replace(/bg-white\/10/g, 'bg-white/30');

// Buttons / Badges
code = code.replace(/bg-amber-500\/10/g, 'bg-white/20');
code = code.replace(/border-amber-500\/20/g, 'border-white/30');
code = code.replace(/bg-blue-500\/10/g, 'bg-white/20');
code = code.replace(/border-blue-500\/20/g, 'border-white/30');

// Specific section classes
// The Distance Cards
code = code.replace(/bg-zinc-900/g, 'bg-white text-[#00CFCF]'); // Handled above, but we need to fix text colors inside cards.
// If a card is white, text needs to be dark. Let's not blindly replace bg-zinc-900 with bg-white without fixing text.

// I think the easiest way is to rewrite LandingPage.tsx with standard Tailwind classes for this specific theme.
