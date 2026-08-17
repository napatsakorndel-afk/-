const fs = require('fs');
const file = 'src/components/LandingPage.tsx';
let code = fs.readFileSync(file, 'utf8');

// Increase price size
code = code.replace(
  'span className={`text-4xl sm:text-5xl font-black font-mono leading-none tracking-tight ${dist.textColor}`}>{dist.price} <span className="text-base sm:text-lg font-medium text-white/50">THB</span>',
  'span className={`text-6xl sm:text-7xl font-black font-mono leading-none tracking-tight ${dist.textColor}`}>{dist.price} <span className="text-xl sm:text-2xl font-medium text-white/50">THB</span>'
);

// Increase "ไม่มีขั้นต่ำ" size
code = code.replace(
  'span className={`text-3xl sm:text-4xl font-black leading-none tracking-tight ${dist.textColor}`}>ไม่มีขั้นต่ำ</span>',
  'span className={`text-4xl sm:text-5xl font-black leading-none tracking-tight ${dist.textColor}`}>ไม่มีขั้นต่ำ</span>'
);

// Optional: Increase header label "ค่าสมัครเข้าร่วม" to be more visible
code = code.replace(
  'span className="text-xs text-white/50 block font-bold uppercase tracking-wider">{dist.type === \'donation\' ? \'การร่วมสมทบทุน\' : \'ค่าสมัครเข้าร่วม\'}</span>',
  'span className="text-sm sm:text-base text-white/60 block font-bold uppercase tracking-wider">{dist.type === \'donation\' ? \'การร่วมสมทบทุน\' : \'ค่าสมัครเข้าร่วม\'}</span>'
);

fs.writeFileSync(file, code);
console.log("Success patch font sizes 3");
