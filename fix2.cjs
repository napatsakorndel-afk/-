const fs = require('fs');
let content = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const regex = /      <\/section>sName="w-full h-full object-contain rounded-xl" \/>\s*<\/div>\s*\) : \(\s*<div className="relative bg-black\/40 border border-white\/5 border-dashed rounded-2xl p-6 md:p-10 w-full max-w-sm flex flex-col items-center justify-center aspect-square shadow-inner">\s*<Shirt className="w-12 h-12 mb-3 opacity-30 text-white" \/>\s*<span className="text-xs text-white\/40 font-black uppercase tracking-wider text-center">รออัปโหลดภาพเสื้อที่ระลึก<\/span>\s*<\/div>\s*\)}\s*<\/div>\s*<\/section>/s;

const replacement = `      </section>`;

let newContent = content.replace(regex, replacement);
fs.writeFileSync('src/components/LandingPage.tsx', newContent);
console.log('Fixed garbage.');
