import fs from "node:fs";
import path from "node:path";
import { SEO_CONFIG, getSEOConfig } from "./src/data/seoConfig.js";

const BASE_URL = "https://wgalmeida.com.br";

/** Parse YAML frontmatter from markdown string */
function parseFrontmatterSimple(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const yaml = match[1];
  const result = {};
  for (const line of yaml.split('\n')) {
    const m = line.match(/^(\w+):\s*"?([^"]*)"?\s*$/);
    if (m) result[m[1]] = m[2].trim();
  }
  return result;
}

/** Get SEO config for a blog article from its markdown file */
function getBlogArticleSEO(slug) {
  const mdPath = path.join(process.cwd(), "src", "content", "blog", `${slug}.md`);
  if (!fs.existsSync(mdPath)) return null;
  const raw = fs.readFileSync(mdPath, "utf8");
  const fm = parseFrontmatterSimple(raw);
  const title = fm.title ? `${fm.title} | Grupo WG Almeida` : null;
  const description = fm.excerpt || null;
  const image = fm.image ? `${BASE_URL}${fm.image}` : `${BASE_URL}/og-home-1200x630.jpg`;
  const canonical = `${BASE_URL}/blog/${slug}`;
  if (!title) return null;
  return { title, description, canonical, og: { title, description, image, url: canonical }, twitter: { card: "summary_large_image", title, description, image } };
}

/** Get SEO config for an estilo from its markdown file */
function getEstiloSEO(slug) {
  const mdPath = path.join(process.cwd(), "src", "content", "estilos", `${slug}.md`);
  if (!fs.existsSync(mdPath)) return null;
  const raw = fs.readFileSync(mdPath, "utf8");
  const fm = parseFrontmatterSimple(raw);
  const displayName = slug.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  const title = fm.title ? `${fm.title} - Guia Completo de Estilo | WG Almeida` : `${displayName} - Guia Completo de Estilo | WG Almeida`;
  const description = fm.excerpt || `Descubra o estilo ${displayName}: caracteristicas, cores e como aplicar na sua casa com a curadoria do Grupo WG Almeida.`;
  const image = `${BASE_URL}/og-home-1200x630.jpg`;
  const canonical = `${BASE_URL}/estilos/${slug}`;
  return { title, description, canonical, og: { title, description, image, url: canonical }, twitter: { card: "summary_large_image", title, description, image } };
}

/** Resolve SEO config for any route, with rich data for blog/estilos */
function resolveSEO(route) {
  if (route.startsWith('/blog/')) {
    const slug = route.replace('/blog/', '');
    return getBlogArticleSEO(slug) || getSEOConfig(route);
  }
  if (route.startsWith('/estilos/')) {
    const slug = route.replace('/estilos/', '');
    return getEstiloSEO(slug) || getSEOConfig(route);
  }
  return getSEOConfig(route);
}

const root = process.cwd();
const outDirArg = process.argv[2];
const outDir = outDirArg || process.env.BUILD_OUT_DIR || "dist";
const outputRoot = path.join(root, outDir);
const templatePath = path.join(outputRoot, "index.html");

const sitemapPath = path.join(root, "public", "sitemap.xml");

function getBlogRoutes() {
  const blogPath = path.join(root, "src", "content", "blog");
  const routes = [];
  if (fs.existsSync(blogPath)) {
    const files = fs.readdirSync(blogPath).filter(f => f.endsWith('.md'));
    files.forEach(file => {
      const slug = file.replace('.md', '');
      routes.push(`/blog/${slug}`);
    });
    
    // Verificar subpastas de idiomas
    ['en', 'es'].forEach(lang => {
      const langPath = path.join(blogPath, lang);
      if (fs.existsSync(langPath)) {
        const langFiles = fs.readdirSync(langPath).filter(f => f.endsWith('.md'));
        langFiles.forEach(file => {
          const slug = file.replace('.md', '');
          routes.push(`/blog/${slug}`); // O sistema de tradução usa o mesmo slug no roteamento
        });
      }
    });
  }
  return routes;
}

