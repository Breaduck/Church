// Sticky header
const header = document.getElementById('site-header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// Hamburger menu
const hamburger = document.getElementById('hamburger');
const nav = document.getElementById('main-nav');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  nav.classList.toggle('open');
  hamburger.setAttribute('aria-label', nav.classList.contains('open') ? '메뉴 닫기' : '메뉴 열기');
});

// Close nav on link click
nav.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    nav.classList.remove('open');
  });
});

// Smooth scroll offset for fixed header
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = header.offsetHeight + 16;
    window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
  });
});

// Fade-in on scroll
const observer = new IntersectionObserver(
  entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  }),
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.fade-in').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 0.1}s`;
  observer.observe(el);
});

// Worship tabs
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});
