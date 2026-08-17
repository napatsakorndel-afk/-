const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

code = code.replace(/if\s*\(\s*type\s*===\s*"shirt"\s*\)\s*\{\s*setShirtImage\(compressedBase64\);\s*\}\s*else\s*\{\s*setMedalImage\(compressedBase64\);\s*\}/, `if (type === "shirt") {
                  setShirtImage(compressedBase64);
                } else if (type === "medal") {
                  setMedalImage(compressedBase64);
                } else if (type === "routemap") {
                  setRouteMapImage(compressedBase64);
                } else if (type === "logo") {
                  setLogoImage(compressedBase64);
                }`);

fs.writeFileSync('src/components/AdminPortal.tsx', code);
console.log("Fixed!");
