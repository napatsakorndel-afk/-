const fs = require('fs');
let code = fs.readFileSync('src/components/StatusChecker.tsx', 'utf8');

code = code.replace(`  Share2\n}   ExternalLink,\n} from "lucide-react";`, `  Share2,\n  ExternalLink\n} from "lucide-react";`);

fs.writeFileSync('src/components/StatusChecker.tsx', code);
console.log("Fixed import");
