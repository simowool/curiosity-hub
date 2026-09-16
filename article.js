function esc(s) {
  return String(s).replace(/[&<>"']/g, function (ch) {
    var n = { "&": 38, "<": 60, ">": 62, '"': 34, "'": 39 }[ch];
    return String.fromCharCode(38, 35) + n + String.fromCharCode(59);
  });
}
function kindLabel(k) {
  if (k === "thought") return "想想";
  if (k === "paper") return "論文";
  return "網站";
}
function paragraphs(text) {
  return String(text || "").split(/\n{2,}/).map(function (p) { return p.trim(); }).filter(Boolean)
    .map(function (p) {
      var html = esc(p).replace(/\n/g, "<br>");
      if (/^「[^」]+」$/.test(p.trim())) {
        return '<p class="thought-lead">' + html + "</p>";
      }
      if (/^關鍵\s*\d+/.test(p.trim())) {
        return '<p class="thought-key"><strong>' + html + "</strong></p>";
      }
      return "<p>" + html + "</p>";
    }).join("");
}
var params = new URLSearchParams(window.location.search);
var id = params.get("id") || (window.location.hash || "").replace(/^#/, "");
var box = document.getElementById("reader");
fetch("data.json?v=20260916d")
  .then(function (r) { if (!r.ok) throw new Error("data.json HTTP " + r.status); return r.json(); })
  .then(function (d) {
    var entries = (d && d.entries) || [];
    var e = entries.filter(function (x) { return x.id === id; })[0];
    if (!e) {
      document.title = "找不到內容 · 好奇學學";
      box.innerHTML = "<h1>找不到這篇</h1><p>可能已下架或網址不完整。<a href=\"./\">回列表</a></p>";
      return;
    }
    var k = e.kind || "site";
    document.title = (e.title || "未命名") + " · 好奇學學";
    var facts = e.basic_info
      ? Object.entries(e.basic_info).filter(function (kv) { return kv[0] !== "年齡段"; }).map(function (kv) {
          var v = Array.isArray(kv[1]) ? kv[1].join("、") : String(kv[1]);
          return "<div><b>" + esc(kv[0]) + "</b><span>" + esc(v) + "</span></div>";
        }).join("")
      : "";
    var body = paragraphs(e.content || e.summary || "");
    var src = "";
    if (e.source) {
      src = '<p class="source">' + esc(e.source.channel || "來源");
      if (e.source.name) src += " · " + esc(e.source.name);
      if (e.source.url) src += ' · <a href="' + esc(e.source.url) + '" target="_blank" rel="noopener">原文／來源</a>';
      src += "</p>";
    }
    box.innerHTML =
      '<div class="card-top"><span class="badge ' + esc(kindLabel(k)) + '">' + esc(kindLabel(k)) +
      '</span><span class="date">' + esc(e.date || "") + "</span></div>" +
      "<h1>" + esc(e.title || "未命名") + "</h1>" +
      (facts ? '<div class="facts">' + facts + "</div>" : "") +
      '<div class="article-body">' + body + "</div>" + src;
  })
  .catch(function () {
    box.innerHTML = "<h1>讀不到資料</h1><p><a href=\"./\">回列表</a></p>";
  });
