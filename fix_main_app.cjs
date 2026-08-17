const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldMain = '<main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 mb-16 md:mb-0 z-10">';
const newMain = '<main className={`flex-grow w-full mb-16 md:mb-0 z-10 ${activeTab === "home" ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12"}`}>';

if (code.includes(oldMain)) {
    code = code.replace(oldMain, newMain);
    fs.writeFileSync('src/App.tsx', code);
    console.log('Fixed main container in App.tsx');
} else {
    console.log('Main container not found');
}
