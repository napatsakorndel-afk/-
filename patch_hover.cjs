const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/className="hover:text-orange-400 text-blue-500 font-medium"/g, 'className="text-blue-500 hover:text-blue-700 dark:hover:text-orange-400 font-medium transition"');

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx hover styles");
