/* ═══════════════════════════════════════════════════════════════
   NATHAN PORTFOLIO — script.js
   Modules: LiquidCanvas · ChatBot · ScrollAnimator ·
            NavHighlighter · ThemeToggle · CounterAnimation ·
            TypingEffect · Analytics
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   1. VERCEL ANALYTICS INJECTION
   Injects Vercel Analytics from local node_modules build,
   falling back to CDN so dev preview also works.
───────────────────────────────────────────────────────────── */
(function injectAnalytics() {
  // Try to use Vercel Analytics (script tag approach for static sites)
  const script = document.createElement('script');
  // Vercel Analytics auto-detects when deployed on Vercel.
  // For local dev we load the module version via a data attribute.
  script.defer = true;
  script.dataset.analyticsId = 'portfolio-nathan';
  // This src works when deployed; for local file:// it silently fails
  script.src = 'https://va.vercel-scripts.com/v1/script.debug.js';
  script.onerror = () => {
    // Fallback: silently skip — analytics not available locally
    console.info('[Analytics] Vercel Analytics not available (local mode)');
  };
  document.head.appendChild(script);

  // Custom event tracking helper
  window.trackEvent = function(name, props = {}) {
    if (typeof window.va === 'function') {
      window.va('event', { name, ...props });
    }
  };
})();


/* ─────────────────────────────────────────────────────────────
   2. LIQUID CANVAS
   Renders animated fluid blobs using canvas 2D (no WebGL).
   Uses metaball-inspired sinusoidal movement with
   radial-gradient compositing.
───────────────────────────────────────────────────────────── */
class LiquidCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.blobs = [];
    this.raf = null;
    this.resize();
    this.initBlobs();
    this.animate();
    window.addEventListener('resize', () => this.resize(), { passive: true });
  }

  resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  initBlobs() {
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Define blobs with distinct colors matching the palette
    const configs = [
      { color: '99,102,241',  r: 320, speed: 0.35, phase: 0    },  // indigo
      { color: '139,92,246',  r: 280, speed: 0.28, phase: 1.2  },  // purple
      { color: '6,182,212',   r: 240, speed: 0.42, phase: 2.4  },  // cyan
      { color: '59,130,246',  r: 200, speed: 0.31, phase: 0.8  },  // blue
      { color: '167,139,250', r: 180, speed: 0.38, phase: 3.6  },  // lavender
    ];

    this.blobs = configs.map((c, i) => ({
      x: w * (0.2 + 0.15 * i),
      y: h * (0.3 + 0.1 * Math.sin(i)),
      baseX: w * (0.2 + 0.15 * i),
      baseY: h * (0.3 + 0.1 * Math.sin(i)),
      r: c.r,
      color: c.color,
      speed: c.speed,
      phase: c.phase,
      ampX: w * 0.18,
      ampY: h * 0.18,
      t: c.phase,
    }));
  }

  drawBlob(blob) {
    const { ctx } = this;
    const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
    gradient.addColorStop(0,   `rgba(${blob.color}, 0.22)`);
    gradient.addColorStop(0.5, `rgba(${blob.color}, 0.10)`);
    gradient.addColorStop(1,   `rgba(${blob.color}, 0.00)`);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  animate() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dark base
    ctx.fillStyle = '#050814';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.blobs.forEach(blob => {
      blob.t += blob.speed * 0.008;
      blob.x = blob.baseX + Math.sin(blob.t * 1.0) * blob.ampX;
      blob.y = blob.baseY + Math.cos(blob.t * 0.7) * blob.ampY;
      this.drawBlob(blob);
    });

    this.raf = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf);
  }
}


/* ─────────────────────────────────────────────────────────────
   3. TYPING EFFECT
   Cycles through role strings character by character.
───────────────────────────────────────────────────────────── */
class TypingEffect {
  constructor(elementId, strings, speed = 70, pause = 2200) {
    this.el = document.getElementById(elementId);
    if (!this.el) return;
    this.strings = strings;
    this.speed = speed;
    this.pause = pause;
    this.strIdx = 0;
    this.charIdx = 0;
    this.isDeleting = false;
    this.tick();
  }

  tick() {
    const current = this.strings[this.strIdx];
    this.el.textContent = current.substring(0, this.charIdx);

    if (!this.isDeleting && this.charIdx === current.length) {
      setTimeout(() => {
        this.isDeleting = true;
        this.tick();
      }, this.pause);
      return;
    }

    if (this.isDeleting && this.charIdx === 0) {
      this.isDeleting = false;
      this.strIdx = (this.strIdx + 1) % this.strings.length;
    }

    this.charIdx += this.isDeleting ? -1 : 1;
    setTimeout(() => this.tick(), this.isDeleting ? this.speed / 2 : this.speed);
  }
}


