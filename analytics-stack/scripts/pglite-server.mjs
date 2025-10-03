// scripts/pglite-server.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Point resolution at the frontend app
const appDir = path.resolve(__dirname, "../apps/Next-js-Boilerplate");
const appPkg = path.join(appDir, "package.json");
const appRequire = createRequire(appPkg);

function log(...args) {
  console.log("[pglite]", ...args);
}

async function importFromApp(modPath) {
  try {
    const resolved = appRequire.resolve(modPath);
    return { mod: await import(resolved), resolved };
  } catch {
    return null;
  }
}

async function main() {
  const DB_PATH = path.resolve(appDir, "local.db");
  const HOST = process.env.PGLITE_HOST || "127.0.0.1";
  const PORT = Number(process.env.PGLITE_PORT || 6543);

  // Try to load the main PGlite class
  const mainCandidates = [
    "@electric-sql/pglite",
    "@electric-sql/pglite/dist/index.js",
    "@electric-sql/pglite/dist/index.cjs"
  ];
  let PGlite, mainResolved;

  for (const c of mainCandidates) {
    const hit = await importFromApp(c);
    if (hit) {
      const m = hit.mod;
      PGlite = m.PGlite || m.default?.PGlite || m.default;
      mainResolved = hit.resolved;
      if (PGlite) break;
    }
  }
  if (!PGlite) {
    console.error("[pglite] Could not load PGlite from", mainCandidates.join(", "));
    process.exit(1);
  }
  log("Loaded PGlite from", mainResolved);

  // Try to load a server implementation
  const serverCandidates = [
    "@electric-sql/pglite/server",
    "@electric-sql/pglite/dist/server.js",
    "@electric-sql/pglite/dist/server.cjs",
    "@electric-sql/pglite/server.js"
  ];
  let serverMod, serverResolved;

  for (const c of serverCandidates) {
    const hit = await importFromApp(c);
    if (hit) {
      serverMod = hit.mod;
      serverResolved = hit.resolved;
      break;
    }
  }
  if (!serverMod) {
    console.error("[pglite] Could not resolve a server module. Tried:", serverCandidates.join(", "));
    process.exit(1);
  }
  log("Loaded server module from", serverResolved);

  // Instantiate DB
  const db = new PGlite({ dataDir: DB_PATH });

  // Start server (support multiple API shapes)
  let closeFn = null;
  if (typeof serverMod.createServer === "function") {
    const srv = await serverMod.createServer({ db, host: HOST, port: PORT });
    closeFn = srv?.close?.bind(srv);
    log(`Ready on ws://${HOST}:${PORT} (createServer) db: ${DB_PATH}`);
  } else if (serverMod.PGliteSocketServer) {
    const Srv = serverMod.PGliteSocketServer;
    const srv = new Srv({ db, host: HOST, port: PORT });
    if (typeof srv.listen === "function") {
      await srv.listen();
      closeFn = srv.close?.bind(srv);
      log(`Ready on ws://${HOST}:${PORT} (PGliteSocketServer.listen) db: ${DB_PATH}`);
    } else if (typeof srv.start === "function") {
      await srv.start(PORT, HOST);
      closeFn = srv.stop?.bind(srv);
      log(`Ready on ws://${HOST}:${PORT} (PGliteSocketServer.start) db: ${DB_PATH}`);
    } else {
      console.error("[pglite] Unknown server interface on PGliteSocketServer");
      process.exit(1);
    }
  } else {
    console.error("[pglite] Server module found, but no known exports (createServer or PGliteSocketServer).");
    process.exit(1);
  }

  const shutdown = async () => {
    log("Shutting down...");
    try { await closeFn?.(); } catch {}
    try { await db.close?.(); } catch {}
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((e) => {
  console.error("[pglite] Failed to start:", e?.stack || e);
  process.exit(1);
});
