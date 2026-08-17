const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const routeRegex = /\/\/ Admin action: Reject Registration.*?app\.post\("\/api\/admin\/checkin".*?res\.json\(\{ success: true \}\);\n\}\);\n/s;
code = code.replace(routeRegex, '');

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts");
