try { sessionStorage.setItem("hubKind", "thought"); } catch (e) {}
function esc(s) {
  return String(s).replace(/[&<>"']/g, function (ch) {
    var n = { "&": 38, "<": 60, ">": 62, '"': 34, "'": 39 }[ch];
    return String.fromCharCode(38, 35) + n + String.fromCharCode(59);
  });
}
function kindLabel(k) {
  if (k === "thought" || k === "paper") return "好奇想想";
  return "網站";
}
function linkify(escaped) {
  return escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (full, label, href) {
    if (!/^(https?:\/\/|\/|article\.html|a\/)/i.test(href)) return full;
    return '<a href="' + href + '">' + label + "</a>";
  });
}
function paragraphs(text) {
  return String(text || "").split(/\n{2,}/).map(function (p) { return p.trim(); }).filter(Boolean)
    .map(function (p) {
      var html = linkify(esc(p).replace(/\n/g, "<br>"));
      if (/^「[^」]+」$/.test(p.trim())) {
        return '<p class="thought-lead">' + html + "</p>";
      }
      if (/^關鍵\s*\d+/.test(p.trim()) || /^\d+\.\s/.test(p.trim()) || /^簡單來說/.test(p.trim()) || /^[📌✅]\s/.test(p.trim())) {
        return '<p class="thought-key"><strong>' + html + "</strong></p>";
      }
      if (/^[一二三四五六七八九十]+、/.test(p.trim()) || /^結語[：:]/.test(p.trim())) {
        return '<p class="thought-key"><strong>' + html + "</strong></p>";
      }
      if (p.length <= 40 && !/[。！？]$/.test(p) && !/^親愛的/.test(p) && !/^誠摯地/.test(p) && !/^20\d{2}/.test(p) && !/^Sally |^Melissa |^Anantha |^Roger /.test(p)) {
        if (/臨時委員會$|實務支持$|共享文化$|研究事業中的 AI$|一起做$|^AI 與教育/.test(p)) {
          return '<p class="thought-key"><strong>' + html + "</strong></p>";
        }
      }
      return "<p>" + html + "</p>";
    }).join("");
}
function articleUrl() {
  return window.location.href.split("#")[0];
}
function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise(function (resolve, reject) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy") ? resolve() : reject();
    } catch (err) {
      reject(err);
    }
    document.body.removeChild(ta);
  });
}
function flashBtn(btn, label) {
  var old = btn.textContent;
  btn.textContent = label;
  btn.classList.add("done");
  setTimeout(function () {
    btn.textContent = old;
    btn.classList.remove("done");
  }, 1600);
}
function bindShare(title) {
  var url = articleUrl();
  var shareBtn = document.getElementById("shareBtn");
  var copyBtn = document.getElementById("copyLinkBtn");
  if (shareBtn) {
    shareBtn.addEventListener("click", function () {
      var payload = { title: title + " · 好奇學學", text: title, url: url };
      if (navigator.share) {
        navigator.share(payload).catch(function () {});
        return;
      }
      copyText(url).then(function () { flashBtn(shareBtn, "已複製連結"); }).catch(function () {});
    });
  }
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      copyText(url).then(function () { flashBtn(copyBtn, "已複製"); }).catch(function () { flashBtn(copyBtn, "複製失敗"); });
    });
  }
}
var params = new URLSearchParams(window.location.search);
var pathMatch = (window.location.pathname || "").match(/\/a\/([^/]+)\.html$/);
var inArticleDir = !!pathMatch;
var id = (pathMatch && decodeURIComponent(pathMatch[1])) || params.get("id") || (window.location.hash || "").replace(/^#/, "");
var box = document.getElementById("reader");
var dataFile = inArticleDir ? "../data.json?v=20260923b" : "data.json?v=20260923b";
var homeHref = inArticleDir ? "../" : "./";
if (box) {
fetch(dataFile)
  .then(function (r) { if (!r.ok) throw new Error("data.json HTTP " + r.status); return r.json(); })
  .then(function (d) {
    var entries = (d && d.entries) || [];
    var e = entries.filter(function (x) { return x.id === id; })[0];
    if (!e) {
      document.title = "找不到內容 · 好奇學學";
      box.innerHTML = "<h1>找不到這篇</h1><p>可能已下架或網址不完整。<a href=\"" + homeHref + "\">回列表</a></p>";
      return;
    }
    var k = e.kind || "site";
    var title = e.title || "未命名";
    document.title = title + " · 好奇學學";
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
      '<div class="card-top"><span class="badge 想想">' + esc(kindLabel(k)) +
      '</span><span class="date">' + esc(e.date || "") + "</span></div>" +
      "<h1>" + esc(title) + "</h1>" +
      '<div class="share-row">' +
        '<button type="button" class="share-btn" id="shareBtn">分享</button>' +
        '<button type="button" class="share-btn" id="copyLinkBtn">Copy link</button>' +
      "</div>" +
      (facts ? '<div class="facts">' + facts + "</div>" : "") +
      '<div class="article-body">' + body + "</div>" + src;
    bindShare(title);
  })
  .catch(function () {
    box.innerHTML = "<h1>讀不到資料</h1><p><a href=\"" + homeHref + "\">回列表</a></p>";
  });
}
