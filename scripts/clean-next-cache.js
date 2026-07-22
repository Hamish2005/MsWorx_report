const fs = require("fs");
const path = require("path");

const workspace = path.resolve(__dirname, "..");
const cache = path.resolve(workspace, ".next");

if (path.dirname(cache) !== workspace) {
  throw new Error("Refusing to remove a cache directory outside the workspace.");
}

if (fs.existsSync(cache)) {
  fs.rmSync(cache, { recursive: true, force: true });
  console.log("Removed stale Next.js development cache.");
}
