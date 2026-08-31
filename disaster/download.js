import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

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

const classNameMap = {
  class11A: "Class 11 A",
  class11B: "Class 11 B",
  class12A: "Class 12 A",
  class12B: "Class 12 B"
};

function formatRs(n){
  return Number(n || 0).toLocaleString('en-IN');
}
function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

const params = new URLSearchParams(window.location.search);
const classId = params.get('c');
const backToClassLink = document.getElementById('backToClassLink');
const toolbarClassName = document.getElementById('dlToolbarClassName');
const toolbarSub = document.getElementById('dlToolbarSub');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const emptyState = document.getElementById('dlEmptyState');
const pagesRoot = document.getElementById('dlPagesRoot');

if (classId) backToClassLink.href = 'class.html?c=' + classId;

downloadAllBtn.addEventListener('click', () => {
  window.print();
});

/* ----------------------------------------------------------------
   Page shell
   - Page 1 gets the full masthead (school name / location / title)
     plus the class line and the explanatory note.
   - Every later page gets ONLY a compact continuation header
     (class name + "...जारी"), never the full masthead again.
   ---------------------------------------------------------------- */
function pageShellHtml(bodyHtml, pageNum, totalPagesPlaceholder, headerHtml){
  return (
    '<div class="a4-page-wrap"><div class="a4-page">' +
      headerHtml +
      bodyHtml +
      '<div class="a4-page-footer">' +
        '<span>दरबार विपद् राहत कोष</span>' +
        '<span>पृष्ठ ' + pageNum + ' / ' + totalPagesPlaceholder + '</span>' +
      '</div>' +
    '</div></div>'
  );
}

function fullHeaderHtml(className){
  const parts = className.split(' ');
  const grade = parts.length >= 2 ? parts[0] + ' ' + parts[1] : className;
  const section = parts.length >= 3 ? parts[2] : '';
  return (
    '<div class="a4-dateline"><span class="lbl">मिति:</span><span class="fillline"></span></div>' +
    '<div class="a4-masthead">' +
      '<div class="school-name">दरबार हाई स्कूल</div>' +
      '<div class="school-loc">रानीपोखरी</div>' +
      '<div class="doc-title">प्रधानमन्त्री विपद् राहत कोष — दान संकलन विवरण</div>' +
    '</div>' +
    '<div class="a4-classline">' +
      '<span>कक्षा: ' + escapeHtml(grade) + '</span>' +
      '<span>सेक्सन: ' + escapeHtml(section) + '</span>' +
    '</div>' +
    '<div class="a4-note">' +
      'कक्षा ' + escapeHtml(className) + ' का विद्यार्थीहरूले दानको लागि आफ्नो व्यक्तिगत योगदान र कक्षाको जरिवाना रकमबाट संकलन गरेको सहयोग रकमबाट, सहयोग गर्ने विद्यार्थीहरूको नाम र रकम पारदर्शी हुने गरी डेटा संकलन गरिएको छ।' +
    '</div>'
  );
}

function continuationHeaderHtml(className){
  return (
    '<div class="a4-continuation">' +
      '<span class="a4-continuation-class">' + escapeHtml(className) + '</span>' +
      '<span class="a4-continuation-tag">... जारी (क्रमशः)</span>' +
    '</div>'
  );
}

function tableHeadHtml(){
  return (
    '<table class="a4-table"><thead><tr>' +
      '<th class="sn-col">क्र.सं.</th>' +
      '<th>विद्यार्थीको नाम</th>' +
      '<th class="amt-col">रकम (रु.)</th>' +
    '</tr></thead><tbody>'
  );
}

function rowHtml(idx, name, amt){
  return (
    '<tr><td class="sn-col">' + idx + '</td>' +
    '<td>' + escapeHtml(name) + '</td>' +
    '<td class="amt-col">' + formatRs(amt) + '</td></tr>'
  );
}

