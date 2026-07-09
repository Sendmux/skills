#!/usr/bin/env node

import { collectPluginBundleDrift } from "./build-plugin-bundles.mjs";

const failures = collectPluginBundleDrift();

if (failures.length > 0) {
  console.error("Plugin bundle check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  console.error("Run `node scripts/build-plugin-bundles.mjs` and commit the generated files.");
  process.exit(1);
}

console.log("Plugin bundle check passed.");
