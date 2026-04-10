import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const defaultInfraDir = path.resolve(
  projectRoot,
  '..',
  '..',
  '..',
  '..',
  '..',
  '07_20260310_Infraestrutura',
  'Operacao-Tuneis-PM2',
);

const infraDir = path.resolve(process.env.WG_INFRA_TUNNELS_DIR || defaultInfraDir);
const manifestPath = path.join(infraDir, 'TUNEIS-ATIVOS.json');
const reservedPortsPath = path.join(infraDir, 'PORTAS-RESERVADAS.md');
const canonicalLogsDir = path.join(infraDir, 'logs');
const auditsDir = path.join(infraDir, 'audits');

const severityRank = {
  low: 1,
  medium: 2,
  high: 3,
};

const parseCliArgs = () => {
  const options = {};

  for (const arg of process.argv.slice(2)) {
    if (!arg.startsWith('--')) continue;

    const [key, ...rest] = arg.slice(2).split('=');
    const value = rest.length > 0 ? rest.join('=') : 'true';
    options[key] = value;
  }

  return options;
};

const normalizeText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const normalizePathForCompare = (value = '') =>
  value
    .replace(/\\/g, '/')
    .replace(/^([a-z]):/i, (_, drive) => `${drive.toUpperCase()}:`)
    .replace(/\/+$/, '')
    .toLowerCase();

const parseReservedPorts = (markdown) => {
  const lines = markdown.split(/\r?\n/);
  const rows = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) continue;

    const cells = trimmed
      .split('|')
      .map((cell) => cell.trim())
      .filter(Boolean);

    if (cells.length < 5) continue;
    if (cells[0] === 'Porta' || /^-+$/.test(cells[0])) continue;

    const port = Number.parseInt(cells[0], 10);
    if (!Number.isFinite(port)) continue;

    rows.push({
      port,
      expectedOwner: cells[1],
      usage: cells[2],
      state: cells[3],
      note: cells[4],
    });
  }

  return rows;
};

const evaluateOwnerMismatch = (expectedOwner, owner) => {
  const expected = normalizeText(expectedOwner);
  const current = normalizeText(owner);

  if (!expected) return false;
  if (expected.includes('atendimento') && !current.includes('atendimento')) return true;
  if (expected.includes('servidor') && !current.includes('administrador')) return true;

  return false;
};

const getHighestSeverity = (issues) =>
  issues.reduce((highest, issue) => {
    if ((severityRank[issue.severity] || 0) > (severityRank[highest] || 0)) {
      return issue.severity;
    }

    return highest;
  }, 'low');

const cli = parseCliArgs();
const failOn = (cli['fail-on'] || 'medium').toLowerCase();

if (!Object.keys(severityRank).includes(failOn)) {
  console.error(`Valor invalido para --fail-on: ${failOn}. Use high, medium ou low.`);
  process.exit(2);
}

if (!fs.existsSync(manifestPath)) {
  console.error(`Manifesto de tuneis nao encontrado: ${manifestPath}`);
  process.exit(2);
}

