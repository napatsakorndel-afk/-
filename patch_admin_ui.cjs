const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

const medalSection = `{/* MEDAL ASSET */}
                <div className="bg-white/[0.02] border border-slate-200 dark:border-white/5 p-6 rounded-3xl space-y-6 relative overflow-hidden">
                  <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest border-b border-slate-200 dark:border-white/5 pb-2">
                    เหรียญที่ระลึก (Medal)
                  </h4>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-white/40 block">
                      อัปโหลดภาพเหรียญ (Medal Image Upload)
                    </label>
                    <label className="border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-amber-500 bg-slate-50 dark:bg-white/5 hover:bg-amber-500/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[200px] relative overflow-hidden group">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleAssetUpload(e, "medal")}
                        className="sr-only"
                      />
                      {medalImage ? (
                        <div className="relative group w-full h-48 bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-center">
                          <img src={medalImage} alt="Medal Preview" className="w-full h-full object-contain" />
                          <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); setMedalImage(""); }}
                            className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-full shadow-lg transition"
                            title="ลบรูปภาพ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 flex flex-col items-center justify-center h-full text-slate-300 dark:text-white/30">
                          <Image className="w-8 h-8 text-white/20 mb-2" />
                          <span className="text-[12px] font-black text-amber-400">คลิกเพื่อเลือกไฟล์รูปเหรียญ</span>
                          <span className="text-[10px]">รองรับ JPG, PNG ไม่เกิน 2MB</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* SOUVENIR ASSET */}
                <div className="bg-white/[0.02] border border-slate-200 dark:border-white/5 p-6 rounded-3xl space-y-6 relative overflow-hidden">
                  <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest border-b border-slate-200 dark:border-white/5 pb-2">
                    ของที่ระลึก (Souvenir)
                  </h4>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-white/40 block">
                      อัปโหลดภาพของที่ระลึก (Souvenir Image Upload)
                    </label>
                    <label className="border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-amber-500 bg-slate-50 dark:bg-white/5 hover:bg-amber-500/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[200px] relative overflow-hidden group">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleAssetUpload(e, "souvenir")}
                        className="sr-only"
                      />
                      {souvenirImage ? (
                        <div className="relative group w-full h-48 bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-center">
                          <img src={souvenirImage} alt="Souvenir Preview" className="w-full h-full object-contain" />
                          <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); setSouvenirImage(""); }}
                            className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-full shadow-lg transition"
                            title="ลบรูปภาพ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 flex flex-col items-center justify-center h-full text-slate-300 dark:text-white/30">
                          <Image className="w-8 h-8 text-white/20 mb-2" />
                          <span className="text-[12px] font-black text-amber-400">คลิกเพื่อเลือกไฟล์ของที่ระลึก</span>
                          <span className="text-[10px]">รองรับ JPG, PNG ไม่เกิน 2MB</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>`;

// Replace everything between "{/* MEDAL ASSET */}" and "{/* ROUTE MAP ASSET */}"
const startIndex = code.indexOf('{/* MEDAL ASSET */}');
const endIndex = code.indexOf('{/* ROUTE MAP ASSET */}');

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + medalSection + '\n\n                ' + code.substring(endIndex);
  fs.writeFileSync('src/components/AdminPortal.tsx', code);
  console.log("Successfully patched AdminPortal.tsx UI");
} else {
  console.log("Failed to find bounds");
}
