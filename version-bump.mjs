import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

const targetVersion = process.env.npm_package_version;

// Fetch latest README from GitHub
try {
  execSync("git fetch origin && git checkout origin/main -- README.md", {
    stdio: "inherit",
  });
  console.log("Updated README.md from GitHub");
} catch {
  console.warn("Could not fetch README.md from GitHub");
}

// Update manifest.json
let manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t") + "\n");

console.log(`Updated manifest.json to version ${targetVersion}`);
