const fs = require('fs');

console.log('Starting server.ts conversion...');

// Read the backup file
const content = fs.readFileSync('server.ts.backup', 'utf8');

// Step 1: Update imports at the top
let converted = content.replace(
  `import prisma from "./src/db/index.ts";`,
  `import prisma from "./src/db/index.js";
import { seedDatabase } from "./src/lib/seed.js";
import { AIQueueManager } from "./src/lib/aiQueue.js";
import { getSessionUser, requireAuth, requireAdmin } from "./src/middleware/auth.js";`
);

// Step 2: Remove old database initialization (everything between imports and AI_CONFIG)
// Find the start of AI_CONFIG
const aiConfigStart = converted.indexOf('// --- Global AI Configuration ---');
const importsEnd = converted.indexOf('import prisma');
const nextLineAfterImports = converted.indexOf('\n', importsEnd) + 1;

// Remove everything between imports and AI_CONFIG
const beforeImports = converted.substring(0, nextLineAfterImports);
const afterAIConfig = converted.substring(aiConfigStart);
converted = beforeImports + '\n' + afterAIConfig;

// Step 3: Remove AIQueueManager class definition (it's now in aiQueue.ts)
const classStart = converted.indexOf('class AIQueueManager {');
if (classStart !== -1) {
  const classEnd = converted.indexOf('\n}\n', classStart) + 3;
  converted = converted.substring(0, classStart) + converted.substring(classEnd);
}

// Step 4: Remove getSessionUser function definition
const getSessionStart = converted.indexOf('const getSessionUser = (req: express.Request');
if (getSessionStart !== -1) {
  const getSessionEnd = converted.indexOf('};', getSessionStart) + 2;
  converted = converted.substring(0, getSessionStart) + converted.substring(getSessionEnd);
}

// Step 5: Remove checkAdmin function definition
const checkAdminStart = converted.indexOf('const checkAdmin = (req: express.Request');
if (checkAdminStart !== -1) {
  const checkAdminEnd = converted.indexOf('};', checkAdminStart) + 2;
  converted = converted.substring(0, checkAdminStart) + converted.substring(checkAdminEnd);
}

// Step 6: Replace checkAdmin with requireAdmin
converted = converted.replace(/checkAdmin/g, 'requireAdmin');

// Step 7: Add await to getSessionUser calls
converted = converted.replace(/const user = getSessionUser\(/g, 'const user = await getSessionUser(');
converted = converted.replace(/const userBuffer = getSessionUser\(/g, 'const user = await getSessionUser(');

// Step 8: Make route handlers async
converted = converted.replace(/(apiRouter\.(get|post|put|delete)\([^,]+,\s*)(\(req,\s*res\))/g, '$1async $3');
converted = converted.replace(/(apiRouter\.(get|post|put|delete)\([^,]+,\s*\w+,\s*)(\(req,\s*res\))/g, '$1async $3');

// Step 9: Add seedDatabase call to startServer
converted = converted.replace(
  'async function startServer() {\n  const app = express();',
  'async function startServer() {\n  await seedDatabase();\n  \n  const app = express();'
);

// Step 10: Simple db.prepare replacements for common patterns
// DELETE queries
converted = converted.replace(/db\.prepare\("DELETE FROM (\w+)"\)\.run\(\)/g, 
  (match, table) => `await prisma.${convertTableName(table)}.deleteMany()`);

// COUNT queries
converted = converted.replace(/\(db\.prepare\("SELECT COUNT\(\*\) as count FROM (\w+)"\)\.get\(\) as any\)\.count/g,
  (match, table) => `await prisma.${convertTableName(table)}.count()`);

// Write the converted file
fs.writeFileSync('server-converted.ts', converted);

console.log('Conversion complete! File saved as server-converted.ts');
console.log('\nNOTE: This is a partial conversion. You still need to manually convert:');
console.log('- Complex SELECT queries with WHERE clauses');
console.log('- INSERT queries');
console.log('- UPDATE queries');
console.log('- JOIN queries');
console.log('- Transaction blocks');
console.log('\nUse PRISMA_CONVERSION_GUIDE.md for reference.');

function convertTableName(table) {
  const mapping = {
    'users': 'user',
    'submissions': 'submission',
    'future_qr_scans': 'qrScan',
    'qr_definitions': 'qrDefinition',
    'qr_riddle_attempts': 'qrRiddleAttempt',
    'game_configs': 'gameConfig',
    'inventory': 'inventory',
    'mystery_nodes': 'mysteryNode',
    'user_mystery_claims': 'userMysteryClaim',
    'tick_boom_sessions': 'tickBoomSession'
  };
  return mapping[table] || table;
}

// Made with Bob
