(function () {
  const timeline = document.getElementById('chatTimeline');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('userInput');
  const clearBtn = document.getElementById('clearChatBtn');
  const quickActionContainer = document.querySelector('.quick-actions');

  const STORAGE_KEYS = {
    conversation: 'bizassist_conversation',
    profile: 'bizassist_profile',
    language: 'bizassist_language',
    analytics: 'bizassist_analytics',
    aiEnabled: 'bizassist_ai_enabled',
    apiKey: 'bizassist_api_key'
  };

  const Language = {
    EN: 'en',
    ES: 'es'
  };

  let currentLanguage = localStorage.getItem(STORAGE_KEYS.language) || Language.EN;
  let aiEnabled = localStorage.getItem(STORAGE_KEYS.aiEnabled) === 'true';
  let apiKey = localStorage.getItem(STORAGE_KEYS.apiKey) || '';

  const strings = {
    [Language.EN]: {
      welcome: "Hello! How can I help you today?",
      intro: "I’m your virtual assistant, here to help with questions and support.",
      you: 'You',
      bot: 'BizAssist',
      ask: 'Type your message...',
      cleared: 'Conversation cleared.',
      optionsIntro: 'Here are some things I can help with:',
      hours: 'Our office is open Monday through Friday, 9 AM to 6 PM.',
      location: 'We are located at 123 Business Ave, Suite 456.',
      contact: 'You can reach us at support@example.com or +1 (555) 000-1234.',
      pricing: 'We offer 3 packages: Basic, Premium, and Enterprise. Would you like a comparison?',
      returns: 'We offer free shipping over $50 and 30-day returns.',
      payments: 'We accept Visa, MasterCard, and PayPal.',
      ticketPrompt: 'Please describe the issue you\'re facing, and I\'ll create a support ticket.',
      ticketCreated: (id) => `Ticket created: ${id}. Our team will contact you soon.`,
      trackPrompt: 'Please enter your order ID to track your shipment.',
      trackResult: (id, eta) => `Order ${id} is in transit. Estimated delivery: ${eta}.`,
      assistPrompt: 'Please describe the product or issue and I\'ll help troubleshoot.',
      leadPrompt: 'Can I have your name and email to send more details?',
      thanksLead: (name) => `Thanks, ${name}. We\'ll follow up shortly.`,
      qualifyPrompt: 'What is your budget range? (e.g., <$100, $100-$500, >$500)',
      schedulePrompt: 'Would you like to book a demo? Available today: 2 PM or 4 PM.',
      scheduled: (slot) => `Demo booked for ${slot}. You\'ll receive a reminder.`,
      comparePlans: 'Standard vs Premium: Premium adds priority support and advanced features.',
      personalize: (name) => `Welcome back, ${name}! Continue where we left off?`,
      langSwitched: (lang) => `Language switched to ${lang === 'en' ? 'English' : 'Español'}.`,
      aiThinking: '🤖 AI is thinking...',
      aiError: 'AI response failed. Using fallback response.',
      aiSetup: 'AI features require an API key. Please enter your OpenAI API key.',
      aiEnabled: 'AI responses enabled!',
      aiDisabled: 'AI responses disabled. Using rule-based responses.'
    },
    [Language.ES]: {
      welcome: '¡Hola! ¿En qué puedo ayudarte hoy?',
      intro: 'Soy tu asistente virtual, aquí para ayudarte con preguntas y soporte.',
      you: 'Tú',
      bot: 'BizAssist',
      ask: 'Escribe tu mensaje...',
      cleared: 'Conversación borrada.',
      optionsIntro: 'Estas son algunas cosas con las que puedo ayudar:',
      hours: 'Abrimos de lunes a viernes, de 9 AM a 6 PM.',
      location: 'Estamos en 123 Business Ave, Oficina 456.',
      contact: 'Escríbenos a support@example.com o +1 (555) 000-1234.',
      pricing: 'Ofrecemos 3 planes: Básico, Premium y Enterprise. ¿Quieres una comparación?',
      returns: 'Envío gratis en pedidos > $50 y devoluciones en 30 días.',
      payments: 'Aceptamos Visa, MasterCard y PayPal.',
      ticketPrompt: 'Describe el problema y crearé un ticket de soporte.',
      ticketCreated: (id) => `Ticket creado: ${id}. Nuestro equipo te contactará pronto.`,
      trackPrompt: 'Ingresa tu ID de pedido para rastrear el envío.',
      trackResult: (id, eta) => `Pedido ${id} en tránsito. Entrega estimada: ${eta}.`,
      assistPrompt: 'Describe el producto o problema y te ayudaré.',
      leadPrompt: '¿Me das tu nombre y correo para enviarte más detalles?',
      thanksLead: (name) => `Gracias, ${name}. Te contactaremos en breve.`,
      qualifyPrompt: '¿Cuál es tu presupuesto? (p.ej., <$100, $100-$500, >$500)',
      schedulePrompt: '¿Quieres reservar una demo? Hoy: 2 PM o 4 PM.',
      scheduled: (slot) => `Demo reservada a las ${slot}. Recibirás un recordatorio.`,
      comparePlans: 'Estándar vs Premium: Premium incluye soporte prioritario y funciones avanzadas.',
      personalize: (name) => `¡Bienvenido de nuevo, ${name}! ¿Continuamos donde quedamos?`,
      langSwitched: (lang) => `Idioma cambiado a ${lang === 'en' ? 'English' : 'Español'}.`,
      aiThinking: '🤖 IA está pensando...',
      aiError: 'Respuesta de IA falló. Usando respuesta de respaldo.',
      aiSetup: 'Las funciones de IA requieren una clave API. Por favor ingresa tu clave API de OpenAI.',
      aiEnabled: '¡Respuestas de IA habilitadas!',
      aiDisabled: 'Respuestas de IA deshabilitadas. Usando respuestas basadas en reglas.'
    }
  };

  function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function load(key, fallback) {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    try { return JSON.parse(raw); } catch { return fallback; }
  }

  function randomId(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36).slice(-4)}`;
  }

  function nowPlus(days) {
    const d = new Date(Date.now() + days * 86400000);
    return d.toDateString();
  }

  function scrollToBottom() {
    timeline.scrollTop = timeline.scrollHeight;
  }

  // AI Response Functions
  async function getAIResponse(message) {
    if (!aiEnabled || !apiKey) {
      return null;
    }

    try {
      const conversationHistory = getConversationHistory();
      const systemPrompt = getSystemPrompt();
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: message }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('AI Response Error:', error);
      return null;
    }
  }

  function getConversationHistory() {
    const messages = Array.from(timeline.children).slice(-10); // Last 10 messages
    return messages.map(msg => {
      const role = msg.classList.contains('user') ? 'user' : 'assistant';
      const content = msg.querySelector('.bubble').textContent;
      return { role, content };
    });
  }

  function getSystemPrompt() {
    const s = strings[currentLanguage];
    return `You are BizAssist, a helpful business assistant chatbot. You help customers with:

1. Business Information: Hours (${s.hours}), Location (${s.location}), Contact (${s.contact})
2. Products/Services: We offer Basic, Premium, and Enterprise packages
3. Support: Create tickets, track orders, provide assistance
4. Lead Generation: Collect contact info, qualify leads, schedule demos
5. General Business Questions: Be helpful and professional

Current language: ${currentLanguage === 'en' ? 'English' : 'Spanish'}
Keep responses concise, helpful, and business-focused. If you can't help, suggest contacting support.`;
  }

  function showAIThinking() {
    const thinkingMsg = addMessage({ 
      role: 'bot', 
      text: strings[currentLanguage].aiThinking,
      isThinking: true 
    });
    return thinkingMsg;
  }

  function removeThinkingMessage() {
    const thinkingMsgs = timeline.querySelectorAll('.msg.bot .bubble');
    thinkingMsgs.forEach(bubble => {
      if (bubble.textContent.includes('🤖')) {
        bubble.closest('.msg').remove();
      }
    });
  }

  function addMessage({ role, text, html, suggestions, isThinking = false }) {
    const wrap = document.createElement('div');
    wrap.className = `msg ${role}`;

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    if (isThinking) {
      bubble.innerHTML = `<span class="thinking-dots">${text}</span>`;
    } else if (html) {
      bubble.innerHTML = html;
    } else {
      bubble.textContent = text;
    }

    wrap.appendChild(bubble);

    if (Array.isArray(suggestions) && suggestions.length) {
      const sug = document.createElement('div');
      sug.className = 'suggestions';
      suggestions.forEach((s) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip';
        b.textContent = s.label;
        b.addEventListener('click', () => handleIntent(s.intent, s.meta));
        sug.appendChild(b);
      });
      wrap.appendChild(sug);
    }

    timeline.appendChild(wrap);
    persistConversation();
    scrollToBottom();
  }

  function persistConversation() {
    const data = Array.from(timeline.children).map((node) => {
      const role = node.classList.contains('user') ? 'user' : 'bot';
      const bubble = node.querySelector('.bubble');
      return { role, html: bubble.innerHTML };
    });
    save(STORAGE_KEYS.conversation, data);
  }

  function restoreConversation() {
    timeline.innerHTML = '';
    const data = load(STORAGE_KEYS.conversation, []);
    if (data.length) {
      data.forEach((m) => addMessage({ role: m.role, html: m.html }));
    } else {
      greet();
    }
  }

  function greet() {
    const s = strings[currentLanguage];
    addMessage({ role: 'bot', text: `${s.welcome} ${s.intro}` });
    addMessage({
      role: 'bot',
      text: s.optionsIntro,
      suggestions: [
        { label: 'Browse products', intent: 'browse' },
        { label: 'Track my order', intent: 'track' },
        { label: 'Speak to an agent', intent: 'agent' }
      ]
    });
  }

  async function handleUserInput(message) {
    if (!message.trim()) return;
    addMessage({ role: 'user', text: message.trim() });
    
    // Try AI response first if enabled
    if (aiEnabled && apiKey) {
      const thinkingMsg = showAIThinking();
      const aiResponse = await getAIResponse(message.trim());
      
      // Remove thinking message
      thinkingMsg.remove();
      
      if (aiResponse) {
        addMessage({ role: 'bot', text: aiResponse });
        trackAnalytics('ai_response');
        return;
      } else {
        addMessage({ role: 'bot', text: strings[currentLanguage].aiError });
        trackAnalytics('ai_error');
      }
    }
    
    // Fallback to rule-based responses
    routeFreeform(message.trim());
  }

  function routeFreeform(message) {
    const msg = message.toLowerCase();
    if (msg.includes('hours')) return handleIntent('hours');
    if (msg.includes('location')) return handleIntent('location');
    if (msg.includes('contact')) return handleIntent('contact');
    if (msg.includes('price') || msg.includes('package')) return handleIntent('pricing');
    if (msg.includes('return') || msg.includes('ship')) return handleIntent('returns');
    if (msg.includes('pay')) return handleIntent('payments');
    if (msg.includes('track') || msg.includes('order')) return handleIntent('track');
    if (msg.includes('ticket') || msg.includes('issue') || msg.includes('support')) return handleIntent('ticket');
    if (msg.includes('demo') || msg.includes('book') || msg.includes('schedule')) return handleIntent('schedule');
    if (msg.includes('agent') || msg.includes('human')) return handleIntent('agent');
    if (msg.includes('compare') || msg.includes('standard') || msg.includes('premium')) return handleIntent('compare');

    // fallback
    addMessage({ role: 'bot', text: 'I can help with FAQs, orders, support, and more. Try the quick actions.' });
  }

  function handleIntent(intent, meta) {
    const s = strings[currentLanguage];
    switch (intent) {
      case 'hours':
        addMessage({ role: 'bot', text: s.hours });
        break;
      case 'location':
        addMessage({ role: 'bot', text: s.location });
        break;
      case 'contact':
        addMessage({ role: 'bot', text: s.contact });
        break;
      case 'pricing':
        addMessage({ role: 'bot', text: s.pricing, suggestions: [ { label: 'Compare plans', intent: 'compare' } ] });
        break;
      case 'compare':
        addMessage({ role: 'bot', text: s.comparePlans });
        break;
      case 'returns':
        addMessage({ role: 'bot', text: s.returns });
        break;
      case 'payments':
        addMessage({ role: 'bot', text: s.payments });
        break;
      case 'ticket':
        addMessage({ role: 'bot', text: s.ticketPrompt });
        expectNext('ticketDetails');
        break;
      case 'track':
        addMessage({ role: 'bot', text: s.trackPrompt });
        expectNext('orderId');
        break;
      case 'assist':
        addMessage({ role: 'bot', text: s.assistPrompt });
        expectNext('assistDetails');
        break;
      case 'lead':
        addMessage({ role: 'bot', text: s.leadPrompt });
        expectNext('leadDetails');
        break;
      case 'qualify':
        addMessage({ role: 'bot', text: s.qualifyPrompt });
        expectNext('budget');
        break;
      case 'schedule':
        addMessage({ role: 'bot', text: s.schedulePrompt });
        expectNext('slot');
        break;
      case 'browse':
        addMessage({ role: 'bot', html:
          '<div class="options">' +
          '<div class="option-card"><strong>Electronics</strong><div class="muted">Top sellers and accessories</div></div>' +
          '<div class="option-card"><strong>Apparel</strong><div class="muted">Shirts, shoes, and more</div></div>' +
          '<div class="option-card"><strong>Home goods</strong><div class="muted">Decor and essentials</div></div>' +
          '</div>',
          suggestions: [ { label: 'Compare Standard vs Premium', intent: 'compare' } ]
        });
        break;
      case 'agent':
        addMessage({ role: 'bot', text: 'It seems I might need help here. Would you like to chat with an agent?' });
        break;
      case 'lang-en':
        switchLanguage(Language.EN);
        break;
      case 'lang-es':
        switchLanguage(Language.ES);
        break;
      case 'toggle-ai':
        toggleAI();
        updateAIStatus();
        break;
      case 'set-api-key':
        promptForAPIKey();
        updateAIStatus();
        break;
      default:
        addMessage({ role: 'bot', text: 'I\'m not sure yet, but I\'m learning every day.' });
    }
  }

  function switchLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem(STORAGE_KEYS.language, lang);
    addMessage({ role: 'bot', text: strings[lang].langSwitched(lang) });
  }

  // Simple short-term expectations for next user message
  const expectations = {
    current: null
  };

  function expectNext(kind) {
    expectations.current = kind;
  }

  function clearExpectation() {
    expectations.current = null;
  }

  function handleExpectation(message) {
    const s = strings[currentLanguage];
    const kind = expectations.current;
    if (!kind) return false;

    if (kind === 'ticketDetails') {
      const id = randomId('TKT');
      addMessage({ role: 'bot', text: s.ticketCreated(id) });
      trackAnalytics('ticket_created');
      clearExpectation();
      return true;
    }
    if (kind === 'orderId') {
      const id = message.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 18);
      addMessage({ role: 'bot', text: s.trackResult(id || 'ORDER', nowPlus(3)) });
      trackAnalytics('order_tracked');
      clearExpectation();
      return true;
    }
    if (kind === 'assistDetails') {
      addMessage({ role: 'bot', text: 'Thanks. Here are some tips: restart the app, clear cache, and update to latest version. If issue persists, I can escalate to support.' });
      trackAnalytics('assist_provided');
      clearExpectation();
      return true;
    }
    if (kind === 'leadDetails') {
      const name = (/name\s*[:\-]?\s*([\w\s]+)/i.exec(message)?.[1] || message.split(/[\s,]/)[0] || 'Friend').trim();
      const email = /([\w.+-]+@[\w-]+\.[\w.-]+)/.exec(message)?.[1] || 'unknown@example.com';
      const profile = { name, email };
      save(STORAGE_KEYS.profile, profile);
      addMessage({ role: 'bot', text: s.thanksLead(name) });
      trackAnalytics('lead_captured');
      clearExpectation();
      return true;
    }
    if (kind === 'budget') {
      addMessage({ role: 'bot', text: 'Thanks! Based on your budget, I recommend starting with our Premium plan.' });
      trackAnalytics('lead_qualified');
      clearExpectation();
      return true;
    }
    if (kind === 'slot') {
      const slot = /2\s*pm|4\s*pm/i.test(message) ? (message.match(/2\s*pm/i) ? '2 PM' : '4 PM') : '2 PM';
      addMessage({ role: 'bot', text: s.scheduled(slot) });
      trackAnalytics('demo_scheduled');
      clearExpectation();
      return true;
    }
    return false;
  }

  function attachQuickActions() {
    quickActionContainer.addEventListener('click', (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      const intent = target.getAttribute('data-intent');
      if (!intent) return;
      handleIntent(intent);
    });
  }

  function trackAnalytics(eventName) {
    const analytics = load(STORAGE_KEYS.analytics, []);
    analytics.push({ eventName, ts: Date.now() });
    save(STORAGE_KEYS.analytics, analytics);
  }

  function personalizeIfPossible() {
    const profile = load(STORAGE_KEYS.profile, null);
    if (profile && profile.name) {
      addMessage({ role: 'bot', text: strings[currentLanguage].personalize(profile.name) });
    }
  }

  // AI Control Functions
  function toggleAI() {
    aiEnabled = !aiEnabled;
    localStorage.setItem(STORAGE_KEYS.aiEnabled, aiEnabled.toString());
    
    if (aiEnabled && !apiKey) {
      promptForAPIKey();
    } else {
      addMessage({ 
        role: 'bot', 
        text: aiEnabled ? strings[currentLanguage].aiEnabled : strings[currentLanguage].aiDisabled 
      });
    }
  }

  function promptForAPIKey() {
    const key = prompt(strings[currentLanguage].aiSetup);
    if (key && key.trim()) {
      apiKey = key.trim();
      localStorage.setItem(STORAGE_KEYS.apiKey, apiKey);
      addMessage({ role: 'bot', text: strings[currentLanguage].aiEnabled });
    } else {
      aiEnabled = false;
      localStorage.setItem(STORAGE_KEYS.aiEnabled, 'false');
    }
  }

  function setAPIKey(key) {
    apiKey = key.trim();
    localStorage.setItem(STORAGE_KEYS.apiKey, apiKey);
    if (key) {
      aiEnabled = true;
      localStorage.setItem(STORAGE_KEYS.aiEnabled, 'true');
    }
  }

  function updateAIStatus() {
    const statusEl = document.getElementById('aiStatus');
    if (statusEl) {
      statusEl.textContent = aiEnabled ? 'On' : 'Off';
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = input.value;
    input.value = '';
    if (handleExpectation(value)) return;
    handleUserInput(value);
  });

  clearBtn.addEventListener('click', () => {
    timeline.innerHTML = '';
    localStorage.removeItem(STORAGE_KEYS.conversation);
    addMessage({ role: 'bot', text: strings[currentLanguage].cleared });
    greet();
    personalizeIfPossible();
  });

  // Init
  attachQuickActions();
  updateAIStatus();
  restoreConversation();
  personalizeIfPossible();
})();


