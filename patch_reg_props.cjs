const fs = require('fs');
let code = fs.readFileSync('src/components/RegistrationForm.tsx', 'utf8');

code = code.replace(
  'interface RegistrationFormProps {\n  onSuccess: (reg: Registration) => void;\n  onCancel: () => void;\n}',
  'interface RegistrationFormProps {\n  onSuccess: (reg: Registration) => void;\n  onCancel: () => void;\n  preselectedDistance?: DistanceType | null;\n}'
);

code = code.replace(
  'export default function RegistrationForm({ onSuccess, onCancel }: RegistrationFormProps) {',
  'export default function RegistrationForm({ onSuccess, onCancel, preselectedDistance }: RegistrationFormProps) {'
);

code = code.replace(
  'distance: "REGULAR",',
  'distance: preselectedDistance || "REGULAR",'
);

fs.writeFileSync('src/components/RegistrationForm.tsx', code);
console.log("Success patch reg props");
