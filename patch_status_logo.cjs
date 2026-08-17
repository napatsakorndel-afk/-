const fs = require('fs');
let code = fs.readFileSync('src/components/StatusChecker.tsx', 'utf8');

// 1. Add state for logoImage
code = code.replace(
  'const [downloadingTicket, setDownloadingTicket] = useState<boolean>(false);',
  'const [downloadingTicket, setDownloadingTicket] = useState<boolean>(false);\n  const [logoImage, setLogoImage] = useState<string>("");'
);

// 2. Fetch logoImage
code = code.replace(
  '// No initial fetch to protect API',
  `// No initial fetch to protect API
  useEffect(() => {
    fetch("/api/assets/settings")
      .then(res => res.json())
      .then(data => {
        if (data.logoImage) setLogoImage(data.logoImage);
      })
      .catch(err => console.error("Failed to load assets", err));
  }, []);`
);

// 3. Update Canvas for BIB/Ticket drawing to use logoImage if available
// This is slightly tricky, we need to load the image asynchronously before drawing it onto the canvas, or just draw the text if it fails.
// For simplicity and since Canvas drawing of external images can have CORS issues, we might just update the HTML representation of the Ticket first.

// In HTML representation:
const targetHtml = `<h4 className="text-xs font-black tracking-widest text-orange-500 uppercase italic">LSEd Running 2569</h4>
                  <p className="text-[8px] text-white/30 uppercase tracking-widest mt-0.5 font-mono">Learning Sciences & Education TU</p>`;
const replacementHtml = `{logoImage ? (
                    <img src={logoImage} alt="Event Logo" className="h-8 w-auto object-contain" />
                  ) : (
                    <>
                      <h4 className="text-xs font-black tracking-widest text-orange-500 uppercase italic">LSEd Running 2569</h4>
                      <p className="text-[8px] text-white/30 uppercase tracking-widest mt-0.5 font-mono">Learning Sciences & Education TU</p>
                    </>
                  )}`;
code = code.replace(targetHtml, replacementHtml);

const targetHtml2 = `<h4 className="text-xs font-black tracking-widest text-blue-400 uppercase italic">LSEd Running</h4>
                    <p className="text-[8px] text-white/50 uppercase font-black tracking-wider mt-0.5 font-mono">Learning Sciences & Education TU</p>`;
const replacementHtml2 = `{logoImage ? (
                      <img src={logoImage} alt="Event Logo" className="h-8 w-auto object-contain" />
                    ) : (
                      <>
                        <h4 className="text-xs font-black tracking-widest text-blue-400 uppercase italic">LSEd Running</h4>
                        <p className="text-[8px] text-white/50 uppercase font-black tracking-wider mt-0.5 font-mono">Learning Sciences & Education TU</p>
                      </>
                    )}`;
code = code.replace(targetHtml2, replacementHtml2);

fs.writeFileSync('src/components/StatusChecker.tsx', code);
console.log("StatusChecker HTML UI patched with logoImage");
