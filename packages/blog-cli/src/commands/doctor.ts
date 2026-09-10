import fs from 'fs';
import path from 'path';
import { detectEnvironment } from '../detector';

export async function runDoctorCommand() {
  const cwd = process.cwd();
  console.log('\n🩺 Running ZwantumBlog Diagnostic Health Check...\n');

  const env = detectEnvironment(cwd);

  console.log(`[Framework]      ${env.isNextJs ? 'Next.js' : env.isVite ? 'React (Vite)' : 'React'}`);
  console.log(`[TypeScript]     ${env.isTypeScript ? '✓ Configured' : '⚠ JavaScript only'}`);
  console.log(`[App Router]     ${env.hasNextAppRouter ? '✓ App Router detected' : '— Standard routing'}`);

  // Check config file
  const configExists =
    fs.existsSync(path.join(cwd, 'blog.config.ts')) ||
    fs.existsSync(path.join(cwd, 'blog.config.js'));
  console.log(`[Config File]    ${configExists ? '✓ blog.config found' : '❌ Missing blog.config (Run: npx zwantum-blog init)'}`);

  // Check client file
  const clientExists =
    fs.existsSync(path.join(cwd, 'src', 'lib', 'blog.ts')) ||
    fs.existsSync(path.join(cwd, 'lib', 'blog.ts')) ||
    fs.existsSync(path.join(cwd, 'src', 'lib', 'blog.js')) ||
    fs.existsSync(path.join(cwd, 'lib', 'blog.js'));
  console.log(`[Client Helper]  ${clientExists ? '✓ Blog client helper found' : '⚠ Missing blog client helper'}`);

  // Check package.json for @zwantum/blog
  const pkgPath = path.join(cwd, 'package.json');
  let hasBlogPkg = false;
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.dependencies?.['@zwantum/blog'] || pkg.devDependencies?.['@zwantum/blog']) {
        hasBlogPkg = true;
      }
    } catch {}
  }
  console.log(`[Package Installed] ${hasBlogPkg ? '✓ @zwantum/blog installed' : '⚠ @zwantum/blog not in package.json dependencies'}`);

  console.log('\nDoctor check completed.\n');
}
