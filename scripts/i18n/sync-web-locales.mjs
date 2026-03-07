import { cp, mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const webLocalesRoot = path.resolve(projectRoot, '..', 'qualorahub', 'src', 'locales');
const mobileLocalesRoot = path.resolve(projectRoot, 'src', 'i18n', 'locales');
const SUPPORTED_LANGUAGES = ['en', 'es', 'ar'];

async function ensureDirectoryExists(targetPath) {
  await mkdir(targetPath, { recursive: true });
}

async function assertDirectoryExists(targetPath) {
  const targetStats = await stat(targetPath).catch(() => null);
  if (!targetStats?.isDirectory()) {
    throw new Error(`Expected directory at ${targetPath}`);
  }
}

async function syncLanguage(language) {
  const sourcePath = path.join(webLocalesRoot, language);
  const destinationPath = path.join(mobileLocalesRoot, language);

  await assertDirectoryExists(sourcePath);
  await ensureDirectoryExists(destinationPath);
  await cp(sourcePath, destinationPath, { recursive: true, force: true });

  const copiedEntries = await readdir(destinationPath);
  return copiedEntries.length;
}

async function main() {
  await assertDirectoryExists(webLocalesRoot);
  await ensureDirectoryExists(mobileLocalesRoot);

  const results = await Promise.all(
    SUPPORTED_LANGUAGES.map(async (language) => {
      const fileCount = await syncLanguage(language);
      return `${language}: ${fileCount} files`;
    }),
  );

  console.log(`Synced web locale resources into ${mobileLocalesRoot}`);
  for (const line of results) {
    console.log(`- ${line}`);
  }
}

main().catch((error) => {
  console.error('[i18n:sync] Failed to sync locale resources.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
