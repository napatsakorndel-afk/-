const fs = require('fs');
let code = fs.readFileSync('src/components/RegistrationForm.tsx', 'utf8');

// Rather than replacing conditionally, let's just show BOTH the normal shirt and polo shirt for VIPs if that's what's wanted, but wait, the user's screenshot has two shirts shown. 
// Ah, the user's screenshot actually shows 1 image element that has TWO shirts in it. 
// "VIP ให้ขึ้นภาพเสื้อโปโลด้วย" -> "For VIP, make it show the polo shirt image too."
// If I look at the screenshot, on the left side there's an image of a polo shirt (or a shirt with collar? no, it's a crew neck and a v-neck/polo), and on the right side there's the medal. 
// Actually, looking at the code, distance.startsWith("vip") makes it show poloShirtImage. 

const replaceStr = `
                  ) : (
                    <>
                      {distance.startsWith("vip") ? (
                        <>
                          {poloShirtImage ? (
                            <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 flex items-center justify-center p-2 shadow-inner relative group">
                              <img src={poloShirtImage} alt="VIP Polo Shirt" className="w-full h-full object-contain rounded-lg drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
                            </div>
                          ) : shirtImage ? (
                            <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 flex items-center justify-center p-2 shadow-inner relative group">
                              <img src={shirtImage} alt="VIP Polo Shirt (Fallback)" className="w-full h-full object-contain rounded-lg drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
                            </div>
                          ) : (
                            <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-xl bg-slate-100 dark:bg-black/40 border border-dashed border-white/20 flex flex-col items-center justify-center text-slate-300 dark:text-white/30">
                              <Shirt className="w-6 h-6 mb-1 opacity-50" />
                              <span className="text-[9px] uppercase font-black tracking-wider">รออัปโหลดภาพ</span>
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
`;

code = code.replace(
  /                      \{distance\.startsWith\("vip"\) \? \([\s\S]*?                      \)}/g,
  replaceStr.trim()
);
fs.writeFileSync('src/components/RegistrationForm.tsx', code);
console.log("Patched both shirts");