function totalsAndSignaturesHtml(donationTotal, fineAmount){
  const grand = donationTotal + fineAmount;
  return (
    '<div class="a4-totals">' +
      '<table>' +
        '<tr><td class="label">व्यक्तिगत दान जम्मा</td><td class="value">रु. ' + formatRs(donationTotal) + '</td></tr>' +
        '<tr><td class="label">कक्षा जरिवाना योगदान</td><td class="value">रु. ' + formatRs(fineAmount) + '</td></tr>' +
        '<tr class="grand"><td class="label">कुल जम्मा</td><td class="value">रु. ' + formatRs(grand) + '</td></tr>' +
      '</table>' +
    '</div>' +
    '<div class="a4-signatures">' +
      '<div class="a4-sig-block"><div class="a4-sig-line"></div><div class="a4-sig-label">क्याप्टेनको हस्ताक्षर</div></div>' +
      '<div class="a4-sig-block"><div class="a4-sig-line"></div><div class="a4-sig-label">उप क्याप्टेनको हस्ताक्षर</div></div>' +
    '</div>'
  );
}

async function loadClassData(id){
  const [donationsSnap, fineSnap] = await Promise.all([
    get(ref(db, 'classDonations/' + id)),
    get(ref(db, 'classFine/' + id + '/amount'))
  ]);
  const donationsData = donationsSnap.exists() ? donationsSnap.val() : {};
  const entries = Object.values(donationsData).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const fineAmount = fineSnap.exists() ? (Number(fineSnap.val()) || 0) : 0;
  let donationTotal = 0;
  entries.forEach(e => { donationTotal += Number(e.amount) || 0; });
  return { entries, donationTotal, fineAmount };
}

/* ----------------------------------------------------------------
   Measurement helpers.
   We measure against real rendered content (using the correct
   header for each page type) so the row-capacity numbers are
   accurate and pages fill up properly instead of leaving a mostly
   blank continuation page for one leftover row.
   ---------------------------------------------------------------- */
function buildProbe(headerHtml, extraBodyHtml){
  const probe = document.createElement('div');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.left = '-9999px';
  probe.style.top = '0';
  probe.innerHTML = pageShellHtml(
    tableHeadHtml() + '</tbody></table>' + (extraBodyHtml || ''),
    1, 1, headerHtml
  );
  document.body.appendChild(probe);
  return probe;
}

function measureRowHeight(table){
  const sampleRow = document.createElement('tr');
  sampleRow.innerHTML = '<td class="sn-col">1</td><td>नमूना नाम विद्यार्थी</td><td class="amt-col">1,000</td>';
  table.querySelector('tbody').appendChild(sampleRow);
  const h = sampleRow.getBoundingClientRect().height || 34;
  return h;
}

// Capacity for a normal (non-final) content page: full header on page 1,
// compact continuation header on later pages.
function measureRowCapacity(className, isFirstPage){
  const headerHtml = isFirstPage ? fullHeaderHtml(className) : continuationHeaderHtml(className);
  const probe = buildProbe(headerHtml, '');
  const page = probe.querySelector('.a4-page');
  const table = probe.querySelector('.a4-table');
  const availableHeight = page.clientHeight - (page.scrollHeight - table.clientHeight) - 24;
  const rowHeight = measureRowHeight(table);
  document.body.removeChild(probe);
  return Math.max(1, Math.floor(availableHeight / rowHeight));
}

// Capacity for the final page, which also carries totals + signatures.
function measureFinalPageCapacity(className, isFirstPage){
  const headerHtml = isFirstPage ? fullHeaderHtml(className) : continuationHeaderHtml(className);
  const probe = buildProbe(headerHtml, totalsAndSignaturesHtml(0, 0));
  const page = probe.querySelector('.a4-page');
  const table = probe.querySelector('.a4-table');
  const extras = probe.querySelector('.a4-totals').getBoundingClientRect().height +
                 probe.querySelector('.a4-signatures').getBoundingClientRect().height;
  const availableHeight = page.clientHeight - (page.scrollHeight - table.clientHeight) - extras - 24;
  const rowHeight = measureRowHeight(table);
  document.body.removeChild(probe);
  return Math.max(0, Math.floor(availableHeight / rowHeight));
}

/* ----------------------------------------------------------------
   Pagination.
   Key fix: capacity differs between the first page (full header,
   less room) and continuation pages (compact header, more room),
   and we greedily fill every page to capacity instead of an
   algorithm that could strand a single row alone on a near-empty
   final page.
   ---------------------------------------------------------------- */
