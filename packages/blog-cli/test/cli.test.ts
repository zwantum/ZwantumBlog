import { describe, it, expect } from 'vitest';
import { detectEnvironment } from '../src/detector';
import path from 'path';

describe('ZwantumBlog CLI Environment Detector', () => {
  it('detects monorepo project environment properly', () => {
    const rootDir = path.resolve(__dirname, '../../..');
    const env = detectEnvironment(rootDir);

    expect(env.isTypeScript).toBe(true);
    expect(env.packageManager).toBe('pnpm');
  });
});
