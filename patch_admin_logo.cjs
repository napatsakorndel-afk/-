const fs = require('fs');

let adminCode = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

// 1. Add state
adminCode = adminCode.replace(
  'const [routeMapImage, setRouteMapImage] = useState<string>("");',
  'const [routeMapImage, setRouteMapImage] = useState<string>("");\n  const [logoImage, setLogoImage] = useState<string>("");'
);

// 2. Fetch state
adminCode = adminCode.replace(
  'setRouteMapImage(data.routeMapImage || "");',
  'setRouteMapImage(data.routeMapImage || "");\n        setLogoImage(data.logoImage || "");'
);

// 3. Handle upload
adminCode = adminCode.replace(
  'type: "shirt" | "medal" | "routemap"',
  'type: "shirt" | "medal" | "routemap" | "logo"'
);

adminCode = adminCode.replace(
  'if (type === "routemap") setRouteMapImage(dataUrl);',
  'if (type === "routemap") setRouteMapImage(dataUrl);\n                if (type === "logo") setLogoImage(dataUrl);'
);

// 4. Save state
adminCode = adminCode.replace(
  'JSON.stringify({ shirtImage, medalImage, routeMapImage })',
  'JSON.stringify({ shirtImage, medalImage, routeMapImage, logoImage })'
);

// 5. Add UI block
const routeMapBlock = `                {/* ROUTE MAP ASSET */}`;
const logoBlock = `
                {/* LOGO ASSET */}
                <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl space-y-6 relative overflow-hidden md:col-span-2">
                  <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest border-b border-white/5 pb-2">
                    โลโก้งานวิ่ง (Logo)
                  </h4>
                  <div className="relative group w-full">
                    <label className="cursor-pointer block">
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/jpg" 
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
                        <div className="space-y-2 flex flex-col items-center justify-center h-full text-white/30 p-8 border-2 border-dashed border-white/10 rounded-2xl">
                          <Image className="w-6 h-6 text-white/20 mb-1" />
                          <span className="text-[12px] font-black text-amber-400">คลิกเพื่อเลือกไฟล์รูปโลโก้</span>
                          <span className="text-[10px]">รองรับ JPG, PNG ไม่เกิน 2MB</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
`;

adminCode = adminCode.replace(routeMapBlock, logoBlock + routeMapBlock);
fs.writeFileSync('src/components/AdminPortal.tsx', adminCode);

console.log("AdminPortal patched with logoImage");
