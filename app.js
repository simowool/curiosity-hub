let DATA = { meta: {}, entries: [] };
const CATS = ["全部", "科學", "數學", "語文", "社會", "藝術", "程式", "百科", "其他"];
let cat = "全部";

const chips = document.getElementById("chips");
CATS.forEach((name) => {
  const b = document.createElement("button");
  b.className = "chip" + (name === cat ? " active" : "");
  b.textContent = name;
  b.onclick = () => { cat = name; render(); };
  chips.appendChild(b);
});

document.getElementById("q").addEventListener("input", render);

function render() {
  [...chips.children].forEach((el) => {
    el.classList.toggle("active", el.textContent === cat);
  });
  const q = document.getElementById("q").value.trim().toLowerCase();
  const items = (DATA.entries || []).filter((e) => {
    const okCat = cat === "全部" || e.category === cat;
    if (!okCat) return false;
    if (!q) return true;
    const info = e.basic_info ? Object.values(e.basic_info).join(" ") : "";
    const blob = [e.title, e.summary, e.notes, info, (e.tags || []).join(" "), e.source && e.source.name, e.source && e.source.url]
      .filter(Boolean).join(" ").toLowerCase();
    return blob.includes(q);
  }).sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.id).localeCompare(String(a.id)));

  document.getElementById("stats").textContent = items.length + " / " + (DATA.entries || []).length + " 則";

  const list = document.getElementById("list");
  list.innerHTML = "";
  if (!items.length) {
    list.innerHTML = `<div class="empty"><h2>還沒有符合的網站</h2><p>把想收的自學網站丟到 Grok，或改一下搜尋與分類。</p></div>`;
    return;
  }
  items.forEach((e) => {
    const facts = e.basic_info
      ? Object.entries(e.basic_info).map(([k, v]) => `<div><b>${esc(k)}</b><span>${esc(String(v))}</span></div>`).join("")
      : "";
    const tags = (e.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("");
    const src = e.source
      ? `<div class="source">${esc(e.source.channel || "來源")}${e.source.name ? " · " + esc(e.source.name) : ""}${e.source.url ? ` · <a href="${esc(e.source.url)}" target="_blank" rel="noopener">開啟</a>` : ""}</div>`
      : "";
    const el = document.createElement("article");
    el.className = "card";
    el.innerHTML = `<div class="card-top"><span class="badge ${esc(e.category || "其他")}">${esc(e.category || "其他")}</span><h2 class="title">${esc(e.title || "未命名")}</h2><span class="date">${esc(e.date || "")}</span></div>${e.summary ? `<p class="summary">${esc(e.summary)}</p>` : ""}${facts ? `<div class="facts">${facts}</div>` : ""}${tags ? `<div class="tags">${tags}</div>` : ""}${src}`;
    list.appendChild(el);
  });
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({"&":"&","<":"<",">":">","\"":""","'":"&#39;"}[c]));
}

fetch("data.json").then((r) => r.json()).then((d) => { DATA = d; render(); }).catch(() => render());
