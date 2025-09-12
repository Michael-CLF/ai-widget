// loader-iframe.js
(() => {
  // Find the loader <script> tag (this tag itself)
  const script = document.currentScript || document.querySelector('script[data-widget-id]');
  if (!script) return;

  // Config from data-* attrs with sane defaults
  const cfg = {
    widgetId: script.getAttribute('data-widget-id') || '',
    apiBaseUrl: script.getAttribute('data-api-base-url') || 'https://us-central1-clf-agent.cloudfunctions.net',
    name: script.getAttribute('data-name') || 'AI Assistant',
    color: script.getAttribute('data-color') || '#02474d',
    position: (script.getAttribute('data-position') || 'bottom-right').toLowerCase(), // "bottom-right" | "bottom-left"
    siteName: script.getAttribute('data-site-name') || (document.title || location.hostname),
    verticals: script.getAttribute('data-verticals') || 'real_estate,mortgage',
    // Sizing — tweak if you like
    width: parseInt(script.getAttribute('data-width') || '380', 10),
    height: parseInt(script.getAttribute('data-height') || '560', 10),
  };

  if (!cfg.widgetId) {
    console.warn('AI Widget: data-widget-id is required on the loader tag.');
    return;
  }

  // Build iframe src with query params (so widget.html can read config)
  const qs = new URLSearchParams({
    widgetId: cfg.widgetId,
    apiBaseUrl: cfg.apiBaseUrl,
    name: cfg.name,
    color: cfg.color,
    siteName: cfg.siteName,
    verticals: cfg.verticals,
    chatEndpoint: script.getAttribute('data-chat-endpoint') || '/claudeChat'    
  }).toString();

  const iframe = document.createElement('iframe');
  iframe.src = `https://michael-clf.github.io/ai-widget/widget.html?${qs}`;
  iframe.title = cfg.name;
  iframe.setAttribute('aria-label', cfg.name);
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
  `;

  // Optional: allow page-less features safely (no camera/mic by default)
  iframe.allow = 'clipboard-read; clipboard-write';

  // Append late to avoid layout jank
  const append = () => document.body.appendChild(iframe);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', append);
  } else {
    append();
  }
})();
