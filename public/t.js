/* inda.dev analytics: no cookies, no IPs, respects DNT/GPC. Sends to /api/e. */
(function () {
  var w = window, d = document, n = navigator, ls, ss;
  w.indaTrack = function () {};
  if (n.doNotTrack === "1" || n.globalPrivacyControl || /bot|crawl|spider|headless/i.test(n.userAgent)) return;
  try { ls = localStorage; ss = sessionStorage; if (ls.getItem("inda_admin")) return; } catch (e) { return; }

  function rid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
  var vid = ls.getItem("inda_vid"), isNew = !vid;
  if (!vid) { vid = rid(); ls.setItem("inda_vid", vid); }
  var now = Date.now(), last = +ss.getItem("inda_last") || 0, sid = ss.getItem("inda_sid");
  if (!sid || now - last > 18e5) { sid = rid(); ss.setItem("inda_sid", sid); }

  var q = new URLSearchParams(location.search);
  var utm = { s: q.get("utm_source") || q.get("ref") || q.get("src"), m: q.get("utm_medium"), c: q.get("utm_campaign") };
  var ref = d.referrer, path, start, depth, sentDepth;

  function send(t, props, value) {
    ss.setItem("inda_last", Date.now());
    var body = JSON.stringify({
      t: t, p: location.pathname, v: vid, s: sid, n: isNew, r: ref || null, u: utm,
      sc: screen.width + "x" + screen.height, l: n.language, z: Intl.DateTimeFormat().resolvedOptions().timeZone,
      th: d.documentElement.dataset.theme, pr: props || null, val: value == null ? null : value
    });
    if (!(n.sendBeacon && n.sendBeacon("/api/e", new Blob([body], { type: "application/json" }))))
      fetch("/api/e", { method: "POST", body: body, keepalive: true, headers: { "content-type": "application/json" } });
  }
  w.indaTrack = send;

  function leave() {
    if (!path) return;
    send("leave", { depth: depth }, Math.round((Date.now() - start) / 1000));
  }
  function view() {
    if (path === location.pathname) return;
    if (path) { leave(); ref = location.origin + path; utm = { s: null, m: null, c: null }; }
    path = location.pathname; start = Date.now(); depth = 0; sentDepth = {};
    send("pageview");
    isNew = false;
  }

  ["pushState", "replaceState"].forEach(function (k) {
    var o = history[k];
    history[k] = function () { var r = o.apply(this, arguments); setTimeout(view, 0); return r; };
  });
  w.addEventListener("popstate", view);

  w.addEventListener("scroll", function () {
    var h = d.documentElement, max = h.scrollHeight - h.clientHeight;
    var pct = max <= 0 ? 100 : Math.round((h.scrollTop / max) * 100);
    [25, 50, 75, 100].forEach(function (m) {
      if (pct >= m && !sentDepth[m]) { sentDepth[m] = 1; depth = m; send("scroll", { depth: m }); }
    });
  }, { passive: true });

  d.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("a,button,[data-track]");
    if (!el) return;
    var id = el.getAttribute("data-track"), href = el.getAttribute("href") || "";
    if (/^mailto:/.test(href)) send("email_click", { id: id });
    else if (/wa\.me|whatsapp\.com/.test(href)) send("whatsapp_click", { id: id });
    else if (el.hasAttribute("download") || /\/api\/cv/.test(href)) send("cv_download");
    else if (/^https?:/.test(href) && el.host !== location.host) send("outbound", { url: href.slice(0, 200), id: id });
    if (id) send("click", { id: id });
  }, true);

  /* Web Vitals: LCP, CLS, INP (longest interaction), TTFB. */
  var v = {};
  function po(type, cb, opts) { try { new PerformanceObserver(function (l) { l.getEntries().forEach(cb); }).observe(Object.assign({ type: type, buffered: true }, opts)); } catch (e) {} }
  po("largest-contentful-paint", function (e) { v.lcp = Math.round(e.startTime); });
  po("layout-shift", function (e) { if (!e.hadRecentInput) v.cls = (v.cls || 0) + e.value; });
  po("event", function (e) { if (e.interactionId) v.inp = Math.max(v.inp || 0, Math.round(e.duration)); }, { durationThreshold: 40 });
  var nav = performance.getEntriesByType("navigation")[0];
  if (nav) v.ttfb = Math.round(nav.responseStart);
  var vitalsSent = false;

  d.addEventListener("visibilitychange", function () {
    if (d.visibilityState !== "hidden") return;
    leave(); start = Date.now();
    if (!vitalsSent && (v.lcp || v.ttfb)) { vitalsSent = true; if (v.cls != null) v.cls = +v.cls.toFixed(3); send("vitals", v); }
  });

  view();
})();
