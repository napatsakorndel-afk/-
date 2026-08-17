const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// 1. Add state
code = code.replace(
  'const [medalImage, setMedalImage] = useState<string>("");',
  'const [medalImage, setMedalImage] = useState<string>("");\n  const [routeMapImage, setRouteMapImage] = useState<string>("");'
);

// 2. Add fetch
code = code.replace(
  'if (data.medalImage) setMedalImage(data.medalImage);',
  'if (data.medalImage) setMedalImage(data.medalImage);\n        if (data.routeMapImage) setRouteMapImage(data.routeMapImage);'
);

// 3. Update img src
code = code.replace(
  'src="/route-map.png"',
  'src={routeMapImage || "/route-map.png"}'
);

fs.writeFileSync('src/components/LandingPage.tsx', code);
console.log("LandingPage patched for fetch");
