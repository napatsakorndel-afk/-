const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const targetStr = `          <div className="relative rounded-xl overflow-hidden bg-zinc-900 border border-white/10 aspect-video flex items-center justify-center">
            {/* Visual Route Representation via SVG */}
            <svg className="w-full h-full" viewBox="0 0 400 220">
              <rect width="400" height="220" fill="#18181b" />
              {/* Grid lines */}
              <path d="M0,50 L400,50 M0,100 L400,100 M0,150 L400,150 M0,200 L400,200 M50,0 L50,220 M100,0 L100,220 M150,0 L150,220 M200,0 L200,220 M250,0 L250,220 M300,0 L300,220 M350,0 L350,220" stroke="#27272a" strokeWidth="0.5" />
              
              {/* TU Buildings & Parks (represented nicely) */}
              <rect x="30" y="30" width="100" height="40" rx="4" fill="#1e3a8a" stroke="#3b82f6" />
              <text x="80" y="54" fontSize="8" fill="#ffffff" fontWeight="bold" textAnchor="middle">อาคารเรียนรวม (SC3)</text>

              <rect x="230" y="140" width="150" height="50" rx="4" fill="#065f46" stroke="#10b981" />
              <text x="305" y="161" fontSize="8" fill="#ffffff" fontWeight="black" textAnchor="middle">จุดปล่อยตัว & เส้นชัย</text>
              <text x="305" y="174" fontSize="7" fill="#a7f3d0" fontWeight="bold" textAnchor="middle">อาคารสิริวิทยาลักษณ์ LSEd</text>

              {/* Park Lake */}
              <ellipse cx="200" cy="110" rx="40" ry="25" fill="#1e293b" stroke="#475569" strokeWidth="1" />
              <text x="200" y="113" fontSize="8" fill="#94a3b8" fontWeight="bold" textAnchor="middle">สวนป๋วยฯ / แกนกลาง</text>

              {/* Running Route path */}
              <path d="M 80,70 L 80,140 Q 80,185 180,185 L 250,185 L 250,110 L 170,110 L 170,70 Z" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 4" />
              
              {/* Release badges */}
              <circle cx="80" cy="70" r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="250" cy="185" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />

              <text x="80" y="24" fontSize="8" fill="#3b82f6" fontWeight="bold" textAnchor="middle">CHECKPOINT (SC3)</text>
              <text x="305" y="130" fontSize="8" fill="#10b981" fontWeight="black" textAnchor="middle">START / FINISH</text>
            </svg>
            <div className="absolute bottom-2 right-2 bg-black/80 text-[10px] text-white/50 px-2 py-0.5 rounded border border-white/5 font-mono">
              MAP: Siriwiyhalai Building Loop, TU RANGSIT
            </div>
          </div>
          <p className="text-xs text-white/40 leading-relaxed text-center font-light">
            * จุดปล่อยตัวและเข้าเส้นชัย ณ อาคารสิริวิทยาลักษณ์ คณะวิทยาการเรียนรู้และศึกษาศาสตร์ มธ. วิ่งเป็นเส้นทางลูปผ่านสวนป๋วยฯ และแกนกลางมหาวิทยาลัยธรรมศาสตร์
          </p>`;

