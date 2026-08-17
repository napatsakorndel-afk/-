const fs = require('fs');
let code = fs.readFileSync('src/components/StatusChecker.tsx', 'utf8');

if (!code.includes('import { QRCodeCanvas } from "qrcode.react";')) {
  code = code.replace(
    'import React, { useState, useEffect } from "react";',
    'import React, { useState, useEffect } from "react";\nimport { QRCodeCanvas } from "qrcode.react";'
  );
}

const qrDisplay = `                  {/* QR CODE DISPLAY */}
                  <div className="flex flex-col items-center justify-center pt-2 pb-4 border-b border-slate-100">
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
                      <QRCodeCanvas 
                        value={selectedReg.id} 
                        size={140} 
                        level={"H"}
                        includeMargin={false}
                        className="rounded-lg"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-3 font-semibold">แสกน QR Code นี้ ณ จุดเช็คอินในวันงาน</p>
                  </div>
`;

code = code.replace(
  '{/* BIB NUMBER DISPLAY */}',
  qrDisplay + '\n                  {/* BIB NUMBER DISPLAY */}'
);

fs.writeFileSync('src/components/StatusChecker.tsx', code);
console.log("Success patch status qr");
