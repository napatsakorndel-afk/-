const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

code = code.replace(
  'import { generatePromptPayPayload } from "../lib/promptpay.js";',
  'import { generatePromptPayPayload } from "../lib/promptpay.js";\nimport { CheckinScanner } from "./CheckinScanner.js";'
);

code = code.replace(
  ') : subTab === "assets" ? (',
  ') : subTab === "checkin" ? (\n          <CheckinScanner />\n        ) : subTab === "assets" ? ('
);

fs.writeFileSync('src/components/AdminPortal.tsx', code);
console.log("Success patch admin checkin 2");
