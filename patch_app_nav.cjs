const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'onClick={() => { setActiveTab("register"); setInitialSearchQuery(""); }}',
  'onClick={() => { setPreselectedDistance(null); setActiveTab("register"); setInitialSearchQuery(""); }}'
);
code = code.replace(
  'onClick={() => { setActiveTab("register"); setInitialSearchQuery(""); }}',
  'onClick={() => { setPreselectedDistance(null); setActiveTab("register"); setInitialSearchQuery(""); }}'
);
code = code.replace(
  'onClick={() => setActiveTab(activeTab === "register" ? "home" : "register")}',
  'onClick={() => { setPreselectedDistance(null); setActiveTab(activeTab === "register" ? "home" : "register"); }}'
);

fs.writeFileSync('src/App.tsx', code);
console.log("Success patch app nav");
