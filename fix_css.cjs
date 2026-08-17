const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

// I will just wipe out everything except the tailwind imports.
const newCode = `@import "tailwindcss";`;
fs.writeFileSync('src/index.css', newCode);
console.log('Cleaned up index.css');
