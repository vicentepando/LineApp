const fs = require('fs');
const path = require('path');

const scriptPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-modules-jsi',
  'apple',
  'scripts',
  'build-xcframework.sh'
);

if (!fs.existsSync(scriptPath)) {
  console.warn('[postinstall] expo-modules-jsi build script not found; skipping patch.');
  process.exit(0);
}

const source = fs.readFileSync(scriptPath, 'utf8');

if (source.includes('CODE_SIGNING_ALLOWED=NO')) {
  process.exit(0);
}

const marker = '    SWIFT_COMPILATION_MODE=wholemodule \\\n';
const replacement =
  marker +
  '    CODE_SIGNING_ALLOWED=NO \\\n' +
  '    CODE_SIGNING_REQUIRED=NO \\\n' +
  '    CODE_SIGN_IDENTITY="" \\\n';

if (!source.includes(marker)) {
  console.warn('[postinstall] expo-modules-jsi patch marker not found; skipping patch.');
  process.exit(0);
}

fs.writeFileSync(scriptPath, source.replace(marker, replacement));
console.log('[postinstall] Patched expo-modules-jsi xcframework code signing.');
