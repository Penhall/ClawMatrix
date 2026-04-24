import * as fs from 'fs/promises';
import * as path from 'path';
import { lookupMatrix } from './solver.js';
import type { AuditResult, DetectedStack, DetectedContradiction } from './types.js';

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
    stack.runtime = `Node.js ${process.version.replace('v', '')}`;
    const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps['next']) stack.framework = 'Next.js';
    if (deps['@prisma/client'] || deps['prisma']) stack.orm = 'Prisma';
    if (deps['typescript']) stack.language = 'TypeScript';
  }

  const hasCsproj = (await fs.readdir(rootDir)).some((f) => f.endsWith('.csproj'));
  if (hasCsproj) { stack.language = 'C#'; stack.runtime = '.NET'; }

  if (await fileExists(path.join(rootDir, 'pom.xml'))) {
    stack.language = 'Java'; stack.runtime = 'JVM';
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
      const stat = await fs.stat(full);
      if (stat.isDirectory()) { await walk(full); }
      else if (pattern.test(entry)) { results.push(path.relative(rootDir, full)); }
    }
  }
  await walk(rootDir);
  return results;
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

  const suggestions = contradictions.map((c) => lookupMatrix(c.improving, c.worsening));
  return { stack, contradictions, idleResources, suggestions };
}
