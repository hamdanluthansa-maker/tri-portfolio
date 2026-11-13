/**
 * Motion Layer — Tri Hamdani Portfolio
 * Vanilla JS, zero dependencies. Respects prefers-reduced-motion.
 * Content is rendered asynchronously by script.js, so DOM changes are watched
 * with MutationObserver and new elements are wired up as they appear.
 */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const REVEAL_SELECTOR = [
    '.content-section .section-badge-header',
    '.about-card-main',
    '.vibe-coding-hero-card',
    '.vibe-perk-item',
    '.skills-filter-tabs',
    '.skill-card',
    '.project-card',
    '.timeline-header-pill',
    '.timeline-item',
    '.edu-card',
    '.org-card',
    '.gallery-filter-bar',
    '.gallery-card',
    '.cta-inner-card'
  ].join(',');

  const TILT_SELECTOR = '.project-card, .skill-card';

  /* ---------------- 4. SCROLL STAGGER REVEAL ---------------- */
  let revealObserver = null;

  function setupReveal() {
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    document.documentElement.classList.add('mx-on');

    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        if (entry.target.classList.contains('timeline-item')) entry.target.classList.add('is-lit');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    scanReveal(document);
  }

  function scanReveal(root) {
    if (!revealObserver) return;
    const nodes = root.querySelectorAll ? root.querySelectorAll(REVEAL_SELECTOR) : [];
    nodes.forEach((el) => {
      if (el.dataset.mxReveal) return;
      el.dataset.mxReveal = '1';
      // Stagger relative to siblings of the same kind (capped so long lists stay snappy)
      const siblings = el.parentElement ? Array.from(el.parentElement.children) : [el];
      const index = Math.max(0, siblings.indexOf(el)) % 6;
      el.style.setProperty('--mx-delay', (index * 0.08).toFixed(2) + 's');
      el.classList.add('mx-reveal');
      revealObserver.observe(el);
    });
  }

  /* ---------------- 4b. TIMELINE PROGRESS LINE ---------------- */
  function setupTimeline() {
    if (reduceMotion) {
      document.querySelectorAll('.timeline-track').forEach((t) => t.style.setProperty('--mx-progress', '1'));
      return;
    }
    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      document.querySelectorAll('.timeline-track').forEach((track) => {
        const rect = track.getBoundingClientRect();
        if (rect.height <= 0) return;
        const progress = (vh * 0.75 - rect.top) / rect.height;
        track.style.setProperty('--mx-progress', Math.min(1, Math.max(0, progress)).toFixed(3));
      });
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  /* ---------------- 3. 3D TILT + SPOTLIGHT ---------------- */
  function setupTilt() {
    if (reduceMotion || !finePointer) return;
    const MAX_DEG = 7;
    let activeCard = null;
    let frame = 0;
    let lastEvent = null;

    const apply = () => {
      frame = 0;
      if (!activeCard || !lastEvent) return;
      const rect = activeCard.getBoundingClientRect();
      const px = (lastEvent.clientX - rect.left) / rect.width;
      const py = (lastEvent.clientY - rect.top) / rect.height;
      const strength = activeCard.classList.contains('skill-card') ? 0.6 : 1;
      activeCard.style.setProperty('--mx-ry', ((px - 0.5) * 2 * MAX_DEG * strength).toFixed(2) + 'deg');
      activeCard.style.setProperty('--mx-rx', ((0.5 - py) * 2 * MAX_DEG * strength).toFixed(2) + 'deg');
      activeCard.style.setProperty('--mx-x', (px * 100).toFixed(1) + '%');
      activeCard.style.setProperty('--mx-y', (py * 100).toFixed(1) + '%');
    };

    const release = (card) => {
      card.classList.remove('is-tilting');
      card.style.removeProperty('--mx-rx');
      card.style.removeProperty('--mx-ry');
    };

    document.addEventListener('pointermove', (e) => {
      const card = e.target instanceof Element ? e.target.closest(TILT_SELECTOR) : null;
      if (card !== activeCard) {
        if (activeCard) release(activeCard);
        activeCard = card;
        if (activeCard) activeCard.classList.add('is-tilting');
      }
      if (!activeCard) return;
      lastEvent = e;
      if (!frame) frame = requestAnimationFrame(apply);
    }, { passive: true });

    document.addEventListener('pointerleave', () => {
      if (activeCard) release(activeCard);
      activeCard = null;
    });
  }

  /* ---------------- 1. HERO: COUNT-UP + CYBER DECRYPT ---------------- */
  function countUp(el) {
    if (el.dataset.mxCounted) return;
    const raw = (el.textContent || '').trim();
    const match = raw.match(/^(\D*)(\d+(?:[.,]\d+)?)(.*)$/);
    if (!match) return;
    el.dataset.mxCounted = '1';
    const prefix = match[1];
    const target = parseFloat(match[2].replace(',', '.'));
    const decimals = (match[2].split(/[.,]/)[1] || '').length;
    const suffix = match[3];
    if (reduceMotion || !isFinite(target)) return;

    const duration = 1600;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = raw;
    };
    el.textContent = prefix + (0).toFixed(decimals) + suffix;
    requestAnimationFrame(tick);
  }

  function runCounters() {
    document.querySelectorAll('#statsContainer .metric-huge-number').forEach(countUp);
  }

  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@<>/\\{}[]';

  function decrypt(el) {
    if (!el || el.dataset.mxDecrypted || reduceMotion) return;
    const finalText = (el.textContent || '').trim();
    if (!finalText) return;
    el.dataset.mxDecrypted = '1';
    el.setAttribute('aria-label', finalText);

    const chars = Array.from(finalText);
    const total = 22;
    let frameNo = 0;

    const render = () => {
      frameNo++;
      const revealCount = Math.floor((frameNo / total) * chars.length);
      // Built with DOM nodes (no innerHTML) — text stays escaped.
      const frag = document.createDocumentFragment();
      chars.forEach((ch, i) => {
        if (i < revealCount || ch === ' ') {
          frag.appendChild(document.createTextNode(ch));
        } else {
          const span = document.createElement('span');
          span.className = 'mx-glyph';
          span.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          frag.appendChild(span);
        }
      });
      el.replaceChildren(frag);
      if (frameNo < total) {
        setTimeout(() => requestAnimationFrame(render), 45);
      } else {
        el.textContent = finalText;
        el.removeAttribute('aria-label');
      }
    };
    setTimeout(render, 250);
  }

  function heroReady() {
    runCounters();
    decrypt(document.getElementById('profileName'));
  }

  function setupHero() {
    const stats = document.getElementById('statsContainer');
    let fired = false;
    const fire = () => {
      if (fired) return;
      fired = true;
      heroReady();
    };
    if (stats) {
      // script.js re-renders the stats once portfolio.json loads; wait for that.
      const mo = new MutationObserver(() => {
        mo.disconnect();
        requestAnimationFrame(fire);
      });
      mo.observe(stats, { childList: true });
    }
    // Fallback if data was already rendered or never changes
    setTimeout(fire, 1800);
  }

  /* ---------------- 5. VIBE TERMINAL ---------------- */
  const TERMINAL_SCRIPTS = [
    [
      { type: 'cmd',  text: '$ vibe prompt "forum tebengan Jawa-Bali"' },
      { type: 'info', text: '› AI merancang arsitektur & UI…' },
      { type: 'info', text: '› build React + Firestore realtime' },
      { type: 'ok',   text: '✓ NebengKirim live di Vercel' }
    ],
    [
      { type: 'cmd',  text: '$ vibe prompt "kasir multiplatform + OCR"' },
      { type: 'info', text: '› generate POS, stok & laporan…' },
      { type: 'info', text: '› package Web · Electron · Android' },
      { type: 'ok',   text: '✓ POSCloud siap dipakai' }
    ],
    [
      { type: 'cmd',  text: '$ design --brand "identitas visual klien"' },
      { type: 'info', text: '› 12+ tahun rasa desain grafis' },
      { type: 'info', text: '› logo · layout · motion · konten' },
      { type: 'ok',   text: '✓ Ide gila → jadi nyata' }
    ]
  ];

  function buildTerminal() {
    const host = document.querySelector('.hero-right-column');
    if (!host || host.querySelector('.mx-terminal')) return null;

    const term = document.createElement('div');
    term.className = 'mx-terminal';
    term.setAttribute('role', 'img');
    term.setAttribute('aria-label', 'Simulasi alur kerja Vibe Coding: prompt, build oleh AI, lalu live.');

    const bar = document.createElement('div');
    bar.className = 'mx-terminal-bar';
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span');
      dot.className = 'mx-terminal-dot';
      bar.appendChild(dot);
    }
    const title = document.createElement('span');
    title.className = 'mx-terminal-title';
    title.textContent = 'vibe-terminal — tri@madiun';
    bar.appendChild(title);

    const body = document.createElement('div');
    body.className = 'mx-terminal-body';
    body.setAttribute('aria-hidden', 'true');

    term.appendChild(bar);
    term.appendChild(body);

    const tagline = host.querySelector('.hero-tagline-right');
    if (tagline && tagline.nextSibling) host.insertBefore(term, tagline.nextSibling);
    else host.appendChild(term);
    return body;
  }

  function setupTerminal() {
    const body = buildTerminal();
    if (!body) return;

    const caret = document.createElement('span');
    caret.className = 'mx-caret';

    if (reduceMotion) {
      TERMINAL_SCRIPTS[0].forEach((l) => {
        const line = document.createElement('div');
        line.className = 'mx-term-line is-' + l.type;
        line.textContent = l.text;
        body.appendChild(line);
      });
      return;
    }

    let visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
      }).observe(body);
    }

    const wait = (ms) => new Promise((resolve) => {
      const step = () => {
        if (document.hidden || !visible) return setTimeout(step, 400);
        setTimeout(resolve, ms);
      };
      step();
    });

    async function typeLine(item) {
      const line = document.createElement('div');
      line.className = 'mx-term-line is-' + item.type;
      body.appendChild(line);
      line.appendChild(caret);
      const speed = item.type === 'cmd' ? 38 : 18;
      for (const ch of item.text) {
        caret.before(document.createTextNode(ch));
        await wait(speed);
      }
      await wait(item.type === 'cmd' ? 420 : 300);
    }

    (async function loop() {
      let i = 0;
      for (;;) {
        body.replaceChildren();
        for (const item of TERMINAL_SCRIPTS[i % TERMINAL_SCRIPTS.length]) {
          await typeLine(item);
        }
        await wait(2600);
        i++;
      }
    })();
  }

  /* ---------------- DOM WATCHER FOR ASYNC CONTENT ---------------- */
  function watchDynamicContent() {
    const main = document.querySelector('main') || document.body;
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((n) => {
          if (n.nodeType !== 1) return;
          if (n.matches && n.matches(REVEAL_SELECTOR)) scanReveal(n.parentElement || n);
          else scanReveal(n);
        });
      }
    });
    mo.observe(main, { childList: true, subtree: true });
  }

  function init() {
    setupReveal();
    watchDynamicContent();
    setupTimeline();
    setupTilt();
    setupHero();
    setupTerminal();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
