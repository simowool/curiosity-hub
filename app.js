let DATA = { meta: {}, entries: [] };
let activeTag = "全部";
let age = "全部";
let kind = "全部";
let chipSignature = "";

const KIND_OPTS = [
  { id: "全部", label: "全部" },
  { id: "site", label: "網站" },
  { id: "thought", label: "想想" },
  { id: "paper", label: "論文" }
];

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
const kindsEl = document.getElementById("kinds");
const ageRow = document.getElementById("ageRow");
document.getElementById("q").addEventListener("input", render);

function kindOf(e) { return e.kind || "site"; }
function kindLabel(k) {
  if (k === "thought") return "想想";
  if (k === "paper") return "論文";
  return "網站";
}
function liveEntries(entries) {
  return (entries || []).filter((e) => (e.status || "recommended") !== "offline");
}
function uniqueTags(entries) {
  const counts = new Map();
  (entries || []).forEach((e) => {
    (Array.isArray(e.tags) ? e.tags : []).forEach((t) => {
      const name = String(t || "").trim();
      if (!name) return;
      counts.set(name, (counts.get(name) || 0) + 1);
    });
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-Hant")).map(([name]) => name);
}
function bandsOf(e) {
  const info = e.basic_info || {};
  if (Array.isArray(info["年齡段"]) && info["年齡段"].length) return info["年齡段"];
  return [];
}
function buildKindChips() {
  if (!kindsEl) return;
  kindsEl.innerHTML = "";
  KIND_OPTS.forEach((opt) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip" + (opt.id === kind ? " active" : "");
    b.textContent = opt.label;
    b.addEventListener("click", () => { kind = opt.id; render(); });
    kindsEl.appendChild(b);
  });
}
function buildAgeChips() {
  if (!ageChips) return;
  if (ageRow) ageRow.style.display = (kind === "thought" || kind === "paper") ? "none" : "";
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
  buildKindChips();
  const names = ["全部"].concat(uniqueTags(liveEntries(DATA.entries)));
  const signature = names.join("\u0001");
  if (!force && signature === chipSignature) {
    [...chipsEl.children].forEach((el) => { el.classList.toggle("active", el.textContent === activeTag); });
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
      if (kind !== "全部" && kindOf(e) !== kind) return false;
      const tags = Array.isArray(e.tags) ? e.tags : [];
      if (!(activeTag === "全部" || tags.indexOf(activeTag) !== -1)) return false;
      const applyAge = kind === "全部" || kind === "site";
      if (applyAge && age !== "全部") {
        if (kindOf(e) !== "site") return false;
        if (bandsOf(e).indexOf(age) === -1) return false;
      }
      if (!q) return true;
      const info = e.basic_info ? Object.values(e.basic_info).join(" ") : "";
      const blob = [e.title, e.summary, e.notes, kindLabel(kindOf(e)), info, tags.join(" "), e.source && e.source.name, e.source && e.source.url].filter(Boolean).join(" ").toLowerCase();
      return blob.includes(q);
    }).sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.id).localeCompare(String(a.id)));
    document.getElementById("stats").textContent = items.length + " / " + pool.length + " 則";
    const list = document.getElementById("list");
    list.innerHTML = "";
    if (!items.length) {
      list.innerHTML = '<div class="empty"><h2>還沒有符合的內容</h2><p>把網站、想法或論文丟到 Grok，或改一下類型、搜尋與標籤。</p></div>';
      return;
    }
    items.forEach((e) => {
      const k = kindOf(e);
      const badgeText = k === "site" ? (e.category || "其他") : kindLabel(k);
      const badgeClass = k === "site" ? (e.category || "其他") : kindLabel(k);
      const facts = e.basic_info
        ? Object.entries(e.basic_info).filter(([key]) => key !== "年齡段").map(([key, v]) => "<div><b>" + esc(key) + "</b><span>" + esc(Array.isArray(v) ? v.join("、") : String(v)) + "</span></div>").join("")
        : "";
      const tagHtml = (Array.isArray(e.tags) ? e.tags : []).map((t) => '<button type="button" class="tag" data-tag="' + esc(t) + '">' + esc(t) + "</button>").join("");
      let src = "";
      if (e.source) {
        src = '<div class="source">' + esc(e.source.channel || "來源");
        if (e.source.name) src += " · " + esc(e.source.name);
        if (e.source.url) src += ' · <a href="' + esc(e.source.url) + '" target="_blank" rel="noopener">開啟</a>';
        src += "</div>";
      }
      const el = document.createElement("article");
      el.className = "card";
      el.innerHTML = '<div class="card-top"><span class="badge ' + esc(badgeClass) + '">' + esc(badgeText) + '</span><h2 class="title">' + esc(e.title || "未命名") + '</h2><span class="date">' + esc(e.date || "") + "</span></div>" + (e.summary ? '<p class="summary">' + esc(e.summary) + "</p>" : "") + (facts ? '<div class="facts">' + facts + "</div>" : "") + (tagHtml ? '<div class="tags">' + tagHtml + "</div>" : "") + src;
      el.querySelectorAll("button.tag").forEach((btn) => {
        btn.addEventListener("click", () => { activeTag = btn.getAttribute("data-tag") || "全部"; render(); window.scrollTo({ top: 0, behavior: "smooth" }); });
      });
      list.appendChild(el);
    });
  } catch (err) { console.error("curiosity-hub render failed", err); }
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, function (ch) {
    var n = { "&": 38, "<": 60, ">": 62, '"': 34, "'": 39 }[ch];
    return String.fromCharCode(38, 35) + n + String.fromCharCode(59);
  });
}
fetch("data.json?v=20260915e")
  .then(function (r) { if (!r.ok) throw new Error("data.json HTTP " + r.status); return r.json(); })
  .then(function (d) {
    DATA = d && typeof d === "object" ? d : { meta: {}, entries: [] };
    if (!Array.isArray(DATA.entries)) DATA.entries = [];
    buildChips(true); render();
  })
  .catch(function (err) { console.error("curiosity-hub data load failed", err); render(); });
