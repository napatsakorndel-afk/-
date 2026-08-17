const fs = require('fs');
const content = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');
console.log(content.slice(1400, 1420));
