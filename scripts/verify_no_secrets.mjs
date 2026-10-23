#!/usr/bin/env node
/**
 * Secret & Credential Leak Verifier
 * Scans git-tracked files to ensure no real API keys, credentials, or .env secrets
 * are committed to public source control.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const SENSITIVE_PATTERNS = [
  { name: 'Google / Firebase API Key', regex: /AIza[0-9A-Za-z\-_]{35}/g },
  { name: 'Anthropic API Key', regex: /sk-ant-[a-zA-Z0-9\-_]{20,}/g },
  { name: 'Replicate API Token', regex: /r8_[a-zA-Z0-9\-_]{30,}/g },
  { name: 'GitHub Personal Access Token', regex: /(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82}/g },
  { name: 'Stripe Live Secret Key', regex: /[sr]k_live_[0-9a-zA-Z]{24,}/g },
  { name: 'AWS Access Key ID', regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g },
  { name: 'Private Key Block', regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
];

const IGNORE_SUBSTRINGS = [
  'replace-with',
  'dummy',
  'example',
  'placeholder',
  'timecapsule_local_dev_only',
  'user:pass',
  'tests/',
];

console.log('🔒 Running Secret & Credential Leak Audit...');

// 1. Verify .env is strictly ignored by git
try {
  const checkIgnore = execSync('git check-ignore -v .env', { cwd: rootDir, encoding: 'utf-8' }).trim();
  console.log(`✔ .env is properly ignored: ${checkIgnore}`);
} catch (e) {
  console.error('❌ CRITICAL: .env is NOT ignored by git!');
  process.exit(1);
}

// 2. Get all tracked files in git
const trackedFiles = execSync('git ls-files', { cwd: rootDir, encoding: 'utf-8' })
  .trim()
  .split('\n')
  .filter(Boolean);

let findings = 0;

for (const relativePath of trackedFiles) {
  // Skip tests where synthetic mock keys are explicitly used for testing secret redaction
  if (relativePath.startsWith('tests/')) continue;

  const fullPath = path.join(rootDir, relativePath);
  if (!fs.existsSync(fullPath)) continue;

  // Skip large binary/media files
  const stat = fs.statSync(fullPath);
  if (stat.size > 1024 * 1024) continue;

  let content = '';
  try {
    content = fs.readFileSync(fullPath, 'utf-8');
  } catch (err) {
    continue; // binary or unreadable
  }

  for (const { name, regex } of SENSITIVE_PATTERNS) {
    const matches = content.match(regex);
    if (matches) {
      for (const m of matches) {
        if (IGNORE_SUBSTRINGS.some((s) => m.toLowerCase().includes(s))) continue;
        console.error(`❌ [${name}] exposed in tracked file: ${relativePath}`);
        findings++;
      }
    }
  }
}

// 3. If local .env exists, verify none of the actual secret values appear in tracked files
const envPath = path.join(rootDir, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envLines = envContent.split('\n');

  for (const line of envLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...rest] = trimmed.split('=');
    const val = rest.join('=').trim().replace(/^['"]|['"]$/g, '');

    // Skip short or non-secret standard values
    if (
      val.length < 8 ||
      ['postgresql', 'localhost', '127.0.0.1', 'timecapsule-studio', 'development', 'production', 'test'].includes(val)
    ) {
      continue;
    }

    try {
      const grepRes = execSync(`git grep -F "${val}" || true`, { cwd: rootDir, encoding: 'utf-8' }).trim();
      if (grepRes) {
        const matchingFiles = grepRes
          .split('\n')
          .map((l) => l.split(':')[0])
          .filter((f) => !f.startsWith('tests/'));
        if (matchingFiles.length > 0) {
          console.error(`❌ Secret value for '${key}' found in tracked files: ${[...new Set(matchingFiles)].join(', ')}`);
          findings++;
        }
      }
    } catch (_) {}
  }
}

if (findings > 0) {
  console.error(`\n❌ Audit FAILED: ${findings} potential secret exposure(s) detected.`);
  process.exit(1);
} else {
  console.log('✔ Audit PASSED: Zero API keys or secrets detected in git-tracked files.\n');
}
