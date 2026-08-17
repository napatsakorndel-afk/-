const fs = require('fs');
const content = fs.readFileSync('src/components/RegistrationForm.tsx', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(380, 480).join('\n'));
