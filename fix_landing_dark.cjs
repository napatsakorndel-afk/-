const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

code = code.replace(/bg-white text-\[\#00CFCF\] border-transparent shadow-xl rounded-xl/g, 'bg-white/5 border-white/10 rounded-xl');
code = code.replace(/bg-white text-\[\#00CFCF\] border-transparent shadow-xl rounded-2xl/g, 'bg-white/5 border border-white/10 rounded-2xl');
code = code.replace(/text-\[\#00CFCF\]\/60/g, 'text-white/60');
code = code.replace(/text-\[\#00CFCF\]\/70/g, 'text-white/70');
code = code.replace(/text-\[\#00CFCF\]\/90/g, 'text-white/90');
code = code.replace(/hover:text-\[\#00CFCF\]/g, 'hover:text-blue-900');

fs.writeFileSync('src/components/LandingPage.tsx', code);
