import fs from 'fs';
import path from 'path';

describe('H4: Database Migrations & Baselining Integrity', () => {
  const rootDir = process.cwd();
  const schemaPath = path.join(rootDir, 'Database', 'schema.prisma');
  const migrationsDir = path.join(rootDir, 'Database', 'migrations');
  const lockFilePath = path.join(migrationsDir, 'migration_lock.toml');
  const baselineSqlPath = path.join(migrationsDir, '0_init', 'migration.sql');
  const packageJsonPath = path.join(rootDir, 'package.json');

  it('verifies migration_lock.toml exists and specifies postgresql provider', () => {
    expect(fs.existsSync(lockFilePath)).toBe(true);
    const lockContent = fs.readFileSync(lockFilePath, 'utf8');
    expect(lockContent).toContain('provider = "postgresql"');
  });

  it('verifies baseline migration 0_init exists and covers all 36 models in schema.prisma', () => {
    expect(fs.existsSync(baselineSqlPath)).toBe(true);

    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const sqlContent = fs.readFileSync(baselineSqlPath, 'utf8');

    // Extract all model names from schema.prisma
    const modelMatches = [...schemaContent.matchAll(/^model\s+(\w+)/gm)].map((m) => m[1]);
    expect(modelMatches.length).toBe(36);

    for (const model of modelMatches) {
      expect(sqlContent).toContain(`CREATE TABLE "${model}"`);
    }
  });

  it('verifies baseline migration creates all domain enums', () => {
    const sqlContent = fs.readFileSync(baselineSqlPath, 'utf8');
    const expectedEnums = [
      'UserRole',
      'OrderStatus',
      'PaymentStatus',
      'PaymentMethod',
      'CustomerSegment',
      'LoyaltyTier',
    ];

    for (const enumName of expectedEnums) {
      expect(sqlContent).toContain(`CREATE TYPE "${enumName}"`);
    }
  });

  it('verifies package.json enforces prisma migrate deploy for production migrations', () => {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    expect(pkg.scripts['db:migrate']).toBe('prisma migrate deploy --schema=Database/schema.prisma');
    expect(pkg.scripts['db:migrate']).not.toContain('db push');
    expect(pkg.scripts['db:migrate']).not.toContain('migrate dev');
  });
});

