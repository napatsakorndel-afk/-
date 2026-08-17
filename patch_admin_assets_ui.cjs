const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

const uiToInsert = `
        ) : subTab === "assets" ? (
          <div className="p-5 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
              <div>
                <h3 className="text-xl font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                  <Image className="w-5 h-5" /> อัปโหลดภาพของที่ระลึก
                </h3>
                <p className="text-xs text-white/50 mt-1.5">
                  อัปโหลดภาพเสื้อและเหรียญที่ระลึกเพื่อให้ผู้สมัครเห็นภาพของจริงในหน้าฟอร์ม
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveAssetsSettings} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* SHIRT ASSET */}
                <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl space-y-6 relative overflow-hidden">
                  <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest border-b border-white/5 pb-2">
                    เสื้อที่ระลึก (Shirt)
                  </h4>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-white/40 block">
                      อัปโหลดภาพเสื้อ (Shirt Image Upload)
                    </label>
                    <label className="border-2 border-dashed border-white/10 hover:border-amber-500 bg-black/20 hover:bg-amber-500/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[200px] relative overflow-hidden group">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleAssetUpload(e, "shirt")}
                        className="sr-only"
                      />
                      {shirtImage ? (
                        <div className="relative group w-full h-48 bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-center">
                          <img src={shirtImage} alt="Shirt Preview" className="w-full h-full object-contain" />
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
                        <div className="space-y-2 flex flex-col items-center justify-center h-full text-white/30">
                          <Image className="w-8 h-8 text-white/20 mb-2" />
                          <span className="text-[12px] font-black text-amber-400">คลิกเพื่อเลือกไฟล์รูปเสื้อ</span>
                          <span className="text-[10px]">รองรับ JPG, PNG ไม่เกิน 2MB</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* MEDAL ASSET */}
                <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl space-y-6 relative overflow-hidden">
                  <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest border-b border-white/5 pb-2">
                    เหรียญที่ระลึก (Medal)
                  </h4>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-white/40 block">
                      อัปโหลดภาพเหรียญ (Medal Image Upload)
                    </label>
                    <label className="border-2 border-dashed border-white/10 hover:border-amber-500 bg-black/20 hover:bg-amber-500/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[200px] relative overflow-hidden group">
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
                        <div className="space-y-2 flex flex-col items-center justify-center h-full text-white/30">
                          <Image className="w-8 h-8 text-white/20 mb-2" />
                          <span className="text-[12px] font-black text-amber-400">คลิกเพื่อเลือกไฟล์รูปเหรียญ</span>
                          <span className="text-[10px]">รองรับ JPG, PNG ไม่เกิน 2MB</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {/* ACTION ROW */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/5">
                <div className="text-xs">
                  {assetsError && <p className="text-red-400 flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5"/> {assetsError}</p>}
                  {assetsSuccess && <p className="text-emerald-400 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5"/> บันทึกข้อมูลรูปภาพของที่ระลึกสำเร็จ!</p>}
                </div>
                <button
                  type="submit"
                  disabled={savingAssets}
                  className="w-full sm:w-auto px-10 py-3.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl transition shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  {savingAssets ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> กำลังบันทึก...</>
                  ) : (
                    <><Save className="w-4 h-4" /> บันทึกรูปภาพ</>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </section>
`;

code = code.replace(
  '        )}\n      </section>',
  '        )\n' + uiToInsert
);

fs.writeFileSync('src/components/AdminPortal.tsx', code);
console.log("Success admin ui");
