import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { createLogger, defineConfig } from "vite";
import { compression } from "vite-plugin-compression2";
import { visualizer } from "rollup-plugin-visualizer";
const require = createRequire(import.meta.url);
const vitePrerender = require("vite-plugin-prerender").default ?? require("vite-plugin-prerender");
const PuppeteerRenderer =
  require("@prerenderer/renderer-puppeteer").default ??
  require("@prerenderer/renderer-puppeteer");
import inlineEditPlugin from "./plugins/visual-editor/vite-plugin-react-inline-editor.js";
import editModeDevPlugin from "./plugins/visual-editor/vite-plugin-edit-mode.js";
import iframeRouteRestorationPlugin from "./plugins/vite-plugin-iframe-route-restoration.js";
import selectionModePlugin from "./plugins/selection-mode/vite-plugin-selection-mode.js";
const isDev = process.argv.includes("serve") || process.argv.includes("dev");
const enableLegacyPrerender = process.env.ENABLE_LEGACY_PRERENDER === "true";
const enableEditorDevPlugins = process.env.ENABLE_VISUAL_EDITOR_DEV === "true";
const defaultPrerenderRoutes = [
  "/",
  "/sobre",
  "/processo",
  "/projetos",
  "/store",
  "/arquitetura",
  "/engenharia",
  "/marcenaria",
];

const sitemapPath = path.resolve(__dirname, "public", "sitemap.xml");
const prerenderRoutesFromSitemap = (() => {
  try {
    if (!fs.existsSync(sitemapPath)) return [];
    const xml = fs.readFileSync(sitemapPath, "utf8");
    const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/gim)];
    return matches
      .map((m) => m[1]?.trim())
      .filter(Boolean)
      .map((loc) => {
        const url = new URL(loc);
        const pathname = url.pathname || "/";
        return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
      });
  } catch {
    return [];
  }
})();

const prerenderRoutes = Array.from(new Set([...defaultPrerenderRoutes, ...prerenderRoutesFromSitemap]));
const coreJsInternalsPath = path.resolve(
  __dirname,
  "node_modules/core-js/internals/define-global-property.js",
);

// Some tools are requesting a non-existent `define-globalThis-property` module from core-js.
// Alias it to the actual helper so Rollup can resolve and bundle correctly.
const coreJsAliasPlugin = {
  name: "corejs-define-globalthis-fix",
  resolveId(source) {
    if (source.includes("define-globalThis-property")) {
      return coreJsInternalsPath;
    }

    if (source.includes("globalThis-this")) {
      return path.resolve(
        __dirname,
        "node_modules/core-js/internals/global-this.js",
      );
    }
    return null;
  },
  load(id) {
    if (id.includes("define-globalThis-property")) {
      return fs.readFileSync(coreJsInternalsPath, "utf8");
    }
    if (id.includes("globalThis-this")) {
      return fs.readFileSync(
        path.resolve(__dirname, "node_modules/core-js/internals/global-this.js"),
        "utf8",
      );
    }
    return null;
  },
};

const configHorizonsViteErrorHandler = `
const observer = new MutationObserver((mutations) => {
	for (const mutation of mutations) {
		for (const addedNode of mutation.addedNodes) {
			if (
				addedNode.nodeType === Node.ELEMENT_NODE &&
				(
					addedNode.tagName?.toLowerCase() === 'vite-error-overlay' ||
					addedNode.classList?.contains('backdrop')
				)
			) {
				handleViteOverlay(addedNode);
			}
		}
	}
});

observer.observe(document.documentElement, {
	childList: true,
	subtree: true
});

function handleViteOverlay(node) {
	if (!node.shadowRoot) {
		return;
	}

	const backdrop = node.shadowRoot.querySelector('.backdrop');

	if (backdrop) {
		const overlayHtml = backdrop.outerHTML;
		const parser = new DOMParser();
		const doc = parser.parseFromString(overlayHtml, 'text/html');
		const messageBodyElement = doc.querySelector('.message-body');
		const fileElement = doc.querySelector('.file');
		const messageText = messageBodyElement ? messageBodyElement.textContent.trim() : '';
		const fileText = fileElement ? fileElement.textContent.trim() : '';
		const error = messageText + (fileText ? ' File:' + fileText : '');

		window.parent.postMessage({
			type: 'horizons-vite-error',
			error,
		}, '*');
	}
}
`;

