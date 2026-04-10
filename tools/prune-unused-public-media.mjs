import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDirArg = process.argv[2] || 'dist';
const outDir = path.join(root, outDirArg);

const removableTargets = [
  path.join(outDir, 'images', 'about', 'william-almeida.png'),
];

let removedCount = 0;
let removedBytes = 0;

const removeTarget = async (targetPath) => {
  if (!fs.existsSync(targetPath)) return;

  const stat = await fs.promises.stat(targetPath);
  if (stat.isDirectory()) {
    const entries = await fs.promises.readdir(targetPath, { withFileTypes: true });
    for (const entry of entries) {
      await removeTarget(path.join(targetPath, entry.name));
    }
    await fs.promises.rm(targetPath, { recursive: true, force: true });
    removedCount += 1;
    return;
  }

  removedBytes += stat.size;
  removedCount += 1;
  await fs.promises.rm(targetPath, { force: true });
};

for (const target of removableTargets) {
  await removeTarget(target);
}

console.log(`unused public media removed: ${removedCount}`);
console.log(`unused public media bytes removed: ${removedBytes}`);
