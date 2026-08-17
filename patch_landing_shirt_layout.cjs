const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// 1. Change section class
const oldSection = '<section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center bg-gradient-to-br from-indigo-50 via-white to-indigo-50 dark:from-neutral-950 dark:via-zinc-900 dark:to-indigo-950 border border-slate-200 dark:border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl" id="shirts">';
const newSection = '<section className="flex flex-col gap-12 bg-gradient-to-br from-indigo-50 via-white to-indigo-50 dark:from-neutral-950 dark:via-zinc-900 dark:to-indigo-950 border border-slate-200 dark:border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl" id="shirts">';
code = code.replace(oldSection, newSection);

// 2. Change first lg:col-span-6 to full width
const oldFirstCol = '<div className="lg:col-span-6 space-y-6">';
const newFirstCol = '<div className="w-full space-y-6">';
code = code.replace(oldFirstCol, newFirstCol);

// 3. Change second lg:col-span-6 to full width, increase max-w-xs to max-w-lg
const oldSecondCol = '<div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start justify-center p-4">';
const newSecondCol = '<div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-start justify-center p-4">';
code = code.replace(oldSecondCol, newSecondCol);

// 4. Increase font size for shirt types and max-w-xs to max-w-md or lg
code = code.split('font-bold text-slate-700 dark:text-white/80').join('text-xl font-black text-slate-700 dark:text-white/80');
code = code.split('max-w-xs').join('max-w-[500px]');

fs.writeFileSync('src/components/LandingPage.tsx', code);
console.log("Patched shirt layout");
