import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getDatabase, ref, get, set, push, remove, onValue } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDNnCaEWJNG2DHAqo0nhQFozfHg7O8QW-0",
  authDomain: "disaster-3f81a.firebaseapp.com",
  databaseURL: "https://disaster-3f81a-default-rtdb.firebaseio.com",
  projectId: "disaster-3f81a",
  storageBucket: "disaster-3f81a.firebasestorage.app",
  messagingSenderId: "67104282273",
  appId: "1:67104282273:web:a148968677ff377262c2e0"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const classIdMap = {
  "Class 11 A": "class11A",
  "Class 11 B": "class11B",
  "Class 12 A": "class12A",
  "Class 12 B": "class12B"
};
const classNameMap = {
  class11A: "Class 11 A",
  class11B: "Class 11 B",
  class12A: "Class 12 A",
  class12B: "Class 12 B"
};
const allClassIds = Object.keys(classNameMap);

// ---------- Shared helpers ----------
function formatRs(n){
  return Number(n || 0).toLocaleString('en-IN');
}
function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
function buildDonationRows(data, withActions){
  const entries = Object.entries(data || {});
  entries.sort((a, b) => (a[1].createdAt || 0) - (b[1].createdAt || 0));
  let total = 0;
  let rowsHtml = '';
  const colCount = withActions ? 4 : 3;
  entries.forEach(([key, entry], idx) => {
    const amt = Number(entry.amount) || 0;
    total += amt;
    rowsHtml +=
      '<tr><td class="sn-col">' + (idx + 1) + '</td>' +
      '<td>' + escapeHtml(entry.name || '') + '</td>' +
      '<td class="amt-col">' + formatRs(amt) + '</td>';
    if (withActions) {
      rowsHtml +=
        '<td><div class="row-actions">' +
        '<button class="icon-btn edit-icon" data-edit-key="' + key + '" data-edit-name="' + escapeHtml(entry.name || '') + '" data-edit-amount="' + amt + '" aria-label="सम्पादन गर्नुहोस्">&#9998;</button>' +
        '<button class="icon-btn delete-icon" data-delete-key="' + key + '" data-delete-name="' + escapeHtml(entry.name || '') + '" aria-label="मेटाउनुहोस्">&#128465;</button>' +
        '</div></td>';
    }
    rowsHtml += '</tr>';
  });
  if (entries.length === 0) {
    rowsHtml = '<tr><td colspan="' + colCount + '" style="text-align:center; color:var(--ink-faint); padding:20px;">अहिलेसम्म कुनै दान दर्ता भएको छैन।</td></tr>';
  }
  return { rowsHtml, total };
}

const pieColors = ['#1a4fd6', '#d61a2c', '#1fa35c', '#e0a020'];

function renderPieChart(wrapEl, perClassTotal){
  if (!wrapEl) return;
  const parts = allClassIds.map((id, i) => ({
    id,
    name: classNameMap[id],
    amount: perClassTotal[id] || 0,
    color: pieColors[i % pieColors.length]
  }));
  const grand = parts.reduce((s, p) => s + p.amount, 0);

  if (grand <= 0) {
    wrapEl.innerHTML = '<div class="pie-empty">अहिलेसम्म कुनै दान दर्ता भएको छैन।</div>';
    return;
  }

  const cx = 100, cy = 100, r = 90;
  let startAngle = -90;
  let pathsSvg = '';

  parts.forEach(p => {
    if (p.amount <= 0) return;
    const fraction = p.amount / grand;
    const endAngle = startAngle + fraction * 360;
    const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;

    const startRad = (Math.PI / 180) * startAngle;
    const endRad = (Math.PI / 180) * endAngle;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    if (fraction >= 0.9999) {
      pathsSvg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + p.color + '"></circle>';
    } else {
      pathsSvg += '<path d="M' + cx + ',' + cy + ' L' + x1.toFixed(2) + ',' + y1.toFixed(2) +
        ' A' + r + ',' + r + ' 0 ' + largeArc + ' 1 ' + x2.toFixed(2) + ',' + y2.toFixed(2) + ' Z" fill="' + p.color + '"></path>';
    }
    startAngle = endAngle;
  });

  const svgHtml = '<svg class="pie-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' + pathsSvg + '</svg>';

  const legendHtml = '<div class="pie-legend">' + parts.map(p => {
    const pct = grand > 0 ? Math.round((p.amount / grand) * 100) : 0;
    return '<div class="pie-legend-item">' +
      '<span class="pie-swatch" style="background:' + p.color + '"></span>' +
      '<span><span class="pie-legend-name">' + escapeHtml(p.name) + '</span><br>' +
      '<span class="pie-legend-amt">रु. ' + formatRs(p.amount) + ' (' + pct + '%)</span></span>' +
      '</div>';
  }).join('') + '</div>';

  wrapEl.innerHTML = svgHtml + legendHtml;
}

