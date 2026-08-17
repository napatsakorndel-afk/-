const fs = require('fs');
let code = fs.readFileSync('src/components/RegistrationForm.tsx', 'utf8');

const targetStr = `
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
`;

// It seems in the previous patch I might have accidentally overwritten the medal logic inside distance.startsWith("vip") section, because I replaced:
//                      {distance.startsWith("vip") ? ([\s\S]*?                      )}
// This might have removed the medal image for VIP!

// Let's check what it looks like now around line 430
console.log(code.slice(code.indexOf('                      ) : ('), code.indexOf('                      ) : (') + 2000));
