/* ═══════════════════════════════════════════════════════════════
   NATHAN PORTFOLIO — script.js  (v2 — Production Ready)
   Modules:
   1. EmailJS Form Handler
   2. Toast Notification System
   3. GitHub API Live Stats
   4. Dev Quote API (quotable.io)
   5. LiquidCanvas
   6. TypingEffect
   7. CounterAnimation
   8. ScrollAnimator
   9. NavHighlighter
   10. Hamburger Menu
   11. ThemeToggle
   12. CursorGlow
   13. ChatBot
   14. Vercel Analytics
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   ⚙️  CONFIGURATION  — Edit these values!
───────────────────────────────────────────────────────────── */
const CONFIG = {
  // ── EmailJS ───────────────────────────────────────────────
  // 1. Go to https://www.emailjs.com/ and create a free account
  // 2. Add an Email Service (Gmail) → copy the Service ID below
  // 3. Create an Email Template using these variables:
  //    {{from_name}}, {{from_email}}, {{subject}}, {{message}}
  //    Set "To Email" = nathanseptiantimotius123@gmail.com
  // 4. Copy your Public Key from Account → API Keys
  EMAILJS_PUBLIC_KEY:  'YOUR_PUBLIC_KEY',    // ← replace
  EMAILJS_SERVICE_ID:  'YOUR_SERVICE_ID',    // ← replace
  EMAILJS_TEMPLATE_ID: 'YOUR_TEMPLATE_ID',  // ← replace

  // ── GitHub ────────────────────────────────────────────────
  GITHUB_USERNAME: 'Nathansept',

  // ── Owner email for fallback ──────────────────────────────
  OWNER_EMAIL: 'nathanseptiantimotius123@gmail.com',
};


/* ─────────────────────────────────────────────────────────────
   1. VERCEL ANALYTICS
───────────────────────────────────────────────────────────── */
window.trackEvent = function(name, props = {}) {
  // Vercel Analytics
  if (typeof window.va === 'function') {
    window.va('event', { name, ...props });
  }
  // Speed Insights is auto-injected via CDN script tag in HTML
};


