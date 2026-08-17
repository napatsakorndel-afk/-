const fs = require('fs');
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add state for logoImage
appCode = appCode.replace(
  'const [adminMode, setAdminMode] = useState(false);',
  'const [adminMode, setAdminMode] = useState(false);\n  const [logoImage, setLogoImage] = useState<string>("");'
);

// 2. Fetch logoImage
appCode = appCode.replace(
  '// No initial stats to fetch unless we have a specific endpoint.',
  `// No initial stats to fetch unless we have a specific endpoint.
  useEffect(() => {
    fetch("/api/assets/settings")
      .then(res => res.json())
      .then(data => {
        if (data.logoImage) setLogoImage(data.logoImage);
      })
      .catch(err => console.error("Failed to load assets", err));
  }, []);`
);

// 3. Update the logo render logic
const targetLogoUI = `          <div 
            onClick={() => { setActiveTab("home"); setInitialSearchQuery(""); }}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="flex items-center gap-1.5 bg-[#E25B45]/10 px-3 py-1.5 rounded-xl border border-[#E25B45]/20">
              <span className="text-2xl font-black tracking-wide italic text-blue-600 transition duration-200 group-hover:scale-105">LSEd</span>
              <span className="text-sm font-black tracking-wider text-slate-950 uppercase">RUNNING 2569</span>
            </div>
            <div className="hidden sm:flex flex-col text-left border-l border-slate-200 pl-2.5">
              <span className="text-xs font-extrabold tracking-wider text-[#7F1D1D] uppercase flex items-center gap-1">
                Run to Shine <Sparkles className="w-3.5 h-3.5 text-[#E25B45] animate-pulse" />
              </span>
              <span className="text-[10px] font-bold text-slate-500">โครงการวิ่งฉายแสง</span>
            </div>
          </div>`;

const replacementLogoUI = `          <div 
            onClick={() => { setActiveTab("home"); setInitialSearchQuery(""); }}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            {logoImage ? (
              <img src={logoImage} alt="Event Logo" className="h-12 w-auto object-contain transition duration-200 group-hover:scale-105" />
            ) : (
              <>
                <div className="flex items-center gap-1.5 bg-[#E25B45]/10 px-3 py-1.5 rounded-xl border border-[#E25B45]/20">
                  <span className="text-2xl font-black tracking-wide italic text-blue-600 transition duration-200 group-hover:scale-105">LSEd</span>
                  <span className="text-sm font-black tracking-wider text-slate-950 uppercase">RUNNING 2569</span>
                </div>
                <div className="hidden sm:flex flex-col text-left border-l border-slate-200 pl-2.5">
                  <span className="text-xs font-extrabold tracking-wider text-[#7F1D1D] uppercase flex items-center gap-1">
                    Run to Shine <Sparkles className="w-3.5 h-3.5 text-[#E25B45] animate-pulse" />
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">โครงการวิ่งฉายแสง</span>
                </div>
              </>
            )}
          </div>`;

appCode = appCode.replace(targetLogoUI, replacementLogoUI);
fs.writeFileSync('src/App.tsx', appCode);

console.log("App.tsx patched with logoImage UI");
