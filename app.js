let DATA = { meta: {}, entries: [] };
let activeTag = "全部";
let age = "全部";
let chipSignature = "";

const AGE_OPTS = [
  { id: "全部", label: "全部" },
  { id: "學齡前", label: "學齡前 Early years 3–5" },
  { id: "小學", label: "小學 Primary 6–12" },
  { id: "中學", label: "中學 Secondary 13–18" },
  { id: "大學", label: "大學 University 18+" },
  { id: "成人", label: "成人 Adult 18+" }
];

const chipsEl = document.getElementById("chips");
const ageChips = document.getElementById("ages");
document.getElementById("q").addEventListener("input", render);

function liveEntries(entries) {
  return (entries || []).filter((e) => (e.status || "recommended") !== "offline");
}

function uniqueTags(entries) {
  const counts = new Map();
  (entries || []).forEach((e) => {
    const tags = Array.isArray(e.tags) ? e.tags : [];
    tags.forEach((t) => {
      const name = String(t || "").trim();
      if (!name) return;
      counts.set(name, (counts.get(name) || 0) + 1);
    });
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-Hant"))
    .map(([name]) => name);
}

function bandsOf(e) {
  const info = e.basic_info || {};
  if (Array.isArray(info["年齡段"]) && info["年齡段"].length) return info["年齡段"];
  return [];
}

function buildAgeChips() {
  if (!ageChips) return;
  ageChips.innerHTML = "";
  AGE_OPTS.forEach((opt) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip" + (opt.id === age ? " active" : "");
    b.textContent = opt.label;
    b.addEventListener("click", () => { age = opt.id; render(); });
    ageChips.appendChild(b);
  });
}

function buildChips(force) {
  const tagNames = uniqueTags(liveEntries(DATA.entries));
  const names = ["全部"].concat(tagNames);
  const signature = names.join("\u0001");
  if (!force && signature === chipSignature) {
    [...chipsEl.children].forEach((el) => {
      el.classList.toggle("active", el.textContent === activeTag);
    });
    buildAgeChips();
    return;
  }
  chipSignature = signature;
  if (!names.includes(activeTag)) activeTag = "全部";
  chipsEl.innerHTML = "";
  names.forEach((name) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip" + (name === activeTag ? " active" : "");
    b.textContent = name;
    b.addEventListener("click", () => { activeTag = name; render(); });
    chipsEl.appendChild(b);
  });
  buildAgeChips();
}

function render() {
  try {
    buildChips(false);
    const q = document.getElementById("q").value.trim().toLowerCase();
    const pool = liveEntries(DATA.entries);
    const items = pool.filter((e) => {
      const tags = Array.isArray(e.tags) ? e.tags : [];
      const okTag = activeTag === "全部" || tags.indexOf(activeTag) !== -1;
      if (!okTag) return false;
      if (age !== "全部" && bandsOf(e).indexOf(age) === -1) return false;
      if (!q) return true;
      const info = e.basic_info ? Object.values(e.basic_info).join(" ") : "";
      const blob = [e.title, e.summary, e.notes, info, tags.join(" "), e.source && e.source.name, e.source && e.source.url]
        .filter(Boolean).join(" ").toLowerCase();
      return blob.includes(q);
    }).sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.id).localeCompare(String(a.id)));

    document.getElementById("stats").textContent = items.length + " / " + pool.length + " 則";

    const list = document.getElementById("list");
    list.innerHTML = "";
    if (!items.length) {
      list.innerHTML = '<div class="empty"><h2>還沒有符合的網站</h2><p>把想收的自學網站丟到 Grok，或改一下搜尋、標籤與年齡分段。</p></div>';
      return;
    }
    items.forEach((e) => {
      const facts = e.basic_info
        ? Object.entries(e.basic_info)
            .filter(([k]) => k !== "年齡段")
            .map(([k, v]) => "<div><b>" + esc(k) + "</b><span>" + esc(Array.isArray(v) ? v.join("、") : String(v)) + "</span></div>")
            .join("")
        : "";
      const tagHtml = (Array.isArray(e.tags) ? e.tags : []).map((t) => {
        return '<button type="button" class="tag" data-tag="' + esc(t) + '">' + esc(t) + "</button>";
      }).join("");
      let src = "";
      if (e.source) {
        src = '<div class="source">' + esc(e.source.channel || "來源");
        if (e.source.name) src += " · " + esc(e.source.name);
        if (e.source.url) src += ' · <a href="' + esc(e.source.url) + '" target="_blank" rel="noopener">開啟</a>';
        src += "</div>";
      }
      const el = document.createElement("article");
      el.className = "card";
      el.innerHTML =
        '<div class="card-top"><span class="badge ' + esc(e.category || "其他") + '">' + esc(e.category || "其他") +
        '</span><h2 class="title">' + esc(e.title || "未命名") + '</h2><span class="date">' + esc(e.date || "") +
        "</span></div>" +
        (e.summary ? '<p class="summary">' + esc(e.summary) + "</p>" : "") +
        (facts ? '<div class="facts">' + facts + "</div>" : "") +
        (tagHtml ? '<div class="tags">' + tagHtml + "</div>" : "") +
        src;
      el.querySelectorAll("button.tag").forEach((btn) => {
        btn.addEventListener("click", () => {
          activeTag = btn.getAttribute("data-tag") || "全部";
          render();
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
      });
      list.appendChild(el);
    });
  } catch (err) {
    console.error("curiosity-hub render failed", err);
  }
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, function (ch) {
    var n = { "&": 38, "<": 60, ">": 62, '"': 34, "'": 39 }[ch];
    return String.fromCharCode(38, 35) + n + String.fromCharCode(59);
  });
}

fetch("data.json?v=20260915d")
  .then(function (r) {
    if (!r.ok) throw new Error("data.json HTTP " + r.status);
    return r.json();
  })
  .then(function (d) {
    DATA = d && typeof d === "object" ? d : { meta: {}, entries: [] };
    if (!Array.isArray(DATA.entries)) DATA.entries = [];
    buildChips(true);
    render();
  })
  .catch(function (err) {
    console.error("curiosity-hub data load failed", err);
    render();
  });
