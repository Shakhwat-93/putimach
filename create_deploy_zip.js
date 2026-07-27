import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('=== PACKAGING PUTIMACH HPANEL DEPLOY ZIP ===');

// Check dist exists
if (!fs.existsSync('dist')) {
  console.error('Error: dist directory does not exist. Run build-all.js first.');
  process.exit(1);
}

// Copy .env, server.js, package.json, README into dist so dist has 100% of everything
const extraFiles = ['.env', 'server.js', 'package.json', 'README_HPANEL_DEPLOY.txt'];
extraFiles.forEach(file => {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join('dist', file));
    console.log(`Copied ${file} -> dist/${file}`);
  }
});

// Compress dist/* contents directly into putimach_hpanel_deploy.zip
try {
  if (fs.existsSync('putimach_hpanel_deploy.zip')) {
    fs.unlinkSync('putimach_hpanel_deploy.zip');
  }
  
  const cmd = `powershell -Command "Compress-Archive -Path 'dist\\*' -DestinationPath 'putimach_hpanel_deploy.zip' -Force"`;
  execSync(cmd, { stdio: 'inherit' });
  console.log('\nSuccessfully created putimach_hpanel_deploy.zip!');
  
  const stats = fs.statSync('putimach_hpanel_deploy.zip');
  console.log(`Archive Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
} catch (err) {
  console.error('Packaging error:', err);
  process.exit(1);
}
