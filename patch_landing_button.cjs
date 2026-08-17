const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

code = code.replace(
  "{dist.type === 'donation' ? 'ร่วมบริจาคสนับสนุน' : 'สมัครระยะนี้'}",
  "{dist.type === 'donation' ? 'ร่วมบริจาคสนับสนุน' : dist.type === 'souvenir' ? 'ซื้อของที่ระลึก' : 'สมัครระยะนี้'}"
);

fs.writeFileSync('src/components/LandingPage.tsx', code);
console.log("Patched button text for souvenir");
