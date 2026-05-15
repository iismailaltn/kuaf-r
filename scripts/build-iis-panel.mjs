import { spawnSync } from "child_process"
import path from "path"
import { fileURLToPath } from "url"

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")

process.env.NEXT_PUBLIC_BASE_PATH = "/panel"

const r = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], {
  cwd: projectRoot,
  stdio: "inherit",
  env: { ...process.env, NEXT_PUBLIC_BASE_PATH: "/panel" },
  shell: true,
})
if (r.status !== 0) process.exit(r.status ?? 1)

const post = spawnSync(process.execPath, ["scripts/postbuild-iis.mjs"], {
  cwd: projectRoot,
  stdio: "inherit",
  env: { ...process.env, NEXT_PUBLIC_BASE_PATH: "/panel" },
})
process.exit(post.status ?? 0)
