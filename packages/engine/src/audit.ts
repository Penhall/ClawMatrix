import * as fs from 'fs/promises';
import * as path from 'path';
import { lookupMatrix } from './solver.js';
import type { AuditResult, DetectedStack, DetectedContradiction } from './types.js';

type PkgJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  engines?: { node?: string };
};

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function detectStack(rootDir: string): Promise<DetectedStack> {
  const stack: DetectedStack = {};

  const pkgPath = path.join(rootDir, 'package.json');
  if (await fileExists(pkgPath)) {
    let pkg: PkgJson = {};
    try {
      pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8')) as PkgJson;
    } catch { /* ignore malformed package.json */ }
    const runtimeVersion = pkg.engines?.node ?? process.version.replace('v', '');
    stack.runtime = `Node.js ${runtimeVersion}`;
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps['next']) stack.framework = 'Next.js';
    if (deps['@prisma/client'] || deps['prisma']) stack.orm = 'Prisma';
    if (deps['typescript']) stack.language = 'TypeScript';
  }

  let rootEntries: string[] = [];
  try { rootEntries = await fs.readdir(rootDir); } catch { /* ignore unreadable directory */ }
  if (rootEntries.some((f) => f.endsWith('.csproj'))) {
    stack.language = 'C#';
    stack.runtime = '.NET';
  }

  if (await fileExists(path.join(rootDir, 'pom.xml'))) {
    stack.language = 'Java';
    stack.runtime = 'JVM';
  }

  if (
    await fileExists(path.join(rootDir, 'requirements.txt')) ||
    await fileExists(path.join(rootDir, 'pyproject.toml'))
  ) {
    stack.language = 'Python';
  }

  return stack;
}

async function findFiles(rootDir: string, pattern: RegExp): Promise<string[]> {
  const results: string[] = [];
  async function walk(dir: string) {
    let entries: string[];
    try { entries = await fs.readdir(dir); } catch { return; }
    for (const entry of entries) {
      if (entry === 'node_modules' || entry === '.git') continue;
      const full = path.join(dir, entry);
      let stat;
      try { stat = await fs.stat(full); } catch { continue; }
      if (stat.isDirectory()) { await walk(full); }
      else if (pattern.test(entry)) { results.push(path.relative(rootDir, full)); }
    }
  }
  await walk(rootDir);
  return results;
}

async function detectUnusedEnvVars(rootDir: string): Promise<string[]> {
  const envPath = path.join(rootDir, '.env');
  if (!await fileExists(envPath)) return [];

  const envContent = await fs.readFile(envPath, 'utf-8');
  const definedVars = envContent
    .split('\n')
    .filter((line: string) => line.trim() && !line.trim().startsWith('#'))
    .map((line: string) => line.split('=')[0].trim())
    .filter(Boolean);

  if (definedVars.length === 0) return [];

  // Scan both source files (process.env.VAR) and prisma schemas (env("VAR"))
  const sourceFiles = await findFiles(rootDir, /\.(ts|js|tsx|jsx|prisma)$/);
  const allSource = await Promise.all(
    sourceFiles.map((f) => fs.readFile(path.join(rootDir, f), 'utf-8')),
  );
  const combined = allSource.join('\n');

  const unused = definedVars.filter(
    (v: string) => !combined.includes(`process.env.${v}`) && !combined.includes(`env("${v}")`),
  );
  return unused.map((v: string) => `.env: variável ${v} definida mas não utilizada no código`);
}

export async function analyzeProject(rootDir: string): Promise<AuditResult> {
  const stack = await detectStack(rootDir);
  const contradictions: DetectedContradiction[] = [];
  const idleResources: string[] = [];

  if (stack.framework === 'Next.js') {
    const routeFiles = await findFiles(rootDir, /^route\.(ts|js)$/);
    for (const routeFile of routeFiles) {
      const content = await fs.readFile(path.join(rootDir, routeFile), 'utf-8');
      if (!content.includes('Cache-Control') && !content.includes('revalidate') && !content.includes('cache:')) {
        idleResources.push(`${routeFile}: rota de API sem cache definido (recurso ocioso: tempo de resposta repetido)`);
        contradictions.push({ improving: 9, worsening: 27, source: routeFile });
      }
    }
  }

  if (stack.orm === 'Prisma') {
    const schemaCandidates = [
      path.join(rootDir, 'schema.prisma'),
      path.join(rootDir, 'prisma', 'schema.prisma'),
    ];
    for (const schemaPath of schemaCandidates) {
      if (await fileExists(schemaPath)) {
        const schema = await fs.readFile(schemaPath, 'utf-8');
        const relationCount = (schema.match(/@relation/g) ?? []).length;
        const indexCount = (schema.match(/@@index/g) ?? []).length;
        if (relationCount > indexCount) {
          const diff = relationCount - indexCount;
          idleResources.push(
            `schema.prisma: ${diff} relação(ões) sem @@index explícito (pode causar full table scan)`,
          );
          contradictions.push({ improving: 28, worsening: 36, source: 'schema.prisma' });
        }
        break;
      }
    }
  }

  const unusedEnvItems = await detectUnusedEnvVars(rootDir);
  idleResources.push(...unusedEnvItems);

  const suggestions = contradictions.map((c) => lookupMatrix(c.improving, c.worsening));
  return { stack, contradictions, idleResources, suggestions };
}
