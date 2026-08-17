const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const injection = `
  const displayStats = [
    { label: "ผู้สมัครทั้งหมด", value: stats?.totalRegistered || 0, icon: Users },
    { label: "ผ่านการตรวจสอบ", value: stats?.totalApproved || 0, icon: Shield },
    { label: "ยอดเงินบริจาค (บาท)", value: (stats?.totalIncome || 0).toLocaleString(), icon: Coins },
    { label: "รอการตรวจสอบ", value: stats?.totalPendingVerification || 0, icon: Activity }
  ];

  return (`;

code = code.replace('  return (', injection);

fs.writeFileSync('src/components/LandingPage.tsx', code);
console.log('Fixed');