function paginate(entries, firstPageCapacity, laterPageCapacity, firstPageFinalCapacity, laterPageFinalCapacity){
  if (entries.length === 0) return [[]];

  // Everything fits on page 1 alone (with totals + signatures).
  if (entries.length <= firstPageFinalCapacity) {
    return [entries];
  }

  const pages = [];
  let remaining = entries.slice();

  // Page 1: fill to firstPageCapacity (more pages are coming, so no
  // need to reserve room for totals/signatures here).
  const take1 = Math.min(firstPageCapacity, remaining.length);
  pages.push(remaining.slice(0, take1));
  remaining = remaining.slice(take1);

  // Middle/last pages use the continuation header's larger capacity.
  // Rebalance near the end so a tiny leftover never gets stranded alone
  // on a near-empty final page — if what's left after a full page would
  // leave only a sliver for the final page, pull some rows back instead.
  while (remaining.length > 0) {
    if (remaining.length <= laterPageFinalCapacity) {
      pages.push(remaining);
      remaining = [];
      break;
    }
    const take = Math.min(laterPageCapacity, remaining.length);
    const after = remaining.length - take;
    if (after > 0 && after < Math.ceil(laterPageFinalCapacity * 0.3)) {
      const rebalancedTake = remaining.length - laterPageFinalCapacity;
      pages.push(remaining.slice(0, rebalancedTake));
      remaining = remaining.slice(rebalancedTake);
    } else {
      pages.push(remaining.slice(0, take));
      remaining = remaining.slice(take);
    }
  }

  return pages;
}

async function render(){
  if (!classId || !classNameMap[classId]) {
    toolbarClassName.textContent = 'कक्षा फेला परेन';
    emptyState.style.display = 'block';
    emptyState.querySelector('p').textContent = 'सही कक्षा लिङ्कबाट यो पृष्ठ खोल्नुहोस्।';
    return;
  }

  const className = classNameMap[classId];
  toolbarClassName.textContent = className + ' — सूची डाउनलोड';
  toolbarSub.textContent = 'डाउनलोड बटनले प्रिन्ट / PDF को रूपमा बचत गर्ने विकल्प खोल्नेछ। धेरै पृष्ठ भए छेउछेउ स्क्रोल गर्नुहोस् (स्वाइप)।';

  let data;
  try {
    data = await loadClassData(classId);
  } catch (err) {
    console.error(err);
    toolbarClassName.textContent = 'डेटा लोड गर्न सकिएन';
    emptyState.style.display = 'block';
    emptyState.querySelector('p').textContent = 'डेटा लोड गर्दा त्रुटि भयो: ' + (err.code || err.message || 'unknown error');
    return;
  }

  const { entries, donationTotal, fineAmount } = data;

  const firstPageCapacity = measureRowCapacity(className, true);
  const laterPageCapacity = measureRowCapacity(className, false);
  const firstPageFinalCapacity = measureFinalPageCapacity(className, true);
  const laterPageFinalCapacity = measureFinalPageCapacity(className, false);

  const pages = paginate(
    entries,
    firstPageCapacity,
    laterPageCapacity,
    firstPageFinalCapacity,
    laterPageFinalCapacity
  );
  const totalPages = pages.length;

  let idxCounter = 1;
  const pageHtmls = pages.map((rows, pageIdx) => {
    const isFirst = pageIdx === 0;
    const isLast = pageIdx === pages.length - 1;
    const headerHtml = isFirst ? fullHeaderHtml(className) : continuationHeaderHtml(className);

    let body = tableHeadHtml();

    if (rows.length === 0 && entries.length === 0) {
      body += '<tr><td colspan="3" style="text-align:center; color:var(--ink-faint); padding:20px;">अहिलेसम्म कुनै दान दर्ता भएको छैन।</td></tr>';
    } else {
      rows.forEach(entry => {
        body += rowHtml(idxCounter, entry.name || '', Number(entry.amount) || 0);
        idxCounter++;
      });
    }
    body += '</tbody></table>';

    if (isLast) {
      body += totalsAndSignaturesHtml(donationTotal, fineAmount);
    }

    return pageShellHtml(body, pageIdx + 1, totalPages, headerHtml);
  });

  pagesRoot.innerHTML = pageHtmls.join('');

  if (totalPages > 1) {
    toolbarSub.textContent = 'जम्मा ' + totalPages + ' पृष्ठहरू — छेउछेउ स्क्रोल गर्नुहोस् (स्वाइप)। डाउनलोड बटनले प्रिन्ट / PDF खोल्नेछ।';
  } else {
    toolbarSub.textContent = 'डाउनलोड बटनले प्रिन्ट / PDF को रूपमा बचत गर्ने विकल्प खोल्नेछ।';
  }
}

render();
