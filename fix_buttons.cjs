const fs = require('fs');
const files = [
  'src/components/RegistrationForm.tsx',
  'src/components/StatusChecker.tsx',
  'src/components/AdminPortal.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');

    const btnColors = ['bg-\\[#FF6B1A\\]', 'bg-orange-600', 'bg-orange-500', 'bg-blue-600', 'bg-blue-500', 'bg-purple-600', 'bg-red-600', 'bg-emerald-600', 'bg-green-600', 'bg-black', 'bg-neutral-800'];
    btnColors.forEach(color => {
      // Find `bg-orange-600 ... text-slate-900 dark:text-white`
      const regex = new RegExp(`(${color}[^"]*?)text-slate-900 dark:text-white`, 'g');
      code = code.replace(regex, '$1text-white');
    });

    fs.writeFileSync(file, code);
  }
});
