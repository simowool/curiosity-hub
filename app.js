let DATA = { meta: {}, entries: [] };
let activeTag = "全部";
let chipSignature = "";

const chipsEl = document.getElementById("chips");
document.getElementById("q").addEventListener("input", render);

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

function buildChips(force) {
  const tagNames = uniqueTags(DATA.entries);
  const names = ["全部"].concat(tagNames);
  const signature = names.join("\u0001");
  if (!force && signature === chipSignature) {
    [...chipsEl.children].forEach((el) => {
      el.classList.toggle("active", el.textContent === activeTag);
    });
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
    b.addEventListener("click", () => {
      activeTag = name;
      render();
    });
    chipsEl.appendChild(b);
  });
}

function render() {
  try {
    buildChips(false);
    const q = document.getElementById("q").value.trim().toLowerCase();
    const items = (DATA.entries || []).filter((e) => {
      const tags = Array.isArray(e.tags) ? e.tags : [];
      const okTag = activeTag === "全部" || tags.indexOf(activeTag) !== -1;
      if (!okTag) return false;
      if (!q) return true;
      const info = e.basic_info ? Object.values(e.basic_info).join(" ") : "";
      const blob = [e.title, e.summary, e.notes, info, tags.join(" "), e.source && e.source.name, e.source && e.source.url]
        .filter(Boolean).join(" ").toLowerCase();
      return blob.includes(q);
    }).sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.id).localeCompare(String(a.id)));

    document.getElementById("stats").textContent = items.length + " / " + (DATA.entries || []).length + " 則";

    const list = document.getElementById("list");
    list.innerHTML = "";
    if (!items.length) {
      list.innerHTML = '<div class="empty"><h2>還沒有符合的網站</h2><p>把想收的自學網站丟到 Grok，或改一下搜尋與標籤。</p></div>';
      return;
    }
    items.forEach((e) => {
      const facts = e.basic_info
        ? Object.entries(e.basic_info).map(([k, v]) => "<div><b>" + esc(k) + "</b><span>" + esc(String(v)) + "</span></div>").join("")
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
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

fetch("data.json?v=20260911q")
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
