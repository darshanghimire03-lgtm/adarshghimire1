(function () {
  var BOOK_PATH = "M4 5.5A1.5 1.5 0 0 1 5.5 4H9v15H5.5A1.5 1.5 0 0 1 4 17.5v-12zM9 4h6v15H9zM15 4h3.5A1.5 1.5 0 0 1 20 5.5v12a1.5 1.5 0 0 1-1.5 1.5H15zM9.8 19v1.8M14.2 19v1.8";
  var CHEVRON_PATH = "M9 5l7 7-7 7";
  var SVG_NS = "http://www.w3.org/2000/svg";

  var subjectListEl = document.getElementById("subjectList");

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function iconSvg(d) {
    var s = document.createElementNS(SVG_NS, "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    var p = document.createElementNS(SVG_NS, "path");
    p.setAttribute("d", d);
    s.appendChild(p);
    return s;
  }

  function unitsLabel(n) {
    return n + (n === 1 ? " unit" : " units");
  }

  function buildSubjectCard(subjectName) {
    var subjectKey = sanitizeKey(subjectName);
    var a = el("a", "subject-card");
    a.href = "unit.html?subjectName=" + encodeURIComponent(subjectName) +
             "&subjectKey=" + encodeURIComponent(subjectKey);

    var icon = el("span", "subject-icon");
    icon.appendChild(iconSvg(BOOK_PATH));
    a.appendChild(icon);

    var info = el("span", "subject-info");
    info.style.display = "block";
    info.appendChild(el("div", "subject-name", subjectName));
    var count = el("div", "subject-count", "Loading...");
    info.appendChild(count);
    a.appendChild(info);

    var chevron = iconSvg(CHEVRON_PATH);
    chevron.setAttribute("class", "subject-chevron");
    a.appendChild(chevron);

    unitsRef(subjectKey).once("value").then(function (snap) {
      count.textContent = unitsLabel(snap.numChildren());
    }).catch(function () {
      count.textContent = "Units unavailable";
    });

    var li = document.createElement("li");
    li.appendChild(a);
    return li;
  }

  function buildSubjects() {
    subjectListEl.textContent = "";
    SUBJECTS.forEach(function (name) {
      subjectListEl.appendChild(buildSubjectCard(name));
    });
  }

  window.Tabs = window.Tabs || {};
  window.Tabs.subject = {
    start: buildSubjects
  };
})();