const replacementStr = `          {routeMapImage ? (
            <div className="relative rounded-xl overflow-hidden bg-zinc-900 border border-white/10 flex items-center justify-center">
              <img src={routeMapImage} alt="Route Map 5KM" className="w-full h-auto object-contain max-h-[500px]" />
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-zinc-900 border border-white/10 aspect-video flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 400 220">
                <rect width="400" height="220" fill="#18181b" />
                <path d="M0,50 L400,50 M0,100 L400,100 M0,150 L400,150 M0,200 L400,200 M50,0 L50,220 M100,0 L100,220 M150,0 L150,220 M200,0 L200,220 M250,0 L250,220 M300,0 L300,220 M350,0 L350,220" stroke="#27272a" strokeWidth="0.5" />
                <rect x="30" y="30" width="100" height="40" rx="4" fill="#1e3a8a" stroke="#3b82f6" />
                <text x="80" y="54" fontSize="8" fill="#ffffff" fontWeight="bold" textAnchor="middle">อาคารเรียนรวม (SC3)</text>
                <rect x="230" y="140" width="150" height="50" rx="4" fill="#065f46" stroke="#10b981" />
                <text x="305" y="161" fontSize="8" fill="#ffffff" fontWeight="black" textAnchor="middle">จุดปล่อยตัว & เส้นชัย</text>
                <text x="305" y="174" fontSize="7" fill="#a7f3d0" fontWeight="bold" textAnchor="middle">อาคารสิริวิทยาลักษณ์ LSEd</text>
                <ellipse cx="200" cy="110" rx="40" ry="25" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                <text x="200" y="113" fontSize="8" fill="#94a3b8" fontWeight="bold" textAnchor="middle">สวนป๋วยฯ / แกนกลาง</text>
                <path d="M 80,70 L 80,140 Q 80,185 180,185 L 250,185 L 250,110 L 170,110 L 170,70 Z" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 4" />
                <circle cx="80" cy="70" r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="250" cy="185" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                <text x="80" y="24" fontSize="8" fill="#3b82f6" fontWeight="bold" textAnchor="middle">CHECKPOINT (SC3)</text>
                <text x="305" y="130" fontSize="8" fill="#10b981" fontWeight="black" textAnchor="middle">START / FINISH</text>
              </svg>
              <div className="absolute bottom-2 right-2 bg-black/80 text-[10px] text-white/50 px-2 py-0.5 rounded border border-white/5 font-mono">
                MAP: Siriwiyhalai Building Loop, TU RANGSIT
              </div>
            </div>
          )}

          {/* 11 Checkpoints Text Instructions */}
          <div className="bg-black/30 border border-white/5 rounded-2xl p-6 mt-6">
            <h4 className="text-white font-bold mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-500" />
              รายละเอียดจุดเช็คพอยต์ 11 จุด (5 KM)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              {[
                "จุดที่ 1: จุดปล่อยตัว (Start) ป้ายคณะวิทยาการเรียนรู้และศึกษาศาสตร์ (อาคารสิริวิทยาลักษณ์)",
                "จุดที่ 2: วิ่งไปตามเส้นทาง วงเวียนคณะวิทยาศาสตร์",
                "จุดที่ 3: ผ่านหน้าอาคารบรรยายรวม 3 (SC3)",
                "จุดที่ 4: เลี้ยวเข้าสู่ถนนแกนกลางมหาวิทยาลัย",
                "จุดที่ 5: ผ่านศูนย์กีฬาธรรมศาสตร์ (ยิมเนเซียม)",
                "จุดที่ 6: วิ่งเลียบทางเดินริมสระน้ำ (ทิศตะวันตก)",
                "จุดที่ 7: ผ่านหน้าอุทยานการเรียนรู้ป๋วย อึ๊งภากรณ์",
                "จุดที่ 8: วิ่งวนขวารอบสวนป๋วยฯ (Puey Park)",
                "จุดที่ 9: เลี้ยวกลับเข้าสู่ถนนเมนหลัก (Main Road)",
                "จุดที่ 10: วิ่งตรงมุ่งหน้ากลับมายังซอยอาคารสิริวิทยาลักษณ์",
                "จุดที่ 11: เข้าเส้นชัย (Finish) ที่ลานหน้าคณะวิทยาการเรียนรู้ฯ"
              ].map((text, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-sm text-white/70 font-light leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
          
          <p className="text-xs text-white/40 leading-relaxed text-center font-light pt-2">
            * จุดปล่อยตัวและเข้าเส้นชัย ณ อาคารสิริวิทยาลักษณ์ คณะวิทยาการเรียนรู้และศึกษาศาสตร์ มธ. วิ่งเป็นเส้นทางลูปผ่านสวนป๋วยฯ และแกนกลางมหาวิทยาลัยธรรมศาสตร์
          </p>`;

if (code.includes('Visual Route Representation via SVG')) {
  code = code.replace(targetStr, replacementStr);
  fs.writeFileSync('src/components/LandingPage.tsx', code);
  console.log("Successfully patched LandingPage.tsx with 11 checkpoints.");
} else {
  console.log("Error: targetStr not found.");
}
