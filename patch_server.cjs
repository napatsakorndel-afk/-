const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// GET
code = code.replace(
  'res.json({ shirtImage: "", medalImage: "", routeMapImage: "", logoImage: "", souvenirImage: "" });',
  'res.json({ shirtImage: "", poloShirtImage: "", medalImage: "", routeMapImage: "", logoImage: "", souvenirImage: "" });'
);

// POST body
code = code.replace(
  'const { shirtImage, medalImage, routeMapImage, logoImage, souvenirImage } = req.body;',
  'const { shirtImage, poloShirtImage, medalImage, routeMapImage, logoImage, souvenirImage } = req.body;'
);

// POST db save
code = code.replace(
  'shirtImage: shirtImage || "",',
  'shirtImage: shirtImage || "",\n      poloShirtImage: poloShirtImage || "",'
);

fs.writeFileSync('server.ts', code);