function getRoutesFromSitemap() {
  if (!fs.existsSync(sitemapPath)) return [];

  const xml = fs.readFileSync(sitemapPath, "utf8");
  const locMatches = [...xml.matchAll(/<loc>(.*?)<\/loc>/gim)];
  const routes = [];

  for (const match of locMatches) {
    const loc = match[1]?.trim();
    if (!loc) continue;

    try {
      const url = new URL(loc);
      let route = url.pathname || "/";
      if (route.length > 1 && route.endsWith("/")) route = route.slice(0, -1);
      routes.push(route);
    } catch {
      // ignore malformed urls
    }
  }

  return routes;
}

const ROUTES = Array.from(
  new Set([
    "/", 
    ...Object.keys(SEO_CONFIG).filter((route) => route !== "/"), 
    ...getBlogRoutes(),
    ...getRoutesFromSitemap()
  ])
);

const replaceOne = (html, pattern, value) => {
  if (pattern.test(html)) {
    return html.replace(pattern, value);
  }
  return html;
};

const escapeHtml = (text = "") =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const routeLabel = (route) => {
  if (route === "/") return "Grupo WG Almeida";
  const raw = route.split("/").filter(Boolean).pop() || "";
  return raw
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

function buildSeoFallback(route, config) {
  const heading = escapeHtml(config.og?.title || config.title || routeLabel(route));
  const description = escapeHtml(config.description || "");
  const canonical = `https://wgalmeida.com.br${route}`;

  return `
<div id="wg-seo-fallback" style="max-width:980px;margin:48px auto;padding:0 20px;font-family:Inter,Arial,sans-serif;color:#222;line-height:1.6">
  <h1 style="font-size:36px;line-height:1.2;margin:0 0 16px 0;font-weight:500">${heading}</h1>
  <p style="font-size:18px;margin:0 0 14px 0">${description}</p>
  <p style="font-size:16px;margin:0 0 18px 0">
    O Grupo WG Almeida atua com arquitetura, engenharia e marcenaria integradas, do projeto a entrega da obra, com padrao tecnico e gestao unificada.
  </p>
  <p style="font-size:16px;margin:0 0 18px 0">
    Nesta pagina voce encontra informacoes objetivas sobre escopo, etapas, qualidade de execucao e orientacoes para tomar decisoes com seguranca. O foco e entregar clareza de investimento, previsibilidade de prazo e compatibilizacao entre arquitetura, obra e marcenaria, evitando retrabalho e ruido operacional ao longo de toda a jornada do cliente.
  </p>
  <nav aria-label="Navegacao interna">
    <a href="/arquitetura">Arquitetura</a> ·
    <a href="/engenharia">Engenharia</a> ·
    <a href="/marcenaria">Marcenaria</a> ·
    <a href="/obra-turn-key">Obra Turn Key</a> ·
    <a href="/arquitetura-corporativa">Arquitetura Corporativa</a> ·
    <a href="/construtora-alto-padrao-sp">Construtora Alto Padrao SP</a> ·
    <a href="/reforma-apartamento-itaim">Reforma Apartamento Itaim</a> ·
    <a href="/solicite-proposta">Solicite Proposta</a> ·
    <a href="/projetos">Projetos</a> ·
    <a href="/faq">FAQ</a> ·
    <a href="/contato">Contato</a>
  </nav>
  <p style="margin-top:12px;font-size:13px;color:#666">
    URL canonica: <a href="${canonical}">${canonical}</a>
  </p>
</div>`;
}

function applySeo(template, route, config) {
  const title = escapeHtml(config.title);
  const desc = escapeHtml(config.description);
  const canonical = `https://wgalmeida.com.br${route}`;
  const ogTitle = escapeHtml(config.og?.title || config.title);
  const ogDesc = escapeHtml(config.og?.description || config.description);
  const ogImage = config.og?.image || "https://wgalmeida.com.br/og-home-1200x630.jpg";
  const ogUrl = canonical;
  const twTitle = escapeHtml(config.twitter?.title || config.og?.title || config.title);
  const twDesc = escapeHtml(config.twitter?.description || config.og?.description || config.description);
  const twImage = config.twitter?.image || ogImage;

  let html = template;
  html = replaceOne(html, /<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  html = replaceOne(html, /<meta name="description" content="[^"]*"\s*\/?>/i, `<meta name="description" content="${desc}" />`);
  html = replaceOne(html, /<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${canonical}" />`);
  html = replaceOne(html, /<meta property="og:title" content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${ogTitle}" />`);
  html = replaceOne(html, /<meta property="og:description" content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${ogDesc}" />`);
  html = replaceOne(html, /<meta property="og:image" content="[^"]*"\s*\/?>/i, `<meta property="og:image" content="${ogImage}" />`);
  html = replaceOne(html, /<meta property="og:url" content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${ogUrl}" />`);
  html = replaceOne(html, /<meta name="twitter:title" content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${twTitle}" />`);
  html = replaceOne(html, /<meta name="twitter:url" content="[^"]*"\s*\/?>/i, `<meta name="twitter:url" content="${ogUrl}" />`);
  html = replaceOne(html, /<meta name="twitter:description" content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${twDesc}" />`);
  html = replaceOne(html, /<meta name="twitter:image" content="[^"]*"\s*\/?>/i, `<meta name="twitter:image" content="${twImage}" />`);
  html = replaceOne(
    html,
    /<script>\s*\(function\(\)\s*\{[\s\S]*?dynamic-canonical[\s\S]*?<\/script>/i,
    `<script>(function(){var canonical=document.querySelector('link[rel="canonical"]');if(canonical){canonical.href='${canonical}';}})();</script>`
  );
  if (route === "/") {
    html = replaceOne(
      html,
      /<div id="root">[\s\S]*?<\/div>/i,
      `<div id="root">${buildSeoFallback(route, config)}</div>`
    );
  } else {
    html = replaceOne(
      html,
      /<div id="root">\s*<\/div>/i,
      `<div id="root">${buildSeoFallback(route, config)}</div>`
    );
  }
  return html;
}

async function run() {
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  const rootTemplate = await fs.promises.readFile(templatePath, "utf8");
  for (const route of ROUTES) {
    const seo = resolveSEO(route);
    const routeDir = route === "/" ? outputRoot : path.join(outputRoot, route.slice(1));
    const routeIndexPath = path.join(routeDir, "index.html");
    const sourceHtml = fs.existsSync(routeIndexPath)
      ? await fs.promises.readFile(routeIndexPath, "utf8")
      : rootTemplate;
    const html = applySeo(sourceHtml, route, seo);

    await fs.promises.mkdir(routeDir, { recursive: true });
    await fs.promises.writeFile(routeIndexPath, html);
    console.log(`ok: ${path.join(outDir, route === "/" ? "index.html" : `${route.slice(1)}/index.html`)}`);
  }

  // Geração do Sitemap dinâmico
  console.log("Generating dynamic sitemap.xml...");
  const today = new Date().toISOString().split('T')[0];
  const sitemapEntries = ROUTES.map(route => {
    let priority = "0.8";
    if (route === "/") priority = "1.0";
    else if (["/arquitetura", "/engenharia", "/marcenaria", "/projetos"].includes(route)) priority = "0.9";
    else if (route.startsWith("/blog/")) priority = "0.7";

    return `  <url>
    <loc>https://wgalmeida.com.br${route === "/" ? "" : route}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.startsWith("/blog/") ? "monthly" : "weekly"}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join("\n");

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</urlset>`;

  const finalSitemapPath = path.join(outputRoot, "sitemap.xml");
  await fs.promises.writeFile(finalSitemapPath, sitemapXml);
  
  // Também atualizar na pasta public para o próximo build
  await fs.promises.writeFile(sitemapPath, sitemapXml);
  console.log(`Sitemap updated with ${ROUTES.length} routes.`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

