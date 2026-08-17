const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  'res.json({ shirtImage: "", medalImage: "", routeMapImage: "" });',
  'res.json({ shirtImage: "", medalImage: "", routeMapImage: "", logoImage: "" });'
);

code = code.replace(
  'const { shirtImage, medalImage, routeMapImage } = req.body;',
  'const { shirtImage, medalImage, routeMapImage, logoImage } = req.body;'
);

code = code.replace(
  'routeMapImage: routeMapImage || ""',
  'routeMapImage: routeMapImage || "",\n      logoImage: logoImage || ""'
);

fs.writeFileSync('server.ts', code);
console.log("Server patched with logoImage");
