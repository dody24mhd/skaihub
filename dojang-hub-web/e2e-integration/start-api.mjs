// Menjalankan API Laravel untuk E2E integrasi di atas file SQLite sementara.
// TIDAK PERNAH menyentuh database pgsql lokal: semua env DB di-override di sini.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const apiDir = path.resolve(here, "../../dojang-hub-api");
const dbFile = path.join(apiDir, "storage", "testing", "integration.sqlite");
const port = process.env.INTEGRATION_API_PORT || "8010";

mkdirSync(path.dirname(dbFile), { recursive: true });
if (existsSync(dbFile)) rmSync(dbFile, { force: true });
writeFileSync(dbFile, "");

const env = {
  ...process.env,
  APP_ENV: "testing",
  APP_DEBUG: "false",
  DB_CONNECTION: "sqlite",
  DB_DATABASE: dbFile,
  DB_URL: "",
  CACHE_STORE: "array",
  SESSION_DRIVER: "array",
  QUEUE_CONNECTION: "sync",
  BCRYPT_ROUNDS: "4",
  CORS_ALLOWED_ORIGINS: "http://localhost:3910,http://127.0.0.1:3910",
  PHP_CLI_SERVER_WORKERS: "4",
};

const php = process.env.PHP_BIN || "php";
const phpArgs = ["-d", "opcache.enable_cli=0", "artisan"];

const migrate = spawnSync(php, [...phpArgs, "migrate:fresh", "--seed", "--force"], {
  cwd: apiDir,
  env,
  stdio: "inherit",
});
if (migrate.status !== 0) {
  console.error("migrate:fresh --seed gagal pada sqlite integrasi");
  process.exit(migrate.status ?? 1);
}

const serve = spawn(php, [...phpArgs, "serve", "--host=127.0.0.1", `--port=${port}`, "--no-reload"], {
  cwd: apiDir,
  env,
  stdio: "inherit",
});
const stop = () => serve.kill();
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
serve.on("exit", (code) => process.exit(code ?? 0));
