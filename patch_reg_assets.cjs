const fs = require('fs');
let code = fs.readFileSync('src/components/RegistrationForm.tsx', 'utf8');

const stateToInsert = `
  const [shirtImage, setShirtImage] = useState<string>("");
  const [medalImage, setMedalImage] = useState<string>("");

  useEffect(() => {
    fetch("/api/assets/settings")
      .then(res => res.json())
      .then(data => {
        if (data.shirtImage) setShirtImage(data.shirtImage);
        if (data.medalImage) setMedalImage(data.medalImage);
      })
      .catch(err => console.error("Failed to load assets", err));
  }, []);
`;

code = code.replace(
  '  // Form State',
  stateToInsert + '\n  // Form State'
);

const souvenirRegex = /<div className="bg-white\/5 border border-orange-500\/20 rounded-2xl p-5 mt-4 flex flex-col items-center justify-center gap-3 animate-fade-in text-center min-h-\[160px\]">[\s\S]*?<\/div>/;

const souvenirReplacement = `<div className="bg-white/5 border border-orange-500/20 rounded-2xl p-5 mt-4 flex flex-col items-center justify-center gap-4 animate-fade-in text-center min-h-[160px]">
                <div className="flex gap-4 items-center justify-center">
                  {shirtImage ? (
                    <div className="w-24 h-24 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center p-2 shadow-inner relative group">
                      <img src={shirtImage} alt="Shirt" className="w-full h-full object-contain rounded-lg drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-black/40 border border-dashed border-white/20 flex flex-col items-center justify-center text-white/30">
                      <Shirt className="w-6 h-6 mb-1 opacity-50" />
                      <span className="text-[9px] uppercase font-black tracking-wider">รออัปโหลดภาพ</span>
                    </div>
                  )}

                  {medalImage ? (
                    <div className="w-24 h-24 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center p-2 shadow-inner relative group">
                      <img src={medalImage} alt="Medal" className="w-full h-full object-contain rounded-lg drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-black/40 border border-dashed border-white/20 flex flex-col items-center justify-center text-white/30">
                      <Award className="w-6 h-6 mb-1 opacity-50" />
                      <span className="text-[9px] uppercase font-black tracking-wider">รออัปโหลดภาพ</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase tracking-wider text-orange-400">
                    แพ็กเกจของที่ระลึกสะสม (Souvenir Package)
                  </h4>
                  <ul className="text-xs text-white/60 space-y-0.5 pt-2 text-left list-disc list-inside">
                    <li>เสื้อวิ่งพรีเมียม LSEd Running 1 ตัว (ระบุไซส์ในขั้นตอนถัดไป)</li>
                    <li>เหรียญรางวัลพรีเมียม สุโขทัย ซิกเนเจอร์ ซีรีส์ 1 เหรียญ</li>
                    <li>สิทธิ์ขอลดหย่อนภาษีจากการสมทบทุน 1 เท่า</li>
                  </ul>
                </div>
              </div>`;

if (souvenirRegex.test(code)) {
    code = code.replace(souvenirRegex, souvenirReplacement);
    fs.writeFileSync('src/components/RegistrationForm.tsx', code);
    console.log("Success reg assets");
} else {
    console.log("Failed to match souvenir regex in RegistrationForm");
}
