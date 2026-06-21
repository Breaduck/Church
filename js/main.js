// Nav: transparent → solid on scroll
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('solid', window.scrollY > 10);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Mobile nav toggle
const toggle = document.getElementById('nav-toggle');
const links  = document.getElementById('nav-links');
toggle.addEventListener('click', () => {
  toggle.classList.toggle('open');
  links.classList.toggle('open');
});
links.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => {
    toggle.classList.remove('open');
    links.classList.remove('open');
  })
);

// Smooth scroll (offset for fixed nav)
document.querySelectorAll('a[href^="#"]').forEach(a =>
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    window.scrollTo({ top: t.offsetTop - 52, behavior: 'smooth' });
  })
);

// Reveal on scroll
const observer = new IntersectionObserver(
  entries => entries.forEach(el => {
    if (el.isIntersecting) {
      el.target.classList.add('visible');
      observer.unobserve(el.target);
    }
  }),
  { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 5) * 80}ms`;
  observer.observe(el);
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
