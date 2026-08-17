const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

code = code.replace(
  'onRegisterClick: () => void;',
  'onRegisterClick: (distance?: DistanceType) => void;'
);

code = code.replace(
  'onClick={onRegisterClick}',
  'onClick={() => onRegisterClick()}'
); // hero button

code = code.replace(
  'onClick={onRegisterClick}',
  'onClick={() => onRegisterClick(dist.type)}'
); // distance card button

code = code.replace(
  'onClick={onRegisterClick}',
  'onClick={() => onRegisterClick("souvenir")}'
); // souvenir section button

fs.writeFileSync('src/components/LandingPage.tsx', code);
console.log("Success patch landing");