/* ─────────────────────────────────────────────────────────────
   2. TOAST NOTIFICATION SYSTEM
───────────────────────────────────────────────────────────── */
const Toast = {
  container: null,

  init() {
    this.container = document.getElementById('toastContainer');
  },

  show(type, title, message, duration = 5000) {
    if (!this.container) return;

    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-msg">${message}</div>` : ''}
      </div>
    `;

    this.container.appendChild(toast);

    const dismiss = () => {
      toast.classList.add('toast-leaving');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    };

    const timer = setTimeout(dismiss, duration);
    toast.addEventListener('click', () => { clearTimeout(timer); dismiss(); });
    return toast;
  },

  success(title, msg) { return this.show('success', title, msg); },
  error(title, msg)   { return this.show('error',   title, msg, 7000); },
  info(title, msg)    { return this.show('info',     title, msg); },
};


/* ─────────────────────────────────────────────────────────────
   3. EMAILJS CONTACT FORM
───────────────────────────────────────────────────────────── */
function initContactForm() {
  const form      = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const noteEl    = document.getElementById('emailjsNote');
  const dismissEl = document.getElementById('dismissNote');

  if (!form) return;

  // Dismiss setup note
  dismissEl?.addEventListener('click', e => {
    e.preventDefault();
    noteEl?.remove();
  });

  // Check if EmailJS is configured
  const isConfigured = (
    CONFIG.EMAILJS_PUBLIC_KEY  !== 'YOUR_PUBLIC_KEY' &&
    CONFIG.EMAILJS_SERVICE_ID  !== 'YOUR_SERVICE_ID' &&
    CONFIG.EMAILJS_TEMPLATE_ID !== 'YOUR_TEMPLATE_ID'
  );

  if (isConfigured && typeof emailjs !== 'undefined') {
    emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY);
    noteEl?.remove();
  }

  // Validate a single field
  function validateField(el) {
    const ok = el.value.trim() !== '';
    el.classList.toggle('error', !ok);
    return ok;
  }

  // Remove error on input
  form.querySelectorAll('input, textarea').forEach(el => {
    el.addEventListener('input', () => el.classList.remove('error'));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Basic validation
    let valid = true;
    form.querySelectorAll('[required]').forEach(el => {
      if (!validateField(el)) valid = false;
    });

    if (!valid) {
      Toast.error('Missing fields', 'Please fill in all required fields.');
      return;
    }

    // Set loading state
    submitBtn.dataset.loading = 'true';
    window.trackEvent('contact_form_submit');

    try {
      if (isConfigured && typeof emailjs !== 'undefined') {
        // ── Real EmailJS send ──────────────────────────────
        await emailjs.sendForm(
          CONFIG.EMAILJS_SERVICE_ID,
          CONFIG.EMAILJS_TEMPLATE_ID,
          form
        );
        Toast.success('Message sent! 🎉', "Thanks! I'll get back to you within 24 hours.");
        form.reset();

      } else {
        // ── Fallback: open mailto ──────────────────────────
        const name    = form.from_name.value.trim();
        const email   = form.from_email.value.trim();
        const subject = form.subject.value.trim();
        const msg     = form.message.value.trim();

        const mailtoUrl = `mailto:${CONFIG.OWNER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
          `From: ${name} <${email}>\n\n${msg}`
        )}`;

        window.open(mailtoUrl, '_blank');

        Toast.info(
          'Opening your email client',
          'EmailJS not configured yet. Your email app will open to send the message directly.'
        );
      }

    } catch (err) {
      console.error('[EmailJS Error]', err);
      Toast.error('Send failed', 'Something went wrong. Please email me directly at ' + CONFIG.OWNER_EMAIL);
    } finally {
      delete submitBtn.dataset.loading;
    }
  });
}


/* ─────────────────────────────────────────────────────────────
   4. GITHUB API — Live Stats
   Free, public, no auth required for public profiles
───────────────────────────────────────────────────────────── */
async function loadGitHubStats() {
  try {
    const res  = await fetch(`https://api.github.com/users/${CONFIG.GITHUB_USERNAME}`);
    if (!res.ok) throw new Error('GitHub API error');
    const data = await res.json();

    // Repos
    const reposEl = document.getElementById('ghRepos');
    if (reposEl) animateNumber(reposEl, 0, data.public_repos || 0);

    // Stars — requires a second call to get all repos
    const reposRes = await fetch(`https://api.github.com/users/${CONFIG.GITHUB_USERNAME}/repos?per_page=100`);
    if (reposRes.ok) {
      const repos = await reposRes.json();
      const stars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
      const starsEl = document.getElementById('ghStars');
      if (starsEl) animateNumber(starsEl, 0, stars);
    }

    // Followers
    const followersEl = document.getElementById('ghFollowers');
    if (followersEl) animateNumber(followersEl, 0, data.followers || 0);

  } catch (err) {
    console.info('[GitHub API] Could not load stats:', err.message);
    // Graceful fallback — hide the widget
    const widget = document.getElementById('githubStats');
    if (widget) widget.style.display = 'none';
  }
}

function animateNumber(el, from, to, duration = 1200) {
  const start = performance.now();
  const update = (now) => {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic
    el.textContent = Math.round(from + (to - from) * ease);
    if (t < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}


/* ─────────────────────────────────────────────────────────────
   5. DEV QUOTE API — quotable.io (free, no key)
───────────────────────────────────────────────────────────── */
async function loadDevQuote() {
  const textEl   = document.getElementById('quoteText');
  const authorEl = document.getElementById('quoteAuthor');
  if (!textEl) return;

  try {
    const res  = await fetch('https://api.quotable.io/random?tags=technology,inspirational&maxLength=160');
    if (!res.ok) throw new Error('Quote API error');
    const data = await res.json();
    textEl.textContent   = data.content;
    if (authorEl) authorEl.textContent = '— ' + data.author;
  } catch {
    textEl.textContent   = 'Code is like humor. When you have to explain it, it\'s bad.';
    if (authorEl) authorEl.textContent = '— Cory House';
  }
}


/* ─────────────────────────────────────────────────────────────
   6. LIQUID CANVAS
   Animated fluid blobs using canvas 2D API at 60fps
───────────────────────────────────────────────────────────── */
class LiquidCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx   = this.canvas.getContext('2d');
    this.blobs = [];
    this.raf   = null;
    this.resize();
    this.initBlobs();
    this.animate();
    window.addEventListener('resize', () => this.resize(), { passive: true });
  }

  resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.initBlobs();
  }

  initBlobs() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.blobs = [
      { color:'99,102,241',  r:320, speed:.35, phase:0,   ampX:w*.18, ampY:h*.18 },
      { color:'139,92,246',  r:280, speed:.28, phase:1.2, ampX:w*.16, ampY:h*.16 },
      { color:'6,182,212',   r:240, speed:.42, phase:2.4, ampX:w*.20, ampY:h*.14 },
      { color:'59,130,246',  r:200, speed:.31, phase:0.8, ampX:w*.14, ampY:h*.20 },
      { color:'167,139,250', r:180, speed:.38, phase:3.6, ampX:w*.22, ampY:h*.12 },
    ].map((c, i) => ({
      ...c,
      baseX: w * (0.2 + 0.15 * i),
      baseY: h * (0.3 + 0.1 * Math.sin(i)),
      x: w * (0.2 + 0.15 * i),
      y: h * (0.3 + 0.1 * Math.sin(i)),
      t: c.phase,
    }));
  }

  drawBlob(b) {
    const { ctx } = this;
    const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    g.addColorStop(0,   `rgba(${b.color},.22)`);
    g.addColorStop(.5,  `rgba(${b.color},.10)`);
    g.addColorStop(1,   `rgba(${b.color},0)`);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  animate() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#050814';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.blobs.forEach(b => {
      b.t += b.speed * .008;
      b.x  = b.baseX + Math.sin(b.t * 1.0) * b.ampX;
      b.y  = b.baseY + Math.cos(b.t * 0.7) * b.ampY;
      this.drawBlob(b);
    });
    this.raf = requestAnimationFrame(() => this.animate());
  }

  destroy() { if (this.raf) cancelAnimationFrame(this.raf); }
}


