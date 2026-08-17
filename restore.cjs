const fs = require('fs');
fs.copyFileSync('backup_LandingPage.tsx', 'src/components/LandingPage.tsx');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
const newMain = '<main className={`flex-grow w-full mb-16 md:mb-0 z-10 ${activeTab === "home" ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12"}`}>';
const oldMain = '<main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 mb-16 md:mb-0 z-10">';
appCode = appCode.replace(newMain, oldMain);
fs.writeFileSync('src/App.tsx', appCode);

console.log('Restored LandingPage.tsx and App.tsx');
