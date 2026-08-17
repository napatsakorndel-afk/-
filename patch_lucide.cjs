const fs = require('fs');
let code = fs.readFileSync('src/components/StatusChecker.tsx', 'utf8');

if (!code.includes("ExternalLink,")) {
  code = code.replace(/from "lucide-react";/, '  ExternalLink,\n} from "lucide-react";');
  fs.writeFileSync('src/components/StatusChecker.tsx', code);
  console.log("Added ExternalLink");
}
