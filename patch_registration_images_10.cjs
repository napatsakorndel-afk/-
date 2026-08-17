const fs = require('fs');
let code = fs.readFileSync('src/components/RegistrationForm.tsx', 'utf8');

// I am missing a closing </div> for the wrapper div that starts with `<div className={\`bg-slate-50 ...`
// So I will find `</>)}</div>` which closes the image section and add another `</div>` before the `<div className="space-y-1 text-left...`

const errStr = `                  )}
                </div>
                
                <div className="space-y-1 text-left w-full max-w-sm mx-auto">`;
const fixStr = `                  )}
                </div>
                
                <div className="space-y-1 text-left w-full max-w-sm mx-auto">`;
                
// Let's check where the closing brace of `["REGULAR", "5K", "vip", "souvenir"].includes(formData.distance) && (` is.
// It should be after `</div>`

// Wait, the original code had:
// </div>
// <div className="space-y-1 ...">

// Let's replace:
// `</>)}</div><div className="space-y-1 text-left` -> `</>)}</div></div><div className="space-y-1 text-left` ? No, `space-y-1` is INSIDE the block!
// Wait, the block needs to be closed at the end of the `&& ( ... )` which is lower down.

// Ah, the problem is in `patch_registration_images_9.cjs` where I used a regex to replace `\${ \n <div` with `\${...}\`>\n<div`, but in doing so, I might have messed up the backticks or curly braces.
// Let's look at line 385:
// `<div className={\`bg-slate-50 dark:bg-white/5 border rounded-2xl p-5 mt-4 flex flex-col items-center justify-center gap-4 animate-fade-in text-center min-h-[160px] \${formData.distance === 'vip' ? 'border-yellow-500/20' : formData.distance === 'souvenir' ? 'border-orange-500/20' : 'border-blue-500/20'}\`}><div className="flex gap-4 items-center justify-center">`

// Let's see the error again: Expected "}" but found "className" at `426 | <div className="space-y-1 ...`
// This means a `{` was opened but not closed, or a tag was opened but not closed.

// Let's check line 385: `<div className={\`bg-slate-50 ... \${...}\`}>`
// The original was:
// <div className={\`bg-slate-50 ... \${
//   formData.distance === 'vip' ? ...
// }\`}>

// If we replaced it with `<div className={\`... \${...}\`}>\n<div ...>`, it looks correct.
// Wait, the regex replace in script 9 was:
// `<div className={\`bg-slate-50 dark:bg-white/5 border rounded-2xl p-5 mt-4 flex flex-col items-center justify-center gap-4 animate-fade-in text-center min-h-[160px] \${formData.distance === 'vip' ? 'border-yellow-500/20' : formData.distance === 'souvenir' ? 'border-orange-500/20' : 'border-blue-500/20'}\`>\n<div className="flex gap-4 items-center justify-center">`

// IT IS MISSING THE CLOSING CURLY BRACE FOR `className={...}`!!!
// Ah, `className={\`...\`}>` -> the regex replaced it with `className={\`...\`>\n` - MISSING THE `}` BEFORE `>`!

code = code.replace(
  "border-blue-500/20'}`>\n<div",
  "border-blue-500/20'}`}> \n<div"
);

fs.writeFileSync('src/components/RegistrationForm.tsx', code);
console.log("Patched missing }");

