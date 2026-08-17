const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

const oldContainer = '<div className="relative group w-full h-48 bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-center">';
const newContainer = '<div className="relative group w-full h-auto bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center overflow-hidden">';

const oldImgContain = 'className="w-full h-full object-contain"';
const newImgContain = 'className="w-full h-auto object-cover"';

// Wait, the button positioning `absolute -top-3 -right-3` works best if the container doesn't have overflow-hidden.
// Let's use:
const newContainer2 = '<div className="relative group w-full h-auto max-w-[250px] mx-auto rounded-xl border border-slate-200 flex items-center justify-center shadow-sm">';
const newImg2 = 'className="w-full h-auto object-contain rounded-xl"';

// Let's replace line by line for the previews:
code = code.replace(
  '<div className="relative group w-full h-48 bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-center">\n                          <img src={shirtImage} alt="Shirt Preview" className="w-full h-full object-contain" />',
  '<div className="relative group w-full h-auto max-w-[200px] mx-auto">\n                          <img src={shirtImage} alt="Shirt Preview" className="w-full h-auto object-cover rounded-xl shadow-md border border-slate-200" />'
);

code = code.replace(
  '<div className="relative group w-full h-48 bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-center">\n                          <img src={medalImage} alt="Medal Preview" className="w-full h-full object-contain" />',
  '<div className="relative group w-full h-auto max-w-[200px] mx-auto">\n                          <img src={medalImage} alt="Medal Preview" className="w-full h-auto object-cover rounded-xl shadow-md border border-slate-200" />'
);

code = code.replace(
  '<div className="relative group w-full h-48 bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-center">\n                          <img src={souvenirImage} alt="Souvenir Preview" className="w-full h-full object-contain" />',
  '<div className="relative group w-full h-auto max-w-[200px] mx-auto">\n                          <img src={souvenirImage} alt="Souvenir Preview" className="w-full h-auto object-cover rounded-xl shadow-md border border-slate-200" />'
);

fs.writeFileSync('src/components/AdminPortal.tsx', code);
console.log("Patched AdminPortal");
