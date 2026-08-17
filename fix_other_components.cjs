const fs = require('fs');

const files = [
  'src/components/RegistrationForm.tsx',
  'src/components/StatusChecker.tsx',
  'src/components/AdminPortal.tsx'
];

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  
  // Convert dark transparent cards to solid white cards
  code = code.replace(/bg-black\/40 border border-white\/10/g, 'bg-white border-none shadow-2xl text-[#00CFCF]');
  code = code.replace(/bg-neutral-950\/60 border border-white\/5/g, 'bg-white border-none shadow-2xl text-[#00CFCF]');
  code = code.replace(/bg-zinc-900 border border-white\/10/g, 'bg-white border-none shadow-2xl text-[#00CFCF]');
  code = code.replace(/bg-black\/20/g, 'bg-[#00CFCF]/5');
  code = code.replace(/bg-white\/5/g, 'bg-[#00CFCF]/5');
  
  // Borders
  code = code.replace(/border-white\/10/g, 'border-[#00CFCF]/10');
  
  // Text colors
  code = code.replace(/text-white\/70/g, 'text-[#00CFCF]/70');
  code = code.replace(/text-white\/60/g, 'text-[#00CFCF]/60');
  code = code.replace(/text-white\/40/g, 'text-[#00CFCF]/40');
  code = code.replace(/text-white/g, 'text-[#00CFCF]'); // Global text-white inside these files is now text-cyan
  // Revert button text to white
  code = code.replace(/text-\[\#00CFCF\] font-bold uppercase/g, 'text-white font-bold uppercase');
  code = code.replace(/text-\[\#00CFCF\] font-black uppercase/g, 'text-white font-black uppercase');
  
  fs.writeFileSync(file, code);
  console.log(`Updated ${file}`);
});
