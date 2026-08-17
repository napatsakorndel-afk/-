const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

const shirtSectionOld = `<div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-900 dark:text-white/40 block">
                      อัปโหลดภาพเสื้อ (Shirt Image Upload)
                    </label>
                    <label className="border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-amber-500 bg-slate-50 dark:bg-white/5 hover:bg-amber-500/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[200px] relative overflow-hidden group">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleAssetUpload(e, "shirt")}
                        className="sr-only"
                      />
                      {shirtImage ? (
                        <div className="relative group w-full h-auto max-w-[200px] mx-auto">
                          <img src={shirtImage} alt="Shirt Preview" className="w-full h-auto object-cover rounded-xl shadow-md border border-slate-200" />
                          <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); setShirtImage(""); }}
                            className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-full shadow-lg transition"
                            title="ลบรูปภาพ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 flex flex-col items-center justify-center h-full text-slate-300 dark:text-slate-900 dark:text-white/30">
                          <Image className="w-8 h-8 text-slate-900 dark:text-slate-900 dark:text-white/20 mb-2" />
                          <span className="text-[12px] font-black text-amber-400">คลิกเพื่อเลือกไฟล์รูปเสื้อ</span>
                          <span className="text-[10px]">รองรับ JPG, PNG ไม่เกิน 2MB</span>
                        </div>
                      )}
                    </label>
                  </div>`;

const shirtSectionNew = `<div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-900 dark:text-white/40 block">
                      อัปโหลดภาพเสื้อคอกลม (Crew Neck Shirt)
                    </label>
                    <label className="border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-amber-500 bg-slate-50 dark:bg-white/5 hover:bg-amber-500/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[200px] relative overflow-hidden group">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleAssetUpload(e, "shirt")}
                        className="sr-only"
                      />
                      {shirtImage ? (
                        <div className="relative group w-full h-auto max-w-[200px] mx-auto">
                          <img src={shirtImage} alt="Shirt Preview" className="w-full h-auto object-cover rounded-xl shadow-md border border-slate-200" />
                          <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); setShirtImage(""); }}
                            className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-full shadow-lg transition"
                            title="ลบรูปภาพ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 flex flex-col items-center justify-center h-full text-slate-300 dark:text-slate-900 dark:text-white/30">
                          <Image className="w-8 h-8 text-slate-900 dark:text-slate-900 dark:text-white/20 mb-2" />
                          <span className="text-[12px] font-black text-amber-400">คลิกเพื่อเลือกไฟล์เสื้อคอกลม</span>
                          <span className="text-[10px]">รองรับ JPG, PNG ไม่เกิน 2MB</span>
                        </div>
                      )}
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-900 dark:text-white/40 block">
                      อัปโหลดภาพเสื้อโปโล (Polo Shirt)
                    </label>
                    <label className="border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-amber-500 bg-slate-50 dark:bg-white/5 hover:bg-amber-500/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[200px] relative overflow-hidden group">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleAssetUpload(e, "poloshirt")}
                        className="sr-only"
                      />
                      {poloShirtImage ? (
                        <div className="relative group w-full h-auto max-w-[200px] mx-auto">
                          <img src={poloShirtImage} alt="Polo Shirt Preview" className="w-full h-auto object-cover rounded-xl shadow-md border border-slate-200" />
                          <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); setPoloShirtImage(""); }}
                            className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-full shadow-lg transition"
                            title="ลบรูปภาพ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 flex flex-col items-center justify-center h-full text-slate-300 dark:text-slate-900 dark:text-white/30">
                          <Image className="w-8 h-8 text-slate-900 dark:text-slate-900 dark:text-white/20 mb-2" />
                          <span className="text-[12px] font-black text-amber-400">คลิกเพื่อเลือกไฟล์เสื้อโปโล</span>
                          <span className="text-[10px]">รองรับ JPG, PNG ไม่เกิน 2MB</span>
                        </div>
                      )}
                    </label>
                  </div>
                  </div>`;

if (code.includes(shirtSectionOld)) {
  code = code.replace(shirtSectionOld, shirtSectionNew);
  fs.writeFileSync('src/components/AdminPortal.tsx', code);
  console.log("Patched shirt section UI");
} else {
  console.log("Could not find exact shirt block.");
}
