const fs = require('fs');

let adminCode = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

const targetStr = `                </div>
              </div>

              {/* ACTION ROW */}`;

const replacementStr = `                </div>

                {/* ROUTE MAP ASSET */}
                <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl space-y-6 relative overflow-hidden">
                  <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest border-b border-white/5 pb-2">
                    แผนที่เส้นทางวิ่ง (Route Map)
                  </h4>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-white/40 block">
                      อัปโหลดภาพแผนที่ (Route Map Image Upload)
                    </label>
                    <label className="border-2 border-dashed border-white/10 hover:border-amber-500 bg-black/20 hover:bg-amber-500/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[200px] relative overflow-hidden group">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleAssetUpload(e, "routemap")}
                        className="sr-only"
                      />
                      {routeMapImage ? (
                        <div className="relative group w-full h-auto min-h-[100px] bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-center">
                          <img src={routeMapImage} alt="Route Map Preview" className="w-full h-auto object-contain max-h-[400px]" />
                          <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); setRouteMapImage(""); }}
                            className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-full shadow-lg transition"
                            title="ลบรูปภาพ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 flex flex-col items-center justify-center h-full text-white/30">
                          <Image className="w-8 h-8 text-white/20 mb-2" />
                          <span className="text-[12px] font-black text-amber-400">คลิกเพื่อเลือกไฟล์รูปแผนที่เส้นทางวิ่ง</span>
                          <span className="text-[10px]">รองรับ JPG, PNG ไม่เกิน 2MB</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* LOGO ASSET */}
                <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl space-y-6 relative overflow-hidden">
                  <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest border-b border-white/5 pb-2">
                    โลโก้งานวิ่ง (Logo)
                  </h4>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-white/40 block">
                      อัปโหลดโลโก้ (Logo Image Upload)
                    </label>
                    <label className="border-2 border-dashed border-white/10 hover:border-amber-500 bg-black/20 hover:bg-amber-500/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[200px] relative overflow-hidden group">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleAssetUpload(e, "logo")}
                        className="sr-only"
                      />
                      {logoImage ? (
                        <div className="relative group w-full h-auto min-h-[100px] bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-center">
                          <img src={logoImage} alt="Logo Preview" className="w-auto h-24 object-contain" />
                          <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); setLogoImage(""); }}
                            className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-full shadow-lg transition"
                            title="ลบรูปภาพ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 flex flex-col items-center justify-center h-full text-white/30">
                          <Image className="w-8 h-8 text-white/20 mb-2" />
                          <span className="text-[12px] font-black text-amber-400">คลิกเพื่อเลือกไฟล์รูปโลโก้</span>
                          <span className="text-[10px]">รองรับ JPG, PNG ไม่เกิน 2MB</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

              </div>

              {/* ACTION ROW */}`;

if (adminCode.includes(targetStr)) {
  adminCode = adminCode.replace(targetStr, replacementStr);
  fs.writeFileSync('src/components/AdminPortal.tsx', adminCode);
  console.log("Successfully patched AdminPortal.tsx UI blocks.");
} else {
  console.log("Error: Target string not found in AdminPortal.tsx");
}
