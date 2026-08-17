const fs = require('fs');
let code = fs.readFileSync('src/components/RegistrationForm.tsx', 'utf8');

if (!code.includes('const [souvenirImage, setSouvenirImage]')) {
  code = code.replace(
    'const [medalImage, setMedalImage] = useState<string>("");',
    'const [medalImage, setMedalImage] = useState<string>("");\n  const [souvenirImage, setSouvenirImage] = useState<string>("");\n  const [poloShirtImage, setPoloShirtImage] = useState<string>("");'
  );
  
  code = code.replace(
    'if (data.medalImage) setMedalImage(data.medalImage);',
    'if (data.medalImage) setMedalImage(data.medalImage);\n        if (data.souvenirImage) setSouvenirImage(data.souvenirImage);\n        if (data.poloShirtImage) setPoloShirtImage(data.poloShirtImage);'
  );
}

const replacement = `                <div className="flex gap-4 items-center justify-center">
                  {formData.distance === 'souvenir' ? (
                    souvenirImage ? (
                      <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 flex items-center justify-center p-2 shadow-inner relative group">
                        <img src={souvenirImage} alt="Souvenir" className="w-full h-full object-contain rounded-lg drop-shadow-md group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    ) : (
                      <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-xl bg-slate-100 dark:bg-black/40 border border-dashed border-white/20 flex flex-col items-center justify-center text-slate-300 dark:text-white/30">
                        <Award className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-xs uppercase font-black tracking-wider">รออัปโหลดภาพของที่ระลึก</span>
                      </div>
                    )
                  ) : (
                    <>
                      {shirtImage ? (
                        <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 flex items-center justify-center p-2 shadow-inner relative group">
                          <img src={shirtImage} alt="Shirt" className="w-full h-full object-contain rounded-lg drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      ) : (
                        <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-xl bg-slate-100 dark:bg-black/40 border border-dashed border-white/20 flex flex-col items-center justify-center text-slate-300 dark:text-white/30">
                          <Shirt className="w-6 h-6 mb-1 opacity-50" />
                          <span className="text-[9px] uppercase font-black tracking-wider">รออัปโหลดภาพ</span>
                        </div>
                      )}
                      {medalImage ? (
                        <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 flex items-center justify-center p-2 shadow-inner relative group">
                          <img src={medalImage} alt="Medal" className="w-full h-full object-contain rounded-lg drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      ) : (
                        <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-xl bg-slate-100 dark:bg-black/40 border border-dashed border-white/20 flex flex-col items-center justify-center text-slate-300 dark:text-white/30">
                          <Award className="w-6 h-6 mb-1 opacity-50" />
                          <span className="text-[9px] uppercase font-black tracking-wider">รออัปโหลดภาพ</span>
                        </div>
                      )}
                    </>
                  )}
                </div>`;

const original = fs.readFileSync('original_image_block.txt', 'utf8').trim();

if (code.includes(original)) {
  code = code.replace(original, replacement);
  fs.writeFileSync('src/components/RegistrationForm.tsx', code);
  console.log("Successfully updated image rendering logic based on package selection");
} else {
  console.log("Could not find exact text match.");
}