/* ─────────────────────────────────────────────────────────────
   4. COUNTER ANIMATION
   Animates numbers from 0 to target value on first visibility.
───────────────────────────────────────────────────────────── */
class CounterAnimation {
  constructor() {
    this.counters = document.querySelectorAll('.stat-number[data-target]');
    this.started  = false;

    const observer = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting) && !this.started) {
        this.started = true;
        this.run();
        observer.disconnect();
      }
    }, { threshold: 0.5 });

    this.counters.forEach(el => observer.observe(el));
  }

  run() {
    this.counters.forEach(el => {
      const target = parseInt(el.dataset.target, 10);
      const duration = 1800;
      const step = 16;
      const increment = target / (duration / step);
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          el.textContent = target;
          clearInterval(timer);
        } else {
          el.textContent = Math.floor(current);
        }
      }, step);
    });
  }
}


/* ─────────────────────────────────────────────────────────────
   5. SCROLL ANIMATOR
   Fades in sections & items using IntersectionObserver.
   Also animates skill bar widths.
───────────────────────────────────────────────────────────── */
class ScrollAnimator {
  constructor() {
    const opts = { threshold: 0.1 };

    // Sections
    const sectionObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          sectionObs.unobserve(e.target);
        }
      });
    }, opts);

    document.querySelectorAll('.reveal-section').forEach(el => sectionObs.observe(el));

    // Items (with optional delay)
    const itemObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const delay = parseInt(e.target.dataset.delay || '0', 10);
          setTimeout(() => e.target.classList.add('visible'), delay);
          itemObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal-item').forEach(el => itemObs.observe(el));

    // Skill bars
    const barObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.querySelectorAll('.bar-fill').forEach(bar => {
            bar.style.width = (bar.dataset.w || 0) + '%';
          });
          barObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });

    document.querySelectorAll('.skills-category').forEach(el => barObs.observe(el));
  }
}


/* ─────────────────────────────────────────────────────────────
   6. NAV HIGHLIGHTER
   Highlights active nav link based on scroll position.
───────────────────────────────────────────────────────────── */
class NavHighlighter {
  constructor() {
    this.links    = document.querySelectorAll('.nav-link[data-section]');
    this.navbar   = document.getElementById('navbar');
    this.sections = [...this.links].map(l => document.getElementById(l.dataset.section)).filter(Boolean);

    window.addEventListener('scroll', () => this.onScroll(), { passive: true });
    this.onScroll();
  }

  onScroll() {
    const scrollY = window.scrollY;

    // Navbar scrolled class
    if (scrollY > 50) {
      this.navbar.classList.add('scrolled');
    } else {
      this.navbar.classList.remove('scrolled');
    }

    // Active section
    let current = this.sections[0]?.id || '';
    this.sections.forEach(sec => {
      if (scrollY >= sec.offsetTop - 120) current = sec.id;
    });

    this.links.forEach(l => {
      l.classList.toggle('active', l.dataset.section === current);
    });
  }
}


/* ─────────────────────────────────────────────────────────────
   7. HAMBURGER MENU
───────────────────────────────────────────────────────────── */
function initHamburger() {
  const btn   = document.getElementById('hamburger');
  const menu  = document.getElementById('navLinks');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const open = btn.classList.toggle('open');
    menu.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
  });

  // Close on nav link click
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      btn.classList.remove('open');
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', false);
    });
  });
}


/* ─────────────────────────────────────────────────────────────
   8. THEME TOGGLE
───────────────────────────────────────────────────────────── */
function initThemeToggle() {
  const btn  = document.getElementById('themeToggle');
  const icon = btn?.querySelector('.theme-icon');
  if (!btn) return;

  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.dataset.theme = saved;
  icon.textContent = saved === 'dark' ? '☀️' : '🌙';

  btn.addEventListener('click', () => {
    const isDark = document.documentElement.dataset.theme === 'dark';
    const next = isDark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    icon.textContent = next === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', next);
    window.trackEvent?.('theme_toggle', { to: next });
  });
}


