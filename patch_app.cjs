const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('const [preselectedDistance')) {
  code = code.replace(
    'const [activeTab, setActiveTab] = useState<TabType>("home");',
    'const [activeTab, setActiveTab] = useState<TabType>("home");\n  const [preselectedDistance, setPreselectedDistance] = useState<DistanceType | null>(null);'
  );
}

code = code.replace(
  'onRegisterClick={() => setActiveTab("register")}',
  'onRegisterClick={(dist) => { if (dist) setPreselectedDistance(dist); setActiveTab("register"); }}'
);

code = code.replace(
  '<RegistrationForm \n            onSuccess={(reg) => handleNavigateToStatus(reg.id)} \n            onCancel={() => setActiveTab("home")}\n          />',
  '<RegistrationForm \n            onSuccess={(reg) => handleNavigateToStatus(reg.id)} \n            onCancel={() => setActiveTab("home")}\n            preselectedDistance={preselectedDistance}\n          />'
);

fs.writeFileSync('src/App.tsx', code);
console.log("Success patch app");