// ---------- Shared: topbar login button + login modal ----------
function initAuthWidgets(onLoginSuccess, onLogout){
  const topbarAuthBtn = document.getElementById('topbarAuthBtn');
  const closeLoginBtn = document.getElementById('closeLoginBtn');
  const loginOverlay = document.getElementById('loginOverlay');
  const loginForm = document.getElementById('loginForm');
  const classSelect = document.getElementById('classSelect');
  const passInput = document.getElementById('passInput');
  const loginError = document.getElementById('loginError');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');

  let activeClassId = localStorage.getItem('durbar_active_class_id') || null;

  function isLoggedIn(){ return !!activeClassId; }

  function refreshAuthBtn(){
    if (isLoggedIn()) {
      topbarAuthBtn.textContent = 'लग आउट';
      topbarAuthBtn.classList.add('is-logout');
    } else {
      topbarAuthBtn.textContent = 'लग इन';
      topbarAuthBtn.classList.remove('is-logout');
    }
    const dashMenuBtn = document.getElementById('dashMenuBtn');
    if (dashMenuBtn) {
      dashMenuBtn.classList.toggle('visible', isLoggedIn());
    }
  }
  refreshAuthBtn();

  function openModal(){
    if (!loginOverlay) return;
    loginOverlay.classList.add('active');
    loginError.textContent = '';
  }
  function closeModal(){
    if (!loginOverlay) return;
    loginOverlay.classList.remove('active');
    loginForm.reset();
    loginError.textContent = '';
  }

  if (topbarAuthBtn) {
    topbarAuthBtn.addEventListener('click', () => {
      if (isLoggedIn()) {
        activeClassId = null;
        localStorage.removeItem('durbar_active_class_id');
        localStorage.removeItem('durbar_active_class');
        refreshAuthBtn();
        if (onLogout) onLogout();
      } else {
        openModal();
      }
    });
  }
  if (closeLoginBtn) closeLoginBtn.addEventListener('click', closeModal);
  if (loginOverlay) {
    loginOverlay.addEventListener('click', (e) => {
      if (e.target === loginOverlay) closeModal();
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginError.textContent = '';

      const className = classSelect.value;
      const enteredPass = passInput.value.trim();

      if (!className) {
        loginError.textContent = 'कृपया कक्षा छान्नुहोस्।';
        return;
      }
      if (!enteredPass) {
        loginError.textContent = 'कृपया पासकोड प्रविष्ट गर्नुहोस्।';
        return;
      }

      loginSubmitBtn.disabled = true;
      loginSubmitBtn.textContent = 'जाँच गर्दै...';

      try {
        const classId = classIdMap[className];
        const passSnap = await get(ref(db, 'classPasscodes/' + classId + '/passcode'));

        if (!passSnap.exists()) {
          loginError.textContent = 'यो कक्षा अझै सेटअप गरिएको छैन। एडमिनलाई सम्पर्क गर्नुहोस्।';
          return;
        }

        const storedPass = passSnap.val();
        if (storedPass === enteredPass) {
          activeClassId = classId;
          localStorage.setItem('durbar_active_class_id', classId);
          localStorage.setItem('durbar_active_class', className);
          refreshAuthBtn();
          closeModal();
          if (onLoginSuccess) onLoginSuccess(classId, className);
          if (window.location.pathname.indexOf('class.html') === -1) {
            window.location.href = 'class.html?c=' + classId;
          }
        } else {
          loginError.textContent = 'गलत पासकोड। फेरि प्रयास गर्नुहोस्।';
        }
      } catch (err) {
        console.error(err);
        loginError.textContent = 'त्रुटि: ' + (err.code || err.message || 'केही गलत भयो');
      } finally {
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.textContent = 'लग इन';
      }
    });
  }

  return {
    isLoggedIn,
    getActiveClassId: () => activeClassId,
    refreshAuthBtn
  };
}

