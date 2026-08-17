const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const errStr = `            <div className="flex gap-4">
              <a href="#" className="hover:text-orange-400 text-blue-500 font-medium">ติดต่อคณะวิทยาการเรียนรู้ฯ</a>
              <span>•</span>
              <a href="#" className="hover:text-orange-400 text-blue-500 font-medium">สายด่วนช่วยเหลือทางการแพทย์</a>
              <span>•</span>
              <a href="#" className="hover:text-orange-400 text-blue-500 font-medium">แจ้งปัญหาด้านระบบลงทะเบียน</a>
            </div>`;
                                
const fixStr = `            <div className="flex gap-4">
              <a href="https://www.facebook.com/lsed.tu/" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 text-blue-500 font-medium">ติดต่อคณะวิทยาการเรียนรู้ฯ</a>
              <span>•</span>
              <a href="#" className="hover:text-orange-400 text-blue-500 font-medium">สายด่วนช่วยเหลือทางการแพทย์</a>
              <span>•</span>
              <a href="mailto:Napatsakorn.del@gmail.com" className="hover:text-orange-400 text-blue-500 font-medium">แจ้งปัญหาด้านระบบลงทะเบียน</a>
            </div>`;

if (code.includes(errStr)) {
  code = code.replace(errStr, fixStr);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched footer links");
} else {
  console.log("Could not find footer text match.");
}
