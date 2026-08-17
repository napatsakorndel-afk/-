const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

// The messed up part is from:
//             <button
//               type="submit"
//               className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition cursor-pointer shadow-lg shadow-blue-500/20"
//               id="admin-login-submit"
//             >
//               เข้าสู่ระบบหลังบ้าน
//             </button>
//                     </div>
//         {subTab === "runners" ? (

const searchStr = `
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition cursor-pointer shadow-lg shadow-blue-500/20"
              id="admin-login-submit"
            >
              เข้าสู่ระบบหลังบ้าน
            </button>
                    </div>
        {subTab === "runners" ? (
`;

// Replace it with proper closure and opening of dashboard
const replacementStr = `
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition cursor-pointer shadow-lg shadow-blue-500/20"
              id="admin-login-submit"
            >
              เข้าสู่ระบบหลังบ้าน
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 p-4 md:p-8 font-sans flex flex-col">
      <div className="max-w-[1400px] w-full mx-auto bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col flex-1 h-full min-h-[calc(100vh-4rem)]">
        
        {/* HEADER */}
        <div className="bg-slate-900 dark:bg-black px-6 md:px-10 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">Admin Console</h1>
              <p className="text-[10px] md:text-xs text-blue-200 font-medium uppercase tracking-widest mt-1 opacity-80">LSEd Running 2569 Management</p>
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <button
              onClick={() => setIsAuthenticated(false)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>

        {/* TOP TAB NAVIGATION */}
        <div className="flex flex-col md:flex-row border-b border-slate-200 dark:border-white/5 bg-slate-950 dark:bg-neutral-900 overflow-x-auto shrink-0 hide-scrollbar">
          <button
            type="button"
            onClick={() => setSubTab("runners")}
            className={\`flex-1 md:flex-initial px-6 py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition \${
              subTab === "runners"
                ? "border-blue-500 text-blue-400 bg-white/[0.02]"
                : "border-transparent text-slate-400 dark:text-white/50 hover:text-white/80 hover:bg-white/[0.01]"
            }\`}
          >
            <Users className="w-4 h-4" /> จัดการนักวิ่ง
          </button>
          <button
            type="button"
            onClick={() => setSubTab("shipping")}
            className={\`flex-1 md:flex-initial px-6 py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition \${
              subTab === "shipping"
                ? "border-purple-500 text-purple-400 bg-white/[0.02]"
                : "border-transparent text-slate-400 dark:text-white/50 hover:text-white/80 hover:bg-white/[0.01]"
            }\`}
          >
            <Package className="w-4 h-4" /> แพ็คของ/จัดส่ง
          </button>
          <button
            type="button"
            onClick={() => setSubTab("payment")}
            className={\`flex-1 md:flex-initial px-6 py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition \${
              subTab === "payment"
                ? "border-emerald-500 text-emerald-400 bg-white/[0.02]"
                : "border-transparent text-slate-400 dark:text-white/50 hover:text-white/80 hover:bg-white/[0.01]"
            }\`}
          >
            <CreditCard className="w-4 h-4" /> บัญชีรับเงิน
          </button>
          <button
            type="button"
            onClick={() => setSubTab("assets")}
            className={\`flex-1 md:flex-initial px-6 py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition \${
              subTab === "assets"
                ? "border-amber-500 text-amber-400 bg-white/[0.02]"
                : "border-transparent text-slate-400 dark:text-white/50 hover:text-white/80 hover:bg-white/[0.01]"
            }\`}
          >
            <Image className="w-4 h-4" /> ภาพประกอบ
          </button>
        </div>

        {/* MAIN CONTENT AREA */}
        <section className="flex-1 bg-white dark:bg-black relative overflow-hidden flex flex-col h-full">
        {subTab === "runners" ? (
`;

// Remove whitespaces to make search easier
const codeNormalized = code.replace(/\s+/g, ' ');
const searchNormalized = searchStr.replace(/\s+/g, ' ');

if (codeNormalized.includes(searchNormalized)) {
  console.log("Found the broken layout!");
  
  // Do a manual exact string replacement
  const startIndex = code.indexOf('id="admin-login-submit"');
  if (startIndex !== -1) {
    const sectionStart = code.lastIndexOf('<button', startIndex);
    const textAfter = code.substring(startIndex);
    const sectionEnd = startIndex + textAfter.indexOf('{subTab === "runners" ? (');
    
    if (sectionStart !== -1 && sectionEnd !== -1) {
      const actualCodeToReplace = code.substring(sectionStart, sectionEnd + '{subTab === "runners" ? ('.length);
      code = code.replace(actualCodeToReplace, replacementStr.trim());
      fs.writeFileSync('src/components/AdminPortal.tsx', code);
      console.log("Patched successfully!");
    } else {
      console.log("Could not find exact bounds");
    }
  }
} else {
  console.log("String not found");
}

