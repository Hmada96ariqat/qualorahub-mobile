#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const openApiPath = path.join(repoRoot, 'docs/api/openapi.json');

const requiredEndpoints = [
  { method: 'post', path: '/api/v1/auth/login' },
  { method: 'post', path: '/api/v1/auth/refresh' },
  { method: 'post', path: '/api/v1/auth/logout' },
  { method: 'get', path: '/api/v1/auth/context' },
  { method: 'get', path: '/api/v1/auth/rbac' },
];

function readOpenApi(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`OpenAPI file is missing: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function hasTypedSuccessResponse(operation) {
  if (!operation || typeof operation !== 'object') return false;
  if (!operation.responses || typeof operation.responses !== 'object') return false;

  return Object.entries(operation.responses).some(([statusCode, response]) => {
    if (!String(statusCode).startsWith('2')) return false;
    if (!response || typeof response !== 'object') return false;
    if (!response.content || typeof response.content !== 'object') return false;

    return Object.values(response.content).some((contentValue) => {
      if (!contentValue || typeof contentValue !== 'object') return false;
      return Boolean(contentValue.schema);
    });
  });
}

function verifyEndpoints(openApi) {
  const failures = [];

  for (const endpoint of requiredEndpoints) {
    const pathItem = openApi.paths?.[endpoint.path];
    const operation = pathItem?.[endpoint.method];

    if (!operation) {
      failures.push(`${endpoint.method.toUpperCase()} ${endpoint.path}: operation missing`);
      continue;
    }

    if (!hasTypedSuccessResponse(operation)) {
      failures.push(
        `${endpoint.method.toUpperCase()} ${endpoint.path}: missing typed 2xx response content schema`,
      );
    }
  }

  return failures;
}

try {
  const openApi = readOpenApi(openApiPath);
  const failures = verifyEndpoints(openApi);

  if (failures.length > 0) {
    console.error('OpenAPI verification failed for required Phase 1 endpoints:');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log('OpenAPI verification passed for required Phase 1 endpoints.');
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`OpenAPI verification failed: ${message}`);
  process.exit(1);
}
