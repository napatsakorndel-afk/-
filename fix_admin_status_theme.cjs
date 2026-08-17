const fs = require('fs');

const files = [
  'src/components/RegistrationForm.tsx',
  'src/components/StatusChecker.tsx',
  'src/components/AdminPortal.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');

    code = code.replace(/bg-neutral-950\/90/g, 'bg-white/90 dark:bg-neutral-950/90');
    code = code.replace(/bg-neutral-950\/40/g, 'bg-white dark:bg-neutral-950/40');
    code = code.replace(/bg-neutral-900\/60/g, 'bg-white dark:bg-neutral-900/60');
    code = code.replace(/bg-neutral-900\/50/g, 'bg-slate-50 dark:bg-neutral-900/50');
    
    // Exact bg-neutral-950
    code = code.replace(/bg-neutral-950(?![\/\-])/g, 'bg-white dark:bg-neutral-950');
    // Exact bg-neutral-900
    code = code.replace(/bg-neutral-900(?![\/\-])/g, 'bg-slate-50 dark:bg-neutral-900');
    // Exact bg-slate-900
    code = code.replace(/bg-slate-900(?![\/\-])/g, 'bg-white dark:bg-slate-900');
    
    // Fix text-white inside those that might have been skipped or need text-slate-900 dark:text-white
    code = code.replace(/text-slate-100(?! dark:)/g, 'text-slate-900 dark:text-slate-100');
    code = code.replace(/text-white(?! dark:)/g, 'text-slate-900 dark:text-white');
    
    fs.writeFileSync(file, code);
    console.log(`Patched ${file}`);
  }
});
