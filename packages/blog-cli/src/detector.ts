import fs from 'fs';
import path from 'path';

export interface ProjectEnvironment {
  isNextJs: boolean;
  hasNextAppRouter: boolean;
  isVite: boolean;
  isTypeScript: boolean;
  hasSrcDir: boolean;
  packageManager: 'pnpm' | 'yarn' | 'npm';
}

export function detectEnvironment(cwd: string = process.cwd()): ProjectEnvironment {
  let isNextJs = false;
  let hasNextAppRouter = false;
  let isVite = false;
  let isTypeScript = false;
  let hasSrcDir = false;
  let packageManager: 'pnpm' | 'yarn' | 'npm' = 'npm';

  const pkgPath = path.join(cwd, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps['next']) isNextJs = true;
      if (deps['vite']) isVite = true;
      if (deps['typescript'] || fs.existsSync(path.join(cwd, 'tsconfig.json'))) isTypeScript = true;
    } catch {
      // Ignore parse error
    }
  }

  // Check next app router
  if (isNextJs) {
    if (fs.existsSync(path.join(cwd, 'app')) || fs.existsSync(path.join(cwd, 'src', 'app'))) {
      hasNextAppRouter = true;
    }
  }

  // Check src folder
  if (fs.existsSync(path.join(cwd, 'src'))) {
    hasSrcDir = true;
  }

  // Check lockfiles
  if (fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'))) {
    packageManager = 'pnpm';
  } else if (fs.existsSync(path.join(cwd, 'yarn.lock'))) {
    packageManager = 'yarn';
  }

  return {
    isNextJs,
    hasNextAppRouter,
    isVite,
    isTypeScript,
    hasSrcDir,
    packageManager,
  };
}