/* ─────────────────────────────────────────────────────────────
   9. CURSOR GLOW
   Follows mouse cursor with a soft glow radial gradient.
───────────────────────────────────────────────────────────── */
function initCursorGlow() {
  const glow = document.getElementById('cursorGlow');
  if (!glow) return;

  let mx = 0, my = 0;
  let cx = 0, cy = 0;
  let raf;

  window.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
  }, { passive: true });

  function lerp(a, b, t) { return a + (b - a) * t; }

  function frame() {
    cx = lerp(cx, mx, 0.12);
    cy = lerp(cy, my, 0.12);
    glow.style.transform = `translate(${cx - 200}px, ${cy - 200}px)`;
    raf = requestAnimationFrame(frame);
  }

  frame();
}


/* ─────────────────────────────────────────────────────────────
   10. CHATBOT ENGINE
   Rule-based intent matching with typing simulation.
───────────────────────────────────────────────────────────── */
class ChatBot {
  constructor() {
    this.bubble     = document.getElementById('chatBubble');
    this.panel      = document.getElementById('chatPanel');
    this.messages   = document.getElementById('chatMessages');
    this.input      = document.getElementById('chatInput');
    this.sendBtn    = document.getElementById('chatSend');
    this.closeBtn   = document.getElementById('chatCloseBtn');
    this.notif      = this.bubble?.querySelector('.chat-notif');
    this.isOpen     = false;
    this.firstOpen  = true;
    this.suggestions = document.getElementById('chatSuggestions');

    if (!this.bubble) return;

    this.intents = [
      {
        patterns: ['who are you', 'about you', 'tell me about', 'introduce', 'yourself'],
        response: "Hi there! 👋 I'm Nathan's assistant. Nathan is a <strong>Creative Developer & Designer</strong> based in Indonesia, passionate about crafting beautiful and performant web experiences. He bridges design thinking with solid engineering!"
      },
      {
        patterns: ['skill', 'tech', 'stack', 'know', 'expertise', 'language', 'framework'],
        response: "Nathan's skills include:\n• 🖥️ <strong>Frontend:</strong> HTML/CSS, JavaScript, React, Next.js, TypeScript\n• ⚙️ <strong>Backend:</strong> Node.js, Python\n• 🎨 <strong>Design:</strong> Figma, UI/UX\n• 🔧 <strong>Tools:</strong> Git, DevOps, Vercel"
      },
      {
        patterns: ['project', 'work', 'portfolio', 'build', 'made', 'create'],
        response: "Nathan has worked on some exciting projects! Check out:\n🛒 <strong>E-Commerce Platform</strong> — React + Node.js + MongoDB\n📊 <strong>SaaS Analytics Dashboard</strong> — Next.js + Tailwind + Prisma\n💪 <strong>AI Fitness App</strong> — React Native + Firebase + AI/ML\n\n<a href='#projects' style='color:var(--accent-cyan)'>→ View all projects</a>"
      },
      {
        patterns: ['contact', 'hire', 'reach', 'email', 'message', 'work together', 'collaborate'],
        response: "Want to work with Nathan? Awesome! 🚀\n📧 <strong>Email:</strong> nathan@example.com\n📍 <strong>Location:</strong> Indonesia\n⚡ <strong>Response time:</strong> Within 24 hours\n\n<a href='#contact' style='color:var(--accent-cyan)'>→ Send a message</a>"
      },
      {
        patterns: ['experience', 'year', 'how long', 'senior', 'junior'],
        response: "Nathan has <strong>3+ years</strong> of professional development experience, working with 15+ clients and delivering 20+ projects across e-commerce, SaaS, and mobile domains."
      },
      {
        patterns: ['available', 'free', 'open', 'freelance', 'opportunity', 'hire'],
        response: "Great news! ✅ Nathan is currently <strong>available for new opportunities</strong> — freelance, contract, or full-time. Feel free to reach out via the <a href='#contact' style='color:var(--accent-cyan)'>contact form</a>!"
      },
      {
        patterns: ['hello', 'hi', 'hey', 'good', 'morning', 'afternoon', 'evening'],
        response: "Hey there! 👋 Welcome to Nathan's portfolio! How can I help you today? You can ask me about his skills, projects, experience, or how to contact him."
      },
      {
        patterns: ['thank', 'thanks', 'appreciate', 'great', 'cool', 'awesome', 'nice'],
        response: "You're welcome! 😊 Feel free to ask anything else, or jump to <a href='#contact' style='color:var(--accent-cyan)'>Contact</a> to get in touch with Nathan directly!"
      },
    ];

    this.defaultResponse = "Hmm, I'm not sure about that one! 🤔 Try asking about Nathan's <strong>skills</strong>, <strong>projects</strong>, <strong>experience</strong>, or <strong>contact info</strong>.";

    this.bindEvents();
  }

