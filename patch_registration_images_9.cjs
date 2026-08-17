const fs = require('fs');
let code = fs.readFileSync('src/components/RegistrationForm.tsx', 'utf8');

const errStr = `            {["REGULAR", "5K", "vip", "souvenir"].includes(formData.distance) && (
              <div className=\`bg-slate-50 dark:bg-white/5 border rounded-2xl p-5 mt-4 flex flex-col items-center justify-center gap-4 animate-fade-in text-center min-h-[160px] \${
                                <div className="flex gap-4 items-center justify-center">`;
                                
const fixStr = `            {["REGULAR", "5K", "vip", "souvenir"].includes(formData.distance) && (
              <div className=\`bg-slate-50 dark:bg-white/5 border rounded-2xl p-5 mt-4 flex flex-col items-center justify-center gap-4 animate-fade-in text-center min-h-[160px] \${
                formData.distance === 'vip' ? 'border-yellow-500/20' : 
                formData.distance === 'souvenir' ? 'border-orange-500/20' : 
                'border-blue-500/20'
              }\`>
                <div className="flex gap-4 items-center justify-center">`;

if (code.includes(errStr)) {
  code = code.replace(errStr, fixStr);
  fs.writeFileSync('src/components/RegistrationForm.tsx', code);
  console.log("Patched Syntax error");
} else {
  // Let's try more flexible matching
  const regex = /<div className=\{`bg-slate-50 dark:bg-white\/5 border rounded-2xl p-5 mt-4 flex flex-col items-center justify-center gap-4 animate-fade-in text-center min-h-\[160px\] \$\{\s*<div className="flex gap-4 items-center justify-center">/gm;
  if (regex.test(code)) {
    code = code.replace(regex, `<div className={\`bg-slate-50 dark:bg-white/5 border rounded-2xl p-5 mt-4 flex flex-col items-center justify-center gap-4 animate-fade-in text-center min-h-[160px] \${formData.distance === 'vip' ? 'border-yellow-500/20' : formData.distance === 'souvenir' ? 'border-orange-500/20' : 'border-blue-500/20'}\`>\n<div className="flex gap-4 items-center justify-center">`);
    fs.writeFileSync('src/components/RegistrationForm.tsx', code);
    console.log("Patched Syntax error with regex");
  } else {
    console.log("Could not find syntax error text match.");
  }
}