if (!fs.existsSync(reservedPortsPath)) {
  console.error(`Arquivo de portas reservadas nao encontrado: ${reservedPortsPath}`);
  process.exit(2);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const reservedMarkdown = fs.readFileSync(reservedPortsPath, 'utf8');
const reservedRows = parseReservedPorts(reservedMarkdown);
const reservedByPort = new Map(reservedRows.map((row) => [row.port, row]));
const tunnels = Array.isArray(manifest.tunnels) ? manifest.tunnels : [];
const activeTunnels = tunnels.filter((tunnel) => normalizeText(tunnel?.status) === 'active');
const issues = [];

for (const conflict of manifest.conflicts || []) {
  if (normalizeText(conflict?.status) !== 'open') continue;

  issues.push({
    code: `manifest_conflict_${conflict.type || 'unknown'}`,
    severity: normalizeText(conflict?.severity) || 'medium',
    message: `Conflito aberto no manifesto: ${conflict.type || 'sem tipo'} na porta ${conflict.port || 'n/a'}`,
    context: {
      port: conflict.port,
      tools: conflict.active_tools || [],
      pids: conflict.active_pids || [],
    },
  });
}

const activeByPort = new Map();
for (const tunnel of activeTunnels) {
  if (!Number.isFinite(tunnel.port)) continue;

  if (!activeByPort.has(tunnel.port)) activeByPort.set(tunnel.port, []);
  activeByPort.get(tunnel.port).push(tunnel);
}

for (const [port, entries] of activeByPort.entries()) {
  if (entries.length > 1) {
    issues.push({
      code: 'duplicate_tunnel_same_port',
      severity: 'medium',
      message: `Mais de um tunel ativo na mesma porta ${port}`,
      context: {
        port,
        tunnelIds: entries.map((entry) => entry.id),
        tools: [...new Set(entries.map((entry) => entry.tool))],
      },
    });
  }
}

const normalizedCanonicalLogsDir = normalizePathForCompare(canonicalLogsDir);

for (const tunnel of activeTunnels) {
  const tunnelId = tunnel.id || 'unknown';
  const port = tunnel.port;
  const reserved = reservedByPort.get(port);

  if (!reserved) {
    issues.push({
      code: 'active_port_not_reserved',
      severity: 'high',
      message: `Tunel ativo ${tunnelId} usa porta ${port} sem reserva canonicamente registrada`,
      context: {
        tunnelId,
        port,
        tool: tunnel.tool,
        owner: tunnel.owner,
      },
    });
  }

  if (reserved && evaluateOwnerMismatch(reserved.expectedOwner, tunnel.owner || '')) {
    issues.push({
      code: 'owner_mismatch_for_reserved_port',
      severity: 'medium',
      message: `Owner divergente para a porta ${port}: esperado ${reserved.expectedOwner}, encontrado ${tunnel.owner || 'n/a'}`,
      context: {
        tunnelId,
        port,
        expectedOwner: reserved.expectedOwner,
        foundOwner: tunnel.owner,
      },
    });
  }

  if (!tunnel.public_url) {
    issues.push({
      code: 'missing_public_url',
      severity: 'medium',
      message: `Tunel ativo ${tunnelId} sem public_url registrada`,
      context: { tunnelId, port, tool: tunnel.tool },
    });
  }

  if (!Number.isFinite(tunnel.pid)) {
    issues.push({
      code: 'missing_pid',
      severity: 'low',
      message: `Tunel ativo ${tunnelId} sem PID valido no manifesto`,
      context: { tunnelId, port, tool: tunnel.tool },
    });
  }

  const logPath = tunnel.log_path;
  if (!logPath || normalizeText(logPath) === 'stdout') {
    issues.push({
      code: 'non_canonical_log_path',
      severity: 'medium',
      message: `Tunel ativo ${tunnelId} sem log persistente em caminho canonico`,
      context: { tunnelId, port, logPath: logPath || null },
    });
  } else {
    const normalizedLogPath = normalizePathForCompare(logPath);
    const isCanonical =
      normalizedLogPath === normalizedCanonicalLogsDir ||
      normalizedLogPath.startsWith(`${normalizedCanonicalLogsDir}/`);

    if (!isCanonical) {
      issues.push({
        code: 'log_path_outside_canonical',
        severity: 'medium',
        message: `Tunel ativo ${tunnelId} com log fora do diretorio canonico`,
        context: {
          tunnelId,
          port,
          logPath,
          expectedBaseDir: canonicalLogsDir,
        },
      });
    }
  }
}

const issueCounts = {
  high: issues.filter((issue) => issue.severity === 'high').length,
  medium: issues.filter((issue) => issue.severity === 'medium').length,
  low: issues.filter((issue) => issue.severity === 'low').length,
};

const highestSeverity = getHighestSeverity(issues);
const auditStatus = issues.length === 0 ? 'ok' : highestSeverity === 'high' ? 'blocked' : 'warning';

const report = {
  generated_at: new Date().toISOString(),
  source: 'tools/audit-infra-tunnels.mjs',
  infra_dir: infraDir,
  status: auditStatus,
  summary: {
    active_tunnels: activeTunnels.length,
    reserved_ports: reservedRows.length,
    issues_total: issues.length,
    issues_by_severity: issueCounts,
    highest_severity: issues.length > 0 ? highestSeverity : null,
  },
  issues,
};

fs.mkdirSync(auditsDir, { recursive: true });
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const reportPath = path.join(auditsDir, `tunnel-audit-${timestamp}.json`);
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log('Infra tunnel audit summary');
console.log(`- status: ${auditStatus}`);
console.log(`- active_tunnels: ${report.summary.active_tunnels}`);
console.log(`- issues_total: ${report.summary.issues_total}`);
console.log(`- high: ${issueCounts.high} | medium: ${issueCounts.medium} | low: ${issueCounts.low}`);
console.log(`- report: ${reportPath}`);

if (issues.length > 0) {
  console.log('');
  console.log('Open issues:');
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. [${issue.severity}] ${issue.code} :: ${issue.message}`);
  });
}

const thresholdRank = severityRank[failOn] || severityRank.medium;
const shouldFail = issues.some((issue) => (severityRank[issue.severity] || 0) >= thresholdRank);

if (shouldFail) {
  process.exit(1);
}