const configHorizonsRuntimeErrorHandler = `
window.onerror = (message, source, lineno, colno, errorObj) => {
	const errorDetails = errorObj ? JSON.stringify({
		name: errorObj.name,
		message: errorObj.message,
		stack: errorObj.stack,
		source,
		lineno,
		colno,
	}) : null;

	window.parent.postMessage({
		type: 'horizons-runtime-error',
		message,
		error: errorDetails
	}, '*');
};
`;

const configHorizonsConsoleErrroHandler = `
const originalConsoleError = console.error;
console.error = function(...args) {
	originalConsoleError.apply(console, args);

	let errorString = '';

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg instanceof Error) {
			errorString = arg.stack || \`\${arg.name}: \${arg.message}\`;
			break;
		}
	}

	if (!errorString) {
		errorString = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
	}

	window.parent.postMessage({
		type: 'horizons-console-error',
		error: errorString
	}, '*');
};
`;

const configWindowFetchMonkeyPatch = `
const originalFetch = window.fetch;

window.fetch = function(...args) {
	const url = args[0] instanceof Request ? args[0].url : args[0];

	// Skip WebSocket URLs
	if (url.startsWith('ws:') || url.startsWith('wss:')) {
		return originalFetch.apply(this, args);
	}

	return originalFetch.apply(this, args)
		.then(async response => {
			const contentType = response.headers.get('Content-Type') || '';

			// Exclude HTML document responses
			const isDocumentResponse =
				contentType.includes('text/html') ||
				contentType.includes('application/xhtml+xml');

			if (!response.ok && !isDocumentResponse) {
					const responseClone = response.clone();
					const errorFromRes = await responseClone.text();
					const requestUrl = response.url;
					console.error(\`Fetch error from \${requestUrl}: \${errorFromRes}\`);
			}

			return response;
		})
		.catch(error => {
			const targetUrl = url.toLowerCase();
			if (!targetUrl.endsWith('.html') && !targetUrl.endsWith('.htm')) {
				console.error(error);
			}

			throw error;
		});
};
`;

const configNavigationHandler = `
if (window.navigation && window.self !== window.top) {
	window.navigation.addEventListener('navigate', (event) => {
		const url = event.destination.url;

		try {
			const destinationUrl = new URL(url);
			const destinationOrigin = destinationUrl.origin;
			const currentOrigin = window.location.origin;

			if (destinationOrigin === currentOrigin) {
				return;
			}
		} catch (error) {
			return;
		}

		window.parent.postMessage({
			type: 'horizons-navigation-error',
			url,
		}, '*');
	});
}
`;

const enableHorizonsMonitoring = process.env.HORIZONS_EMBED === "true";

const addTransformIndexHtml = {
  name: "add-transform-index-html",
  transformIndexHtml(html) {
    const optimizedHtml = html
      .replace(/<link rel="modulepreload"[^>]*vendor-supabase[^>]*>\s*/g, "")
      .replace(/<link rel="modulepreload"[^>]*vendor-motion[^>]*>\s*/g, "");

    const tags = [];

    // Horizons iframe monitoring — only when embedded (adds TBT overhead)
    if (enableHorizonsMonitoring) {
      tags.push(
        { tag: "script", attrs: { type: "module" }, children: configHorizonsRuntimeErrorHandler, injectTo: "head" },
        { tag: "script", attrs: { type: "module" }, children: configHorizonsViteErrorHandler, injectTo: "head" },
        { tag: "script", attrs: { type: "module" }, children: configHorizonsConsoleErrroHandler, injectTo: "head" },
        { tag: "script", attrs: { type: "module" }, children: configWindowFetchMonkeyPatch, injectTo: "head" },
        { tag: "script", attrs: { type: "module" }, children: configNavigationHandler, injectTo: "head" },
      );
    }

    if (
      !isDev &&
      process.env.TEMPLATE_BANNER_SCRIPT_URL &&
      process.env.TEMPLATE_REDIRECT_URL
    ) {
      tags.push({
        tag: "script",
        attrs: {
          src: process.env.TEMPLATE_BANNER_SCRIPT_URL,
          "template-redirect-url": process.env.TEMPLATE_REDIRECT_URL,
        },
        injectTo: "head",
      });
    }

    return {
      html: optimizedHtml,
      tags,
    };
  },
};