/* ─────────────────────────────────────────────────────────────
   7. TYPING EFFECT
───────────────────────────────────────────────────────────── */
class TypingEffect {
  constructor(elementId, strings, speed = 70, pause = 2200) {
    this.el       = document.getElementById(elementId);
    if (!this.el) return;
    this.strings  = strings;
    this.speed    = speed;
    this.pause    = pause;
    this.strIdx   = 0;
    this.charIdx  = 0;
    this.deleting = false;
    this.tick();
  }

  tick() {
    const cur = this.strings[this.strIdx];
    this.el.textContent = cur.substring(0, this.charIdx);

    if (!this.deleting && this.charIdx === cur.length) {
      setTimeout(() => { this.deleting = true; this.tick(); }, this.pause);
      return;
    }

    if (this.deleting && this.charIdx === 0) {
      this.deleting = false;
      this.strIdx   = (this.strIdx + 1) % this.strings.length;
    }

    this.charIdx += this.deleting ? -1 : 1;
    setTimeout(() => this.tick(), this.deleting ? this.speed / 2 : this.speed);
  }
}


/* ─────────────────────────────────────────────────────────────
   8. COUNTER ANIMATION
───────────────────────────────────────────────────────────── */
class CounterAnimation {
  constructor() {
    this.counters = document.querySelectorAll('.stat-number[data-target]');
    this.started  = false;
    const obs = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting) && !this.started) {
        this.started = true;
        this.run();
        obs.disconnect();
      }
    }, { threshold: .5 });
    this.counters.forEach(el => obs.observe(el));
  }

  run() {
    this.counters.forEach(el => {
      animateNumber(el, 0, parseInt(el.dataset.target, 10));
    });
  }
}


/* ─────────────────────────────────────────────────────────────
   9. SCROLL ANIMATOR
───────────────────────────────────────────────────────────── */
class ScrollAnimator {
  constructor() {
    const sObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); sObs.unobserve(e.target); }
      });
    }, { threshold: .1 });

    document.querySelectorAll('.reveal-section').forEach(el => sObs.observe(el));

    const iObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const delay = parseInt(e.target.dataset.delay || '0', 10);
          setTimeout(() => e.target.classList.add('visible'), delay);
          iObs.unobserve(e.target);
        }
      });
    }, { threshold: .12 });

    document.querySelectorAll('.reveal-item').forEach(el => iObs.observe(el));

    // Skill bars
    const bObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.querySelectorAll('.bar-fill').forEach(b => {
            b.style.width = (b.dataset.w || 0) + '%';
          });
          bObs.unobserve(e.target);
        }
      });
    }, { threshold: .3 });

    document.querySelectorAll('.skills-category').forEach(el => bObs.observe(el));
  }
}


/* ─────────────────────────────────────────────────────────────
   10. NAV HIGHLIGHTER
───────────────────────────────────────────────────────────── */
class NavHighlighter {
  constructor() {
    this.links    = document.querySelectorAll('.nav-link[data-section]');
    this.navbar   = document.getElementById('navbar');
    this.sections = [...this.links]
      .map(l => document.getElementById(l.dataset.section))
      .filter(Boolean);
    window.addEventListener('scroll', () => this.onScroll(), { passive: true });
    this.onScroll();
  }

