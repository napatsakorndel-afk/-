const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const stateToInsert = `
  const [shirtImage, setShirtImage] = useState<string>("");
  const [medalImage, setMedalImage] = useState<string>("");

  useEffect(() => {
    fetch("/api/assets/settings")
      .then(res => res.json())
      .then(data => {
        if (data.shirtImage) setShirtImage(data.shirtImage);
        if (data.medalImage) setMedalImage(data.medalImage);
      })
      .catch(err => console.error("Failed to load assets", err));
  }, []);
`;

code = code.replace(
  '  const [shirtView, setShirtView] = useState<"front" | "back">("front");',
  '  const [shirtView, setShirtView] = useState<"front" | "back">("front");\n' + stateToInsert
);

// Shirt replacement
const shirtPlaceholderRegex = /<div className="relative bg-black\/40 border border-white\/5 border-dashed rounded-2xl p-6 md:p-10 w-full max-w-sm flex flex-col items-center justify-center aspect-square shadow-inner">\s*<Shirt className="w-12 h-12 mb-3 opacity-30 text-white" \/>\s*<span className="text-xs text-white\/40 font-black uppercase tracking-wider text-center">รออัปโหลดภาพเสื้อที่ระลึก<\/span>\s*<\/div>/;

const shirtReplacement = `{shirtImage ? (
            <div className="relative bg-black/40 border border-white/5 rounded-2xl w-full max-w-sm flex flex-col items-center justify-center aspect-square shadow-inner p-2">
              <img src={shirtImage} alt="Shirt Image" className="w-full h-full object-contain rounded-xl" />
            </div>
          ) : (
            <div className="relative bg-black/40 border border-white/5 border-dashed rounded-2xl p-6 md:p-10 w-full max-w-sm flex flex-col items-center justify-center aspect-square shadow-inner">
              <Shirt className="w-12 h-12 mb-3 opacity-30 text-white" />
              <span className="text-xs text-white/40 font-black uppercase tracking-wider text-center">รออัปโหลดภาพเสื้อที่ระลึก</span>
            </div>
          )}`;

code = code.replace(shirtPlaceholderRegex, shirtReplacement);

// Medal replacement
const medalPlaceholderRegex = /<div className="relative bg-black\/40 border border-white\/5 border-dashed rounded-2xl p-6 md:p-10 w-full max-w-sm flex flex-col items-center justify-center aspect-square shadow-inner group overflow-hidden">\s*<Award className="w-12 h-12 mb-3 opacity-30 text-white" \/>\s*<span className="text-xs text-white\/40 font-black uppercase tracking-wider text-center">รออัปโหลดภาพเหรียญที่ระลึก<\/span>\s*<\/div>/;

const medalReplacement = `{medalImage ? (
            <div className="relative bg-black/40 border border-white/5 rounded-2xl w-full max-w-sm flex flex-col items-center justify-center aspect-square shadow-inner p-2 group overflow-hidden">
              <img src={medalImage} alt="Medal Image" className="w-full h-full object-contain rounded-xl drop-shadow-[0_12px_24px_rgba(245,158,11,0.35)] group-hover:scale-105 transition-transform duration-300" />
            </div>
          ) : (
            <div className="relative bg-black/40 border border-white/5 border-dashed rounded-2xl p-6 md:p-10 w-full max-w-sm flex flex-col items-center justify-center aspect-square shadow-inner group overflow-hidden">
              <Award className="w-12 h-12 mb-3 opacity-30 text-white" />
              <span className="text-xs text-white/40 font-black uppercase tracking-wider text-center">รออัปโหลดภาพเหรียญที่ระลึก</span>
            </div>
          )}`;

code = code.replace(medalPlaceholderRegex, medalReplacement);

fs.writeFileSync('src/components/LandingPage.tsx', code);
console.log("Success landing assets");
