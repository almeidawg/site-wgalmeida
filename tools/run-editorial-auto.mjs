import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const args = process.argv.slice(2);

const hasFlag = (flag) => args.includes(flag);
const readArg = (name, fallback = '') =>
  args.find((arg) => arg.startsWith(`--${name}=`))?.split('=').slice(1).join('=') || fallback;

const batchSize = Number.parseInt(readArg('batch-size', '10'), 10);
const safeBatchSize = Number.isFinite(batchSize) && batchSize > 0 ? batchSize : 10;
const reportPath = readArg('report', `temp_unsplash_priority_batch_report.auto-${new Date().toISOString().slice(0, 10)}.json`);
const queueArgs = [];

if (hasFlag('--with-unsplash')) {
  queueArgs.push('--with-unsplash');
}

const runStep = (label, command, commandArgs, options = {}) => {
  console.log(`\n[editorial-auto] ${label}`);
  console.log(`> ${[command, ...commandArgs].join(' ')}`);

  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
    ...options,
  });

  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status ?? 'unknown'}`);
  }
};

const resolvePythonCommand = () => {
  const candidates = [
    ['py', ['-3']],
    ['python', []],
  ];

  for (const [command, prefixArgs] of candidates) {
    const probe = spawnSync(command, [...prefixArgs, '--version'], {
      cwd: root,
      stdio: 'ignore',
      shell: false,
    });

    if (probe.status === 0) {
      return { command, prefixArgs };
    }
  }

  return null;
};

const selectionPath = path.join(root, 'src', 'data', 'blogUnsplashSelection.json');
const collectionPath = path.join(root, 'unsplash-collection-yU-ii4hFjlg.json');
const canBuildManifest = fs.existsSync(selectionPath) && fs.existsSync(collectionPath);
const pythonRuntime = resolvePythonCommand();

try {
  runStep('Generate editorial queue', 'node', ['./tools/generate-blog-editorial-queue.mjs', ...queueArgs]);

  if (!hasFlag('--skip-fill')) {
    if (!pythonRuntime) {
      console.log('\n[editorial-auto] Priority fill skipped: Python runtime not found.');
    } else {
      runStep(
        'Fill priority Unsplash batch',
        pythonRuntime.command,
        [
          ...pythonRuntime.prefixArgs,
          './tools/fill-unsplash-priority-batch.py',
          '--batch-size',
          String(safeBatchSize),
          '--report',
          reportPath,
        ]
      );
    }
  }

  if (!hasFlag('--skip-manifest')) {
    if (!canBuildManifest) {
      console.log('\n[editorial-auto] Manifest build skipped: selection or collection file not found.');
    } else {
      runStep('Build Unsplash manifest', 'node', ['./tools/build-blog-unsplash-manifest.mjs']);
    }
  }

  if (!hasFlag('--skip-status')) {
    runStep('Run editorial status', 'node', ['./tools/blog-editorial-status.mjs']);
  }

  if (!hasFlag('--skip-audit')) {
    runStep('Run editorial selection audit', 'node', ['./tools/audit-blog-unsplash-selection.mjs']);
  }

  console.log('\n[editorial-auto] Completed successfully.');
} catch (error) {
  console.error(`\n[editorial-auto] ${error.message}`);
  process.exit(1);
}
