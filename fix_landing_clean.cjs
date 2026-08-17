const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const logicPart = code.substring(0, code.indexOf('];') + 2); // gets up to the end of distances array
const uiPart = code.substring(code.indexOf('return (\n    <div className="min-h-screen bg-[#00CFCF]'));

fs.writeFileSync('src/components/LandingPage.tsx', logicPart + '\n\n  ' + uiPart);
console.log('Cleaned up LandingPage.tsx');