// ---------- Home page (index.html) ----------
function initHomePage(){
  const pieChartWrap = document.getElementById('pieChartWrap');
  const grandTotalAmount = document.getElementById('grandTotalAmount');
  const donateSubtotalEl = document.getElementById('donateSubtotal');
  const fineSubtotalEl = document.getElementById('fineSubtotal');

  const auth = initAuthWidgets(null, () => {
    window.location.href = 'index.html';
  });

  // ---------- Home page: grand total (donations + class fines) + pie chart (live) ----------
  function watchSummary(){
    const perClassDonationTotal = {};
    const perClassFineTotal = {};
    const perClassCombinedTotal = {};

    function recomputeGrandTotal(){
      let grand = 0;
      let donateGrand = 0;
      let fineGrand = 0;
      allClassIds.forEach(id => {
        const d = perClassDonationTotal[id] || 0;
        const f = perClassFineTotal[id] || 0;
        perClassCombinedTotal[id] = d + f;
        grand += d + f;
        donateGrand += d;
        fineGrand += f;
      });
      grandTotalAmount.textContent = formatRs(grand);
      if (donateSubtotalEl) donateSubtotalEl.textContent = 'रु. ' + formatRs(donateGrand);
      if (fineSubtotalEl) fineSubtotalEl.textContent = 'रु. ' + formatRs(fineGrand);
      renderPieChart(pieChartWrap, perClassCombinedTotal);
    }

    allClassIds.forEach(classId => {
      onValue(ref(db, 'classDonations/' + classId), (snap) => {
        const data = snap.exists() ? snap.val() : {};
        let total = 0;
        Object.values(data).forEach(entry => { total += Number(entry.amount) || 0; });
        perClassDonationTotal[classId] = total;
        recomputeGrandTotal();
      });

      onValue(ref(db, 'classFine/' + classId + '/amount'), (snap) => {
        perClassFineTotal[classId] = snap.exists() ? (Number(snap.val()) || 0) : 0;
        recomputeGrandTotal();
      });
    });
  }

  watchSummary();
}

