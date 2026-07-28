import {
  auth,
  onAuthStateChanged
} from "firebase-config.js";

const APPS = [
  {
    name: "Durbar",
    icon: "fa-school",
    description: "A lite school communication platform for Grade XI students.",
    status: "live",
    url: "#"
  },
  {
    name: "DarbarHigh",
    icon: "fa-graduation-cap",
    description: "The full-featured school communication platform with chat, notes, and updates.",
    status: "live",
    url: "#"
  },
  {
    name: "Zogo Bingo",
    icon: "fa-dice",
    description: "A multiplayer Bingo game with real-time synced gameplay.",
    status: "live",
    url: "#"
  },
  {
    name: "Rentmandu",
    icon: "fa-house",
    description: "A room rental platform connecting Kirayedaar and Gharbeti across Nepal.",
    status: "live",
    url: "#"
  },
  {
    name: "ChatSet",
    icon: "fa-comments",
    description: "A social chat app with posts, stories, and short-form video.",
    status: "soon",
    url: "#"
  },
  {
    name: "Doroi Store",
    icon: "fa-store",
    description: "An Android app marketplace for discovering and installing apps.",
    status: "soon",
    url: "#"
  }
];

function getInitials(name){
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function setAvatarElement(el, photoURL, name){
  if (!el) return;
  if (photoURL) {
    el.style.display = '';
    el.innerHTML = '';
    el.style.backgroundImage = "url('" + photoURL + "')";
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    el.textContent = '';
  } else {
    el.style.backgroundImage = '';
    el.style.background = 'linear-gradient(135deg,#2563eb,#3b82f6)';
    el.textContent = getInitials(name);
  }
}

function updateHeaderUser(user){
  const headerUser = document.getElementById('headerUser');
  const headerUserAvatar = document.getElementById('headerUserAvatar');
  const headerUserName = document.getElementById('headerUserName');
  if (!headerUser) return;
  if (user) {
    const name = user.displayName || 'Account';
    headerUser.classList.add('show');
    if (headerUserName) headerUserName.textContent = name;
    setAvatarElement(headerUserAvatar, user.photoURL, name);
  } else {
    headerUser.classList.remove('show');
  }
}

function renderApps(){
  const grid = document.getElementById('appsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  APPS.forEach(app=>{
    const card = document.createElement('div');
    card.className = 'app-card';

    const statusLabel = app.status === 'live' ? 'Available' : 'Coming Soon';
    const btnHtml = app.status === 'live'
      ? '<a href="' + app.url + '" class="app-open-btn"><i class="fas fa-arrow-up-right-from-square"></i> Open App</a>'
      : '<span class="app-open-btn disabled"><i class="fas fa-lock"></i> Coming Soon</span>';

    card.innerHTML =
      '<div class="app-icon"><i class="fas ' + app.icon + '"></i></div>' +
      '<h3>' + app.name + '</h3>' +
      '<p>' + app.description + '</p>' +
      '<span class="app-status ' + app.status + '"><i class="fas fa-circle"></i> ' + statusLabel + '</span>' +
      btnHtml;

    grid.appendChild(card);
  });
}

function showGate(){
  document.getElementById('gateWrap').classList.add('show');
  document.getElementById('appsHero').classList.remove('show');
  document.getElementById('appsSection').classList.remove('show');
}

function showApps(){
  document.getElementById('gateWrap').classList.remove('show');
  document.getElementById('appsHero').classList.add('show');
  document.getElementById('appsSection').classList.add('show');
}

showGate();

onAuthStateChanged(auth, (user)=>{
  updateHeaderUser(user);

  if (!user) {
    sessionStorage.setItem('postLoginRedirect', 'apps.html');
    window.location.href = 'auth.html';
    return;
  }

  renderApps();
  showApps();
});