(() => {
  function initWidget() {
    // 1) Script + config
    const script = document.currentScript || document.querySelector('script[data-widget-id]');
    const widgetId = script?.dataset?.widgetId || script?.getAttribute('data-widget-id');

    if (!widgetId) {
      console.error('AI Widget: data-widget-id is required');
      return;
    }

    const config = {
      widgetId,
      apiBaseUrl: script?.dataset?.apiBaseUrl || 'https://us-central1-clf-agent.cloudfunctions.net',
      name: script?.dataset?.name || 'AI Assistant',
      color: script?.dataset?.color || '#007bff',
      position: script?.dataset?.position || 'bottom-right',
      // New: vertical/context hints to push the bot toward RE/Mortgage
      verticals: (script?.dataset?.verticals || 'real_estate,mortgage')
        .split(',')
        .map(v => v.trim())
        .filter(Boolean),
      siteName: script?.dataset?.siteName || document.title || location.hostname
    };

    // 2) Host + shadow root
    const host = document.createElement('div');
    host.style.cssText = `
      position: fixed;
      z-index: 2147483647;
      bottom: 20px;
      ${config.position.includes('left') ? 'left: 20px;' : 'right: 20px;'}
    `;
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });

    // 3) Styles
    const styles = `
      * { box-sizing: border-box; }

      .widget-button {
        all: unset; cursor: pointer; display: flex; align-items: center; gap: .5rem;
        padding: .75rem 1rem; border-radius: 9999px; box-shadow: 0 8px 24px rgba(0,0,0,.15);
        background: ${config.color}; color: #fff; font: 500 14px/1.2 system-ui, -apple-system, 'Segoe UI', Roboto;
        transition: transform .2s ease;
      }
      .widget-button:hover { transform: scale(1.05); }

      .widget-panel {
        position: fixed;
        ${config.position.includes('left') ? 'left: 20px;' : 'right: 20px;'}
        bottom: 80px; width: 380px; max-width: 90vw; height: 560px;
        border-radius: 16px; overflow: hidden; box-shadow: 0 16px 48px rgba(0,0,0,.25);
        background: #fff; display: none; flex-direction: column;
      }
      .widget-panel.open { display: flex; }

      .widget-header {
        background: ${config.color}; color: #fff; padding: 1rem;
        font: 600 16px/1.2 system-ui; display: flex; justify-content: space-between; align-items: center;
      }
      .close-button {
        background: none; border: none; color: #fff; font-size: 20px; cursor: pointer; padding: 0;
        width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
      }

      .chat-container { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

      /* Messages take the main vertical space */
      .messages {
        flex: 1 1 auto; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 1rem;
        background: #fff;
      }

      .message { max-width: 80%; padding: .75rem 1rem; border-radius: 1rem; font: 14px/1.4 system-ui; }
      .message.user { align-self: flex-end; background: ${config.color}; color: #fff; border-bottom-right-radius: .25rem; }
      .message.ai   { align-self: flex-start; background: #f5f5f5; color: #333; border-bottom-left-radius: .25rem; }

      /* CTA bar (non-blocking) */
      .cta-bar {
        flex: 0 0 auto; display: none; padding: .5rem .75rem; border-top: 1px solid #eee; background: #fafafa;
        align-items: center; justify-content: space-between; gap: .5rem;
      }
      .cta-bar.show { display: flex; }
      .cta-bar .cta-text { font: 500 13px/1.2 system-ui; color: #333; }
      .cta-bar .cta-button {
        border: none; border-radius: 9999px; padding: .5rem .75rem; cursor: pointer;
        font: 500 13px system-ui; background: ${config.color}; color: #fff;
      }

      /* Input row stays at the bottom */
      .input-container {
        flex: 0 0 auto; padding: .75rem; border-top: 1px solid #e5e5e5; display: flex; gap: .5rem; background: #fff;
      }
      .message-input {
        flex: 1; padding: .75rem; border: 1px solid #ddd; border-radius: 1rem; font: 14px/1.2 system-ui; outline: none;
      }
      .send-button {
        padding: .75rem 1rem; background: ${config.color}; color: #fff; border: none; border-radius: 1rem;
        cursor: pointer; font: 500 14px system-ui;
      }
      .send-button:disabled { opacity: .5; cursor: not-allowed; }

      .typing-indicator {
        align-self: flex-start; padding: .75rem 1rem; background: #f5f5f5; border-radius: 1rem; border-bottom-left-radius: .25rem;
        font: 14px/1.4 system-ui; color: #666;
      }
      .typing-dots { display: inline-flex; gap: 2px; }
      .typing-dots span { width: 4px; height: 4px; background: #999; border-radius: 50%; animation: typing 1.4s infinite; }
      .typing-dots span:nth-child(2) { animation-delay: .2s; }
      .typing-dots span:nth-child(3) { animation-delay: .4s; }
      @keyframes typing { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-10px); } }

      /* Slide-up lead form - hidden by default, never overlays messages until opened intentionally */
      .lead-form {
        position: relative;
        display: none;
        padding: 1rem;
        border-top: 1px solid #e5e5e5;
        background: #f9f9f9;
      }
      .lead-form.open { display: block; }

      .lead-form h3 { margin: 0 0 .75rem 0; font: 600 16px/1.2 system-ui; color: #333; }
      .form-group { margin-bottom: .75rem; }
      .form-group label { display: block; margin-bottom: .25rem; font: 500 14px system-ui; color: #555; }
      .form-group input {
        width: 100%; padding: .5rem; border: 1px solid #ddd; border-radius: .5rem; font: 14px system-ui;
      }
      .lead-actions { display: flex; gap: .5rem; margin-top: .5rem; }
      .submit-button, .close-form-button {
        flex: 1; padding: .65rem .75rem; border: none; border-radius: .5rem; cursor: pointer; font: 500 14px system-ui;
      }
      .submit-button { background: ${config.color}; color: #fff; }
      .close-form-button { background: #e9ecef; color: #333; }
    `;

    // 4) Markup
    const widgetHTML = `
      <style>${styles}</style>

      <button class="widget-button" aria-label="${config.name}">💬 ${config.name}</button>

      <div class="widget-panel" role="dialog" aria-label="${config.name}">
        <div class="widget-header">
          <span>${config.name}</span>
          <button class="close-button" aria-label="Close">×</button>
        </div>

        <div class="chat-container">
          <div class="messages" aria-live="polite"></div>

          <div class="cta-bar" id="cta-bar">
            <div class="cta-text">Want tailored options?</div>
            <button class="cta-button" id="open-lead-form">Request more info</button>
          </div>

          <div class="lead-form" id="lead-form" aria-hidden="true">
            <h3>Get personalized assistance</h3>
            <form id="lead-form-element">
              <div class="form-group">
                <label for="lead-name">Name *</label>
                <input type="text" id="lead-name" required />
              </div>
              <div class="form-group">
                <label for="lead-email">Email *</label>
                <input type="email" id="lead-email" required />
              </div>
              <div class="form-group">
                <label for="lead-phone">Phone</label>
                <input type="tel" id="lead-phone" />
              </div>
              <div class="lead-actions">
                <button type="submit" class="submit-button">Get Started</button>
                <button type="button" class="close-form-button" id="close-lead-form">Close form</button>
              </div>
            </form>
          </div>

          <div class="input-container">
            <input type="text" class="message-input" placeholder="Type your message..." maxlength="500" />
            <button class="send-button">Send</button>
          </div>
        </div>
      </div>
    `;
    shadow.innerHTML = widgetHTML;

    // 5) Elements
    const button = shadow.querySelector('.widget-button');
    const panel = shadow.querySelector('.widget-panel');
    const closeBtn = shadow.querySelector('.close-button');
    const messagesContainer = shadow.querySelector('.messages');
    const messageInput = shadow.querySelector('.message-input');
    const sendButton = shadow.querySelector('.send-button');

    const ctaBar = shadow.querySelector('#cta-bar');
    const openLeadBtn = shadow.querySelector('#open-lead-form');
    const closeLeadBtn = shadow.querySelector('#close-lead-form');
    const leadForm = shadow.querySelector('#lead-form');
    const leadFormEl = shadow.querySelector('#lead-form-element');

    // 6) State
    let conversationId = null;
    let messageCount = 0;
    let sessionId = generateSessionId();

    // 7) Events
    button.addEventListener('click', togglePanel);
    closeBtn.addEventListener('click', closePanel);
    messageInput.addEventListener('keypress', handleKeyPress);
    sendButton.addEventListener('click', sendMessage);

    openLeadBtn.addEventListener('click', () => toggleLeadForm(true));
    closeLeadBtn.addEventListener('click', () => toggleLeadForm(false));
    leadFormEl.addEventListener('submit', submitLead);

    // Greeting
    addMessage('ai', 'Hello! I can answer questions about real estate and mortgages—how can I help?');

    // 8) UI handlers
    function togglePanel() {
      panel.classList.toggle('open');
      if (panel.classList.contains('open')) {
        messageInput.focus();
        trackEvent('widget_opened');
      }
    }
    function closePanel() {
      panel.classList.remove('open');
      toggleLeadForm(false);
      trackEvent('widget_closed');
    }
    function handleKeyPress(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    }

    // 9) Chat
    async function sendMessage() {
      const message = messageInput.value.trim();
      if (!message) return;

      addMessage('user', message);
      messageInput.value = '';
      sendButton.disabled = true;

      showTypingIndicator();

      try {
        await saveChatMessage('user', message);

        // Include strong vertical hints with every request
        const aiResponse = await getAIResponse(message, {
          verticals: config.verticals,
          siteName: config.siteName,
          pageUrl: window.location.href
        });

        hideTypingIndicator();
        addMessage('ai', aiResponse);
        await saveChatMessage('ai', aiResponse);

        // Non-blocking nudge: show CTA after 3+ messages
        if (messageCount >= 3) ctaBar.classList.add('show');
      } catch (err) {
        hideTypingIndicator();
        addMessage('ai', 'Sorry, I encountered an error. Please try again.');
        console.error('Widget error:', err);
      } finally {
        sendButton.disabled = false;
      }
    }

    function addMessage(sender, text) {
      const el = document.createElement('div');
      el.className = `message ${sender}`;
      el.textContent = text;
      messagesContainer.appendChild(el);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      messageCount++;
    }

    function showTypingIndicator() {
      const el = document.createElement('div');
      el.className = 'typing-indicator';
      el.innerHTML = 'AI is typing<span class="typing-dots"><span></span><span></span><span></span></span>';
      messagesContainer.appendChild(el);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    function hideTypingIndicator() {
      const el = shadow.querySelector('.typing-indicator');
      if (el) el.remove();
    }

    // 10) Network
    async function saveChatMessage(sender, message) {
      try {
        const payload = {
          widgetId: config.widgetId,
          sessionId,
          timestamp: new Date().toISOString(),
          sender,
          message,
          metadata: {
            userAgent: navigator.userAgent,
            pageUrl: window.location.href,
            pageTitle: document.title,
            verticals: config.verticals,
            siteName: config.siteName
          }
        };

        const res = await fetch(`${config.apiBaseUrl}/chatMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Failed to save message');

        const result = await res.json();
        if (!conversationId && result?.conversationId) {
          conversationId = result.conversationId;
        }
      } catch (e) {
        console.error('Error saving message:', e);
      }
    }

    async function getAIResponse(userMessage, context) {
      try {
        const res = await fetch(`${config.apiBaseUrl}/chatRespond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            widgetId: config.widgetId,
            message: userMessage,
            conversationId,
            sessionId,
            // Push clear domain hints so the backend can steer the model
            context
          })
        });

        if (!res.ok) throw new Error('Failed to get AI response');

        const data = await res.json();
        return (
          data.message ||
          'I apologize, but I cannot provide a response right now. Please try again later.'
        );
      } catch (e) {
        console.error('Error getting AI response:', e);
        return 'I apologize, but I cannot provide a response right now. Please try again later.';
      }
    }

    // 11) Lead form (never auto-blocks messages)
    function toggleLeadForm(open) {
      if (open) {
        leadForm.classList.add('open');
        leadForm.setAttribute('aria-hidden', 'false');
        // Make sure it’s visible without covering answers: it sits below messages + CTA
        ctaBar.classList.remove('show'); // hide CTA once open
        trackEvent('lead_form_opened');
      } else {
        leadForm.classList.remove('open');
        leadForm.setAttribute('aria-hidden', 'true');
      }
    }

    async function submitLead(e) {
      e.preventDefault();
      const name = shadow.querySelector('#lead-name').value.trim();
      const email = shadow.querySelector('#lead-email').value.trim();
      const phone = shadow.querySelector('#lead-phone').value.trim();

      if (!name || !email) {
        alert('Please fill in all required fields.');
        return;
      }

      try {
        const leadData = {
          widgetId: config.widgetId,
          conversationId,
          sessionId,
          leadName: name,
          leadEmail: email,
          leadPhone: phone,
          leadSource: window.location.href,
          capturedAt: new Date().toISOString(),
          conversation: getConversationHistory(),
          verticals: config.verticals,
          siteName: config.siteName
        };

        const res = await fetch(`${config.apiBaseUrl}/leadsCapture`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadData)
        });

        if (res.ok) {
          leadForm.innerHTML =
            '<div style="text-align:center; padding:1.5rem;"><h3>Thank you!</h3><p>We\'ll be in touch soon.</p></div>';
          trackEvent('lead_captured');
          setTimeout(() => closePanel(), 1600);
        } else {
          throw new Error('Failed to submit lead');
        }
      } catch (err) {
        console.error('Error submitting lead:', err);
        alert('There was an error submitting your information. Please try again.');
      }
    }

    function getConversationHistory() {
      const msgs = shadow.querySelectorAll('.message');
      return Array.from(msgs).map(m => ({
        sender: m.classList.contains('user') ? 'user' : 'ai',
        message: m.textContent,
        timestamp: new Date().toISOString()
      }));
    }

    function generateSessionId() {
      return 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
    }

    async function trackEvent(eventType) {
      try {
        await fetch(`${config.apiBaseUrl}/analyticsTrack`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            widgetId: config.widgetId,
            eventType,
            timestamp: new Date().toISOString(),
            pageUrl: window.location.href
          })
        });
      } catch (e) {
        console.error('Error tracking event:', e);
      }
    }

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
    });

    // First load event
    trackEvent('widget_loaded');
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})();
