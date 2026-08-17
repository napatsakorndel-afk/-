const fs = require('fs');
let code = fs.readFileSync('src/components/StatusChecker.tsx', 'utf8');

const targetStr = `              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input 
                  type="text" 
                  value={shippingSearchQuery}
                  onChange={(e) => setShippingSearchQuery(e.target.value)}
                  placeholder="ค้นหารายชื่อจัดส่ง, เลข BIB..."
                  className="w-full pl-11 pr-4 py-3.5 bg-black/40 border border-white/10 text-white rounded-xl text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                />
              </div>
            </div>
          </section>`;

const replacementStr = `              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input 
                  type="text" 
                  value={shippingSearchQuery}
                  onChange={(e) => setShippingSearchQuery(e.target.value)}
                  placeholder="ค้นหารายชื่อจัดส่ง, เลข BIB..."
                  className="w-full pl-11 pr-4 py-3.5 bg-black/40 border border-white/10 text-white rounded-xl text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                />
              </div>
              <div className="pt-2">
                <a 
                  href="https://track.thailandpost.co.th/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 font-bold text-xs uppercase tracking-wider rounded-xl border border-red-500/20 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> ระบบติดตามพัสดุไปรษณีย์ไทย (Track & Trace)
                </a>
              </div>
            </div>
          </section>`;

code = code.replace(targetStr, replacementStr);

// Check if ExternalLink is imported
if (!code.includes("ExternalLink")) {
  code = code.replace('Truck, ', 'Truck, ExternalLink, ');
}

fs.writeFileSync('src/components/StatusChecker.tsx', code);
console.log("Patched shipping link successfully");
