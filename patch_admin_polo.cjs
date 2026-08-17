const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

code = code.replace(
  'const [shirtImage, setShirtImage] = useState<string>("");',
  'const [shirtImage, setShirtImage] = useState<string>("");\n  const [poloShirtImage, setPoloShirtImage] = useState<string>("");'
);

code = code.replace(
  'setShirtImage(data.shirtImage || "");',
  'setShirtImage(data.shirtImage || "");\n        setPoloShirtImage(data.poloShirtImage || "");'
);

code = code.replace(
  'type: "shirt" | "medal" | "routemap" | "logo" | "souvenir"',
  'type: "shirt" | "poloshirt" | "medal" | "routemap" | "logo" | "souvenir"'
);

code = code.replace(
  'if (type === "shirt") {',
  'if (type === "shirt") {\n                  setShirtImage(compressedBase64);\n                } else if (type === "poloshirt") {'
);
code = code.replace(
  'setShirtImage(compressedBase64);\n                } else if (type === "poloshirt") {\n                  setShirtImage(compressedBase64);',
  'setShirtImage(compressedBase64);\n                } else if (type === "poloshirt") {\n                  setPoloShirtImage(compressedBase64);'
);

code = code.replace(
  'body: JSON.stringify({ shirtImage, medalImage, routeMapImage, logoImage, souvenirImage }),',
  'body: JSON.stringify({ shirtImage, poloShirtImage, medalImage, routeMapImage, logoImage, souvenirImage }),'
);

fs.writeFileSync('src/components/AdminPortal.tsx', code);
