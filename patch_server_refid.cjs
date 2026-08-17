const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ Helper to generate a unique Registration ID e\.g\., LSED-XXXXXX\s*const generateRefID = \(\): string => \{[\s\S]*?return `LSED-\$\{result\}`;\s*\};/;

const newCode = `// Helper to generate a unique Registration ID e.g., LSED-XXXXXX
const generateRefID = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const timestampPart = Date.now().toString(36).toUpperCase().slice(-4);
  return \`LSED-\${timestampPart}\${result}\`;
};`;

if (regex.test(code)) {
    code = code.replace(regex, newCode);
    fs.writeFileSync('server.ts', code);
    console.log("Success refid");
} else {
    console.log("refid regex failed");
}
