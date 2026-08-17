const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

code = code.replace(
  'const [subTab, setSubTab] = useState<"runners" | "shipping" | "payment">("runners");',
  'const [subTab, setSubTab] = useState<"runners" | "shipping" | "payment" | "assets">("runners");'
);

// Add the assets tab button
const paymentTabBtnRegex = /<button\s*type="button"\s*onClick=\{\(\) => \{ setSubTab\("payment"\); fetchPaymentSettings\(\); \}\}[\s\S]*?<\/button>/;
const btnMatch = code.match(paymentTabBtnRegex);

if (btnMatch) {
  const paymentBtn = btnMatch[0];
  const assetsBtn = `
          <button
            type="button"
            onClick={() => { setSubTab("assets"); fetchAssetsSettings(); }}
            className={\`flex-1 md:flex-initial px-6 py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition \${
              subTab === "assets"
                ? "border-amber-500 text-amber-400 bg-white/[0.02]"
                : "border-transparent text-white/50 hover:text-white/80 hover:bg-white/[0.01]"
            }\`}
          >
            <Image className="w-4.5 h-4.5" /> อัปโหลดภาพของที่ระลึก
          </button>`;
  
  code = code.replace(paymentBtn, paymentBtn + assetsBtn);
} else {
  console.log("Could not find payment button");
}

fs.writeFileSync('src/components/AdminPortal.tsx', code);
console.log("Success subTab");
