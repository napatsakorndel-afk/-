const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const targetIndex = code.indexOf('alt="Souvenir Image"');
// Look backwards to find the `{medalImage ? (` before it
if (targetIndex !== -1) {
  const lookbehindStr = code.substring(0, targetIndex);
  const medalImageCheckIndex = lookbehindStr.lastIndexOf('{medalImage ? (');
  
  if (medalImageCheckIndex !== -1 && (targetIndex - medalImageCheckIndex) < 500) { // sanity check
    code = code.substring(0, medalImageCheckIndex) + '{souvenirImage ? (' + code.substring(medalImageCheckIndex + '{medalImage ? ('.length);
    fs.writeFileSync('src/components/LandingPage.tsx', code);
    console.log("Patched souvenir conditional.");
  }
}

