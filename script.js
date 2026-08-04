// ==================================================
// DOROI — Script (index.html)
// ==================================================

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Mobile nav toggle ---------- */
  const burger = document.getElementById('burger');
  const navMobile = document.getElementById('navMobile');

  if (burger && navMobile) {
    burger.addEventListener('click', () => {
      navMobile.classList.toggle('is-open');
      burger.classList.toggle('is-active');
    });

    navMobile.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMobile.classList.remove('is-open');
      });
    });
  }

  /* ---------- Smooth anchor scrolling (accounts for sticky nav) ---------- */
  const nav = document.getElementById('nav');
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId.length <= 1) return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      const navHeight = nav ? nav.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 12;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ---------- Scroll-to-top button ---------- */
  const scrollTopBtn = document.getElementById('scrollTop');
  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 600) {
        scrollTopBtn.classList.add('is-visible');
      } else {
        scrollTopBtn.classList.remove('is-visible');
      }
    }, { passive: true });

    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Scroll reveal ---------- */
  const revealTargets = document.querySelectorAll(
    '.disc-card, .step, .stat, .work-card, .studio__card, .contact__card'
  );
  revealTargets.forEach(el => el.setAttribute('data-reveal', ''));

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealTargets.forEach(el => observer.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- Contact form (front-end only demo handling) ---------- */
  const form = document.getElementById('contactForm');
  const note = document.getElementById('formNote');

  if (form && note) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const data = new FormData(form);
      const name = (data.get('name') || '').toString().trim();
      const email = (data.get('email') || '').toString().trim();
      const message = (data.get('message') || '').toString().trim();

      if (!name || !email || !message) {
        note.textContent = 'Please fill in your name, email and project details.';
        note.style.color = '#ff6b6b';
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalLabel = submitBtn.textContent;
      submitBtn.textContent = 'SENDING…';
      submitBtn.disabled = true;

      setTimeout(() => {
        note.textContent = `Thanks ${name.split(' ')[0]} — your project details are in. Expect a reply within a day.`;
        note.style.color = 'var(--blue-400)';
        submitBtn.textContent = originalLabel;
        submitBtn.disabled = false;
        form.reset();
      }, 900);
    });
  }

  /* ---------- Sticky nav background intensifies on scroll ---------- */
  if (nav) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 10) {
        nav.style.boxShadow = '0 8px 24px -12px rgba(0,0,0,.6)';
      } else {
        nav.style.boxShadow = 'none';
      }
    }, { passive: true });
  }

});
