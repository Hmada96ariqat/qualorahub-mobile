#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const sourceRoot = path.join(repoRoot, 'src');
const outputRoot = path.join(repoRoot, 'docs', 'code-map', 'files');

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

  return files.sort();
}

function extractLines(source, expression) {
  const lines = [];
  for (const line of source.split('\n')) {
    if (expression.test(line.trim())) {
      lines.push(line.trim());
    }
  }
  return lines;
}

function describePurpose(relativePath) {
  if (relativePath.includes('/api/client/')) return 'API client infrastructure and request handling.';
  if (relativePath.includes('/api/modules/')) return 'Typed API module wrapper for backend endpoints.';
  if (relativePath.includes('/modules/')) return 'Feature module implementation.';
  if (relativePath.includes('/providers/')) return 'App-level provider and dependency wiring.';
  if (relativePath.includes('/state/')) return 'Global state container.';
  if (relativePath.includes('/hooks/')) return 'Reusable cross-feature hook.';
  if (relativePath.includes('/validation/')) return 'Shared runtime validation schema.';
  if (relativePath.includes('/utils/')) return 'Pure utility or guard helper.';
  if (relativePath.includes('/theme/')) return 'Design token or theming setup.';
  return 'Source module.';
}

function generateMarkdown(relativePath, sourceText) {
  const imports = extractLines(sourceText, /^(import\s|const\s.+\s=\srequire\()/);
  const exports = extractLines(sourceText, /^export\s/);

  const importSection =
    imports.length > 0 ? imports.map((line) => `- \`${line}\``).join('\n') : '- none';
  const exportSection =
    exports.length > 0 ? exports.map((line) => `- \`${line}\``).join('\n') : '- none';

  return `# Code Map: \`${relativePath}\`

## Purpose
${describePurpose(relativePath)}

## Imports
${importSection}

## Exports
${exportSection}
`;
}

if (!fs.existsSync(sourceRoot)) {
  console.error('Source directory missing: src');
  process.exit(1);
}

fs.mkdirSync(outputRoot, { recursive: true });
const sourceFiles = collectSourceFiles(sourceRoot);

for (const sourceFile of sourceFiles) {
  const relativePath = path.relative(repoRoot, sourceFile).split(path.sep).join('/');
  const outFile = path.join(outputRoot, `${relativePath}.md`);
  const outDir = path.dirname(outFile);
  fs.mkdirSync(outDir, { recursive: true });

  const sourceText = fs.readFileSync(sourceFile, 'utf8');
  fs.writeFileSync(outFile, generateMarkdown(relativePath, sourceText));
}

console.log(`Generated code map docs for ${sourceFiles.length} source files.`);
