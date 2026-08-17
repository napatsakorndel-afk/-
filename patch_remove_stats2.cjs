const fs = require('fs');
const file = 'src/components/LandingPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const startIndex = code.indexOf('{/* FAQ or Stats banner */}');
if (startIndex !== -1) {
  code = code.substring(0, startIndex) + '    </div>\n  );\n}\n';
  fs.writeFileSync(file, code);
  console.log("Success remove stats banner");
} else {
  console.log("Could not find start index");
}
