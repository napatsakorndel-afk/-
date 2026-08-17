const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const qrEndpoint = `
// Proxy QR code for download
app.get("/api/qr-download", async (req, res) => {
  try {
    const payload = req.query.payload;
    if (!payload) return res.status(400).json({ error: "Missing payload" });
    const url = \`https://api.qrserver.com/v1/create-qr-code/?size=500x500&color=002d63&data=\${encodeURIComponent(payload)}\`;
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    res.set("Content-Type", "image/png");
    res.set("Content-Disposition", \`attachment; filename="PromptPay_QR.png"\`);
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: "Failed to generate QR" });
  }
});
`;

code = code.replace('app.get("/api/registrations",', qrEndpoint + '\napp.get("/api/registrations",');
fs.writeFileSync('server.ts', code);
