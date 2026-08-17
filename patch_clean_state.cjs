const fs = require('fs');
const file = 'src/components/StatusChecker.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace('  const [referrals, setReferrals] = useState<number>(0);\n', '');
code = code.replace('  const [activeTemplateTab, setActiveTemplateTab] = useState<number>(0);\n', '');
code = code.replace('  const [copiedText, setCopiedText] = useState<boolean>(false);\n', '');

// Also remove the referral loading code
const refEffectStr = `      // simulate loading referral progress
      const saved = localStorage.getItem(\`referrals_\${data.id}\`);
      setReferrals(saved ? parseInt(saved, 10) : 0);
`;
code = code.replace(refEffectStr, '');

fs.writeFileSync(file, code);
console.log("Success patch clean state");
