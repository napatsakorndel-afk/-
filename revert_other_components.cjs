const fs = require('fs');
const files = [
  'src/components/RegistrationForm.tsx',
  'src/components/StatusChecker.tsx',
  'src/components/AdminPortal.tsx'
];

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  
  code = code.replace(/text-white font-bold uppercase/g, 'text-[#00CFCF] font-bold uppercase');
  code = code.replace(/text-white font-black uppercase/g, 'text-[#00CFCF] font-black uppercase');

  code = code.replace(/text-\[\#00CFCF\]\/70/g, 'text-white/70');
  code = code.replace(/text-\[\#00CFCF\]\/60/g, 'text-white/60');
  code = code.replace(/text-\[\#00CFCF\]\/40/g, 'text-white/40');
  code = code.replace(/text-\[\#00CFCF\]/g, 'text-white');
  
  code = code.replace(/border-\[\#00CFCF\]\/10/g, 'border-white/10');
  
  code = code.replace(/bg-\[\#00CFCF\]\/5/g, 'bg-white/5');
  
  // bg-black/40 was converted to bg-white border-none shadow-2xl text-[#00CFCF]
  // In reverse, we have bg-white border-none shadow-2xl text-white (since we just replaced text-[#00CFCF] with text-white)
  code = code.replace(/bg-white border-none shadow-2xl text-white/g, 'bg-black/40 border border-white/10');
  
  // Wait, some were bg-neutral-950/60 and bg-zinc-900. Reverting them all to bg-black/40 is mostly fine for a dark theme container.
  
  fs.writeFileSync(file, code);
  console.log(`Reverted ${file}`);
});
