const fs = require('fs');
const file = 'src/components/LandingPage.tsx';
let code = fs.readFileSync(file, 'utf8');

// Increase text-[10px] above price
code = code.replace(
  'span className="text-[10px] text-white/40 block font-bold uppercase tracking-wider">{dist.type === \'donation\' ? \'การร่วมสมทบทุน\' : \'ค่าสมัครเข้าร่วม\'}</span>',
  'span className="text-xs text-white/50 block font-bold uppercase tracking-wider">{dist.type === \'donation\' ? \'การร่วมสมทบทุน\' : \'ค่าสมัครเข้าร่วม\'}</span>'
);

// Increase สิ่งที่จะได้รับ:
code = code.replace(
  'p className="font-bold text-white text-[10px] uppercase tracking-wider">{dist.type === \'donation\' ? \'สิทธิประโยชน์ทางภาษี:\' : \'สิ่งที่จะได้รับ:\'}</p>',
  'p className="font-bold text-white text-xs uppercase tracking-wider">{dist.type === \'donation\' ? \'สิทธิประโยชน์ทางภาษี:\' : \'สิ่งที่จะได้รับ:\'}</p>'
);

fs.writeFileSync(file, code);
console.log("Success patch font sizes 2");
