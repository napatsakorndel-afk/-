const fs = require('fs');
let code = fs.readFileSync('src/components/RegistrationForm.tsx', 'utf8');

code = code.replace(
  'const [step, setStep] = useState<number>(1);',
  'const [step, setStep] = useState<number>(preselectedDistance ? 2 : 1);'
);

fs.writeFileSync('src/components/RegistrationForm.tsx', code);
console.log("Success patch reg step");
