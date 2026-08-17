const fs = require('fs');
const files = [
  'src/components/RegistrationForm.tsx',
  'src/components/StatusChecker.tsx',
  'src/components/AdminPortal.tsx'
];

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  
  // Revert the bad replacements
  code = code.replace(/text-\[\#00CFCF\]/g, 'text-white');
  
  // Ensure dark backgrounds
  code = code.replace(/bg-white border-none shadow-2xl/g, 'bg-black/40 border border-white/10 shadow-2xl');
  code = code.replace(/bg-white border border-slate-200/g, 'bg-black/40 border border-white/10');
  code = code.replace(/text-slate-900/g, 'text-white');
  code = code.replace(/text-slate-600/g, 'text-white/70');
  code = code.replace(/text-slate-500/g, 'text-white/60');
  code = code.replace(/text-slate-400/g, 'text-white/40');
  
  fs.writeFileSync(file, code);
  console.log(`Cleaned ${file}`);
});
