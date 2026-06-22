import { $ } from "bun";

console.log("🔨 Building serverless function for Vercel (Node.js target)...");

// Build with Node.js target — resolves all @/ path aliases
await $`bun build api/[...path].ts --outfile api/[...path].js --target node --format esm`;

// Remove the TypeScript source so Vercel doesn't try to compile it
// (its esbuild doesn't resolve tsconfig path aliases)
await $`rm api/[...path].ts`;

// Create placeholder to satisfy Vercel's outputDirectory requirement
await $`mkdir -p public`;
await $`echo ok > public/.placeholder`;

console.log("✅ Vercel build completed");
