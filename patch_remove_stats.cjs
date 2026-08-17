const fs = require('fs');
const file = 'src/components/LandingPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const startIndex = code.indexOf('{/* FAQ or Stats banner */}');
const endIndexStr = `        </section>\n      )}\n\n    </div>`;
const endIndex = code.indexOf(endIndexStr);

if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
  code = code.substring(0, startIndex) + '    </div>';
  fs.writeFileSync(file, code);
  console.log("Success remove stats banner");
} else {
  console.log("Could not find start or end index");
  console.log("start:", startIndex);
  console.log("end:", endIndex);
}
