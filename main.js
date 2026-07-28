import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut
} from "./firebase-config.js";

const IMGBB_API_KEY = "1b246ebf1d766f4f37e08018c731b1e5";

const menuBtn = document.getElementById('menuBtn');
const closeBtn = document.getElementById('closeBtn');
const drawer = document.getElementById('drawer');
const overlay = document.getElementById('overlay');

function openDrawer(){
  drawer.classList.add('active');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeDrawer(){
  drawer.classList.remove('active');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

if (menuBtn && drawer && overlay) {
  menuBtn.addEventListener('click', openDrawer);
  closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);
}

function openModal(id){
  const el = document.getElementById(id);
  if (!el) return;
  closeDrawer();
  el.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(id){
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('active');
  document.body.style.overflow = '';
}

document.querySelectorAll('.modal-close').forEach(btn=>{
  btn.addEventListener('click', ()=> closeModal(btn.dataset.close));
});

document.querySelectorAll('.modal-overlay').forEach(ov=>{
  ov.addEventListener('click', (e)=>{
    if(e.target === ov) closeModal(ov.id);
  });
});

const appsBtn = document.getElementById('appsBtn');
if (appsBtn) appsBtn.addEventListener('click', ()=> { window.location.href = 'apps/apps.html'; });

const contactBtn = document.getElementById('contactBtn');
if (contactBtn) contactBtn.addEventListener('click', ()=> openModal('contactModal'));

const contactNavLink = document.getElementById('contactNavLink');
if (contactNavLink) {
  contactNavLink.addEventListener('click', (e)=>{
    e.preventDefault();
    const contactSection = document.getElementById('contact');
    if (contactSection) contactSection.scrollIntoView({behavior:'smooth'});
  });
}

const signupBtnMain = document.getElementById('signupBtnMain');
if (signupBtnMain) signupBtnMain.addEventListener('click', ()=>{ window.location.href = 'auth/auth.html'; });

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

const headerUser = document.getElementById('headerUser');
const headerUserAvatar = document.getElementById('headerUserAvatar');
const headerUserName = document.getElementById('headerUserName');
const headerSignupBtn = document.getElementById('signupBtnMain');

const drawerUserName = document.getElementById('drawerUserName');
const drawerUserSub = document.getElementById('drawerUserSub');
const drawerUserAvatar = document.getElementById('drawerUserAvatar');

function updateHeaderUser(user){
  if (!headerUser) return;
  if (user) {
    const name = user.displayName || 'Account';
    headerUser.classList.add('show');
    if (headerSignupBtn) headerSignupBtn.classList.add('hidden');
    if (headerUserName) headerUserName.textContent = name;
    setAvatarElement(headerUserAvatar, user.photoURL, name);
  } else {
    headerUser.classList.remove('show');
    if (headerSignupBtn) headerSignupBtn.classList.remove('hidden');
  }
}

function updateDrawerUser(user){
  if (!drawerUserName || !drawerUserSub || !drawerUserAvatar) return;
  if (user) {
    const name = user.displayName || 'Account';
    drawerUserName.textContent = name;
    drawerUserSub.textContent = user.email || 'View profile';
    setAvatarElement(drawerUserAvatar, user.photoURL, name);
  } else {
    drawerUserName.textContent = 'Guest';
    drawerUserSub.textContent = 'Tap to sign in';
    setAvatarElement(drawerUserAvatar, null, '');
  }
}

const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const switchText = document.getElementById('switchText');
const goSignup = document.getElementById('goSignup');
const alertBox = document.getElementById('alertBox');
const alertText = document.getElementById('alertText');

function showAlert(message, type){
  if (!alertBox) return;
  alertBox.className = 'alert-box show ' + type;
  alertText.textContent = message;
  const icon = alertBox.querySelector('i');
  icon.className = type === 'success' ? 'fas fa-circle-check' : 'fas fa-circle-exclamation';
}

function hideAlert(){
  if (!alertBox) return;
  alertBox.classList.remove('show');
}

function switchToLogin(){
  loginTab.classList.add('active');
  signupTab.classList.remove('active');
  loginForm.classList.add('active');
  signupForm.classList.remove('active');
  switchText.innerHTML = 'Don\'t have an account? <a id="goSignup2">Sign up for free</a>';
  document.getElementById('goSignup2').addEventListener('click', switchToSignup);
  hideAlert();
}

function switchToSignup(){
  signupTab.classList.add('active');
  loginTab.classList.remove('active');
  signupForm.classList.add('active');
  loginForm.classList.remove('active');
  switchText.innerHTML = 'Already have an account? <a id="goLogin2">Sign in</a>';
  document.getElementById('goLogin2').addEventListener('click', switchToLogin);
  hideAlert();
}

if (loginTab && signupTab) {
  loginTab.addEventListener('click', switchToLogin);
  signupTab.addEventListener('click', switchToSignup);
}

if (goSignup) goSignup.addEventListener('click', switchToSignup);

document.querySelectorAll('.toggle-pass').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const targetInput = document.getElementById(btn.dataset.target);
    const icon = btn.querySelector('i');
    if (targetInput.type === 'password') {
      targetInput.type = 'text';
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    } else {
      targetInput.type = 'password';
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  });
});

function friendlyAuthError(code){
  switch(code){
    case 'auth/email-already-in-use': return 'This email is already registered. Try signing in instead.';
    case 'auth/invalid-email': return 'Please enter a valid email address.';
    case 'auth/weak-password': return 'Password should be at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Incorrect email or password.';
    case 'auth/too-many-requests': return 'Too many attempts. Please try again later.';
    default: return 'Something went wrong. Please try again.';
  }
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    hideAlert();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginSubmitBtn');

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';

    try {
      await signInWithEmailAndPassword(auth, email, password);
      showAlert('Signed in successfully! Redirecting...', 'success');
      const redirectTo = sessionStorage.getItem('postLoginRedirect') || '../index.html';
      sessionStorage.removeItem('postLoginRedirect');
      setTimeout(()=>{ window.location.href = redirectTo; }, 1200);
    } catch (err) {
      showAlert(friendlyAuthError(err.code), 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-right-to-bracket"></i> Sign In';
    }
  });
}

