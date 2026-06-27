#!/usr/bin/env node

// Phase 1 tracer bullet: read one real Hermes SQLite database and print one
// normalized RunTrace JSON object. Intentionally not a server and not a UI.
//
// Run with:
//   node --experimental-sqlite --no-warnings scripts/read-latest-trace.js

const { readLatestTrace } = require('./trace-reader');

try {
  const trace = readLatestTrace();
  console.log(JSON.stringify(trace, null, 2));
} catch (error) {
  console.error(`Failed to read Hermes trace: ${error.message}`);
  process.exit(1);
}
