import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

if (process.platform !== "win32") {
  throw new Error("The Helix Windows installer must be built on Windows.");
}
const target = execFileSync("rustc", ["--print", "host-tuple"], {
  encoding: "utf8",
}).trim();
if (target !== "x86_64-pc-windows-msvc") {
  throw new Error(`Unsupported Windows target: ${target}`);
}
mkdirSync("src-tauri/binaries", { recursive: true });
copyFileSync(process.execPath, join("src-tauri", "binaries", `node-${target}.exe`));
