const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const injection = `
  const displayStats = [
    { label: "ผู้สมัครทั้งหมด", value: stats?.totalRegistered || 0, icon: Users },
    { label: "ผ่านการตรวจสอบ", value: stats?.totalApproved || 0, icon: Shield },
    { label: "ยอดเงินบริจาค (บาท)", value: (stats?.totalIncome || 0).toLocaleString(), icon: Coins },
    { label: "รอการตรวจสอบ", value: stats?.totalPendingVerification || 0, icon: Activity }
  ];

  return (
    <div className="min-h-screen bg-[#00CFCF]`;

// Find where the main return starts
const targetStr = `  return (
    <div className="min-h-screen bg-[#00CFCF]`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, injection);
    fs.writeFileSync('src/components/LandingPage.tsx', code);
    console.log('Fixed exactly!');
} else {
    // try to find alternative
    console.log('Could not find target, attempting alternative');
    const altTarget = `  return (
    <div`;
    if (code.includes(altTarget)) {
        code = code.replace(altTarget, injection.replace(' bg-[#00CFCF]', ''));
        fs.writeFileSync('src/components/LandingPage.tsx', code);
        console.log('Fixed alternative!');
    }
}
