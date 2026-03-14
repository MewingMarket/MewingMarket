/**
 * SCANNER UNIVERSALE
 * - Scansiona app/public, app/server, app/modules, app/services
 * - Trova dove viene importato / usato airtable-sync.cjs
 * - Trova quali funzioni vengono chiamate
 * - Trova tutti gli endpoint Express
 * - Trova quali file front-end chiamano quali endpoint
 * - Segnala errori: file mancanti, require non risolti
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "app");
const TARGET_MODULE = "airtable-sync";

const results = {
  airtableImports: [],
  airtableFunctionCalls: [],
  endpoints: [],
  frontendCalls: [],
  missingFiles: [],
};

// -----------------------------
// Utility
// -----------------------------
function readFileSafe(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    results.missingFiles.push(file);
    return "";
  }
}

function walk(dir, cb) {
  const entries = fs.readdirSync(dir);
  for (const name of entries) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, cb);
    else cb(full);
  }
}

// -----------------------------
// 1) SCANSIONE COMPLETA
// -----------------------------
walk(ROOT, (file) => {
  const rel = file.replace(ROOT, "");
  const ext = path.extname(file);
  if (![".js", ".cjs", ".html"].includes(ext)) return;

  const content = readFileSafe(file);

  // --- AIRTABLE IMPORTS ---
  if (content.includes(TARGET_MODULE)) {
    results.airtableImports.push(rel);
  }

  // --- AIRTABLE FUNCTION CALLS ---
  const fnMatches = [...content.matchAll(/airtable[a-zA-Z0-9_]*\(/g)];
  if (fnMatches.length > 0) {
    results.airtableFunctionCalls.push({
      file: rel,
      calls: fnMatches.map((m) => m[0]),
    });
  }

  // --- EXPRESS ENDPOINTS ---
  const endpointMatches = [...content.matchAll(/app\.(get|post|put|delete)\("([^"]+)"/g)];
  endpointMatches.forEach((m) => {
    results.endpoints.push({
      file: rel,
      method: m[1],
      route: m[2],
    });
  });

  // --- FRONTEND FETCH CALLS ---
  const fetchMatches = [...content.matchAll(/fetch\("([^"]+)"/g)];
  fetchMatches.forEach((m) => {
    results.frontendCalls.push({
      file: rel,
      url: m[1],
    });
  });
});

// -----------------------------
// OUTPUT
// -----------------------------
console.log("\n=== SCANNER UNIVERSALE ===\n");

console.log("📌 IMPORT DI airtable-sync:");
results.airtableImports.forEach((f) => console.log("  →", f));

console.log("\n📌 FUNZIONI airtable-sync CHIAMATE:");
results.airtableFunctionCalls.forEach((obj) => {
  console.log("  →", obj.file);
  obj.calls.forEach((c) => console.log("      -", c));
});

console.log("\n📌 ENDPOINT BACK-END TROVATI:");
results.endpoints.forEach((e) => {
  console.log(`  [${e.method.toUpperCase()}] ${e.route}  →  ${e.file}`);
});

console.log("\n📌 CHIAMATE FRONT-END (fetch):");
results.frontendCalls.forEach((c) => {
  console.log(`  ${c.file}  →  ${c.url}`);
});

console.log("\n⚠️ FILE MANCANTI:");
if (results.missingFiles.length === 0) console.log("  Nessuno");
else results.missingFiles.forEach((f) => console.log("  →", f));

console.log("\n=== FINE ===\n");
