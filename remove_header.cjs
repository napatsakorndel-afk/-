const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// The header starts with <header className="fixed w-full z-50...
// and ends right before {/* Hero Section */}
const heroIndex = code.indexOf('{/* Hero Section */}');
const headerStart = code.indexOf('<header className="fixed w-full');

if (headerStart !== -1 && heroIndex !== -1) {
    code = code.substring(0, headerStart) + code.substring(heroIndex);
    fs.writeFileSync('src/components/LandingPage.tsx', code);
    console.log('Removed header');
} else {
    console.log('Header not found');
}
