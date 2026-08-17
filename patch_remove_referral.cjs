const fs = require('fs');
const file = 'src/components/StatusChecker.tsx';
let code = fs.readFileSync(file, 'utf8');

const startIndex = code.indexOf('{/* PSYCHOLOGICAL GAMIFICATION & REFERRAL CHALLENGE BOARD */}');
const endIndexStr = `                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>`;
const endIndex = code.indexOf(endIndexStr) + endIndexStr.length;

if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
  code = code.substring(0, startIndex) + code.substring(endIndex);
  fs.writeFileSync(file, code);
  console.log("Success remove referral block");
} else {
  console.log("Could not find start or end index");
  console.log("start:", startIndex);
  console.log("end:", endIndex);
}
