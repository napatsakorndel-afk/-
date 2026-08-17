const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const oldHeader = `เหรียญที่ระลึกผู้พิชิต <br /><span className="text-orange-400">ลดหย่อนภาษีได้ตามกฎหมาย</span>`;
const newHeader = `เหรียญที่ระลึกผู้พิชิต`;

code = code.replace(oldHeader, newHeader);

const oldTaxDeductBox = `<div className="p-5 rounded-2xl bg-orange-500/5 border border-orange-500/10 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-orange-400 flex items-center gap-2">
              <FileText className="w-4 h-4" /> สิทธิ์ลดหย่อนภาษี (Tax Deduction Eligible)
            </h4>
            <p className="text-xs text-slate-600 dark:text-white/70 leading-relaxed">
              สำหรับผู้บริจาคหรือสั่งซื้อของที่ระลึกสำหรับงานนี้ รายได้ทั้งหมดหลังหักค่าใช้จ่ายจะนำไปสนับสนุนเข้ากองทุนพัฒนาวิชาการและทุนการศึกษา คณะวิทยาการเรียนรู้และศึกษาศาสตร์ มหาวิทยาลัยธรรมศาสตร์ โดยท่านสามารถระบุ <strong className="text-orange-300">"ขอใช้สิทธิ์ลดหย่อนภาษี"</strong> ในระบบได้ทันที ทางสถาบันจะนำส่งข้อมูลผ่านระบบ e-Donation สรรพากรเพื่ออำนวยความสะดวกให้แก่ท่านอย่างรวดเร็ว
            </p>
          </div>`;

code = code.replace(oldTaxDeductBox, "");

fs.writeFileSync('src/components/LandingPage.tsx', code);
console.log("Successfully removed tax deduct from medal section.");
