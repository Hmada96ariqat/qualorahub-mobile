#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const srcRoot = path.join(repoRoot, 'src');

function collectSourceFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(absolutePath));
      continue;
    }

    if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) {
      files.push(absolutePath);
    }
  }

  return files;
}

function extractSpecifiers(sourceText) {
  const specifiers = [];
  const pattern =
    /\bimport\s+(?:type\s+)?(?:[\w*\s{},]+from\s+)?["']([^"']+)["']|\brequire\(\s*["']([^"']+)["']\s*\)|\bimport\(\s*["']([^"']+)["']\s*\)/g;

  for (const match of sourceText.matchAll(pattern)) {
    const specifier = match[1] ?? match[2] ?? match[3];
    if (specifier) specifiers.push(specifier);
  }

  return specifiers;
}

function resolveSpecifier(filePath, specifier) {
  if (specifier.startsWith('.')) {
    return path.resolve(path.dirname(filePath), specifier);
  }

  if (specifier.startsWith('src/')) {
    return path.join(repoRoot, specifier);
  }

  return null;
}

function toPosix(absolutePath) {
  return absolutePath.split(path.sep).join('/');
}

function isAllowedGeneratedImporter(absolutePathPosix) {
  return (
    absolutePathPosix.includes('/src/api/modules/') ||
    absolutePathPosix.includes('/src/api/contracts/') ||
    absolutePathPosix.includes('/src/api/generated/')
  );
}

function findViolations() {
  if (!fs.existsSync(srcRoot)) return [];

  const files = collectSourceFiles(srcRoot);
  const violations = [];

  for (const filePath of files) {
    const source = fs.readFileSync(filePath, 'utf8');
    const specifiers = extractSpecifiers(source);
    const filePosix = toPosix(filePath);
    const moduleMatch = filePosix.match(/\/src\/modules\/([^/]+)\//);
    const owningModule = moduleMatch?.[1] ?? null;

    for (const specifier of specifiers) {
      if (specifier === 'supabase' || specifier.startsWith('@supabase/')) {
        violations.push(
          `${filePosix}: forbidden Supabase import "${specifier}" (NestJS API only policy)`,
        );
        continue;
      }

      const resolved = resolveSpecifier(filePath, specifier);
      if (!resolved) continue;
      const resolvedPosix = toPosix(resolved);

      if (resolvedPosix.includes('/src/api/generated/') && !isAllowedGeneratedImporter(filePosix)) {
        violations.push(
          `${filePosix}: direct generated API import "${specifier}" is only allowed in src/api/modules or src/api/contracts`,
        );
      }

      if (!owningModule) continue;

      const targetModuleMatch = resolvedPosix.match(/\/src\/modules\/([^/]+)\//);
      const targetModule = targetModuleMatch?.[1] ?? null;
      if (!targetModule || targetModule === owningModule) continue;

      const isSharedContract =
        resolvedPosix.includes(`/src/modules/${targetModule}/contracts`) ||
        resolvedPosix.endsWith(`/src/modules/${targetModule}/contracts`);
      if (isSharedContract) continue;

      violations.push(
        `${filePosix}: cross-module internal import "${specifier}" from "${owningModule}" to "${targetModule}" is not allowed`,
      );
    }
  }

  return violations;
}

const violations = findViolations();
if (violations.length > 0) {
  console.error('Import boundary check failed:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('Import boundary check passed.');
