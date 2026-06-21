// Nav solid on scroll
const nav = document.getElementById('nav');
const setNav = () => nav.classList.toggle('solid', window.scrollY > 20);
window.addEventListener('scroll', setNav, { passive: true });
setNav();

// Mobile nav
const toggle = document.getElementById('nav-toggle');
const links  = document.getElementById('nav-links');
toggle.addEventListener('click', () => {
  toggle.classList.toggle('open');
  links.classList.toggle('open');
});
links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  toggle.classList.remove('open');
  links.classList.remove('open');
}));

// Smooth scroll with nav offset
document.querySelectorAll('a[href^="#"]').forEach(a =>
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    window.scrollTo({ top: t.offsetTop - 56, behavior: 'smooth' });
  })
);

// Hero reveals on load
window.addEventListener('load', () => {
  document.querySelectorAll('.reveal-hero').forEach(el =>
    el.classList.add('visible')
  );
});

// Section reveals on scroll
const obs = new IntersectionObserver(
  entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      obs.unobserve(entry.target);
    }
  }),
  { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
);

document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 6) * 90}ms`;
  obs.observe(el);
});

// Worship tabs
document.querySelectorAll('.wtab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.wtab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.worship-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});
