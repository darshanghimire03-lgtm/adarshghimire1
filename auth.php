<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sign Up — Doroi</title>
<link rel="icon" type="image/png" href="favicon.png">
<link rel="stylesheet" href="style.css">
</head>
<body class="auth-body">

<header class="nav" id="nav">
  <div class="container nav__inner">
    <a href="index.php" class="nav__logo">
      <img src="logo.png" alt="Doroi" class="nav__logo-img" width="26" height="26"> DOROI
    </a>
  </div>
</header>

<main class="auth">
  <div class="auth__card">

    <div class="auth__tabs">
      <button class="auth__tab is-active" data-tab="signup">SIGN UP</button>
      <button class="auth__tab" data-tab="login">LOG IN</button>
    </div>

    <form class="auth__form" id="signupForm" data-panel="signup">
      <h1 class="auth__title">Create your free account</h1>
      <p class="auth__sub">Get early access to new Doroi apps and betas.</p>

      <label>
        <span>FULL NAME</span>
        <input type="text" name="name" id="signupName" placeholder="Your full name" required>
      </label>
      <label>
        <span>EMAIL</span>
        <input type="email" name="email" id="signupEmail" placeholder="you@example.com" required>
      </label>
      <label>
        <span>PASSWORD</span>
        <div class="auth__password-wrap">
          <input type="password" name="password" id="signupPassword" placeholder="At least 6 characters" minlength="6" required>
          <button type="button" class="auth__eye" id="signupPasswordToggle" aria-label="Show password" aria-pressed="false">
            <svg class="icon-eye" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 110-10 5 5 0 010 10zm0-2a3 3 0 100-6 3 3 0 000 6z"/></svg>
            <svg class="icon-eye-off" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" hidden><path fill="currentColor" d="M2.1 3.51 3.51 2.1l18.39 18.39-1.41 1.41-3.02-3.02A11.6 11.6 0 0112 19c-7 0-10-7-10-7a17.5 17.5 0 015.06-6.32L2.1 3.51zM12 7a5 5 0 015 5c0 .64-.13 1.25-.36 1.8l-1.53-1.53A3 3 0 0014.73 10l-1.53-1.53c.5-.24 1.06-.36 1.65-.36-1.25 0-.13 0-.36 0zM7.53 8.94 9.06 10.47A3 3 0 0012 15c.19 0 .38-.02.56-.05l1.53 1.53c-.65.27-1.36.42-2.09.42a5 5 0 01-4.47-7.96zM12 5c7 0 10 7 10 7s-.86 2.02-2.62 3.9l-1.42-1.42C19.24 13.05 20 12 20 12s-2.5-5-8-5c-.64 0-1.25.06-1.83.17L8.66 5.66C9.72 5.24 10.83 5 12 5z"/></svg>
          </button>
        </div>
      </label>

      <label class="auth__check">
        <input type="checkbox" id="isDoroiMember" name="isDoroiMember">
        <span>I'M A DEVELOPER</span>
      </label>

      <div class="auth__member-panel" id="memberPanel" hidden>

        <label>
          <span>ACCESS TOKEN</span>
          <div class="auth__token-wrap">
            <input type="text" id="accessToken" placeholder="Enter access token" autocomplete="off">
            <button type="button" class="btn btn--primary btn--small" id="verifyTokenBtn">VERIFY</button>
          </div>
        </label>
        <p class="auth__note" id="tokenNote"></p>

        <div class="auth__role-section" id="roleSection" hidden>
          <div class="auth__detected-role">
            <span class="auth__spec-label">DETECTED ROLE</span>
            <span class="auth__role-badge" id="detectedRoleBadge">—</span>
          </div>

          <div class="auth__specialization">
            <span class="auth__spec-label">CHOOSE SPECIALIST (SELECT ALL THAT APPLY)</span>
            <div class="auth__chip-group" id="specialistChips">
              <label class="auth__chip">
                <input type="checkbox" name="specialist" value="android"><span>Android App Developer</span>
              </label>
              <label class="auth__chip">
                <input type="checkbox" name="specialist" value="ios"><span>iOS Developer</span>
              </label>
              <label class="auth__chip">
                <input type="checkbox" name="specialist" value="web"><span>Web Developer</span>
              </label>
              <label class="auth__chip">
                <input type="checkbox" name="specialist" value="uiux"><span>UI/UX Developer</span>
              </label>
              <label class="auth__chip">
                <input type="checkbox" name="specialist" value="vibecoder"><span>Vibe Coder</span>
              </label>
            </div>
          </div>
        </div>

      </div>

      <button type="submit" class="btn btn--primary btn--block" id="signupSubmit">SIGN UP FREE →</button>

      <p class="auth__note" id="signupNote"></p>
    </form>

    <form class="auth__form" id="loginForm" data-panel="login" hidden>
      <h1 class="auth__title">Welcome back</h1>
      <p class="auth__sub">Log in to your Doroi account.</p>

      <label>
        <span>EMAIL</span>
        <input type="email" name="email" id="loginEmail" placeholder="you@example.com" required>
      </label>
      <label>
        <span>PASSWORD</span>
        <div class="auth__password-wrap">
          <input type="password" name="password" id="loginPassword" placeholder="Your password" required>
          <button type="button" class="auth__eye" id="loginPasswordToggle" aria-label="Show password" aria-pressed="false">
            <svg class="icon-eye" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 110-10 5 5 0 010 10zm0-2a3 3 0 100-6 3 3 0 000 6z"/></svg>
            <svg class="icon-eye-off" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" hidden><path fill="currentColor" d="M2.1 3.51 3.51 2.1l18.39 18.39-1.41 1.41-3.02-3.02A11.6 11.6 0 0112 19c-7 0-10-7-10-7a17.5 17.5 0 015.06-6.32L2.1 3.51zM12 7a5 5 0 015 5c0 .64-.13 1.25-.36 1.8l-1.53-1.53A3 3 0 0014.73 10l-1.53-1.53c.5-.24 1.06-.36 1.65-.36-1.25 0-.13 0-.36 0zM7.53 8.94 9.06 10.47A3 3 0 0012 15c.19 0 .38-.02.56-.05l1.53 1.53c-.65.27-1.36.42-2.09.42a5 5 0 01-4.47-7.96zM12 5c7 0 10 7 10 7s-.86 2.02-2.62 3.9l-1.42-1.42C19.24 13.05 20 12 20 12s-2.5-5-8-5c-.64 0-1.25.06-1.83.17L8.66 5.66C9.72 5.24 10.83 5 12 5z"/></svg>
          </button>
        </div>
      </label>

      <button type="submit" class="btn btn--primary btn--block" id="loginSubmit">LOG IN →</button>

      <p class="auth__note" id="loginNote"></p>
    </form>

    <div class="auth__form auth__signed-in" id="signedInPanel" hidden>
      <h1 class="auth__title">You're signed in</h1>
      <p class="auth__sub" id="signedInEmail"></p>
      <button type="button" class="btn btn--ghost btn--block" id="signOutBtn">SIGN OUT</button>
    </div>

  </div>
</main>

<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js"></script>
<script src="firebase.js"></script>
<script src="script.js"></script>
</body>
</html>
