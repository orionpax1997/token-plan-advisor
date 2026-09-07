#!/usr/bin/env node
import { main } from "./cli.ts";

main().catch((error) => {
  process.stderr.write(`fatal: ${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
