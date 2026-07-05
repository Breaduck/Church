// 정다운교회 — main.js
// nav scroll state · mobile menu toggle · scroll reveal
(function () {
  'use strict';

  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('nav-toggle');
  const body = document.body;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Nav scroll state (hairline on scroll) ---
  let lastY = -1;
  function onScroll() {
    const y = window.scrollY || window.pageYOffset;
    if (y === lastY) return;
    lastY = y;
    if (!nav) return;
    nav.classList.toggle('is-scrolled', y > 8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // --- Mobile menu toggle ---
  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      const open = nav.classList.toggle('is-open');
      body.classList.toggle('is-nav-open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // Close on link click
    nav.querySelectorAll('.nav-menu a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('is-open');
        body.classList.remove('is-nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        body.classList.remove('is-nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus();
      }
    });
  }

  // --- Scroll reveal ---
  const reveals = document.querySelectorAll('.reveal');

  if (prefersReduced || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (entry.isIntersecting) {
          // Stagger reveals that came in together
          const idx = Number(entry.target.dataset.revealIdx || 0);
          const delay = Math.min(idx * 90, 540);
          setTimeout(function () { entry.target.classList.add('is-in'); }, delay);
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    // Group reveals per parent for staggering
    const groups = new Map();
    reveals.forEach(function (el) {
      const parent = el.parentElement;
      const arr = groups.get(parent) || [];
      el.dataset.revealIdx = arr.length;
      arr.push(el);
      groups.set(parent, arr);
      io.observe(el);
    });
  }

  // --- Smooth anchor offset for same-page links ---
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    const id = a.getAttribute('href');
    if (!id || id === '#' || id.length < 2) return;
    a.addEventListener('click', function (e) {
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 24;
      window.scrollTo({ top: y, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });
})();
