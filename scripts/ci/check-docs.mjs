#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

const requiredDocs = [
  'docs/HANDOFF.md',
  'docs/architecture/ui-reuse-contract.md',
  'docs/architecture/mobile-foundation.md',
  'docs/release/pipeline.md',
  'docs/release/store-readiness-checklist.md',
  'docs/release/incident-runbook.md',
  'docs/product/mobile-waterfall-plan.md',
  'docs/product/current-phase.md',
  'docs/product/acceptance-gates.md',
  'docs/product/module-priority.md',
  'docs/modules/_module-template.md',
  'docs/ux/screen-map.md',
  'docs/testing/test-accounts.md',
  'docs/testing/seed-reset.md',
  'docs/testing/phase-1-foundation.md',
];

const requiredProjectFiles = ['eas.json'];

function assertNonEmptyFile(relativePath, failures) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`${relativePath}: missing`);
    return;
  }

  const content = fs.readFileSync(absolutePath, 'utf8').trim();
  if (!content) failures.push(`${relativePath}: empty`);
}

function collectSourceFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(absolutePath));
      continue;
    }

    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    if (absolutePath.endsWith(path.join('src', 'api', 'generated', 'schema.ts'))) continue;

    files.push(absolutePath);
  }

  return files;
}

function checkCodeMapCoverage(failures) {
  const sourceRoot = path.join(repoRoot, 'src');
  if (!fs.existsSync(sourceRoot)) {
    failures.push('src directory missing');
    return;
  }

  const sourceFiles = collectSourceFiles(sourceRoot);
  for (const sourceFile of sourceFiles) {
    const relativeSource = path.relative(repoRoot, sourceFile);
    const mapFile = path.join(repoRoot, 'docs/code-map/files', `${relativeSource}.md`);
    if (!fs.existsSync(mapFile)) {
      failures.push(`docs/code-map/files/${relativeSource}.md: missing`);
      continue;
    }

    const content = fs.readFileSync(mapFile, 'utf8').trim();
    if (!content) failures.push(`docs/code-map/files/${relativeSource}.md: empty`);
  }
}

const failures = [];
for (const relativePath of requiredDocs) {
  assertNonEmptyFile(relativePath, failures);
}
for (const relativePath of requiredProjectFiles) {
  assertNonEmptyFile(relativePath, failures);
}
checkCodeMapCoverage(failures);

if (failures.length > 0) {
  console.error('Documentation check failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Documentation check passed.');
