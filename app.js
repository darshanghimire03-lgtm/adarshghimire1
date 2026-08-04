document.addEventListener('DOMContentLoaded', () => {

  const chips = document.querySelectorAll('.filter-chip');
  const cards = document.querySelectorAll('.app-card');
  const emptyState = document.getElementById('appsEmpty');

  if (chips.length && cards.length) {
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');

        const filter = chip.getAttribute('data-filter');
        let visibleCount = 0;

        cards.forEach(card => {
          const category = card.getAttribute('data-category');
          const matches = filter === 'all' || category === filter;

          if (matches) {
            card.hidden = false;
            visibleCount++;
          } else {
            card.hidden = true;
          }
        });

        if (emptyState) {
          emptyState.hidden = visibleCount > 0;
        }
      });
    });
  }

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

  const revealTargets = document.querySelectorAll('.app-card');
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

  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.style.boxShadow = window.scrollY > 10
        ? '0 8px 24px -12px rgba(0,0,0,.6)'
        : 'none';
    }, { passive: true });
  }

  const navAuth = document.getElementById('navAuth');
  if (navAuth && typeof auth !== 'undefined') {

    function getInitial(user) {
      const source = (user.displayName && user.displayName.trim())
        || (user.email && user.email.trim())
        || '?';
      return source.charAt(0).toUpperCase();
    }

    function renderLoggedOut() {
      navAuth.innerHTML = `
        <a href="auth.html" class="btn btn--nav" id="navAuthCta">SIGN UP FREE</a>
      `;
    }

    function renderLoggedIn(user) {
      const initial = getInitial(user);
      const label = user.displayName || user.email || 'Account';

      navAuth.innerHTML = `
        <div class="nav__profile" id="navProfile">
          <button type="button" class="nav__profile-btn" id="navProfileBtn" aria-haspopup="true" aria-expanded="false" aria-label="Account menu">
            <span class="nav__profile-avatar">${initial}</span>
          </button>
          <div class="nav__profile-menu" id="navProfileMenu" hidden>
            <p class="nav__profile-name">${label}</p>
            <button type="button" class="nav__profile-signout" id="navSignOutBtn">SIGN OUT</button>
          </div>
        </div>
      `;

      const profile = document.getElementById('navProfile');
      const btn = document.getElementById('navProfileBtn');
      const menu = document.getElementById('navProfileMenu');
      const signOutBtn = document.getElementById('navSignOutBtn');

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = !menu.hidden;
        menu.hidden = isOpen;
        btn.setAttribute('aria-expanded', String(!isOpen));
      });

      document.addEventListener('click', (e) => {
        if (profile && !profile.contains(e.target)) {
          menu.hidden = true;
          btn.setAttribute('aria-expanded', 'false');
        }
      });

      signOutBtn.addEventListener('click', async () => {
        try {
          await auth.signOut();
        } catch (error) {
          console.error(error);
        }
      });
    }

    auth.onAuthStateChanged((user) => {
      if (user) {
        renderLoggedIn(user);
      } else {
        renderLoggedOut();
      }
    });
  }

  const tabs = document.querySelectorAll('.auth__tab');
  const signupForm = document.getElementById('signupForm');
  const loginForm = document.getElementById('loginForm');
  const signedInPanel = document.getElementById('signedInPanel');
  const signedInEmail = document.getElementById('signedInEmail');

  if (signupForm || loginForm) {

    const signupNote = document.getElementById('signupNote');
    const loginNote = document.getElementById('loginNote');
    const signOutBtn = document.getElementById('signOutBtn');

    function showPanel(panelName) {
      tabs.forEach(t => t.classList.toggle('is-active', t.dataset.tab === panelName));
      signupForm.hidden = panelName !== 'signup';
      loginForm.hidden = panelName !== 'login';
    }

    tabs.forEach(tab => {
      tab.addEventListener('click', () => showPanel(tab.dataset.tab));
    });

    showPanel('signup');

    function setNote(el, message, isError) {
      el.textContent = message;
      el.style.color = isError ? '#ff6b6b' : 'var(--blue-400)';
    }

    function setLoading(button, isLoading, loadingLabel, defaultLabel) {
      button.disabled = isLoading;
      button.textContent = isLoading ? loadingLabel : defaultLabel;
    }

    function friendlyError(error) {
      const code = error && error.code ? error.code : '';
      switch (code) {
        case 'auth/email-already-in-use':
          return 'That email is already registered — try logging in instead.';
        case 'auth/invalid-email':
          return 'That email address looks invalid.';
        case 'auth/weak-password':
          return 'Password should be at least 6 characters.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          return 'Incorrect email or password.';
        case 'auth/network-request-failed':
          return 'Network error — check your connection and try again.';
        default:
          return (error && error.message) ? error.message : 'Something went wrong. Please try again.';
      }
    }

    function setupPasswordToggle(inputId, buttonId) {
      const input = document.getElementById(inputId);
      const button = document.getElementById(buttonId);
      if (!input || !button) return;

      const eyeIcon = button.querySelector('.icon-eye');
      const eyeOffIcon = button.querySelector('.icon-eye-off');

      button.addEventListener('click', () => {
        const isHidden = input.type === 'password';
        input.type = isHidden ? 'text' : 'password';
        button.setAttribute('aria-pressed', String(isHidden));
        button.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
        if (eyeIcon) eyeIcon.hidden = isHidden;
        if (eyeOffIcon) eyeOffIcon.hidden = !isHidden;
      });
    }

    setupPasswordToggle('signupPassword', 'signupPasswordToggle');
    setupPasswordToggle('loginPassword', 'loginPasswordToggle');

    if (signupForm) {
      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const submitBtn = document.getElementById('signupSubmit');

        if (!name || !email || password.length < 6) {
          setNote(signupNote, 'Please fill every field. Password needs 6+ characters.', true);
          return;
        }

        setLoading(submitBtn, true, 'CREATING ACCOUNT…', 'SIGN UP FREE →');
        setNote(signupNote, '', false);

        try {
          const credential = await auth.createUserWithEmailAndPassword(email, password);
          await credential.user.updateProfile({ displayName: name });
          setNote(signupNote, `Welcome, ${name.split(' ')[0]} — your account is ready.`, false);
          signupForm.reset();
        } catch (error) {
          setNote(signupNote, friendlyError(error), true);
        } finally {
          setLoading(submitBtn, false, 'CREATING ACCOUNT…', 'SIGN UP FREE →');
        }
      });
    }

    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const submitBtn = document.getElementById('loginSubmit');

        if (!email || !password) {
          setNote(loginNote, 'Enter both your email and password.', true);
          return;
        }

        setLoading(submitBtn, true, 'LOGGING IN…', 'LOG IN →');
        setNote(loginNote, '', false);

        try {
          await auth.signInWithEmailAndPassword(email, password);
          setNote(loginNote, 'Logged in — welcome back.', false);
          loginForm.reset();
        } catch (error) {
          setNote(loginNote, friendlyError(error), true);
        } finally {
          setLoading(submitBtn, false, 'LOGGING IN…', 'LOG IN →');
        }
      });
    }

    if (signOutBtn) {
      signOutBtn.addEventListener('click', async () => {
        try {
          await auth.signOut();
        } catch (error) {
          console.error(error);
        }
      });
    }

    auth.onAuthStateChanged((user) => {
      if (user) {
        signupForm.hidden = true;
        loginForm.hidden = true;
        document.querySelector('.auth__tabs').hidden = true;
        signedInPanel.hidden = false;
        signedInEmail.textContent = user.email || user.displayName || 'Signed in';
      } else {
        signedInPanel.hidden = true;
        document.querySelector('.auth__tabs').hidden = false;
        showPanel('signup');
      }
    });
  }

});
