import fs from 'fs';
import path from 'path';

describe('L3: Repository Clutter Cleanup & tsconfig.json Integrity', () => {
  const rootDir = process.cwd();

  const clutterPaths = [
    path.join(rootDir, 'eslint_report.json'),
    path.join(rootDir, 'tsconfig.tsbuildinfo'),
    path.join(rootDir, 'test-results'),
    path.join(rootDir, 'public', 'sw.js'),
    path.join(rootDir, '.neon'),
  ];

  it('verifies that all clutter, artifact, and metadata files are absent from project root', () => {
    for (const filePath of clutterPaths) {
      const exists = fs.existsSync(filePath);
      expect(exists).toBe(false);
    }
  });

  it('verifies tsconfig.json does not reference nonexistent Backend/ path alias', () => {
    const tsconfigPath = path.join(rootDir, 'tsconfig.json');
    expect(fs.existsSync(tsconfigPath)).toBe(true);

    const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf8');
    const parsed = JSON.parse(tsconfigContent);

    // Paths verification
    expect(parsed.compilerOptions.paths).toBeDefined();
    expect(parsed.compilerOptions.paths['@backend/*']).toBeUndefined();
    expect(parsed.compilerOptions.paths['@/*']).toEqual(['./src/*']);
    expect(parsed.compilerOptions.paths['@database/*']).toEqual(['./Database/*']);

    // Exclude verification
    expect(parsed.exclude).not.toContain('Backend');
  });

  it('verifies .gitignore properly ignores temporary files, reports, and build artifacts', () => {
    const gitignorePath = path.join(rootDir, '.gitignore');
    expect(fs.existsSync(gitignorePath)).toBe(true);

    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    expect(gitignoreContent).toContain('eslint_report.json');
    expect(gitignoreContent).toContain('tsconfig.tsbuildinfo');
    expect(gitignoreContent).toContain('test-results/');
    expect(gitignoreContent).toContain('.neon');
    expect(gitignoreContent).toContain('/public/sw.js');
  });
});

