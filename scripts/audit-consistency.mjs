#!/usr/bin/env node
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const rootDir = process.cwd()
const srcDir = path.join(rootDir, 'src')
const scriptsDir = path.join(rootDir, 'scripts')
const baselineFile = path.join(scriptsDir, 'audit-consistency.baseline.json')
const updateBaseline = process.argv.includes('--update-baseline')
const strictMode = process.argv.includes('--strict')

if (!fs.existsSync(srcDir)) {
  console.error('src/ nao encontrado no diretorio atual.')
  process.exit(1)
}

const CHECKS = [
  {
    id: 'prices',
    label: 'Precos hardcoded',
    pattern: String.raw`\b(?:29|59|79|149)[\.,]90\b|R\$\s*(?:29|59|79|149)(?:[\.,]90)?\b`,
    kind: 'content',
  },
  {
    id: 'urls',
    label: 'URLs hardcoded',
    pattern: String.raw`https?:\/\/(?:easy|obraeasy|easyrealstate|buildtech)\.wgalmeida\.com\.br|(?:easy|obraeasy|easyrealstate|buildtech)\.wgalmeida\.com\.br`,
    kind: 'content',
  },
  {
    id: 'contact',
    label: 'Contato hardcoded',
    pattern: String.raw`98465-0002|contato@wgalmeida\.com\.br|contato@wg`,
    kind: 'content',
  },
  {
    id: 'junk_files',
    label: 'Arquivos suspeitos (temp/backup/final/old)',
    pattern: String.raw`(?:^|[\\/._-])(temp|backup|final|old|legacy|deprecated)(?:[\\/._-]|$)`,
    kind: 'filename',
  },
]

const ALLOWED_SOURCES = {
  prices: ['src/data/company.ts', 'src/data/company.js', 'src/data/planos.ts', 'src/data/planos.js'],
  urls: ['src/data/company.ts', 'src/data/company.js'],
  contact: ['src/data/company.ts', 'src/data/company.js'],
}

const DEFAULT_BASELINE = {
  generatedAt: null,
  checks: Object.fromEntries(CHECKS.map((c) => [c.id, []])),
}

function toPosix(p) {
  return p.replace(/\\/g, '/')
}

function isIgnoredFile(relPath) {
  const p = toPosix(relPath)
  if (p.includes('/__tests__/')) return true
  if (p.includes('/__mocks__/')) return true
  if (p.includes('/__deprecated/')) return true
  if (p.includes('/dist/')) return true
  if (p.includes('/build/')) return true
  if (p.includes('/.next/')) return true
  if (p.includes('/node_modules/')) return true
  if (p.includes('/coverage/')) return true
  if (p.endsWith('.test.ts') || p.endsWith('.test.tsx') || p.endsWith('.test.js') || p.endsWith('.test.jsx')) return true
  if (p.endsWith('.spec.ts') || p.endsWith('.spec.tsx') || p.endsWith('.spec.js') || p.endsWith('.spec.jsx')) return true
  if (p.endsWith('.generated.ts') || p.endsWith('.generated.js')) return true
  return false
}

function run(command) {
  try {
    return execSync(command, { cwd: rootDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  } catch (err) {
    return ''
  }
}

function rgContent(pattern) {
  const cmd = `rg --json -n --no-heading --color never -g "*.ts" -g "*.tsx" -g "*.js" -g "*.jsx" "${pattern}" "${srcDir}"`
  const out = run(cmd)
  if (!out) return []
  const rows = out.split('\n').filter(Boolean)
  const files = []
  for (const row of rows) {
    let parsed
    try {
      parsed = JSON.parse(row)
    } catch {
      continue
    }
    if (parsed.type !== 'match') continue
    const abs = parsed?.data?.path?.text
    if (!abs) continue
    const rel = toPosix(path.relative(rootDir, abs))
    if (!rel || rel.startsWith('..')) continue
    if (isIgnoredFile(rel)) continue
    files.push(rel)
  }
  return Array.from(new Set(files)).sort()
}

function rgFiles(pattern) {
  const out = run(`rg --files "${srcDir}"`)
  if (!out) return []
  const rx = new RegExp(pattern, 'i')
  const files = out
    .split('\n')
    .filter(Boolean)
    .map((abs) => toPosix(path.relative(rootDir, abs)))
    .filter((rel) => rel && !rel.startsWith('..'))
    .filter((rel) => !isIgnoredFile(rel))
    .filter((rel) => rx.test(rel))
  return Array.from(new Set(files)).sort()
}

function loadBaseline() {
  if (!fs.existsSync(baselineFile)) return structuredClone(DEFAULT_BASELINE)
  try {
    const parsed = JSON.parse(fs.readFileSync(baselineFile, 'utf8'))
    if (!parsed || typeof parsed !== 'object') return structuredClone(DEFAULT_BASELINE)
    if (!parsed.checks || typeof parsed.checks !== 'object') return structuredClone(DEFAULT_BASELINE)
    return {
      generatedAt: parsed.generatedAt || null,
      checks: {
        ...Object.fromEntries(CHECKS.map((c) => [c.id, []])),
        ...parsed.checks,
      },
    }
  } catch {
    return structuredClone(DEFAULT_BASELINE)
  }
}

function saveBaseline(data) {
  if (!fs.existsSync(scriptsDir)) fs.mkdirSync(scriptsDir, { recursive: true })
  fs.writeFileSync(baselineFile, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

const baseline = loadBaseline()
const nextBaseline = {
  generatedAt: new Date().toISOString(),
  checks: { ...Object.fromEntries(CHECKS.map((c) => [c.id, []])) },
}

let hasError = false

console.log('\n=== Audit de Consistencia (anti-drift) ===\n')
console.log(`Projeto: ${rootDir}`)
console.log(`Modo: ${updateBaseline ? 'UPDATE_BASELINE' : strictMode ? 'CHECK_STRICT' : 'CHECK'}`)

for (const check of CHECKS) {
  const rawFiles = check.kind === 'filename' ? rgFiles(check.pattern) : rgContent(check.pattern)
  const allowed = new Set((ALLOWED_SOURCES[check.id] || []).map((x) => toPosix(x)))
  const relevant = rawFiles.filter((f) => !allowed.has(toPosix(f)))

  nextBaseline.checks[check.id] = [...relevant]

  if (updateBaseline) {
    console.log(`- ${check.label}: ${relevant.length} arquivo(s) no baseline`) 
    continue
  }

  const known = new Set((baseline.checks[check.id] || []).map((x) => toPosix(x)))
  const regressions = relevant.filter((f) => !known.has(toPosix(f)))

  if (relevant.length === 0) {
    console.log(`- ${check.label}: OK`) 
    continue
  }

  if (strictMode) {
    hasError = true
    console.error(`\nERRO: ${check.label} em modo strict (${relevant.length})`)
    relevant.forEach((f) => console.error(`  + ${f}`))
    continue
  }

  if (regressions.length > 0) {
    hasError = true
    console.error(`\nERRO: ${check.label} com regressao (${regressions.length})`)
    regressions.forEach((f) => console.error(`  + ${f}`))
  } else {
    console.warn(`\nWARN: ${check.label} com legado conhecido (${relevant.length})`) 
  }
}

if (updateBaseline) {
  saveBaseline(nextBaseline)
  console.log(`\nBaseline atualizado em: ${baselineFile}`)
  process.exit(0)
}

if (hasError) {
  console.error('\nFalha na auditoria: regressao detectada.')
  process.exit(1)
}

console.log('\nAudit OK (sem regressao nova).\n')
