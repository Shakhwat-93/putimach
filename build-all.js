// build-all.js
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  fs.readdirSync(from).forEach((element) => {
    const stat = fs.lstatSync(path.join(from, element));
    if (stat.isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    } else if (stat.isDirectory()) {
      copyFolderSync(path.join(from, element), path.join(to, element));
    }
  });
}

try {
  console.log('=== Building Storefront ===');
  execSync('npx vite build', { stdio: 'inherit' });

  console.log('\n=== Building Admin Panel ===');
  // Install dependencies in admin folder first
  execSync('npm install', { cwd: 'admin', stdio: 'inherit' });
  execSync('npx vite build --mode production', { cwd: 'admin', stdio: 'inherit' });

  console.log('\n=== Merging Admin Build into Storefront Dist ===');
  const sourceDir = path.join('admin', 'dist');
  const destDir = path.join('dist', 'admin');

  if (fs.existsSync(sourceDir)) {
     copyFolderSync(sourceDir, destDir);
     console.log('Successfully copied admin build to dist/admin');
  } else {
    throw new Error('Admin build output folder not found at: ' + sourceDir);
  }

  console.log('\n=== Build All Completed Successfully! ===');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
