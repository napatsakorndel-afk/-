const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const apiToInsert = `
// Get assets settings
app.get("/api/assets/settings", async (req, res) => {
  try {
    const docRef = doc(db, "settings", "assets");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      res.json(docSnap.data());
    } else {
      res.json({ shirtImage: "", medalImage: "" });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch assets settings" });
  }
});

// Update assets settings
app.post("/api/assets/settings", async (req, res) => {
  const { shirtImage, medalImage } = req.body;
  try {
    await setDoc(doc(db, "settings", "assets"), {
      shirtImage: shirtImage || "",
      medalImage: medalImage || ""
    });
    res.json({ success: true, message: "บันทึกรูปภาพของที่ระลึกสำเร็จ" });
  } catch (err: any) {
    console.error("Error saving assets:", err);
    res.status(500).json({ error: "ไม่สามารถบันทึกข้อมูลรูปภาพของที่ระลึกได้" });
  }
});
`;

code = code.replace('// Get payment settings', apiToInsert + '\n// Get payment settings');

fs.writeFileSync('server.ts', code);
console.log("Success");
