(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Page entrance: a small fade + vertical settle instead of a hard cut.
  const body = document.body;
  if (reduceMotion) {
    body.classList.remove('page-preload');
    body.classList.add('page-ready');
  } else {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => body.classList.add('page-ready'));
    });
    window.setTimeout(() => body.classList.remove('page-preload'), 520);
  }
  window.addEventListener('pageshow', () => body.classList.remove('page-leave'));
  const header = document.querySelector('.site-header');
  const menuBtn = document.querySelector('.menu-btn');
  const nav = document.querySelector('.main-nav');

  // Lightweight first-view intro (homepage only, once per tab/session).
  const intro = document.querySelector('.site-intro');
  if (intro) {
    let alreadyShown = false;
    try { alreadyShown = sessionStorage.getItem('ryiIntroShown') === '1'; } catch {}
    if (reduceMotion || alreadyShown) {
      intro.remove();
      body.classList.remove('intro-active');
    } else {
      window.setTimeout(() => intro.classList.add('is-leaving'), 920);
      window.setTimeout(() => {
        intro.remove();
        body.classList.remove('intro-active');
        try { sessionStorage.setItem('ryiIntroShown', '1'); } catch {}
      }, 1380);
    }
  }

  const updateHeader = () => {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 24);
  };
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  if (menuBtn && nav) {
    const setMenu = open => {
      nav.classList.toggle('open', open);
      menuBtn.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
      nav.setAttribute('aria-hidden', String(!open));
    };

    nav.setAttribute('aria-hidden', 'true');
    menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        setMenu(false);
        menuBtn.focus();
      }
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 980 && nav.classList.contains('open')) setMenu(false);
    });
  }

  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-nav a').forEach(a => {
    if (a.getAttribute('href') === current) a.classList.add('active');
  });

  // Hero slideshow.
  const slides = [...document.querySelectorAll('.hero-slide')];
  const dots = [...document.querySelectorAll('.hero-progress button')];
  let idx = 0;
  let timer;
  const showSlide = i => {
    if (!slides.length) return;
    idx = (i + slides.length) % slides.length;
    slides.forEach((s, n) => s.classList.toggle('active', n === idx));
    dots.forEach((d, n) => {
      d.classList.remove('active');
      void d.offsetWidth;
      d.classList.toggle('active', n === idx);
    });
  };
  const auto = () => {
    clearInterval(timer);
    if (!reduceMotion) timer = setInterval(() => showSlide(idx + 1), 5800);
  };
  if (slides.length) {
    showSlide(0);
    auto();
    dots.forEach((d, n) => d.addEventListener('click', () => { showSlide(n); auto(); }));
  }

  // Scroll reveals.
  const revealEls = document.querySelectorAll('.reveal,.reveal-left,.reveal-right');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });
    revealEls.forEach(el => observer.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  // Gentle image parallax, throttled to one update per animation frame.
  if (matchMedia('(min-width: 900px)').matches && !reduceMotion) {
    const parallax = [...document.querySelectorAll('[data-parallax]')];
    let ticking = false;
    const move = () => {
      const vh = innerHeight;
      parallax.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom > 0 && r.top < vh) {
          const p = (r.top + r.height / 2 - vh / 2) / vh;
          el.style.transform = `translateY(${p * -18}px) scale(1.035)`;
        }
      });
      ticking = false;
    };
    const requestMove = () => {
      if (!ticking) {
        requestAnimationFrame(move);
        ticking = true;
      }
    };
    move();
    window.addEventListener('scroll', requestMove, { passive:true });
    window.addEventListener('resize', requestMove, { passive:true });
  }

  // Smooth internal page transition.
  // Only normal same-site page links are delayed; hash, mail, tel, downloads,
  // modifier-clicks and external links keep the browser's native behaviour.
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || reduceMotion || e.defaultPrevented || e.button !== 0 ||
        e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const href = a.getAttribute('href');
    if (!href || href === '#' || href.startsWith('#') ||
        href.startsWith('mailto:') || href.startsWith('tel:') ||
        href.startsWith('javascript:') || a.target === '_blank' ||
        a.hasAttribute('download')) return;

    let url;
    try { url = new URL(href, location.href); } catch { return; }
    if (url.origin !== location.origin) return;

    // If this is effectively the same URL, leave it to the browser.
    if (url.href === location.href) return;

    e.preventDefault();
    if (body.classList.contains('page-leave')) return;
    body.classList.add('page-leave');
    a.classList.add('is-activating');

    // 260 ms is long enough to feel smooth but short enough to stay responsive.
    window.setTimeout(() => { location.href = url.href; }, 260);
  });

  // Display-only contact form.
  const form = document.querySelector('#demoContactForm');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const msg = document.querySelector('.demo-message');
      if (msg) {
        msg.style.display = 'block';
        msg.animate?.([
          { opacity: 0, transform: 'translateY(8px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 280, easing: 'ease-out', fill: 'both' });
      }
    });
  }
})();
