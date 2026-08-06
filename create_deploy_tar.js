import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('=== PACKAGING PUTIMACH HPANEL DEPLOY ARCHIVES ===');

// Check dist exists
if (!fs.existsSync('dist')) {
  console.error('Error: dist directory does not exist. Run build-all.js first.');
  process.exit(1);
}

// Copy extra production config & entry files into dist
const extraFiles = ['.env', 'server.js', 'package.json', 'README_HPANEL_DEPLOY.txt'];
extraFiles.forEach(file => {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join('dist', file));
    console.log(`Copied ${file} -> dist/${file}`);
  }
});

// Ensure admin/.htaccess is present inside dist/admin
const adminHtaccessSource = path.join('admin', 'public', '.htaccess');
const adminHtaccessDest = path.join('dist', 'admin', '.htaccess');
if (fs.existsSync(adminHtaccessSource) && fs.existsSync(path.join('dist', 'admin'))) {
  fs.copyFileSync(adminHtaccessSource, adminHtaccessDest);
  console.log(`Copied admin .htaccess -> dist/admin/.htaccess`);
}

// 1. Create putimach_hpanel_deploy.tar.gz
try {
  if (fs.existsSync('putimach_hpanel_deploy.tar.gz')) {
    fs.unlinkSync('putimach_hpanel_deploy.tar.gz');
  }

  console.log('\nCreating putimach_hpanel_deploy.tar.gz...');
  execSync('tar -czvf putimach_hpanel_deploy.tar.gz -C dist .', { stdio: 'inherit' });

  const tarStats = fs.statSync('putimach_hpanel_deploy.tar.gz');
  console.log(`\nSuccessfully created putimach_hpanel_deploy.tar.gz!`);
  console.log(`TAR Archive Size: ${(tarStats.size / (1024 * 1024)).toFixed(2)} MB`);
} catch (err) {
  console.error('Tar packaging error:', err);
}

// 2. Create putimach_hpanel_deploy.zip (fallback)
try {
  if (fs.existsSync('putimach_hpanel_deploy.zip')) {
    fs.unlinkSync('putimach_hpanel_deploy.zip');
  }

  console.log('\nCreating putimach_hpanel_deploy.zip...');
  const cmd = `powershell -Command "Compress-Archive -Path 'dist\\*' -DestinationPath 'putimach_hpanel_deploy.zip' -Force"`;
  execSync(cmd, { stdio: 'inherit' });

  const zipStats = fs.statSync('putimach_hpanel_deploy.zip');
  console.log(`\nSuccessfully created putimach_hpanel_deploy.zip!`);
  console.log(`ZIP Archive Size: ${(zipStats.size / (1024 * 1024)).toFixed(2)} MB`);
} catch (err) {
  console.error('Zip packaging error:', err);
}

console.log('\n=== ALL DEPLOYMENT ARCHIVES CREATED SUCCESSFULLY ===');
