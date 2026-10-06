/* ULD — главная страница. Без зависимостей. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Появление блоков при прокрутке ---------- */
  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    if (!items.length) return;

    items.forEach(function (el) {
      el.classList.add('reveal', 'reveal_from_' + (el.getAttribute('data-reveal') || 'up'));
    });

    function show(el) {
      el.classList.add('reveal_visible');
      el.addEventListener('transitionend', function done(e) {
        if (e.target !== el || e.propertyName !== 'transform') return;
        el.classList.add('reveal_done');
        el.removeEventListener('transitionend', done);
      });
    }

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(show);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        show(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Таймер до этапа ---------- */
  function initCountdown() {
    var root = document.querySelector('[data-countdown]');
    if (!root) return;

    var deadlineAttr = root.getAttribute('data-deadline');
    var demoOffset = Number(root.getAttribute('data-demo-offset')) || 0;
    // На проде дата берётся из data-deadline; в демо отсчёт идёт от момента загрузки.
    var deadline = deadlineAttr ? new Date(deadlineAttr).getTime() : Date.now() + demoOffset * 1000;

    var parts = {
      days: root.querySelector('[data-countdown-days]'),
      hours: root.querySelector('[data-countdown-hours]'),
      minutes: root.querySelector('[data-countdown-minutes]'),
      seconds: root.querySelector('[data-countdown-seconds]')
    };

    function pad(n) { return n < 10 ? '0' + n : String(n); }

    function set(el, value) {
      if (!el || el.textContent === value) return;
      el.textContent = value;
      if (reduceMotion) return;
      el.classList.remove('countdown__value_tick');
      void el.offsetWidth; // перезапуск анимации
      el.classList.add('countdown__value_tick');
    }

    function tick() {
      var left = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      set(parts.days, pad(Math.floor(left / 86400)));
      set(parts.hours, pad(Math.floor(left % 86400 / 3600)));
      set(parts.minutes, pad(Math.floor(left % 3600 / 60)));
      set(parts.seconds, pad(left % 60));
      if (left === 0) clearInterval(timer);
    }

    var timer = setInterval(tick, 1000);
    tick();
  }

  /* ---------- Счётчик очков ---------- */
  function initCounters() {
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
    if (!items.length || reduceMotion || !('IntersectionObserver' in window)) return;

    function run(el) {
      var target = Number(el.getAttribute('data-count'));
      var start = null;
      var duration = 1400;
      function frame(now) {
        if (start === null) start = now;
        var p = Math.min(1, (now - start) / duration);
        var eased = 1 - Math.pow(1 - p, 4);
        el.textContent = String(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Мобильное меню ---------- */
  function initMenu() {
    var menu = document.querySelector('[data-menu]');
    var toggle = document.querySelector('[data-menu-toggle]');
    if (!menu || !toggle) return;

    function setOpen(open) {
      menu.classList.toggle('menu_open', open);
      menu.setAttribute('aria-hidden', String(!open));
      toggle.classList.toggle('burger_active', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      document.body.classList.toggle('page__body_locked', open);
    }

    toggle.addEventListener('click', function () {
      setOpen(!menu.classList.contains('menu_open'));
    });

    menu.addEventListener('click', function (e) {
      if (e.target.closest('[data-menu-close]')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('menu_open')) {
        setOpen(false);
        toggle.focus();
      }
    });

    // при переходе на десктоп меню закрывается
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (e) {
      if (e.matches) setOpen(false);
    });
  }

  /* ---------- Шапка: прячется при прокрутке вниз, выезжает при прокрутке вверх ---------- */
  function initHeader() {
    var header = document.querySelector('[data-header]');
    if (!header) return;

    var lastY = window.scrollY;
    var ticking = false;

    function update() {
      var y = window.scrollY;
      var menuOpen = document.body.classList.contains('page__body_locked');
      if (!menuOpen) {
        if (y > lastY + 4 && y > 240) header.classList.add('header_hidden');
        else if (y < lastY - 4 || y <= 240) header.classList.remove('header_hidden');
      }
      lastY = y;
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
  }

  initReveal();
  initCountdown();
  initCounters();
  initMenu();
  initHeader();
})();