if (signupForm) {
  signupForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    hideAlert();

    const fullName = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const btn = document.getElementById('signupSubmitBtn');

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: fullName });
      showAlert('Account created successfully! Redirecting...', 'success');
      const redirectTo = sessionStorage.getItem('postLoginRedirect') || '../index.html';
      sessionStorage.removeItem('postLoginRedirect');
      setTimeout(()=>{ window.location.href = redirectTo; }, 1200);
    } catch (err) {
      showAlert(friendlyAuthError(err.code), 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
    }
  });
}

const accountCard = document.getElementById('accountCard');
const notLoggedIn = document.getElementById('notLoggedIn');
const accountAvatar = document.getElementById('accountAvatar');
const accountName = document.getElementById('accountName');
const accountEmail = document.getElementById('accountEmail');
const detailName = document.getElementById('detailName');
const detailEmail = document.getElementById('detailEmail');
const detailJoined = document.getElementById('detailJoined');
const logoutBtn = document.getElementById('logoutBtn');
const editProfileBtn = document.getElementById('editProfileBtn');

function renderAccountPage(user){
  if (!accountCard || !notLoggedIn) return;

  if (user) {
    accountCard.classList.remove('hidden');
    notLoggedIn.classList.remove('show');

    const name = user.displayName || 'Doroi User';
    accountName.textContent = name;
    accountEmail.textContent = user.email || '';
    detailName.textContent = name;
    detailEmail.textContent = user.email || '-';

    if (user.metadata && user.metadata.creationTime) {
      const joined = new Date(user.metadata.creationTime);
      detailJoined.textContent = joined.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
    } else {
      detailJoined.textContent = '-';
    }

    setAvatarElement(accountAvatar, user.photoURL, name);
  } else {
    accountCard.classList.add('hidden');
    notLoggedIn.classList.add('show');
  }
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', async ()=>{
    await signOut(auth);
    window.location.href = 'index.html';
  });
}

const editProfileModal = document.getElementById('editProfileModal');
const editAvatarPreview = document.getElementById('editAvatarPreview');
const avatarFileInput = document.getElementById('avatarFileInput');
const editNameInput = document.getElementById('editNameInput');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const editAlertBox = document.getElementById('editAlertBox');
const editAlertText = document.getElementById('editAlertText');

let pendingImageFile = null;

function showEditAlert(message, type){
  if (!editAlertBox) return;
  editAlertBox.className = 'edit-alert-box show ' + type;
  editAlertText.textContent = message;
  const icon = editAlertBox.querySelector('i');
  icon.className = type === 'success' ? 'fas fa-circle-check' : 'fas fa-circle-exclamation';
}

function hideEditAlert(){
  if (!editAlertBox) return;
  editAlertBox.classList.remove('show');
}

if (editProfileBtn) {
  editProfileBtn.addEventListener('click', ()=>{
    const user = auth.currentUser;
    if (!user) return;
    hideEditAlert();
    pendingImageFile = null;
    editNameInput.value = user.displayName || '';
    setAvatarElement(editAvatarPreview, user.photoURL, user.displayName || '');
    openModal('editProfileModal');
  });
}

if (avatarFileInput) {
  avatarFileInput.addEventListener('change', ()=>{
    const file = avatarFileInput.files[0];
    if (!file) return;
    pendingImageFile = file;
    const reader = new FileReader();
    reader.onload = (e)=>{
      editAvatarPreview.style.backgroundImage = "url('" + e.target.result + "')";
      editAvatarPreview.style.backgroundSize = 'cover';
      editAvatarPreview.style.backgroundPosition = 'center';
      editAvatarPreview.textContent = '';
    };
    reader.readAsDataURL(file);
  });
}

async function uploadToImgbb(file){
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('https://api.imgbb.com/1/upload?key=' + IMGBB_API_KEY, {
    method: 'POST',
    body: formData
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error('Image upload failed');
  }

  return data.data.url;
}

if (saveProfileBtn) {
  saveProfileBtn.addEventListener('click', async ()=>{
    const user = auth.currentUser;
    if (!user) return;

    hideEditAlert();
    const newName = editNameInput.value.trim();

    if (!newName) {
      showEditAlert('Please enter your full name.', 'error');
      return;
    }

    saveProfileBtn.disabled = true;
    saveProfileBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
      let photoURL = user.photoURL || null;

      if (pendingImageFile) {
        saveProfileBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading Photo...';
        photoURL = await uploadToImgbb(pendingImageFile);
      }

      await updateProfile(user, { displayName: newName, photoURL: photoURL });

      showEditAlert('Profile updated successfully!', 'success');
      renderAccountPage(auth.currentUser);
      updateHeaderUser(auth.currentUser);
      updateDrawerUser(auth.currentUser);

      setTimeout(()=>{ closeModal('editProfileModal'); }, 1000);
    } catch (err) {
      showEditAlert('Something went wrong. Please try again.', 'error');
    } finally {
      saveProfileBtn.disabled = false;
      saveProfileBtn.innerHTML = '<i class="fas fa-check"></i> Save Changes';
      pendingImageFile = null;
    }
  });
}

onAuthStateChanged(auth, (user)=>{
  updateHeaderUser(user);
  updateDrawerUser(user);
  renderAccountPage(user);
});