  onScroll() {
    const y = window.scrollY;
    this.navbar.classList.toggle('scrolled', y > 50);
    let current = this.sections[0]?.id || '';
    this.sections.forEach(s => { if (y >= s.offsetTop - 130) current = s.id; });
    this.links.forEach(l => l.classList.toggle('active', l.dataset.section === current));
  }
}


/* ─────────────────────────────────────────────────────────────
   11. HAMBURGER MENU
───────────────────────────────────────────────────────────── */
function initHamburger() {
  const btn  = document.getElementById('hamburger');
  const menu = document.getElementById('navLinks');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const open = btn.classList.toggle('open');
    menu.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
  });

  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      btn.classList.remove('open');
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', false);
    });
  });
}


/* ─────────────────────────────────────────────────────────────
   12. THEME TOGGLE
───────────────────────────────────────────────────────────── */
function initThemeToggle() {
  const btn  = document.getElementById('themeToggle');
  const icon = btn?.querySelector('.theme-icon');
  if (!btn) return;

  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.dataset.theme = saved;
  if (icon) icon.textContent = saved === 'dark' ? '☀️' : '🌙';

  btn.addEventListener('click', () => {
    const isDark = document.documentElement.dataset.theme === 'dark';
    const next   = isDark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    if (icon) icon.textContent = next === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', next);
    window.trackEvent('theme_toggle', { to: next });
  });
}


/* ─────────────────────────────────────────────────────────────
   13. CURSOR GLOW
───────────────────────────────────────────────────────────── */
function initCursorGlow() {
  const glow = document.getElementById('cursorGlow');
  if (!glow || window.matchMedia('(pointer: coarse)').matches) return;

  let mx = 0, my = 0, cx = 0, cy = 0;

  window.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
  }, { passive: true });

  const lerp = (a, b, t) => a + (b - a) * t;

  (function frame() {
    cx = lerp(cx, mx, .12);
    cy = lerp(cy, my, .12);
    glow.style.transform = `translate(${cx - 200}px, ${cy - 200}px)`;
    requestAnimationFrame(frame);
  })();
}


/* ─────────────────────────────────────────────────────────────
   14. CHATBOT ENGINE
───────────────────────────────────────────────────────────── */
class ChatBot {
  constructor() {
    this.bubble      = document.getElementById('chatBubble');
    this.panel       = document.getElementById('chatPanel');
    this.messages    = document.getElementById('chatMessages');
    this.input       = document.getElementById('chatInput');
    this.sendBtn     = document.getElementById('chatSend');
    this.closeBtn    = document.getElementById('chatCloseBtn');
    this.notif       = this.bubble?.querySelector('.chat-notif');
    this.suggestions = document.getElementById('chatSuggestions');
    this.isOpen      = false;
    this.firstOpen   = true;
    if (!this.bubble) return;

    this.intents = [
      {
        p: ['who are you','about you','introduce','yourself','nathan'],
        r: "Hi! 👋 I'm Nathan Septian's assistant. Nathan is a <strong>Creative Developer & Designer</strong> based in Indonesia, passionate about crafting beautiful, performant web experiences. He bridges design thinking with solid engineering!"
      },
      {
        p: ['skill','tech','stack','know','language','framework','expertise'],
        r: "Nathan's tech stack includes:\n• 🖥️ <strong>Frontend:</strong> HTML/CSS, JavaScript, React, Next.js, TypeScript\n• ⚙️ <strong>Backend:</strong> Node.js, Python\n• 🎨 <strong>Design:</strong> Figma, UI/UX\n• 🔧 <strong>Tools:</strong> Git, Vercel, Firebase"
      },
      {
        p: ['project','work','portfolio','built','cratter','amartek','sihi'],
        r: "Nathan's featured projects:\n🛒 <strong>Cratter</strong> — E-Commerce Platform (React + Node.js)\n📊 <strong>Amartek 2025</strong> — SaaS Analytics Dashboard (Next.js)\n💪 <strong>SiHi</strong> — AI Health Companion App (React Native)\n\n<a href='#projects' style='color:var(--accent-cyan)'>→ See all projects</a>"
      },
      {
        p: ['contact','hire','reach','email','message','collaborate','work together'],
        r: "Want to work with Nathan? Great choice! 🚀\n📧 <strong>Email:</strong> nathanseptiantimotius123@gmail.com\n📍 <strong>Location:</strong> Indonesia 🇮🇩\n⚡ Responds within 24 hours\n\n<a href='#contact' style='color:var(--accent-cyan)'>→ Send a message</a>"
      },
      {
        p: ['experience','year','how long','senior','professional'],
        r: "Nathan has <strong>3+ years</strong> of professional experience, delivering <strong>20+ projects</strong> for <strong>15+ clients</strong> across e-commerce, SaaS, and mobile app domains."
      },
      {
        p: ['available','free','open','freelance','opportunity','looking','job'],
        r: "✅ Nathan is currently <strong>open to new opportunities</strong> — freelance, contract, or full-time. Reach out via the <a href='#contact' style='color:var(--accent-cyan)'>contact form</a>!"
      },
      {
        p: ['hello','hi','hey','morning','afternoon','evening','sup','halo'],
        r: "Hey! 👋 Welcome to Nathan's portfolio. How can I help? Ask me about his skills, projects, or how to get in touch!"
      },
      {
        p: ['thanks','thank you','appreciate','great','cool','awesome','nice','wow'],
        r: "You're welcome! 😊 Feel free to ask anything else, or head to <a href='#contact' style='color:var(--accent-cyan)'>Contact</a> to reach Nathan directly!"
      },
      {
        p: ['vercel','deploy','hosting','live'],
        r: "This portfolio is deployed on <strong>Vercel</strong> with Vercel Analytics & Speed Insights enabled! Vercel provides instant global CDN, automatic HTTPS, and zero-config deployments."
      },
      {
        p: ['github','repo','code','open source'],
        r: "Nathan's GitHub is at <a href='https://github.com/Nathansept' target='_blank' style='color:var(--accent-cyan)'>github.com/Nathansept</a>. Check out his public repos — Cratter, Amartek-2025, and SiHi!"
      },
    ];

    this.defaultResponse = "Hmm, not sure about that! 🤔 Try asking about Nathan's <strong>skills</strong>, <strong>projects</strong>, <strong>experience</strong>, or <strong>contact info</strong>.";
    this.bindEvents();
  }

