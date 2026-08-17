const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const targetStr = `        <div className="bg-neutral-950/60 border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-500" /> เส้นทางวิ่งและจุดปล่อยตัว/เข้าเส้นชัย
          </h3>
          <div className="relative rounded-xl overflow-hidden bg-zinc-900 border border-white/10 aspect-video flex items-center justify-center">
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
          </p>
        </div>`;

const replacementStr = `        <div className="bg-neutral-950/60 border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-500" /> เคาะเส้นทางวิ่ง 5 KM
          </h3>
          
          <div className="relative rounded-xl overflow-hidden bg-zinc-900 border border-white/10 flex items-center justify-center">
            {/* Displaying Image 2 (Route Map) uploaded by user */}
            <img 
              src="/route-map.png" 
              alt="แผนที่เส้นทางวิ่ง 5 KM" 
              className="w-full h-auto object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.classList.add('aspect-video');
                const placeholder = document.createElement('div');
                placeholder.className = 'flex flex-col items-center justify-center w-full h-full text-white/40 space-y-2 p-8';
                placeholder.innerHTML = '<span class="text-xs">กรุณาอัปโหลดภาพแผนที่</span><span class="text-[10px]">ตั้งชื่อไฟล์ว่า <b>route-map.png</b> ไว้ในโฟลเดอร์ public</span>';
                e.currentTarget.parentElement?.appendChild(placeholder);
              }}
            />
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-black text-white/80 uppercase tracking-widest border-b border-white/10 pb-2">รายละเอียดเส้นทาง (11 จุดเช็คพอยต์)</h4>
            <ol className="list-decimal list-inside space-y-2 text-xs text-white/70 leading-relaxed font-light">
              <li>เริ่มออกตัวที่ป้ายคณะฝั่งทางออกคาเฟ่</li>
              <li>วิ่งขึ้นตรงไปทางสวนป๋วย 100 ปี</li>
              <li>เลี้ยวซ้ายตรงแยกหัวมุมไปทางหอพักแพทย์</li>
              <li>ตรงไปเรื่อยๆ เลี้ยวซ้ายเข้าถนน โดมร่วมใจ (รูปปั้นดอกไม้)</li>
              <li>ตรงไปเรื่อย จนถึง Solar Park เลี้ยวเข้าไปวนสระน้ำหน้าโดมบริหาร</li>
              <li>หลังจากออกมาตรงไปทางเดิมและออกทางออกที่ 1 ตรงวงเวียน เข้าถนนตลาดวิชา</li>
              <li>ขับตามเส้นทางมาเรื่อยๆ ผ่านเชียง 1</li>
              <li>เลี้ยวเข้าสระน้ำคณะวิศวะ ข้ามสะพานและออกมาตรงทางเดิม</li>
              <li>ตรงมาเรื่อย ๆ ผ่านคณะสถาปัตย์แล้วเลี้ยวซ้ายเข้าถนนพิทักษ์ธรรม</li>
              <li>ตรงมาเรื่อยๆ ผ่านรูปปั้นป๋วย เลี้ยวซ้ายเข้าทางเดิมที่ออกตัว</li>
              <li>จุด finish อยู่ที่เดียวกันกับจุด Start</li>
            </ol>
          </div>
        </div>`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/components/LandingPage.tsx', code);
console.log("Replaced route map perfectly!");
