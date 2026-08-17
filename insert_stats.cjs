const fs = require('fs');
let lines = fs.readFileSync('src/components/LandingPage.tsx', 'utf8').split('\n');

const statsInjection = `
  const displayStats = [
    { label: "ผู้สมัครทั้งหมด", value: stats?.totalRegistered || 0, icon: Users },
    { label: "ผ่านการตรวจสอบ", value: stats?.totalApproved || 0, icon: Shield },
    { label: "ยอดเงินบริจาค (บาท)", value: (stats?.totalIncome || 0).toLocaleString(), icon: Coins },
    { label: "รอการตรวจสอบ", value: stats?.totalPendingVerification || 0, icon: Activity }
  ];
`;

let injectionIndex = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('return (') && lines[i].includes('    return (')) {
        injectionIndex = i;
        break;
    }
}

if (injectionIndex !== -1) {
    lines.splice(injectionIndex, 0, statsInjection);
    fs.writeFileSync('src/components/LandingPage.tsx', lines.join('\n'));
    console.log('Injected successfully');
} else {
    console.log('Failed to find injection point');
}