// ---------- Class page (class.html) ----------
function initClassPage(){
  const params = new URLSearchParams(window.location.search);
  const urlClassId = params.get('c');

  const classDetailView = document.getElementById('classDetailView');
  const dashboardView = document.getElementById('dashboardView');
  const dashClassName = document.getElementById('dashClassName');
  const dashDownloadListLink = document.getElementById('dashDownloadListLink');

  const dashMenuBtn = document.getElementById('dashMenuBtn');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const dashDrawer = document.getElementById('dashDrawer');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');
  const drawerChangeCaptainBtn = document.getElementById('drawerChangeCaptainBtn');
  const drawerEditFineBtn = document.getElementById('drawerEditFineBtn');
  const drawerLogoutBtn = document.getElementById('drawerLogoutBtn');

  const captainPopup = document.getElementById('captainPopup');
  const closeCaptainPopupBtn = document.getElementById('closeCaptainPopupBtn');
  const dashCaptainInput = document.getElementById('dashCaptainInput');
  const dashViceInput = document.getElementById('dashViceInput');
  const dashSaveLeadershipBtn = document.getElementById('dashSaveLeadershipBtn');
  const dashLeadershipStatus = document.getElementById('dashLeadershipStatus');

  const finePopup = document.getElementById('finePopup');
  const closeFinePopupBtn = document.getElementById('closeFinePopupBtn');
  const fineAmountInput = document.getElementById('fineAmountInput');
  const saveFineBtn = document.getElementById('saveFineBtn');
  const fineStatus = document.getElementById('fineStatus');

  const openAddDonorBtn = document.getElementById('openAddDonorBtn');
  const addDonorPopup = document.getElementById('addDonorPopup');
  const closeAddDonorPopupBtn = document.getElementById('closeAddDonorPopupBtn');
  const donorNameInput = document.getElementById('donorNameInput');
  const donorAmountInput = document.getElementById('donorAmountInput');
  const addDonationBtn = document.getElementById('addDonationBtn');
  const donationStatus = document.getElementById('donationStatus');

  const editDonorPopup = document.getElementById('editDonorPopup');
  const closeEditDonorPopupBtn = document.getElementById('closeEditDonorPopupBtn');
  const editDonorNameInput = document.getElementById('editDonorNameInput');
  const editDonorAmountInput = document.getElementById('editDonorAmountInput');
  const saveEditDonorBtn = document.getElementById('saveEditDonorBtn');
  const editDonorStatus = document.getElementById('editDonorStatus');

  const deleteConfirmPopup = document.getElementById('deleteConfirmPopup');
  const closeDeleteConfirmBtn = document.getElementById('closeDeleteConfirmBtn');
  const deleteConfirmText = document.getElementById('deleteConfirmText');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

  const donationTableBody = document.getElementById('donationTableBody');
  const donationTotal = document.getElementById('donationTotal');

  const detailClassName = document.getElementById('detailClassName');
  const downloadListLink = document.getElementById('downloadListLink');
  const detailDonationTotal = document.getElementById('detailDonationTotal');
  const detailFineAmount = document.getElementById('detailFineAmount');
  const detailDonationTableBody = document.getElementById('detailDonationTableBody');
  const detailDonationTableTotal = document.getElementById('detailDonationTableTotal');

  let detailUnsubscribes = [];
  function clearDetailListeners(){
    detailUnsubscribes.forEach(fn => fn());
    detailUnsubscribes = [];
  }

  function showPublicDetail(classId, className){
    dashboardView.classList.remove('active');
    classDetailView.classList.add('active');
    detailClassName.textContent = className;
    if (downloadListLink) downloadListLink.href = 'download.html?c=' + classId;

    clearDetailListeners();

    const unsubDonations = onValue(ref(db, 'classDonations/' + classId), (snap) => {
      const data = snap.exists() ? snap.val() : {};
      const { rowsHtml, total } = buildDonationRows(data);
      detailDonationTableBody.innerHTML = rowsHtml;
      detailDonationTableTotal.textContent = 'रु. ' + formatRs(total);
      detailDonationTotal.textContent = 'रु. ' + formatRs(total);
    });
    const unsubFine = onValue(ref(db, 'classFine/' + classId + '/amount'), (snap) => {
      const amt = snap.exists() ? snap.val() : 0;
      detailFineAmount.textContent = 'रु. ' + formatRs(amt);
    });

    detailUnsubscribes.push(unsubDonations, unsubFine);
  }

  // ---------- Dashboard (captain, logged in) ----------
  let donationsUnsubscribe = null;

  function watchDonations(activeClassId){
    if (!activeClassId) return;
    donationsUnsubscribe = onValue(ref(db, 'classDonations/' + activeClassId), (snap) => {
      const data = snap.exists() ? snap.val() : {};
      const { rowsHtml, total } = buildDonationRows(data, true);
      donationTableBody.innerHTML = rowsHtml;
      donationTotal.textContent = 'रु. ' + formatRs(total);
    }, (err) => {
      console.error(err);
      donationStatus.textContent = 'दानहरू लोड गर्न सकिएन: ' + (err.code || err.message);
    });
  }

  function showDashboard(activeClassId, className){
    clearDetailListeners();
    classDetailView.classList.remove('active');
    dashClassName.textContent = className;
    if (dashDownloadListLink) dashDownloadListLink.href = 'download.html?c=' + activeClassId;
    dashboardView.classList.add('active');
    watchDonations(activeClassId);
  }

  async function loadLeadershipIntoDash(activeClassId){
    if (!activeClassId) return;
    dashLeadershipStatus.textContent = '';
    try {
      const snap = await get(ref(db, 'classLeadership/' + activeClassId));
      const data = snap.exists() ? snap.val() : {};
      dashCaptainInput.value = data.captain || '';
      dashViceInput.value = data.viceCaptain || '';
    } catch (err) {
      console.error(err);
      dashLeadershipStatus.style.color = '#d61a2c';
      dashLeadershipStatus.textContent = 'हालको नेतृत्व लोड गर्न सकिएन: ' + (err.code || err.message);
    }
  }

  async function loadFineIntoDash(activeClassId){
    if (!activeClassId) return;
    fineStatus.textContent = '';
    try {
      const snap = await get(ref(db, 'classFine/' + activeClassId + '/amount'));
      const amt = snap.exists() ? snap.val() : 0;
      fineAmountInput.value = amt || '';
    } catch (err) {
      console.error(err);
      fineStatus.style.color = '#d61a2c';
      fineStatus.textContent = 'हालको रकम लोड गर्न सकिएन: ' + (err.code || err.message);
    }
  }

  // ---------- Auth wiring ----------
  const auth = initAuthWidgets(
    (classId, className) => {
      // On successful login on this page (rare, usually redirected), show dashboard
      showDashboard(classId, className);
    },
    () => {
      // Logout: go back to public detail view of the URL class, or home
      if (donationsUnsubscribe) { donationsUnsubscribe(); donationsUnsubscribe = null; }
      closeDrawer();
      if (urlClassId && classNameMap[urlClassId]) {
        showPublicDetail(urlClassId, classNameMap[urlClassId]);
      } else {
        window.location.href = 'index.html';
      }
    }
  );

  // ---------- Slide-in menu drawer ----------
  function openDrawer(){
    drawerOverlay.classList.add('active');
    dashDrawer.classList.add('open');
  }
  function closeDrawer(){
    drawerOverlay.classList.remove('active');
    dashDrawer.classList.remove('open');
  }
  if (dashMenuBtn) dashMenuBtn.addEventListener('click', openDrawer);
  if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

  // ---------- Popup helpers ----------
  function openPopup(el){ el.classList.add('active'); }
  function closePopup(el){ el.classList.remove('active'); }

  drawerChangeCaptainBtn.addEventListener('click', () => {
    closeDrawer();
    loadLeadershipIntoDash(auth.getActiveClassId());
    openPopup(captainPopup);
  });
  closeCaptainPopupBtn.addEventListener('click', () => closePopup(captainPopup));
  captainPopup.addEventListener('click', (e) => { if (e.target === captainPopup) closePopup(captainPopup); });

  drawerEditFineBtn.addEventListener('click', () => {
    closeDrawer();
    loadFineIntoDash(auth.getActiveClassId());
    openPopup(finePopup);
  });
  closeFinePopupBtn.addEventListener('click', () => closePopup(finePopup));
  finePopup.addEventListener('click', (e) => { if (e.target === finePopup) closePopup(finePopup); });

  drawerLogoutBtn.addEventListener('click', () => {
    closeDrawer();
    document.getElementById('topbarAuthBtn').click();
  });

  openAddDonorBtn.addEventListener('click', () => {
    donorNameInput.value = '';
    donorAmountInput.value = '';
    donationStatus.textContent = '';
    openPopup(addDonorPopup);
  });
  closeAddDonorPopupBtn.addEventListener('click', () => closePopup(addDonorPopup));
  addDonorPopup.addEventListener('click', (e) => { if (e.target === addDonorPopup) closePopup(addDonorPopup); });

  dashSaveLeadershipBtn.addEventListener('click', async () => {
    const activeClassId = auth.getActiveClassId();
    if (!activeClassId) return;
    const captainName = dashCaptainInput.value.trim();
    const viceName = dashViceInput.value.trim();
    dashLeadershipStatus.style.color = '#d61a2c';
    dashLeadershipStatus.textContent = '';

    if (!captainName && !viceName) {
      dashLeadershipStatus.textContent = 'सुरक्षित गर्नु अघि कम्तिमा एउटा नाम राख्नुहोस्।';
      return;
    }

    dashSaveLeadershipBtn.disabled = true;
    dashSaveLeadershipBtn.textContent = 'सुरक्षित गर्दै...';

    try {
      await set(ref(db, 'classLeadership/' + activeClassId), {
        captain: captainName,
        viceCaptain: viceName
      });
      dashLeadershipStatus.style.color = '#1a4fd6';
      dashLeadershipStatus.textContent = 'सुरक्षित भयो।';
    } catch (err) {
      console.error(err);
      dashLeadershipStatus.textContent = 'सुरक्षित गर्न असफल: ' + (err.code || err.message || 'unknown error');
    } finally {
      dashSaveLeadershipBtn.disabled = false;
      dashSaveLeadershipBtn.textContent = 'नेतृत्व सुरक्षित गर्नुहोस्';
    }
  });

  saveFineBtn.addEventListener('click', async () => {
    const activeClassId = auth.getActiveClassId();
    if (!activeClassId) return;
    const amt = Number(fineAmountInput.value);
    fineStatus.style.color = '#d61a2c';
    fineStatus.textContent = '';

    if (fineAmountInput.value === '' || isNaN(amt) || amt < 0) {
      fineStatus.textContent = 'मान्य रकम प्रविष्ट गर्नुहोस्।';
      return;
    }

    saveFineBtn.disabled = true;
    saveFineBtn.textContent = 'सुरक्षित गर्दै...';

    try {
      await set(ref(db, 'classFine/' + activeClassId), { amount: amt });
      fineStatus.style.color = '#1a4fd6';
      fineStatus.textContent = 'सुरक्षित भयो।';
    } catch (err) {
      console.error(err);
      fineStatus.textContent = 'सुरक्षित गर्न असफल: ' + (err.code || err.message || 'unknown error');
    } finally {
      saveFineBtn.disabled = false;
      saveFineBtn.textContent = 'रकम सुरक्षित गर्नुहोस्';
    }
  });

  addDonationBtn.addEventListener('click', async () => {
    const activeClassId = auth.getActiveClassId();
    if (!activeClassId) return;
    const name = donorNameInput.value.trim();
    const amt = Number(donorAmountInput.value);
    donationStatus.style.color = '#d61a2c';
    donationStatus.textContent = '';

    if (!name) {
      donationStatus.textContent = 'विद्यार्थीको नाम प्रविष्ट गर्नुहोस्।';
      return;
    }
    if (donorAmountInput.value === '' || isNaN(amt) || amt < 0) {
      donationStatus.textContent = 'मान्य दान रकम प्रविष्ट गर्नुहोस्।';
      return;
    }

    addDonationBtn.disabled = true;
    addDonationBtn.textContent = 'थप्दै...';

    try {
      const newRef = push(ref(db, 'classDonations/' + activeClassId));
      await set(newRef, {
        name: name,
        amount: amt,
        createdAt: Date.now()
      });
      donorNameInput.value = '';
      donorAmountInput.value = '';
      donationStatus.style.color = '#1a4fd6';
      donationStatus.textContent = 'थपियो।';
      closePopup(addDonorPopup);
    } catch (err) {
      console.error(err);
      donationStatus.textContent = 'थप्न असफल: ' + (err.code || err.message || 'unknown error');
    } finally {
      addDonationBtn.disabled = false;
      addDonationBtn.textContent = 'दान थप्नुहोस्';
    }
  });

  // ---------- Edit / Delete donor (event delegation on table body) ----------
  let editingKey = null;
  let deletingKey = null;
  let deletingName = '';

  donationTableBody.addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-edit-key]');
    if (editBtn) {
      editingKey = editBtn.dataset.editKey;
      editDonorNameInput.value = editBtn.dataset.editName || '';
      editDonorAmountInput.value = editBtn.dataset.editAmount || '';
      editDonorStatus.textContent = '';
      openPopup(editDonorPopup);
      return;
    }
    const deleteBtn = e.target.closest('[data-delete-key]');
    if (deleteBtn) {
      deletingKey = deleteBtn.dataset.deleteKey;
      deletingName = deleteBtn.dataset.deleteName || 'यो दाता';
      deleteConfirmText.textContent = 'यसले ' + deletingName + 'को दान प्रविष्टि स्थायी रूपमा हटाउनेछ।';
      openPopup(deleteConfirmPopup);
      return;
    }
  });

  closeEditDonorPopupBtn.addEventListener('click', () => closePopup(editDonorPopup));
  editDonorPopup.addEventListener('click', (e) => { if (e.target === editDonorPopup) closePopup(editDonorPopup); });

  saveEditDonorBtn.addEventListener('click', async () => {
    const activeClassId = auth.getActiveClassId();
    if (!activeClassId || !editingKey) return;
    const name = editDonorNameInput.value.trim();
    const amt = Number(editDonorAmountInput.value);
    editDonorStatus.style.color = '#d61a2c';
    editDonorStatus.textContent = '';

    if (!name) {
      editDonorStatus.textContent = 'विद्यार्थीको नाम प्रविष्ट गर्नुहोस्।';
      return;
    }
    if (editDonorAmountInput.value === '' || isNaN(amt) || amt < 0) {
      editDonorStatus.textContent = 'मान्य दान रकम प्रविष्ट गर्नुहोस्।';
      return;
    }

    saveEditDonorBtn.disabled = true;
    saveEditDonorBtn.textContent = 'सुरक्षित गर्दै...';

    try {
      await set(ref(db, 'classDonations/' + activeClassId + '/' + editingKey + '/name'), name);
      await set(ref(db, 'classDonations/' + activeClassId + '/' + editingKey + '/amount'), amt);
      closePopup(editDonorPopup);
      editingKey = null;
    } catch (err) {
      console.error(err);
      editDonorStatus.textContent = 'सुरक्षित गर्न असफल: ' + (err.code || err.message || 'unknown error');
    } finally {
      saveEditDonorBtn.disabled = false;
      saveEditDonorBtn.textContent = 'परिवर्तनहरू सुरक्षित गर्नुहोस्';
    }
  });

  closeDeleteConfirmBtn.addEventListener('click', () => closePopup(deleteConfirmPopup));
  deleteConfirmPopup.addEventListener('click', (e) => { if (e.target === deleteConfirmPopup) closePopup(deleteConfirmPopup); });

  confirmDeleteBtn.addEventListener('click', async () => {
    const activeClassId = auth.getActiveClassId();
    if (!activeClassId || !deletingKey) return;
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.textContent = 'मेटाउँदै...';
    try {
      await remove(ref(db, 'classDonations/' + activeClassId + '/' + deletingKey));
      closePopup(deleteConfirmPopup);
      deletingKey = null;
    } catch (err) {
      console.error(err);
    } finally {
      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.textContent = 'मेटाउनुहोस्';
    }
  });

  // ---------- Initial view: dashboard if logged into this class, else public detail ----------
  const activeClassId = auth.getActiveClassId();
  if (activeClassId && activeClassId === urlClassId) {
    showDashboard(activeClassId, classNameMap[activeClassId]);
  } else if (urlClassId && classNameMap[urlClassId]) {
    showPublicDetail(urlClassId, classNameMap[urlClassId]);
  } else {
    // No class specified in URL — send back home
    window.location.href = 'index.html';
  }
}

// ---------- Page router ----------
if (document.getElementById('pieChartWrap')) {
  initHomePage();
} else if (document.getElementById('classDetailView')) {
  initClassPage();
}
