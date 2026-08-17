const fs = require('fs');

const files = [
  'src/components/LandingPage.tsx',
  'src/components/RegistrationForm.tsx',
  'src/components/StatusChecker.tsx',
  'src/components/AdminPortal.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');

    // Make sure we only apply once
    if (code.includes('dark:text-white')) {
        console.log(`Skipping ${file} as it seems already patched.`);
        return;
    }

    // 1. Backgrounds
    code = code.replace(/bg-black\/40/g, 'bg-slate-100 dark:bg-black/40');
    code = code.replace(/bg-black\/30/g, 'bg-slate-100 dark:bg-black/30');
    code = code.replace(/bg-black\/20/g, 'bg-slate-50 dark:bg-black/20');
    code = code.replace(/bg-neutral-950\/60/g, 'bg-white/90 dark:bg-neutral-950/60');
    code = code.replace(/bg-zinc-900/g, 'bg-white dark:bg-zinc-900');
    code = code.replace(/bg-white\/5/g, 'bg-slate-50 dark:bg-white/5');
    code = code.replace(/bg-white\/10/g, 'bg-slate-100 dark:bg-white/10');
    code = code.replace(/bg-black\/80/g, 'bg-white/80 dark:bg-black/80');

    // 2. Borders
    code = code.replace(/border-white\/10/g, 'border-slate-200 dark:border-white/10');
    code = code.replace(/border-white\/5/g, 'border-slate-200 dark:border-white/5');
    
    // 3. Text colors
    code = code.replace(/text-white/g, 'text-slate-900 dark:text-white');
    
    // Fix opacities resulting from above text-white replacement
    code = code.replace(/text-slate-900 dark:text-white\/90/g, 'text-slate-800 dark:text-white/90');
    code = code.replace(/text-slate-900 dark:text-white\/70/g, 'text-slate-600 dark:text-white/70');
    code = code.replace(/text-slate-900 dark:text-white\/60/g, 'text-slate-500 dark:text-white/60');
    code = code.replace(/text-slate-900 dark:text-white\/50/g, 'text-slate-400 dark:text-white/50');
    code = code.replace(/text-slate-900 dark:text-white\/40/g, 'text-slate-400 dark:text-white/40');
    code = code.replace(/text-slate-900 dark:text-white\/30/g, 'text-slate-300 dark:text-white/30');
    
    // Fix buttons
    const btnColors = ['bg-\\[#FF6B1A\\]', 'bg-orange-600', 'bg-blue-600', 'bg-purple-600', 'bg-red-600', 'bg-emerald-600', 'bg-green-600', 'bg-neutral-900', 'bg-slate-900'];
    btnColors.forEach(color => {
      const regex = new RegExp(`(${color}[^"]*?)text-slate-900 dark:text-white`, 'g');
      code = code.replace(regex, '$1text-white');
    });
    
    // Fix hovering states where text-white was used
    code = code.replace(/hover:text-slate-900 dark:text-white/g, 'hover:text-slate-900 dark:hover:text-white');
    
    // specific to table headers etc
    code = code.replace(/bg-slate-100 dark:bg-white\/5/g, 'bg-slate-100 dark:bg-white/5');

    fs.writeFileSync(file, code);
    console.log(`Patched ${file}`);
  }
});
