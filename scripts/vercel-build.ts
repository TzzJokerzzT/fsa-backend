import { mkdirSync, renameSync, existsSync, statSync } from "node:fs";

console.log("🔨 Building serverless function for Vercel (Node.js target)...");

// Ensure output directories exist
mkdirSync("api", { recursive: true });
mkdirSync("dist", { recursive: true });

// Use Bun's build API directly — no shell, no glob interpretation
const result = await Bun.build({
  entrypoints: ["src/vercel-entry.ts"],
  outdir: "dist",
  target: "node",
  format: "esm",
});

if (!result.success) {
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

// Rename built file to Vercel's handler path
renameSync("dist/vercel-entry.js", "api/index.js");

// Verify the file was created
if (!existsSync("api/index.js")) {
  console.error("❌ api/index.js was not created!");
  process.exit(1);
}

const size = statSync("api/index.js").size;
console.log(`✅ Build successful → api/index.js (${(size / 1024).toFixed(0)} KB)`);
