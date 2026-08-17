const fs = require('fs');
const file = 'src/components/LandingPage.tsx';
let code = fs.readFileSync(file, 'utf8');

// Increase description font size
code = code.replace(
  'p className="min-h-[80px] md:min-h-[100px] text-xs sm:text-sm">{dist.desc}',
  'p className="min-h-[80px] md:min-h-[100px] text-sm sm:text-base leading-relaxed">{dist.desc}'
);

// Increase gift text font size
code = code.replace(
  'p className="text-xs text-white/50 leading-relaxed font-medium min-h-[80px] md:min-h-[90px]">{dist.gift}',
  'p className="text-sm sm:text-base text-white/70 leading-relaxed font-medium min-h-[80px] md:min-h-[90px]">{dist.gift}'
);

// Increase price size
code = code.replace(
  'span className={`text-2xl sm:text-3xl font-black font-mono leading-none tracking-tight ${dist.textColor}`}>{dist.price} <span className="text-xs sm:text-sm font-medium">THB</span>',
  'span className={`text-4xl sm:text-5xl font-black font-mono leading-none tracking-tight ${dist.textColor}`}>{dist.price} <span className="text-base sm:text-lg font-medium text-white/50">THB</span>'
);

// Increase "ไม่มีขั้นต่ำ" size
code = code.replace(
  'span className={`text-2xl sm:text-3xl font-black leading-none tracking-tight ${dist.textColor}`}>ไม่มีขั้นต่ำ</span>',
  'span className={`text-3xl sm:text-4xl font-black leading-none tracking-tight ${dist.textColor}`}>ไม่มีขั้นต่ำ</span>'
);

// Increase button font size (dist.type === 'donation' ? 'bg-purple-600...)
code = code.replace(
  'className={`w-full py-3 ${dist.type === \'donation\' ? \'bg-purple-600 hover:bg-purple-500 shadow-purple-500/25\' : \'bg-blue-600 hover:bg-blue-500 shadow-blue-500/25\'} text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg transition duration-200 cursor-pointer text-center`}',
  'className={`w-full py-4 ${dist.type === \'donation\' ? \'bg-purple-600 hover:bg-purple-500 shadow-purple-500/25\' : \'bg-blue-600 hover:bg-blue-500 shadow-blue-500/25\'} text-white font-black uppercase tracking-widest text-base rounded-xl shadow-lg transition duration-200 cursor-pointer text-center`}'
);

// Title size (if needed, but user just said description/price/button)

fs.writeFileSync(file, code);
console.log("Success patch font sizes");