console.warn = () => {};

const logger = createLogger();
const loggerError = logger.error;

logger.error = (msg, options) => {
  if (options?.error?.toString().includes("CssSyntaxError: [postcss]")) {
    return;
  }

  loggerError(msg, options);
};

export default defineConfig({
  appType: "spa",
  customLogger: logger,
  plugins: [
    ...(isDev && enableEditorDevPlugins
      ? [
          inlineEditPlugin(),
          editModeDevPlugin(),
          iframeRouteRestorationPlugin(),
          selectionModePlugin(),
        ]
      : []),
    react(),
    ...(!isDev && enableLegacyPrerender && typeof vitePrerender === "function"
      ? [
          vitePrerender({
            staticDir: path.join(__dirname, "dist"),
            routes: prerenderRoutes,
            renderer: new PuppeteerRenderer({
              renderAfterDocumentEvent: "prerender-ready",
              maxConcurrentRoutes: 4,
              headless: true,
            }),
          }),
        ]
      : []),
    ...(!isDev ? [addTransformIndexHtml] : []),
    coreJsAliasPlugin,
    // Compressão Gzip + Brotli dos assets no build
    ...(!isDev
      ? [
          compression({ algorithm: "gzip", threshold: 1024 }),
          compression({ algorithm: "brotliCompress", threshold: 1024 }),
        ]
      : []),
    // Bundle analyzer — gera stats.html na raiz após build
    ...(!isDev && process.env.ANALYZE === "true"
      ? [
          visualizer({
            filename: "stats.html",
            open: true,
            gzipSize: true,
            brotliSize: true,
          }),
        ]
      : []),
  ],
  server: {
    cors: true,
    headers: {
      "Cross-Origin-Embedder-Policy": "credentialless",
    },
    allowedHosts: true,
  },
  resolve: {
    extensions: [".jsx", ".js", ".tsx", ".ts", ".json"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: "globalThis",
    "process.env": {},
  },
  optimizeDeps: {
    include: [],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  build: {
    // Otimizar tamanho do bundle
    target: "es2020",
    // Desabilitar polyfill de modulepreload (browsers modernos suportam nativamente)
    modulePreload: { polyfill: false },
    minify: "esbuild",
    emptyOutDir: true,
    outDir: process.env.BUILD_OUT_DIR || "dist",
    rollupOptions: {
      external: [
        "@babel/parser",
        "@babel/traverse",
        "@babel/generator",
        "@babel/types",
      ],
      output: {
        // Code splitting manual para melhor cache
        manualChunks(id) {
          // Módulo virtual do Vite para preload dinâmico.
          // Se ficar no chunk do Supabase, ele puxa vendor-supabase no first paint.
          if (id.includes("vite/preload-helper")) {
            return "vendor-runtime";
          }

          // Separar vendor chunks para melhor cache e performance
          if (id.includes("node_modules")) {
            // Lucide icons
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
            // React core - critico, carrega primeiro
            if (
              id.includes("/react/") ||
              id.includes("\\react\\") ||
              id.includes("/react-dom/") ||
              id.includes("\\react-dom\\") ||
              id.includes("/react-router") ||
              id.includes("\\react-router") ||
              id.includes("react-router")
            ) {
              return "vendor-react";
            }
            // UI components
            if (id.includes("@radix-ui")) {
              return "vendor-ui";
            }
            // Supabase - lazy loaded
            if (id.includes("@supabase")) {
              return "vendor-supabase";
            }
            // Framer Motion - animacoes, pode ser deferido
            if (id.includes("framer-motion")) {
              return "vendor-motion";
            }
          }
        },
        // Nomes com hash para cache
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    // Aumentar limite de aviso de chunk
    chunkSizeWarningLimit: 500,
  },
});
