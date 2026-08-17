const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

// handleAssetUpload type definition
code = code.replace(
  'type: "shirt" | "medal" | "routemap" | "logo"',
  'type: "shirt" | "medal" | "routemap" | "logo" | "souvenir"'
);

// inside handleAssetUpload
const elseIfLogo = `} else if (type === "logo") {
                  setLogoImage(compressedBase64);
                }`;
const withSouvenir = `} else if (type === "logo") {
                  setLogoImage(compressedBase64);
                } else if (type === "souvenir") {
                  setSouvenirImage(compressedBase64);
                }`;
code = code.replace(elseIfLogo, withSouvenir);

fs.writeFileSync('src/components/AdminPortal.tsx', code);
