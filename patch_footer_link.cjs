const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'href="https://www.facebook.com/lsed.tu/"',
  'href="https://lsed.tu.ac.th/"'
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched footer link");
