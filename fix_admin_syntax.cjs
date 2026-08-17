const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

code = code.replace(
  '        )\n        ) : subTab === "assets" ? (',
  '        ) : subTab === "assets" ? ('
);

fs.writeFileSync('src/components/AdminPortal.tsx', code);
console.log("Success fix admin");