  bindEvents() {
    this.bubble.addEventListener('click', () => this.toggle());
    this.closeBtn?.addEventListener('click', () => this.close());
    this.sendBtn?.addEventListener('click', () => this.handleSend());
    this.input?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    // Suggestion chips
    this.suggestions?.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.processMessage(chip.dataset.msg);
        // Hide suggestions after first use
        if (this.suggestions) this.suggestions.style.display = 'none';
      });
    });
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    this.isOpen = true;
    this.panel.hidden = false;
    this.bubble.querySelector('.open-icon').hidden  = true;
    this.bubble.querySelector('.close-icon').hidden = false;
    if (this.notif) this.notif.style.display = 'none';

    if (this.firstOpen) {
      this.firstOpen = false;
      setTimeout(() => {
        this.addMessage('bot', "Hi! 👋 I'm Nathan's AI assistant. Ask me anything about Nathan — his skills, projects, or how to reach him!");
      }, 400);
    }

    window.trackEvent?.('chatbot_open');
    this.input?.focus();
  }

  close() {
    this.isOpen = false;
    this.panel.hidden = true;
    this.bubble.querySelector('.open-icon').hidden  = false;
    this.bubble.querySelector('.close-icon').hidden = true;
  }

  handleSend() {
    const text = this.input?.value.trim();
    if (!text) return;
    this.input.value = '';
    this.processMessage(text);
  }

  processMessage(text) {
    this.addMessage('user', text);
    window.trackEvent?.('chatbot_message', { query: text.substring(0, 60) });

    // Hide suggestions after any message
    if (this.suggestions) this.suggestions.style.display = 'none';

    // Show typing indicator
    const typingEl = this.addTypingIndicator();
    const delay = 800 + Math.random() * 600;

    setTimeout(() => {
      typingEl.remove();
      this.addMessage('bot', this.getResponse(text));
    }, delay);
  }

  getResponse(text) {
    const lower = text.toLowerCase();
    for (const intent of this.intents) {
      if (intent.patterns.some(p => lower.includes(p))) {
        return intent.response;
      }
    }
    return this.defaultResponse;
  }

  addMessage(type, html) {
    const el = document.createElement('div');
    el.className = `chat-msg ${type}`;
    el.innerHTML = html.replace(/\n/g, '<br>');
    this.messages.appendChild(el);
    this.messages.scrollTop = this.messages.scrollHeight;
    return el;
  }

  addTypingIndicator() {
    const el = document.createElement('div');
    el.className = 'chat-msg bot chat-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    this.messages.appendChild(el);
    this.messages.scrollTop = this.messages.scrollHeight;
    return el;
  }
}


/* ─────────────────────────────────────────────────────────────
   11. CONTACT FORM
   Handles form submit feedback.
───────────────────────────────────────────────────────────── */
function initContactForm() {
  const form    = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  if (!form) return;

  form.addEventListener('submit', () => {
    window.trackEvent?.('contact_form_submit');
    // Form uses mailto action so browser handles it
    // Show success message after brief delay
    setTimeout(() => {
      if (success) {
        success.hidden = false;
        success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setTimeout(() => { success.hidden = true; }, 5000);
      }
    }, 300);
  });
}


/* ─────────────────────────────────────────────────────────────
   12. SMOOTH SCROLL for anchor links
───────────────────────────────────────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}


/* ─────────────────────────────────────────────────────────────
   INIT — Run all modules after DOM is ready
───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Liquid canvas on hero
  new LiquidCanvas('liquidCanvas');

  // Typing effect in hero subtitle
  new TypingEffect('typingTarget', [
    'Creative Developer & Designer',
    'Full-Stack Engineer',
    'UI/UX Enthusiast',
    'Open Source Contributor',
    'Problem Solver',
  ]);

  // Scroll-driven animations
  new ScrollAnimator();

  // Nav active link tracking
  new NavHighlighter();

  // Counter animation on hero stats
  new CounterAnimation();

  // Hamburger menu
  initHamburger();

  // Theme toggle (dark/light)
  initThemeToggle();

  // Cursor glow effect
  initCursorGlow();

  // Chatbot widget
  new ChatBot();

  // Contact form
  initContactForm();

  // Smooth scroll
  initSmoothScroll();

  // Track page view
  window.trackEvent?.('page_view', { page: 'portfolio' });
});
