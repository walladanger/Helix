import { spawnSync } from "node:child_process";

// Use the existing environment wrapper, including its app preview flags.
const child = spawnSync(
  process.execPath,
  ["scripts/with-app-env.mjs", "vite", "build"],
  {
    env: { ...process.env, HELIX_DESKTOP_BUILD: "1" },
    stdio: "inherit",
  },
);
if (child.error) throw child.error;
process.exit(child.status ?? 1);
