(() => {
  // Get configuration from script tag
  const script = document.currentScript;
  const widgetId =
    script?.dataset?.widgetId || script.getAttribute("data-widget-id");

  if (!widgetId) {
    console.error("AI Widget: data-widget-id is required");
    return;
  }

  // Configuration
  const config = {
    widgetId: widgetId,
    apiBaseUrl: "https://us-central1-clf-agent.cloudfunctions.net",
    name: script?.dataset?.name || "AI Assistant",
    color: script?.dataset?.color || "#007bff",
    position: script?.dataset?.position || "bottom-right",
  };

  // Create widget container
  const host = document.createElement("div");
  host.style.cssText = `
    position: fixed;
    z-index: 2147483647;
    bottom: 20px;
    ${config.position.includes("left") ? "left: 20px;" : "right: 20px;"}
  `;
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  // Widget styles
  const style = document.createElement("style");
  style.textContent = `
    * { box-sizing: border-box; }
    
    .widget-button {
      all: unset;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: 9999px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      background: ${config.color};
      color: white;
      font: 500 14px/1.2 system-ui, -apple-system, 'Segoe UI', Roboto;
      transition: transform 0.2s ease;
    }
    
    .widget-button:hover {
      transform: scale(1.05);
    }
    
    .widget-panel {
      position: fixed;
      ${config.position.includes("left") ? "left: 20px;" : "right: 20px;"}
      bottom: 80px;
      width: 380px;
      max-width: 90vw;
      height: 540px;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 16px 48px rgba(0,0,0,0.25);
      background: white;
      display: none;
      flex-direction: column;
    }
    
    .widget-panel.open {
      display: flex;
    }
    
    .widget-header {
      background: ${config.color};
      color: white;
      padding: 1rem;
      font: 600 16px/1.2 system-ui;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .close-button {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .chat-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .message {
      max-width: 80%;
      padding: 0.75rem 1rem;
      border-radius: 1rem;
      font: 14px/1.4 system-ui;
    }
    
    .message.user {
      align-self: flex-end;
      background: ${config.color};
      color: white;
      border-bottom-right-radius: 0.25rem;
    }
    
    .message.ai {
      align-self: flex-start;
      background: #f5f5f5;
      color: #333;
      border-bottom-left-radius: 0.25rem;
    }
    
    .input-container {
      padding: 1rem;
      border-top: 1px solid #e5e5e5;
      display: flex;
      gap: 0.5rem;
    }
    
    .message-input {
      flex: 1;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 1rem;
      font: 14px/1.2 system-ui;
      outline: none;
    }
    
    .send-button {
      padding: 0.75rem 1rem;
      background: ${config.color};
      color: white;
      border: none;
      border-radius: 1rem;
      cursor: pointer;
      font: 500 14px system-ui;
    }
    
    .send-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .typing-indicator {
      align-self: flex-start;
      padding: 0.75rem 1rem;
      background: #f5f5f5;
      border-radius: 1rem;
      border-bottom-left-radius: 0.25rem;
      font: 14px/1.4 system-ui;
      color: #666;
    }
    
    .typing-dots {
      display: inline-flex;
      gap: 2px;
    }
    
    .typing-dots span {
      width: 4px;
      height: 4px;
      background: #999;
      border-radius: 50%;
      animation: typing 1.4s infinite;
    }
    
    .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
    .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
    
    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-10px); }
    }
    
    .lead-form {
      padding: 1rem;
      border-top: 1px solid #e5e5e5;
      background: #f9f9f9;
    }
    
    .lead-form h3 {
      margin: 0 0 1rem 0;
      font: 600 16px/1.2 system-ui;
      color: #333;
    }
    
    .form-group {
      margin-bottom: 1rem;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 0.25rem;
      font: 500 14px system-ui;
      color: #555;
    }
    
    .form-group input {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 0.5rem;
      font: 14px system-ui;
    }
    
    .submit-button {
      width: 100%;
      padding: 0.75rem;
      background: ${config.color};
      color: white;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      font: 500 16px system-ui;
    }
  `;
  shadow.appendChild(style);

  // Widget HTML structure
  const widgetHTML = `
    <button class="widget-button" aria-label="${config.name}">
      💬 ${config.name}
    </button>
    <div class="widget-panel">
      <div class="widget-header">
        <span>${config.name}</span>
        <button class="close-button">×</button>
      </div>
      <div class="chat-container">
        <div class="messages"></div>
        <div class="input-container">
          <input type="text" class="message-input" placeholder="Type your message..." maxlength="500">
          <button class="send-button">Send</button>
        </div>
      </div>
    </div>
  `;

  shadow.innerHTML = widgetHTML;

  // Widget functionality
  const button = shadow.querySelector(".widget-button");
  const panel = shadow.querySelector(".widget-panel");
  const closeBtn = shadow.querySelector(".close-button");
  const messagesContainer = shadow.querySelector(".messages");
  const messageInput = shadow.querySelector(".message-input");
  const sendButton = shadow.querySelector(".send-button");

  let conversationId = null;
  let messageCount = 0;
  let sessionId = generateSessionId();

  // Event listeners
  button.addEventListener("click", togglePanel);
  closeBtn.addEventListener("click", closePanel);
  messageInput.addEventListener("keypress", handleKeyPress);
  sendButton.addEventListener("click", sendMessage);

  // Initialize with welcome message
  addMessage("ai", "Hello! How can I help you today?");

  function togglePanel() {
    panel.classList.toggle("open");
    if (panel.classList.contains("open")) {
      messageInput.focus();
      trackEvent("widget_opened");
    }
  }

  function closePanel() {
    panel.classList.remove("open");
    trackEvent("widget_closed");
  }

  function handleKeyPress(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    // Add user message
    addMessage("user", message);
    messageInput.value = "";
    sendButton.disabled = true;

    // Show typing indicator
    showTypingIndicator();

    try {
      // Save user message
      await saveChatMessage("user", message);

      // Send to AI and get response
      const aiResponse = await getAIResponse(message);

      // Remove typing indicator and add AI response
      hideTypingIndicator();
      addMessage("ai", aiResponse);

      // Save AI message
      await saveChatMessage("ai", aiResponse);

      // Check if should show lead form
      if (messageCount >= 3 && !hasShownLeadForm()) {
        showLeadForm();
      }
    } catch (error) {
      hideTypingIndicator();
      addMessage("ai", "Sorry, I encountered an error. Please try again.");
      console.error("Widget error:", error);
    }

    sendButton.disabled = false;
  }

  function addMessage(sender, text) {
    const messageEl = document.createElement("div");
    messageEl.className = `message ${sender}`;
    messageEl.textContent = text;
    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    messageCount++;
  }

  function showTypingIndicator() {
    const typingEl = document.createElement("div");
    typingEl.className = "typing-indicator";
    typingEl.innerHTML =
      'AI is typing<span class="typing-dots"><span></span><span></span><span></span></span>';
    messagesContainer.appendChild(typingEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function hideTypingIndicator() {
    const typingEl = shadow.querySelector(".typing-indicator");
    if (typingEl) typingEl.remove();
  }

  async function saveChatMessage(sender, message) {
    try {
      const messageData = {
        widgetId: config.widgetId,
        sessionId: sessionId,
        timestamp: new Date().toISOString(),
        sender: sender,
        message: message,
        metadata: {
          userAgent: navigator.userAgent,
          pageUrl: window.location.href,
          pageTitle: document.title,
        },
      };

      const response = await fetch(`${config.apiBaseUrl}/chatMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        throw new Error("Failed to save message");
      }

      const result = await response.json();
      if (!conversationId) {
        conversationId = result.conversationId;
      }
    } catch (error) {
      console.error("Error saving message:", error);
    }
  }

  async function getAIResponse(userMessage) {
    try {
      const response = await fetch(`${config.apiBaseUrl}/chatRespond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          widgetId: config.widgetId,
          message: userMessage,
          conversationId: conversationId,
          sessionId: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();
      return (
        data.message ||
        "I apologize, but I cannot provide a response right now. Please try again later."
      );
    } catch (error) {
      console.error("Error getting AI response:", error);
      return "I apologize, but I cannot provide a response right now. Please try again later.";
    }
  }

  function showLeadForm() {
    const leadFormHTML = `
      <div class="lead-form">
        <h3>Get personalized assistance</h3>
        <div class="form-group">
          <label>Name *</label>
          <input type="text" id="lead-name" required>
        </div>
        <div class="form-group">
          <label>Email *</label>
          <input type="email" id="lead-email" required>
        </div>
        <div class="form-group">
          <label>Phone</label>
          <input type="tel" id="lead-phone">
        </div>
        <button class="submit-button" onclick="submitLead()">Get Started</button>
      </div>
    `;

    const chatContainer = shadow.querySelector(".chat-container");
    chatContainer.insertAdjacentHTML("beforeend", leadFormHTML);

    // Add submitLead to shadow root context
    shadow.submitLead = submitLead;
  }

  async function submitLead() {
    const name = shadow.querySelector("#lead-name").value.trim();
    const email = shadow.querySelector("#lead-email").value.trim();
    const phone = shadow.querySelector("#lead-phone").value.trim();

    if (!name || !email) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const leadData = {
        widgetId: config.widgetId,
        conversationId: conversationId,
        sessionId: sessionId,
        leadName: name,
        leadEmail: email,
        leadPhone: phone,
        leadSource: window.location.href,
        capturedAt: new Date().toISOString(),
        conversation: getConversationHistory(),
      };

      const response = await fetch(`${config.apiBaseUrl}/leadsCapture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(leadData),
      });

      if (response.ok) {
        shadow.querySelector(".lead-form").innerHTML =
          '<div style="text-align: center; padding: 2rem;"><h3>Thank you!</h3><p>We\'ll be in touch soon.</p></div>';
        trackEvent("lead_captured");
        setTimeout(() => closePanel(), 2000);
      } else {
        throw new Error("Failed to submit lead");
      }
    } catch (error) {
      console.error("Error submitting lead:", error);
      alert(
        "There was an error submitting your information. Please try again."
      );
    }
  }

  function getConversationHistory() {
    const messages = shadow.querySelectorAll(".message");
    return Array.from(messages).map((msg) => ({
      sender: msg.classList.contains("user") ? "user" : "ai",
      message: msg.textContent,
      timestamp: new Date().toISOString(),
    }));
  }

  function hasShownLeadForm() {
    return shadow.querySelector(".lead-form") !== null;
  }

  function generateSessionId() {
    return (
      "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  async function trackEvent(eventType) {
    try {
      await fetch(`${config.apiBaseUrl}/analyticsTrack`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          widgetId: config.widgetId,
          eventType: eventType,
          timestamp: new Date().toISOString(),
          pageUrl: window.location.href,
        }),
      });
    } catch (error) {
      console.error("Error tracking event:", error);
    }
  }

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel.classList.contains("open")) {
      closePanel();
    }
  });

  // Initialize tracking
  trackEvent("widget_loaded");
})();
