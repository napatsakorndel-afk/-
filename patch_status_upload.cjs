const fs = require('fs');
let code = fs.readFileSync('src/components/StatusChecker.tsx', 'utf8');

const regex = /const reader = new FileReader\(\);\s*reader\.readAsDataURL\(file\);\s*reader\.onload = async \(\) => \{[\s\S]*?const base64Data = reader\.result as string;/;

const newCode = `const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async (event) => {
        // Compress image using Canvas
        const img = new window.Image();
        img.src = event.target?.result as string;
        
        await new Promise((resolve) => (img.onload = resolve));
        
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with 0.6 quality (ensures it is well under 1MB)
        const base64Data = canvas.toDataURL("image/jpeg", 0.6);`;

if (regex.test(code)) {
    code = code.replace(regex, newCode);
    fs.writeFileSync('src/components/StatusChecker.tsx', code);
    console.log("Success status upload");
} else {
    console.log("Status regex failed");
}
