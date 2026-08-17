const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

code = code.replace(
  'const [medalImage, setMedalImage] = useState<string>("");',
  'const [medalImage, setMedalImage] = useState<string>("");\n  const [souvenirImage, setSouvenirImage] = useState<string>("");'
);

code = code.replace(
  'setMedalImage(data.medalImage || "");',
  'setMedalImage(data.medalImage || "");\n        setSouvenirImage(data.souvenirImage || "");'
);

code = code.replace(
  'body: JSON.stringify({ shirtImage, medalImage, routeMapImage, logoImage }),',
  'body: JSON.stringify({ shirtImage, medalImage, routeMapImage, logoImage, souvenirImage }),'
);

fs.writeFileSync('src/components/AdminPortal.tsx', code);
