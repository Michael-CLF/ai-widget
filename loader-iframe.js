// loader-iframe.js (full file)
(() => {
  // ---- Duplicate guard ------------------------------------------------------
  if (window.__aiWidgetLoaded__) return;
  window.__aiWidgetLoaded__ = true;

  // ---- Script & config -------------------------------------------------------
  const script =
    document.currentScript || document.querySelector('script[data-widget-id]');
  if (!script) return;

  const cfg = {
    widgetId: script.getAttribute('data-widget-id') || '',
    apiBaseUrl:
      script.getAttribute('data-api-base-url') ||
      'https://us-central1-clf-agent.cloudfunctions.net',
    name: script.getAttribute('data-name') || 'AI Assistant',
    color: script.getAttribute('data-color') || '#02474d',
    position: (script.getAttribute('data-position') || 'bottom-right')
      .toLowerCase(), // "bottom-right" | "bottom-left"
    siteName: script.getAttribute('data-site-name') || document.title || location.hostname,
    verticals: script.getAttribute('data-verticals') || 'real_estate,mortgage',
    chatEndpoint: script.getAttribute('data-chat-endpoint') || '/claudeChat',
    // Optional: choose a specific vertical folder (widgets/<vertical>/widget.html)
    vertical: (script.getAttribute('data-vertical') || 'mortgage').trim().toLowerCase(),
    width: parseInt(script.getAttribute('data-width') || '380', 10),
    height: parseInt(script.getAttribute('data-height') || '560', 10),
  };

  if (!cfg.widgetId) {
    console.warn('AI Widget: data-widget-id is required on the loader tag.');
    return;
  }

  // ---- Build iframe src ------------------------------------------------------
  const qs = new URLSearchParams({
    widgetId: cfg.widgetId,
    apiBaseUrl: cfg.apiBaseUrl,
    name: cfg.name,
    color: cfg.color,
    siteName: cfg.siteName,
    verticals: cfg.verticals,
    chatEndpoint: cfg.chatEndpoint,
  }).toString();

  // Default to root widget.html; if data-vertical is present, use folder variant
  // Build iframe path from the selected vertical (no root fallback)
const widgetPath =
  `https://michael-clf.github.io/ai-widget/widgets/${encodeURIComponent(cfg.vertical)}/widget.html?${qs}`;

  // ---- Elements --------------------------------------------------------------
  const iframe = document.createElement('iframe');
  iframe.src = widgetPath;
  iframe.title = cfg.name;
  iframe.setAttribute('aria-label', cfg.name);
  iframe.allow = 'clipboard-read; clipboard-write';
  iframe.style.cssText = `
    position: fixed;
    z-index: 2147483647;
    bottom: 20px;
    ${cfg.position.includes('left') ? 'left: 20px;' : 'right: 20px;'}
    width: ${cfg.width}px;
    height: ${cfg.height}px;
    border: 0;
    border-radius: 16px;
    box-shadow: 0 16px 48px rgba(0,0,0,.25);
    background: transparent;
    overflow: hidden;
    display: none; /* start closed */
  `;

  // Launcher (chat bubble) – shown when widget is closed
  const launcher = document.createElement('button');
  launcher.type = 'button';
  launcher.setAttribute('aria-label', cfg.name);
  launcher.textContent = '💬';
  launcher.style.cssText = `
    position: fixed;
    z-index: 2147483647;
    bottom: 20px;
    ${cfg.position.includes('left') ? 'left: 20px;' : 'right: 20px;'}
    width: 56px; height: 56px;
    border-radius: 50%;
    border: 0;
    box-shadow: 0 8px 24px rgba(0,0,0,.20);
    background: ${cfg.color};
    color: #fff;
    font-size: 24px;
    line-height: 1;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: transform .15s ease;
  `;
  launcher.addEventListener('mouseenter', () => (launcher.style.transform = 'scale(1.05)'));
  launcher.addEventListener('mouseleave', () => (launcher.style.transform = 'scale(1)'));

  // ---- Open/close helpers ----------------------------------------------------
  function openWidget() {
    iframe.style.display = 'block';
    launcher.style.display = 'none';
  }
  function closeWidget() {
    iframe.style.display = 'none';
    launcher.style.display = 'flex';
  }

  launcher.addEventListener('click', openWidget);

  // Listen for CLOSE messages from the iframe (when user clicks the X inside)
  window.addEventListener('message', (e) => {
    // Optionally verify origin:
    // if (e.origin !== 'https://michael-clf.github.io') return;
    const data = e && e.data;
    if (data && data.source === 'ai-widget' && data.type === 'CLOSE') {
      closeWidget();
    }
  });

  // Optional: close on Escape when focus is outside iframe
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && iframe.style.display !== 'none') closeWidget();
  });

  // ---- Append to DOM (start closed) -----------------------------------------
  const append = () => {
    document.body.appendChild(iframe);
    document.body.appendChild(launcher); // launcher visible by default
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', append);
  } else {
    append();
  }

  // ---- Responsive tweak (small screens) -------------------------------------
  function applyResponsiveSize() {
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    const w = Math.min(cfg.width, Math.floor(vw * 0.95));
    const h = Math.min(cfg.height, Math.floor(vh * 0.80));
    iframe.style.width = `${w}px`;
    iframe.style.height = `${h}px`;
  }
  applyResponsiveSize();
  window.addEventListener('resize', applyResponsiveSize);
})();
