const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('import compression')) {
    code = code.replace(
        'import path from "path";',
        'import path from "path";\nimport compression from "compression";'
    );
}

if (!code.includes('app.use(compression())')) {
    code = code.replace(
        'const app = express();',
        'const app = express();\napp.use(compression());'
    );
}

fs.writeFileSync('server.ts', code);
console.log("Success compression");
