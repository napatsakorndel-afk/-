const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// The hero background was:
// bg-gradient-to-br from-neutral-950 via-zinc-900 to-orange-950/20
// We need it to be light in light mode:
code = code.replace(/from-neutral-950 via-zinc-900 to-orange-950\/20/g, 'from-orange-50 via-white to-orange-50 dark:from-neutral-950 dark:via-zinc-900 dark:to-orange-950/20');

// Shirts section:
// bg-gradient-to-br from-neutral-950 via-zinc-900 to-indigo-950
code = code.replace(/from-neutral-950 via-zinc-900 to-indigo-950/g, 'from-indigo-50 via-white to-indigo-50 dark:from-neutral-950 dark:via-zinc-900 dark:to-indigo-950');

// Medals section:
// bg-gradient-to-br from-neutral-950 via-zinc-900 to-amber-950/40
code = code.replace(/from-neutral-950 via-zinc-900 to-amber-950\/40/g, 'from-amber-50 via-white to-amber-50 dark:from-neutral-950 dark:via-zinc-900 dark:to-amber-950/40');

// Map section:
// bg-gradient-to-br from-neutral-950 via-zinc-900 to-black
code = code.replace(/from-neutral-950 via-zinc-900 to-black/g, 'from-slate-100 via-white to-slate-50 dark:from-neutral-950 dark:via-zinc-900 dark:to-black');

// Check text colors on specific labels
// `<div className="inline-flex items-center gap-2 bg-[#E25B45] text-slate-900 dark:text-white` -> wait, bg-[#E25B45] is red/orange. The text on it should be white.
code = code.replace(/bg-\[\#E25B45\] text-slate-900 dark:text-white/g, 'bg-[#E25B45] text-white');

fs.writeFileSync('src/components/LandingPage.tsx', code);
