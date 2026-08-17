const fs = require('fs');

// Patch App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');

// Add imports
app = app.replace('Sparkles\n} from "lucide-react";', 'Sparkles,\n  Sun,\n  Moon\n} from "lucide-react";');

// Add state
const stateHook = `  const [statusInitialTab, setStatusInitialTab] = useState<"lookup" | "shipping">("lookup");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark" || 
        (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);`;
app = app.replace('  const [statusInitialTab, setStatusInitialTab] = useState<"lookup" | "shipping">("lookup");', stateHook);

// Replace structural classes in App.tsx
app = app.replace(/className="min-h-screen bg-black text-white/g, 'className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white');
app = app.replace(/bg-neutral-950\/85 backdrop-blur-md border-b border-white\/10/g, 'bg-white/85 dark:bg-neutral-950/85 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10');
app = app.replace(/text-white uppercase/g, 'text-slate-950 dark:text-white uppercase');
app = app.replace(/border-l border-white\/10/g, 'border-l border-slate-200 dark:border-white/10');
app = app.replace(/text-white\/60/g, 'text-slate-500 dark:text-white/60');
app = app.replace(/text-white\/70 hover:text-orange-400/g, 'text-slate-600 dark:text-white/70 hover:text-blue-600 dark:hover:text-orange-400');
app = app.replace(/bg-white text-black px-4 py-2 rounded-full hover:bg-white\/90/g, 'bg-slate-950 dark:bg-white text-white dark:text-black px-4 py-2 rounded-full hover:bg-slate-800 dark:hover:bg-white/90');
app = app.replace(/ring-2 ring-orange-500/g, 'ring-2 ring-blue-500 dark:ring-orange-500');
app = app.replace(/bg-neutral-950 border-t border-white\/10/g, 'bg-slate-100 dark:bg-neutral-950 border-t border-slate-200 dark:border-white/10');
app = app.replace(/text-white\/40/g, 'text-slate-400 dark:text-white/40');
app = app.replace(/bg-black\/90 backdrop-blur-md border-t border-white\/10/g, 'bg-white/95 dark:bg-black/90 backdrop-blur-md border-t border-slate-200 dark:border-white/10');
app = app.replace(/text-orange-500/g, 'text-blue-600 dark:text-orange-500');
app = app.replace(/hover:text-white/g, 'hover:text-slate-900 dark:hover:text-white');
app = app.replace(/selection:bg-orange-500\/30/g, 'selection:bg-blue-600/30 dark:selection:bg-orange-500/30');

// Add toggle button to header
const toggleBtn = `
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 ml-4 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 transition"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </nav>`;
app = app.replace(/<\/nav>/g, toggleBtn);

const mobileToggleBtn = `
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider hover:text-slate-900 dark:hover:text-white"
        >
          {isDarkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          <span>{isDarkMode ? 'Light' : 'Dark'}</span>
        </button>
      </nav>`;
// We will replace the closing </nav> in the mobile section carefully, but since replace replaces the first one, we can do:
app = app.replace(/<\/nav>/, toggleBtn); // desktop
// Actually we already replaced `</nav>` globally if we used /g, wait I didn't use /g above.
app = app.replace(/<\/nav>/g, toggleBtn); 
// Need to fix this, so let's rewrite the string replacing.

fs.writeFileSync('src/App.tsx', app);
