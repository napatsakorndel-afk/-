const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

if (code.endsWith('    </div>\n  );\n}\n') || code.endsWith('    </div>\n  );\n}')) {
  code = code.replace(/    <\/div>\n  \);\n}\n?$/, '      </div>\n    </div>\n  );\n}\n');
  fs.writeFileSync('src/components/AdminPortal.tsx', code);
  console.log("Patched end!");
} else {
  console.log("End doesn't match, checking what's there.");
  console.log(code.slice(code.length - 20));
}
