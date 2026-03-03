#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const modulesRoot = path.join(repoRoot, 'src', 'modules');

function collectFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(absolutePath));
      continue;
    }

    files.push(absolutePath);
  }

  return files;
}

const contractTests = collectFiles(modulesRoot)
  .map((absolutePath) => path.relative(repoRoot, absolutePath))
  .filter((relativePath) =>
    /src\/modules\/.+\/__tests__\/(.+-api\.test\.ts|contracts\.test\.ts)$/.test(
      relativePath.replaceAll('\\', '/'),
    ),
  )
  .sort((left, right) => left.localeCompare(right));

if (contractTests.length === 0) {
  console.error('No contract tests found in src/modules/**/__tests__.');
  process.exit(1);
}

const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(
  npxCommand,
  ['jest', '--runInBand', ...contractTests],
  {
    cwd: repoRoot,
    stdio: 'inherit',
  },
);

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
