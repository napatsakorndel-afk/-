const fs = require('fs');

// Patch AdminPortal.tsx
let adminCode = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

// 1. Add state
adminCode = adminCode.replace(
  'const [medalImage, setMedalImage] = useState<string>("");',
  'const [medalImage, setMedalImage] = useState<string>("");\n  const [routeMapImage, setRouteMapImage] = useState<string>("");'
);

// 2. Fetch state
adminCode = adminCode.replace(
  'setMedalImage(data.medalImage || "");',
  'setMedalImage(data.medalImage || "");\n        setRouteMapImage(data.routeMapImage || "");'
);

// 3. Handle upload
adminCode = adminCode.replace(
  'type: "shirt" | "medal"',
  'type: "shirt" | "medal" | "routemap"'
);

adminCode = adminCode.replace(
  'if (type === "shirt") setShirtImage(dataUrl);\n                if (type === "medal") setMedalImage(dataUrl);',
  'if (type === "shirt") setShirtImage(dataUrl);\n                if (type === "medal") setMedalImage(dataUrl);\n                if (type === "routemap") setRouteMapImage(dataUrl);'
);

// 4. Save state
adminCode = adminCode.replace(
  'JSON.stringify({ shirtImage, medalImage })',
  'JSON.stringify({ shirtImage, medalImage, routeMapImage })'
);

// 5. Add UI block
const medalBlock = `                {/* MEDAL ASSET */}
                <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl space-y-6 relative overflow-hidden">
                  <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest border-b border-white/5 pb-2">
                    เหรียญที่ระลึก (Medal)
                  </h4>
                  <div className="relative group w-full">
                    <label className="cursor-pointer block">
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/jpg" 
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
                        <div className="space-y-2 flex flex-col items-center justify-center h-full text-white/30 p-10 border-2 border-dashed border-white/10 rounded-2xl">
                          <Image className="w-8 h-8 text-white/20 mb-2" />
                          <span className="text-[12px] font-black text-amber-400">คลิกเพื่อเลือกไฟล์รูปเหรียญ</span>
                          <span className="text-[10px]">รองรับ JPG, PNG ไม่เกิน 2MB</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>`;

const routeMapBlock = `

                {/* ROUTE MAP ASSET */}
                <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl space-y-6 relative overflow-hidden md:col-span-2">
                  <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest border-b border-white/5 pb-2">
                    แผนที่เส้นทางวิ่ง (Route Map)
                  </h4>
                  <div className="relative group w-full">
                    <label className="cursor-pointer block">
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/jpg" 
                        onChange={(e) => handleAssetUpload(e, "routemap")}
                        className="sr-only"
                      />
                      {routeMapImage ? (
                        <div className="relative group w-full h-auto min-h-[200px] bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-center">
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
                        <div className="space-y-2 flex flex-col items-center justify-center h-full text-white/30 p-10 border-2 border-dashed border-white/10 rounded-2xl">
                          <Image className="w-8 h-8 text-white/20 mb-2" />
                          <span className="text-[12px] font-black text-amber-400">คลิกเพื่อเลือกไฟล์รูปแผนที่เส้นทางวิ่ง</span>
                          <span className="text-[10px]">รองรับ JPG, PNG ไม่เกิน 2MB</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>`;

// We might need to adjust the grid if it's md:grid-cols-2
adminCode = adminCode.replace(medalBlock, medalBlock + routeMapBlock);
fs.writeFileSync('src/components/AdminPortal.tsx', adminCode);

// Patch server.ts
let serverCode = fs.readFileSync('server.ts', 'utf8');
serverCode = serverCode.replace(
  'res.json({ shirtImage: "", medalImage: "" });',
  'res.json({ shirtImage: "", medalImage: "", routeMapImage: "" });'
);
serverCode = serverCode.replace(
  'const { shirtImage, medalImage } = req.body;',
  'const { shirtImage, medalImage, routeMapImage } = req.body;'
);
serverCode = serverCode.replace(
  'medalImage: medalImage || ""',
  'medalImage: medalImage || "",\n      routeMapImage: routeMapImage || ""'
);
fs.writeFileSync('server.ts', serverCode);

console.log("Admin and Server patched");
