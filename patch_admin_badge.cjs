const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

code = code.replace(
  '  const getStatusLabel = (status: RegistrationStatus) => {',
  `  const getStatusLabel = (reg: Registration) => {
    if (reg.checkedIn) {
      return <span className="bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">เช็คอินแล้ว</span>;
    }
    const status = reg.status;`
);

code = code.replace(
  '{getStatusLabel(reg.status)}',
  '{getStatusLabel(reg)}'
);

code = code.replace(
  '{getStatusLabel(reg.status)}',
  '{getStatusLabel(reg)}'
);

fs.writeFileSync('src/components/AdminPortal.tsx', code);
console.log("Success patch admin badge");
