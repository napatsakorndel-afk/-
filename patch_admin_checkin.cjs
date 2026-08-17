const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

// 1. Remove CheckinScanner import
code = code.replace(/import \{ CheckinScanner \} from "\.\/CheckinScanner(\.js)?";\n?/, '');

// 2. Remove checkin from subTab state type
code = code.replace(
  `useState<"runners" | "shipping" | "payment" | "assets" | "checkin">`,
  `useState<"runners" | "shipping" | "payment" | "assets">`
);

// 3. Remove the checkin button
const btnRegex = /<button\s+type="button"\s+onClick=\{.*setSubTab\("checkin"\)\}.*?สแกนจุดเช็คอิน\s*<\/button>/s;
code = code.replace(btnRegex, '');

// 4. Remove the checkin conditional render
//         ) : subTab === "checkin" ? (
//           <CheckinScanner />
const renderRegex = /\) : subTab === "checkin" \? \(\s*<CheckinScanner \/>/s;
code = code.replace(renderRegex, '');

fs.writeFileSync('src/components/AdminPortal.tsx', code);
console.log("Patched AdminPortal");
