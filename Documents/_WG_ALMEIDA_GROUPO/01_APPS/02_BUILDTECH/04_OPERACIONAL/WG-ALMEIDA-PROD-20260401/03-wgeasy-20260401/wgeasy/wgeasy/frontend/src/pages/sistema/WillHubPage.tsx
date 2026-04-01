import React, { useEffect, useRef, useState } from "react";

const WillHubPage: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [externalSrc, _setExternalSrc] = useState<string | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const onLoad = async () => {
      try {
        // If the iframe is loaded from another origin, accessing its document will throw.
        // We attempt to access it and if blocked, skip DOM injection.
        let doc: Document | null = null;
        try {
          doc = iframe.contentDocument || iframe.contentWindow?.document || null;
        } catch {
          doc = null;
        }

        // If doc is null, it's cross-origin and we must not attempt DOM injection.
        if (!doc) {
          return;
        }

        // Aplica variáveis CSS no root do iframe
        const root = doc.documentElement;
        if (root) {
          root.style.setProperty('--primary', '14 85% 52%');
          root.style.setProperty('--foreground', '220 20% 12%');
          root.style.setProperty('--background', '40 25% 97%');
          root.style.setProperty('--card', '0 0% 100%');
          root.style.setProperty('font-family', "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif");
        }

        // Injeta CSS override
        const existing = doc.getElementById('willhub-override-styles');
        if (existing) existing.remove();
        const style = doc.createElement('style');
        style.id = 'willhub-override-styles';
        style.textContent = `
          /* Tokens principais (usamos HSL-like tokens via CSS color functions) */
          :root {
            --primary-h: 14; --primary-s: 85%; --primary-l: 52%;
            --primary: 14 85% 52% !important;
            --foreground: 220 20% 12% !important;
            --background: 40 25% 97% !important;
            --card: 0 0% 100% !important;
            --radius: 10px;
            --wg-font-sans: system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
          }

          /* Tipografia base */
          html, body, #root { font-family: var(--wg-font-sans) !important; color: hsl(var(--foreground)) !important; background: hsl(var(--background)) !important; }
          h1,h2,h3,h4,h5,h6 { font-family: var(--wg-font-sans) !important; }
          p, span, a, li, button, input, label { font-family: var(--wg-font-sans) !important; }

          /* Ajustes visuais */
          :root { --br: var(--radius); }
          .text-gradient { background: linear-gradient(135deg, hsl(var(--primary)), rgba(224,191,133,0.95)) !important; -webkit-background-clip: text; -webkit-text-fill-color: transparent !important; }
          img.willhub-avatar { border-radius: 9999px !important; width:48px !important; height:48px !important; object-fit:cover !important }
          .glass-card { box-shadow: 0 6px 18px rgba(0,0,0,0.08) !important; border-radius: var(--br) !important }

          /* Pequenas melhorias de legibilidade */
          button, a, input, textarea { transition: box-shadow 120ms ease, transform 120ms ease !important }
          a { color: hsl(var(--primary)) !important; }

          /* Forçar contraste em componentes problemáticos */
          .btn, .button, .card { border-radius: var(--br) !important }
        `;
        if (doc.head) doc.head.appendChild(style);

        // Padroniza avatares se possível
        const imgs = Array.from(doc.querySelectorAll('img')) as HTMLImageElement[];
        imgs.forEach((img) => {
          const src = (img.getAttribute('src') || '').toLowerCase();
          const alt = (img.getAttribute('alt') || '').toLowerCase();
          if (src.includes('avatar') || alt.includes('avatar') || img.classList.contains('avatar')) {
            img.src = '/imagens/wg-avatar.png';
            img.classList.add('willhub-avatar');
          }
        });

        // InserçÍo resiliente do item 'Theo' no menu lateral do WillHub.
        // O Hub renderiza o menu dinamicamente, entÍo usamos uma funçÍo de tentativa
        // e um MutationObserver para garantir a inserçÍo assim que o container aparecer.
        const insertTheoIfMissing = () => {
          try {
            // helper: busca o container de menu de forma adaptativa
            const findMenuContainer = (): HTMLElement | null => {
              const selectors = ['aside', '.sidebar', '#sidebar', 'nav[role="navigation"]', 'nav', '.menu', '.left-menu', '.sidenav', '.side'];
              for (const s of selectors) {
                const el = doc.querySelector(s) as HTMLElement | null;
                if (el && /Painel|Agenda|Tarefas|Projetos|Sonhos/i.test(el.innerText || '')) return el;
              }

              // busca por elementos que contenham vários links de navegaçÍo com labels conhecidos
              const candidates = Array.from(doc.querySelectorAll('nav, aside, div, section')) as HTMLElement[];
              for (const c of candidates) {
                const links = c.querySelectorAll('a');
                if (links.length >= 3) {
                  const hasKnown = Array.from(links).some(a => /Painel|Agenda|Tarefas|Projetos|Sonhos|Humor|Notas/i.test(a.textContent || ''));
                  if (hasKnown) return c;
                }
              }
              return null;
            };

            const menu = findMenuContainer();
            if (!menu) return false;

            // Evitar duplicatas
            if (menu.querySelector('[data-wg-theo-link]')) return true;

            // Procura o container primário de itens de navegaçÍo
            const listContainer = (menu.querySelector('ul, [role="menu"], .nav-list, .menu-list, .nav, .menu') as HTMLElement) || menu;

            // Identifica o primeiro item real para clonar classes/estrutura
            const first = listContainer.querySelector('li, a, .nav-item, .nav-link') as HTMLElement | null;

            // Cria o link e conteúdo (ícone SVG + rótulo)
            const link = doc.createElement('a');
            link.setAttribute('data-wg-theo-link', '1');
            link.href = '/sistema/theo';
            link.style.cursor = 'pointer';
            link.style.display = 'flex';
            link.style.alignItems = 'center';
            link.style.gap = '0.5rem';

            const label = doc.createElement('span');
            label.textContent = 'Theo';

            const createDogSVG = () => {
              const svgNS = 'http://www.w3.org/2000/svg';
              const svg = doc.createElementNS(svgNS, 'svg');
              svg.setAttribute('viewBox', '0 0 24 24');
              svg.setAttribute('width', '18');
              svg.setAttribute('height', '18');
              svg.setAttribute('aria-hidden', 'true');
              svg.setAttribute('focusable', 'false');
              svg.style.display = 'inline-block';
              svg.style.verticalAlign = 'middle';
              const path = doc.createElementNS(svgNS, 'path');
              path.setAttribute('fill', 'currentColor');
              path.setAttribute('d', 'M5 13c-.3 0-.6.1-.8.3L3 15v4a1 1 0 001 1h3l1-2.2c.2-.4.6-.8 1.1-.9.5-.1 1-.2 1.5-.2 2.2 0 4 1.8 4 4v.1a1 1 0 001 1h3a1 1 0 001-1v-3.9c0-.6-.2-1.2-.6-1.7l-3.2-3.6A6 6 0 007 13z');
              svg.appendChild(path);
              return svg;
            };

            let iconNode: Element | null = null;
            const firstInnerSvg = first && first.querySelector ? (first.querySelector('svg') as SVGElement | null) : null;
            if (firstInnerSvg) {
              try {
                iconNode = firstInnerSvg.cloneNode(true) as Element;
                if (iconNode instanceof SVGElement) {
                  iconNode.setAttribute('width', '18');
                  iconNode.setAttribute('height', '18');
                  iconNode.setAttribute('aria-hidden', 'true');
                }
              } catch {
                iconNode = createDogSVG();
              }
            } else {
              iconNode = createDogSVG();
            }

            const iconWrap = doc.createElement('span');
            iconWrap.setAttribute('aria-hidden', 'true');
            iconWrap.style.display = 'inline-flex';
            iconWrap.style.width = '20px';
            iconWrap.style.height = '20px';
            iconWrap.style.alignItems = 'center';
            iconWrap.style.justifyContent = 'center';
            if (iconNode) iconWrap.appendChild(iconNode);

            link.appendChild(iconWrap);
            link.appendChild(label);

            // Reaplica classes do Hub: tenta clonar classes do primeiro item/link para manter aparência
            if (first) {
              if (first.tagName.toLowerCase() === 'li') {
                const innerA = first.querySelector('a');
                const li = doc.createElement('li');
                li.className = first.className || '';
                if (innerA) {
                  link.className = innerA.className || '';
                } else {
                  link.className = first.className || '';
                }
                li.appendChild(link);
                listContainer.insertBefore(li, first);
              } else if (first.tagName.toLowerCase() === 'a') {
                // Insere antes do primeiro link
                link.className = first.className || '';
                listContainer.insertBefore(link, first);
              } else {
                // Caso genérico: adiciona ao container
                link.className = first.className || '';
                listContainer.insertBefore(link, first);
              }
            } else {
              // Sem referência, anexa no final
              link.className = 'nav-item';
              listContainer.appendChild(link);
            }

            // Clique: comunica o app pai para navegar
            link.addEventListener('click', (e) => {
              try {
                e.preventDefault();
                if (window.parent && window.parent.postMessage) {
                  window.parent.postMessage({ type: 'WILLHUB_NAV', to: '/sistema/theo' }, window.location.origin);
                }
              } catch (postMessageError) {
                void postMessageError;
              }
            });

            return true;
          } catch {
            return false;
          }
        };

        // Tenta inserir imediatamente (caso o menu já exista)
        if (!insertTheoIfMissing()) {
          // Se falhar, observa mutações no body e tenta novamente quando nodos forem adicionados
          const observer = new MutationObserver(() => {
            if (insertTheoIfMissing()) {
              observer.disconnect();
            }
          });
          observer.observe(doc.body || doc.documentElement, { childList: true, subtree: true });

          // Safety timeout: desconecta após 10s
          setTimeout(() => {
            try { observer.disconnect(); } catch (disconnectError) { void disconnectError; }
          }, 10000);
        }
        } catch (e) {
        // cross-origin or other access issues
        console.warn('NÍo foi possível aplicar overrides ou inserir menu no iframe:', e);
      }
    };

    iframe.addEventListener('load', onLoad);
    return () => iframe.removeEventListener('load', onLoad);
  }, []);

  // Fetch the hub HTML once on mount and set to state to use as srcDoc.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await fetch('/willhub-v3.html');
        if (!mounted) return;
        if (resp.ok) {
          const text = await resp.text();
          setHtml(text);
        }
      } catch {
        // ignore: will fall back to wrapper
      }
    })();
    return () => { mounted = false };
  }, []);

  return (
    <div className="min-h-screen w-full">
      <div style={{height: 'calc(100vh)', width: '100%'}}>
        <iframe
          ref={iframeRef}
          srcDoc={html || undefined}
          src={
            externalSrc || (html ? undefined : "/willhub-wrapper.html")
          }
          title="WillHub"
          style={{width: '100%', height: '100%', border: '0'}}
        />
      </div>
    </div>
  );
};

export default WillHubPage;

