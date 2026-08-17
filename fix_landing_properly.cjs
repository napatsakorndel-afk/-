const fs = require('fs');

let backup = fs.readFileSync('backup_LandingPage.tsx', 'utf8');

const logicEndIndex = backup.lastIndexOf('  return (\n    <div className="min-h-screen');
if (logicEndIndex === -1) {
    console.error("Could not find logic end");
}
const logicPart = backup.substring(0, logicEndIndex);

let current = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');
const uiStartIndex = current.indexOf('  return (\n    <div className="min-h-screen bg-[#00CFCF]');
const uiPart = current.substring(uiStartIndex);

fs.writeFileSync('src/components/LandingPage.tsx', logicPart + uiPart);
console.log('Fixed it properly');
