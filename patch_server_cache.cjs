const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const paymentSettingsRegex = /const getPaymentSettings = async \(\) => \{[\s\S]*?return defaults;\n\};/;

const paymentSettingsReplacement = `let cachedPayment: any = null;
let paymentCacheTime = 0;
const getPaymentSettings = async () => {
  if (cachedPayment && Date.now() - paymentCacheTime < 60000) {
    return cachedPayment;
  }
  const defaults = {
    regular: {
      bankName: "ทหารไทยธนชาต (ttb)",
      accountNo: process.env.PROMPTPAY_ID || "0830131768",
      accountName: process.env.PROMPTPAY_NAME || "นาย นภัสกร กลิ่นเฟื่อง",
      qrImage: ""
    },
    taxDeduct: {
      bankName: "ธนาคารกรุงไทย (มธ.)",
      accountNo: "022-0-12345-6",
      accountName: "มธ.คณะวิทยาการเรียนรู้และศึกษาศาสตร์ (เงินบริจาค e-Donation)",
      qrImage: ""
    }
  };
  try {
    const docRef = doc(db, "settings", "payment");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      cachedPayment = {
        regular: {
          bankName: data.regular?.bankName || defaults.regular.bankName,
          accountNo: data.regular?.accountNo || defaults.regular.accountNo,
          accountName: data.regular?.accountName || defaults.regular.accountName,
          qrImage: data.regular?.qrImage || defaults.regular.qrImage
        },
        taxDeduct: {
          bankName: data.taxDeduct?.bankName || defaults.taxDeduct.bankName,
          accountNo: data.taxDeduct?.accountNo || defaults.taxDeduct.accountNo,
          accountName: data.taxDeduct?.accountName || defaults.taxDeduct.accountName,
          qrImage: data.taxDeduct?.qrImage || defaults.taxDeduct.qrImage
        }
      };
      paymentCacheTime = Date.now();
      return cachedPayment;
    }
  } catch (err) {
    console.error("Error reading payment settings from Firestore:", err);
  }
  return defaults;
};`;

code = code.replace(paymentSettingsRegex, paymentSettingsReplacement);

// Hook into post /api/payment/settings to invalidate cache
code = code.replace(
  'app.post("/api/payment/settings", async (req, res) => {',
  'app.post("/api/payment/settings", async (req, res) => {\n  paymentCacheTime = 0;'
);

const assetsGetRegex = /app\.get\("\/api\/assets\/settings", async \(req, res\) => \{[\s\S]*?\}\);/;

const assetsGetReplacement = `let cachedAssets: any = null;
let assetsCacheTime = 0;
app.get("/api/assets/settings", async (req, res) => {
  try {
    if (cachedAssets && Date.now() - assetsCacheTime < 60000) {
      return res.json(cachedAssets);
    }
    const docRef = doc(db, "settings", "assets");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      cachedAssets = docSnap.data();
      assetsCacheTime = Date.now();
      res.json(cachedAssets);
    } else {
      res.json({ shirtImage: "", medalImage: "" });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch assets settings" });
  }
});`;

code = code.replace(assetsGetRegex, assetsGetReplacement);

// Hook into post /api/assets/settings to invalidate cache
code = code.replace(
  'app.post("/api/assets/settings", async (req, res) => {',
  'app.post("/api/assets/settings", async (req, res) => {\n  assetsCacheTime = 0;'
);

fs.writeFileSync('server.ts', code);
console.log("Success caching");
