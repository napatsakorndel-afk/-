const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

const assetStateToInsert = `
  // Asset Settings State
  const [shirtImage, setShirtImage] = useState<string>("");
  const [medalImage, setMedalImage] = useState<string>("");
  const [savingAssets, setSavingAssets] = useState<boolean>(false);
  const [assetsSuccess, setAssetsSuccess] = useState<boolean>(false);
  const [assetsError, setAssetsError] = useState<string | null>(null);
`;

code = code.replace('  const [taxQrImage, setTaxQrImage] = useState<string>("");', '  const [taxQrImage, setTaxQrImage] = useState<string>("");\n' + assetStateToInsert);

const fetchAssetsToInsert = `
  // Fetch Assets Settings
  const fetchAssetsSettings = async () => {
    try {
      const response = await fetch("/api/assets/settings");
      if (response.ok) {
        const data = await response.json();
        setShirtImage(data.shirtImage || "");
        setMedalImage(data.medalImage || "");
      }
    } catch (error) {
      console.error("Failed to fetch assets settings:", error);
    }
  };

  const handleAssetUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "shirt" | "medal") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("ขนาดรูปภาพต้องไม่เกิน 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        if (type === "shirt") {
          setShirtImage(reader.result);
        } else {
          setMedalImage(reader.result);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAssetsSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAssets(true);
    setAssetsSuccess(false);
    setAssetsError(null);
    try {
      const response = await fetch("/api/assets/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shirtImage, medalImage }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save settings");
      setAssetsSuccess(true);
      setTimeout(() => setAssetsSuccess(false), 3000);
    } catch (err: any) {
      setAssetsError(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setSavingAssets(false);
    }
  };
`;

code = code.replace('  // Fetch Payment Settings', fetchAssetsToInsert + '\n  // Fetch Payment Settings');
fs.writeFileSync('src/components/AdminPortal.tsx', code);
console.log("Success admin state");
