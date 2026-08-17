const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const regex = /(<div className="relative rounded-xl overflow-hidden bg-zinc-900 border border-white\/10 aspect-video flex items-center justify-center">[\s\S]*?<\/svg>\s*<div className="absolute bottom-2 right-2 bg-black\/80 text-\[10px\] text-white\/50 px-2 py-0\.5 rounded border border-white\/5 font-mono">\s*MAP: Siriwiyhalai Building Loop, TU RANGSIT\s*<\/div>\s*<\/div>)/;

const checkpointsHTML = `
          {routeMapImage ? (
            <div className="relative rounded-xl overflow-hidden bg-zinc-900 border border-white/10 flex items-center justify-center">
              <img src={routeMapImage} alt="Route Map 5KM" className="w-full h-auto object-contain max-h-[500px]" />
            </div>
          ) : (
            $1
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
`;

if (regex.test(code)) {
  code = code.replace(regex, checkpointsHTML);
  
  // also replace MapPin if it's not imported
  if (!code.includes('MapPin')) {
    code = code.replace('import { ', 'import { MapPin, ');
  }
  
  fs.writeFileSync('src/components/LandingPage.tsx', code);
  console.log("Successfully inserted checkpoints block.");
} else {
  console.log("Error: regex not found in LandingPage.tsx");
}
