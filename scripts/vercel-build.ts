import { unlinkSync, mkdirSync, writeFileSync } from "node:fs";

console.log("🔨 Building serverless function for Vercel (Node.js target)...");

// Use Bun's build API directly — no shell, no glob interpretation
const result = await Bun.build({
  entrypoints: ["api/[...path].ts"],
  outdir: "api",
  target: "node",
  format: "esm",
  naming: "[dir]/[name].[ext]",
});

if (!result.success) {
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

console.log("✅ Build successful");

// Remove the TypeScript source so Vercel doesn't try to compile it
// (Vercel's own TypeScript compilation doesn't resolve tsconfig path aliases)
unlinkSync("api/[...path].ts");
console.log("   Removed source TypeScript file");

// Create placeholder to satisfy Vercel's outputDirectory requirement
mkdirSync("public", { recursive: true });
writeFileSync("public/.placeholder", "ok");
console.log("   Created public/.placeholder");
console.log("✅ Vercel build completed");
