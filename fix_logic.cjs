const fs = require('fs');

let backup = fs.readFileSync('backup_LandingPage.tsx', 'utf8');
const searchString = '  return (\n    <div className="min-h-screen bg-black';

let index = backup.indexOf('  return (\n    <div className="min-h-screen bg-black');
if (index === -1) {
    // try searching for something else
    index = backup.lastIndexOf('  return (');
}

const logicPart = backup.substring(0, index);

// Load the current broken LandingPage.tsx to get the UI part
let current = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');
let currentUiIndex = current.indexOf('  return (\n    <div className="min-h-screen bg-[#00CFCF]');
const uiPart = current.substring(currentUiIndex);

fs.writeFileSync('src/components/LandingPage.tsx', logicPart + uiPart);
console.log('Fixed logic part.');
