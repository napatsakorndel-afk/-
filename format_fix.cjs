const fs = require('fs');
let code = fs.readFileSync('src/components/RegistrationForm.tsx', 'utf8');

// The start of the block is `{distance.startsWith("vip") ? (`
// The end is `{/* SIZE CHART MODAL */`

const startIndex = code.indexOf('{distance.startsWith("vip") ? (');
const endIndex = code.indexOf('{/* SIZE CHART MODAL */');

if (startIndex !== -1 && endIndex !== -1) {
    const newBlock = `{distance.startsWith("vip") ? (
                        <>
                          {shirtImage ? (
                            <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 flex items-center justify-center p-2 shadow-inner relative group">
                              <img src={shirtImage} alt="Shirt" className="w-full h-full object-contain rounded-lg drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
                            </div>
                          ) : (
                            <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-xl bg-slate-100 dark:bg-black/40 border border-dashed border-white/20 flex flex-col items-center justify-center text-slate-300 dark:text-white/30">
                              <Shirt className="w-6 h-6 mb-1 opacity-50" />
                              <span className="text-[9px] uppercase font-black tracking-wider">รออัปโหลดภาพเสื้อวิ่ง</span>
                            </div>
                          )}
                          {poloShirtImage ? (
                            <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 flex items-center justify-center p-2 shadow-inner relative group">
                              <img src={poloShirtImage} alt="VIP Polo Shirt" className="w-full h-full object-contain rounded-lg drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
                            </div>
                          ) : (
                            <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-xl bg-slate-100 dark:bg-black/40 border border-dashed border-white/20 flex flex-col items-center justify-center text-slate-300 dark:text-white/30">
                              <Shirt className="w-6 h-6 mb-1 opacity-50" />
                              <span className="text-[9px] uppercase font-black tracking-wider">รออัปโหลดภาพเสื้อโปโล</span>
                            </div>
                          )}
                        </>
                      ) : (
                        shirtImage ? (
                          <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 flex items-center justify-center p-2 shadow-inner relative group">
                            <img src={shirtImage} alt="Shirt" className="w-full h-full object-contain rounded-lg drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
                          </div>
                        ) : (
                          <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-xl bg-slate-100 dark:bg-black/40 border border-dashed border-white/20 flex flex-col items-center justify-center text-slate-300 dark:text-white/30">
                            <Shirt className="w-6 h-6 mb-1 opacity-50" />
                            <span className="text-[9px] uppercase font-black tracking-wider">รออัปโหลดภาพ</span>
                          </div>
                        )
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
                </div>
                
                <div className="space-y-1 text-left w-full max-w-sm mx-auto">
                  {formData.distance === "REGULAR" || formData.distance === "5K" ? (
                    <>
                      <p className="text-sm font-bold text-slate-700 dark:text-white flex justify-between">
                        <span>ค่าสมัคร</span>
                        <span>500 บาท</span>
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">สิ่งที่จะได้รับ: เสื้อวิ่ง + เหรียญรางวัล + บิบ</p>
                    </>
                  ) : formData.distance === "vip" ? (
                    <>
                      <p className="text-sm font-bold text-yellow-600 dark:text-yellow-500 flex justify-between">
                        <span>ค่าสมัคร VIP</span>
                        <span>1,500 บาท</span>
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">สิ่งที่จะได้รับ: เสื้อวิ่ง + เสื้อโปโล + เหรียญรางวัล + บิบ + ของที่ระลึกพิเศษ</p>
                    </>
                  ) : formData.distance === "souvenir" ? (
                    <>
                      <p className="text-sm font-bold text-orange-600 dark:text-orange-500 flex justify-between">
                        <span>ของที่ระลึก</span>
                        <span>350 บาท</span>
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">สิ่งที่จะได้รับ: เสื้อวิ่ง (ไม่มีบิบ ไม่ได้วิ่ง)</p>
                    </>
                  ) : null}
                </div>
              </div>
            )}
            
            `;
    code = code.substring(0, startIndex) + newBlock + code.substring(endIndex);
    fs.writeFileSync('src/components/RegistrationForm.tsx', code);
    console.log("Successfully replaced the block.");
} else {
    console.log("Could not find start or end index.");
}
