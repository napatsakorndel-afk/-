const fs = require('fs');
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

appCode = appCode.replace(
  'const [statusInitialTab, setStatusInitialTab] = useState<"lookup" | "shipping">("lookup");',
  'const [statusInitialTab, setStatusInitialTab] = useState<"lookup" | "shipping">("lookup");\n  const [logoImage, setLogoImage] = useState<string>("");'
);

// 2. Fetch logoImage
appCode = appCode.replace(
  'fetchStats();\n  }, []);',
  `fetchStats();\n    fetch("/api/assets/settings")\n      .then(res => res.json())\n      .then(data => {\n        if (data.logoImage) setLogoImage(data.logoImage);\n      })\n      .catch(err => console.error("Failed to load assets", err));\n  }, []);`
);

fs.writeFileSync('src/App.tsx', appCode);
console.log("App.tsx fixed");
