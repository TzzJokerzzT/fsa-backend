import { mkdirSync, writeFileSync, renameSync } from "node:fs";

console.log("🔨 Building serverless function for Vercel (Node.js target)...");

// Ensure output directories exist
mkdirSync("api", { recursive: true });
mkdirSync("dist", { recursive: true });

// Use Bun's build API directly — no shell, no glob interpretation
// Source is in src/ (Vercel won't try to compile it)
// Output goes to api/[...path].js (Vercel deploys the .js as catch-all)
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

// Rename built file to Vercel's catch-all path
renameSync("dist/vercel-entry.js", "api/[...path].js");
console.log("✅ Build successful → api/[...path].js");

// Create placeholder to satisfy Vercel's outputDirectory requirement
mkdirSync("public", { recursive: true });
writeFileSync("public/.placeholder", "ok");
console.log("   Created public/.placeholder");
console.log("✅ Vercel build completed");
