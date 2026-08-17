const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// The file got messed up. Let's fix desktop nav:
const desktopNavEndMatch = /<Settings className="w-3\.5 h-3\.5 inline mr-1" \/> Admin Portal\s*<\/button>([\s\S]*?)<\/nav>/;
app = app.replace(desktopNavEndMatch, `<Settings className="w-3.5 h-3.5 inline mr-1" /> Admin Portal
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 ml-4 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 transition"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </nav>`);

// Fix mobile nav:
const mobileNavEndMatch = /<Settings className="w-4\.5 h-4\.5" \/>\s*<span>หลังบ้าน<\/span>\s*<\/button>([\s\S]*?)<\/nav>/;
app = app.replace(mobileNavEndMatch, `<Settings className="w-4.5 h-4.5" />
          <span>หลังบ้าน</span>
        </button>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider hover:text-slate-900 dark:hover:text-white"
        >
          {isDarkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          <span>{isDarkMode ? 'Light' : 'Dark'}</span>
        </button>
      </nav>`);

fs.writeFileSync('src/App.tsx', app);
