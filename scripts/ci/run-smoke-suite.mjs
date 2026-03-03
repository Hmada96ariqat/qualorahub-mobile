#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const smokeSuite = [
  'src/providers/__tests__/AuthProvider.test.tsx',
  'src/modules/crops/__tests__/crops-screen.integration.test.tsx',
  'src/modules/livestock/__tests__/livestock-screen.integration.test.tsx',
  'src/modules/management/__tests__/management-screen.integration.test.tsx',
  'src/modules/dashboard/__tests__/dashboard-api.test.ts',
];

const missing = smokeSuite.filter((relativePath) =>
  !fs.existsSync(path.join(repoRoot, relativePath)),
);

if (missing.length > 0) {
  console.error('Smoke suite is missing required tests:');
  for (const relativePath of missing) {
    console.error(`- ${relativePath}`);
  }
  process.exit(1);
}

const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(
  npxCommand,
  ['jest', '--runInBand', ...smokeSuite],
  {
    cwd: repoRoot,
    stdio: 'inherit',
  },
);

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
