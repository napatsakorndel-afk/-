const fs = require('fs');

const files = [
  'src/components/LandingPage.tsx',
  'src/components/RegistrationForm.tsx',
  'src/components/StatusChecker.tsx',
  'src/components/AdminPortal.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    
    // We replaced `bg-white` with `bg-white/5` or `bg-black/40` or `bg-zinc-900` or `bg-neutral-950`...
    // To properly restore both light and dark, we should inject CSS variables or just modify the main index.css!
    
    fs.writeFileSync(file, code);
  }
});
