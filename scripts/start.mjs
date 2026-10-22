import { cpSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join } from "node:path";
import { parseArgs } from "node:util";

const root = fileURLToPath(new URL("../", import.meta.url));
const server = join(root, ".next", "standalone", "server.js");
if (!existsSync(server)) throw new Error("Run npm run build before starting the application.");
const { values } = parseArgs({ options: { port: { type: "string", short: "p" }, hostname: { type: "string", short: "H" } } });
const port = Number(values.port || process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid server port.");
process.env.PORT = String(port);
process.env.HOSTNAME = values.hostname || process.env.RAMS_BIND_HOST || "127.0.0.1";
cpSync(join(root, ".next", "static"), join(root, ".next", "standalone", ".next", "static"), { recursive: true });
cpSync(join(root, "public"), join(root, ".next", "standalone", "public"), { recursive: true });
await import(pathToFileURL(server).href);
