const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

const targetStr = `                if (type === "shirt") {
          setShirtImage(compressedBase64);
        } else {
          setMedalImage(compressedBase64);
        }`;

const replacementStr = `                if (type === "shirt") {
                  setShirtImage(compressedBase64);
                } else if (type === "medal") {
                  setMedalImage(compressedBase64);
                } else if (type === "routemap") {
                  setRouteMapImage(compressedBase64);
                } else if (type === "logo") {
                  setLogoImage(compressedBase64);
                }`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/components/AdminPortal.tsx', code);
console.log("Admin upload logic fixed");
