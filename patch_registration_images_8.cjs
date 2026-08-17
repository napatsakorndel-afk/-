const fs = require('fs');
let code = fs.readFileSync('src/components/RegistrationForm.tsx', 'utf8');

const oldStr = `            {["REGULAR", "5K", "vip", "souvenir"].includes(formData.distance) && (
              <div className=\`bg-slate-50 dark:bg-white/5 border rounded-2xl p-5 mt-4 flex flex-col items-center justify-center gap-4 animate-fade-in text-center min-h-[160px] \${
                                <div className="flex gap-4 items-center justify-center">`;
                                
const newStr = `            {["REGULAR", "5K", "vip", "souvenir"].includes(formData.distance) && (
              <div className=\`bg-slate-50 dark:bg-white/5 border rounded-2xl p-5 mt-4 flex flex-col items-center justify-center gap-4 animate-fade-in text-center min-h-[160px] \${
                formData.distance === 'vip' ? 'border-yellow-500/20' : 
                formData.distance === 'souvenir' ? 'border-orange-500/20' : 
                'border-blue-500/20'
              }\`>
                <div className="flex gap-4 items-center justify-center">`;

if (code.includes(oldStr)) {
  code = code.replace(oldStr, newStr);
  fs.writeFileSync('src/components/RegistrationForm.tsx', code);
  console.log("Patched Syntax error");
} else {
  console.log("Could not find exact text match.");
}