  bindEvents() {
    this.bubble.addEventListener('click', () => this.toggle());
    this.closeBtn?.addEventListener('click', () => this.close());
    this.sendBtn?.addEventListener('click', () => this.handleSend());
    this.input?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.handleSend(); }
    });
    this.suggestions?.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.processMessage(chip.dataset.msg);
        if (this.suggestions) this.suggestions.style.display = 'none';
      });
    });
  }

  toggle() { this.isOpen ? this.close() : this.open(); }

  open() {
    this.isOpen = true;
    this.panel.hidden = false;
    this.bubble.querySelector('.open-icon').hidden  = true;
    this.bubble.querySelector('.close-icon').hidden = false;
    if (this.notif) this.notif.style.display = 'none';
    if (this.firstOpen) {
      this.firstOpen = false;
      setTimeout(() => this.addMessage('bot', "Hi! 👋 I'm Nathan's assistant. Ask me about his skills, projects, or how to reach him!"), 400);
    }
    window.trackEvent('chatbot_open');
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
    window.trackEvent('chatbot_message', { q: text.substring(0, 60) });
    if (this.suggestions) this.suggestions.style.display = 'none';
    const typing = this.addTypingIndicator();
    setTimeout(() => {
      typing.remove();
      this.addMessage('bot', this.getResponse(text));
    }, 700 + Math.random() * 500);
  }

  getResponse(text) {
    const lower = text.toLowerCase();
    for (const intent of this.intents) {
      if (intent.p.some(p => lower.includes(p))) return intent.r;
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
   15. SMOOTH SCROLL (all anchor links)
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
   INIT — Bootstrap everything on DOMContentLoaded
───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  // Core visual
  new LiquidCanvas('liquidCanvas');
  initCursorGlow();

  // Text effects
  new TypingEffect('typingTarget', [
    'Creative Developer & Designer',
    'Full-Stack Engineer',
    'UI/UX Enthusiast',
    'Open Source Contributor',
    'Problem Solver ✨',
  ]);

  // Animations
  new ScrollAnimator();
  new NavHighlighter();
  new CounterAnimation();

  // UI controls
  initHamburger();
  initThemeToggle();
  initSmoothScroll();

  // Chatbot
  new ChatBot();

  // Toast system
  Toast.init();

  // Contact form (EmailJS)
  initContactForm();

  // Free APIs
  loadGitHubStats();
  loadDevQuote();

  // Analytics page view
  window.trackEvent('page_view', { page: 'portfolio' });
});
