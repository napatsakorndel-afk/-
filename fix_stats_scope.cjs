const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// The incorrect injection block
const badInjection = `  const displayStats = [
    { label: "ผู้สมัครทั้งหมด", value: stats?.totalRegistered || 0, icon: Users },
    { label: "ผ่านการตรวจสอบ", value: stats?.totalApproved || 0, icon: Shield },
    { label: "ยอดเงินบริจาค (บาท)", value: (stats?.totalIncome || 0).toLocaleString(), icon: Coins },
    { label: "รอการตรวจสอบ", value: stats?.totalPendingVerification || 0, icon: Activity }
  ];

  return (`;

// Put it back to return ()
code = code.replace(badInjection, 'return (');

// Now, properly find the return that is followed by <div className="min-h-screen
const injection = `
  const displayStats = [
    { label: "ผู้สมัครทั้งหมด", value: stats?.totalRegistered || 0, icon: Users },
    { label: "ผ่านการตรวจสอบ", value: stats?.totalApproved || 0, icon: Shield },
    { label: "ยอดเงินบริจาค (บาท)", value: (stats?.totalIncome || 0).toLocaleString(), icon: Coins },
    { label: "รอการตรวจสอบ", value: stats?.totalPendingVerification || 0, icon: Activity }
  ];

  return (`;

code = code.replace('  return (\n    <div className="min-h-screen bg-[#00CFCF]', injection + '\n    <div className="min-h-screen bg-[#00CFCF]');

fs.writeFileSync('src/components/LandingPage.tsx', code);
console.log('Fixed scope of displayStats');
