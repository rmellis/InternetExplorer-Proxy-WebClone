(() => {
  "use strict";

  const PROXIES = [
    { url: "https://api.allorigins.win/get?url=", type: "json" },
    { url: "https://corsproxy.io/?", type: "raw" },
    { url: "https://api.codetabs.com/v1/proxy?quest=", type: "raw" }
  ];
  
  const HOMEPAGE = "about:home";
  
  const DEFAULTS = {
    favorites: [
      { url: "https://en.uncyclopedia.co/", title: "Uncyclopedia", icon: "https://upload.wikimedia.org/wikipedia/commons/8/80/Wikipedia-logo-v2.svg" },
      { url: "https://www.bing.com/", title: "Bing", icon: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Bing_Fluent_Logo.svg" },
      { url: "https://www.amazon.com", title: "Amazon", icon: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg" },
      { url: "https://kick.com/browse", title: "Kick", icon: "https://emoji.discadia.com/emojis/34d2e9b2-b9bd-4a49-95c0-0f22fb78fc36.PNG" },
      { url: "https://discord.com", title: "Discord", icon: "https://freelogopng.com/images/all_img/1691730813discord-icon-png.png" },
      { url: "https://www.reddit.com", title: "Reddit", icon: "https://www.redditstatic.com/desktop2x/img/favicon/favicon-96x96.png" },
      { url: "https://store.steampowered.com", title: "Steam", icon: "https://upload.wikimedia.org/wikipedia/commons/8/83/Steam_icon_logo.svg" },
      { url: "https://github.com", title: "GitHub", icon: "https://upload.wikimedia.org/wikipedia/commons/c/c2/GitHub_Invertocat_Logo.svg" }
    ]
  };

  const $ = s => document.querySelector(s);
  const escape = s => (s||"").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  
  function getFavicon(url) {
    if (!url || url.startsWith("about:") || url.startsWith("data:")) return "";
    const fav = favorites.find(f => f.url === url);
    if (fav && fav.icon) return fav.icon;
    try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`; } catch { return ""; }
  }

  function normalizeUrl(input) {
    let s = String(input || "").trim();
    if (!s) return "about:blank";
    if (s === "about:home") return s;
    if (s.startsWith("data:")) return s;
    if (/^https?:\/\//i.test(s)) return s;
    if (s.includes(".") && !s.includes(" ")) return "https://" + s;
    return `https://www.bing.com/search?q=${encodeURIComponent(s)}`;
  }

  let tabs = [];
  let activeTabId = null;
  let favorites = [...DEFAULTS.favorites];
  let isDarkMode = false;

  const webContent = $("#web-content");
  const startPageOverlay = document.createElement("div");
  startPageOverlay.id = "ntp-overlay";
  startPageOverlay.style.display = "none";
  startPageOverlay.style.width = "100%";
  startPageOverlay.style.height = "100%";
  startPageOverlay.style.position = "absolute";
  startPageOverlay.style.top = "0";
  startPageOverlay.style.zIndex = "50";
  webContent.appendChild(startPageOverlay);

  function getThemeColors() {
      const style = getComputedStyle(document.documentElement);
      return {
          bg: style.getPropertyValue('--ntp-bg').trim(),
          card: style.getPropertyValue('--ntp-card').trim(),
          text: style.getPropertyValue('--ntp-text').trim(),
          accent: style.getPropertyValue('--accent').trim()
      };
  }

  async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 8000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  }

  async function raceProxies(targetUrl) {
    const promises = PROXIES.map(async (proxy) => {
      try {
        const res = await fetchWithTimeout(proxy.url + encodeURIComponent(targetUrl));
        if (!res.ok) throw new Error("Status " + res.status);
        let text = proxy.type === "json" ? (await res.json()).contents : await res.text();
        if (!text || text.length < 50) throw new Error("Empty content");
        return text; 
      } catch (e) { throw e; }
    });
    return await Promise.any(promises);
  }

  function renderStartPage() {
    const shortCutsHTML = favorites.map(f => {
        let imgStyle = (f.title === "GitHub" && isDarkMode) ? "filter: invert(1);" : "";
        return `
        <div class="shortcut" onclick="window.navigateActiveTab('${f.url}')">
          <div class="sc-icon-box"><img src="${f.icon}" style="${imgStyle}"></div>
          <div class="sc-label">${f.title}</div>
        </div>`;
    }).join('');

    startPageOverlay.innerHTML = `
        <div class="internal-page">
          <img class="ie-logo" src="https://pngimg.com/d/ie_logo_PNG17.png" alt="IE Logo">
          <div style="font-size: 28px; font-weight: 300; color: var(--ntp-text); margin-bottom: 30px; text-shadow: 0 1px 3px rgba(0,0,0,0.1);">Internet Explorer</div>
          <div class="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#0284C3"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            <input class="search-input" placeholder="Search the web" onkeydown="if(event.key==='Enter') window.navigateActiveTab(this.value)">
          </div>
          <div class="shortcuts-grid">
            ${shortCutsHTML}
          </div>
        </div>`;
  }

  async function navigate(tab, url) {
    tab.loading = true;
    tab.url = url;
    updateUI();

    if (url === "about:home") {
        renderStartPage();
        finishLoad(tab, "New Tab");
        return;
    }

    if (url.startsWith("data:")) {
       renderInternal(tab, "Data", null);
       setTimeout(() => { $(`#frame-${tab.id}`).src = url; }, 10);
       finishLoad(tab, "Data");
       return;
    }

    try {
       let content = await raceProxies(url);
       if (!content.toLowerCase().includes("<base")) {
         if (content.toLowerCase().includes("<head")) content = content.replace(/<head[^>]*>/i, `$&<base href="${url}">`);
         else content = `<base href="${url}">` + content;
       }

       const frame = $(`#frame-${tab.id}`);
       frame.removeAttribute("srcdoc");
       frame.srcdoc = content;
       frame.sandbox = "allow-forms allow-scripts allow-popups allow-same-origin allow-modals";
       
       const m = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
       finishLoad(tab, m ? m[1].trim() : new URL(url).hostname);

    } catch (e) {
       renderError(tab, url);
    }
  }

  function renderInternal(tab, title, html) {
    const frame = $(`#frame-${tab.id}`);
    frame.removeAttribute("src");
    const theme = getThemeColors();
    const styleBlock = `<style>body{font-family:"Segoe UI",sans-serif;color:${theme.text};background:${theme.bg};display:flex;justify-content:center;align-items:center;height:100vh;margin:0;}.error-card{background:${theme.card};padding:40px;border:1px solid rgba(0,0,0,0.2);text-align:center;max-width:500px;}h2{color:#0284C3;margin-top:0;font-weight:normal;}button{background:rgba(0,0,0,0.05);color:inherit;border:1px solid rgba(0,0,0,0.2);padding:6px 20px;cursor:pointer;margin-top:20px;}button:hover{background:rgba(2,132,195,0.1);border-color:#0284C3;}</style>`;
    if (html) frame.srcdoc = `<!doctype html><html><head>${styleBlock}</head><body>${html}</body></html>`;
    finishLoad(tab, title);
  }

  function finishLoad(tab, title) {
    tab.loading = false;
    tab.title = title;
    updateUI();
  }

  function renderError(tab, url) {
    renderInternal(tab, "This page can’t be displayed", `
      <div class="error-card">
        <h2>This page can’t be displayed</h2>
        <p>Make sure the web address <b>${escape(url)}</b> is correct.</p>
        <button onclick="window.parent.navigateActiveTab('${escape(url)}')">Fix connection problems</button>
      </div>
    `);
  }

  function createTab(url = HOMEPAGE) {
    const id = "t-" + Math.random().toString(36).substr(2, 9);
    const iframe = document.createElement("iframe");
    iframe.className = "web-frame";
    iframe.id = "frame-" + id;
    $("#web-content").appendChild(iframe);

    const tab = { id, url, title: "New Tab", loading: false, historyStack: [url], historyIdx: 0 };
    tabs.push(tab);
    activateTab(id);
    navigate(tab, url);
  }

  function activateTab(id) {
    activeTabId = id;
    document.querySelectorAll('.web-frame').forEach(f => f.style.display = 'none');
    updateUI();
  }

  function closeTab(id) {
    if (tabs.length === 1) { navigate(tabs[0], HOMEPAGE); return; }
    const idx = tabs.findIndex(t => t.id === id);
    $(`#frame-${id}`).remove();
    tabs.splice(idx, 1);
    if (activeTabId === id) activateTab(tabs[Math.max(0, idx - 1)].id);
    else updateUI();
  }

  function updateUI() {
    const container = $("#tabs-container");
    container.innerHTML = "";
    
    tabs.forEach(t => {
      const el = document.createElement("div");
      el.className = `tab ${t.id === activeTabId ? 'active' : ''}`;
      
      let favSrc = getFavicon(t.url);
      if(t.url === "about:home") {
        favSrc = "https://pngimg.com/d/ie_logo_PNG17.png";
      }

      el.innerHTML = `
        <div class="tab-icon-area">
          <div class="tab-spinner" style="display:${t.loading?'block':'none'}"></div>
          <img class="tab-favicon" src="${favSrc}" style="display:${t.loading?'none':'block'}">
        </div>
        <span class="tab-title">${escape(t.title)}</span>
        <button class="tab-close" onclick="window.closeTab('${t.id}')">✕</button>
      `;
      el.onclick = (e) => { if(!e.target.classList.contains("tab-close")) activateTab(t.id); };
      container.appendChild(el);
    });

    const newTabBtn = document.createElement("button");
    newTabBtn.id = "new-tab-btn";
    newTabBtn.title = "New tab";
    newTabBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16"><path d="M3 13 L3 4 L10 4 L13 7 L13 13 Z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`;
    newTabBtn.onclick = () => createTab();
    container.appendChild(newTabBtn);

    const t = tabs.find(x => x.id === activeTabId);
    if (t) {
      if (t.url === "about:home") {
          startPageOverlay.style.display = "block";
          if($(`#frame-${t.id}`)) $(`#frame-${t.id}`).style.display = "none";
      } else {
          startPageOverlay.style.display = "none";
          if($(`#frame-${t.id}`)) {
              $(`#frame-${t.id}`).style.display = "block";
              $(`#frame-${t.id}`).classList.add("active");
          }
      }

      $("#urlbar-input").value = t.url === "about:home" ? "" : t.url;
      $("#urlbar-wrapper").classList.toggle("loading", t.loading);
      $("#status-bar").textContent = t.loading ? "Waiting for " + t.url + "..." : "Done";
      $("#back-btn").disabled = t.historyIdx <= 0;
      $("#forward-btn").disabled = t.historyIdx >= t.historyStack.length - 1;
    }
  }

  function renderFavorites() {
    const bar = $("#favorites-bar");
    bar.innerHTML = "";
    favorites.forEach(f => {
      const btn = document.createElement("button");
      btn.className = "bookmark";
      let imgStyle = (f.title === "GitHub" && isDarkMode) ? "filter: invert(1);" : "";
      btn.innerHTML = `<img src="${f.icon}" style="${imgStyle}"> ${escape(f.title)}`;
      btn.onclick = () => { navigate(tabs.find(x => x.id === activeTabId), f.url); };
      bar.appendChild(btn);
    });
  }

  window.closeTab = (id) => { event.stopPropagation(); closeTab(id); };
  window.navigateActiveTab = (url) => {
      const t = tabs.find(x => x.id === activeTabId);
      if(t) {
          const norm = normalizeUrl(url);
          t.historyStack = t.historyStack.slice(0, t.historyIdx + 1);
          t.historyStack.push(norm);
          t.historyIdx++;
          navigate(t, norm);
      }
  };

  window.addEventListener("message", (e) => {
    if (e.data.type === 'nav') window.navigateActiveTab(e.data.url);
  });

  $("#urlbar-input").onkeydown = (e) => { if (e.key === "Enter") window.navigateActiveTab($("#urlbar-input").value); };
  $("#reload-btn").onclick = () => { const t = tabs.find(x => x.id === activeTabId); navigate(t, t.url); };
  $("#back-btn").onclick = () => {
    const t = tabs.find(x => x.id === activeTabId);
    if(t.historyIdx > 0) { t.historyIdx--; navigate(t, t.historyStack[t.historyIdx]); }
  };
  $("#forward-btn").onclick = () => {
    const t = tabs.find(x => x.id === activeTabId);
    if(t.historyIdx < t.historyStack.length-1) { t.historyIdx++; navigate(t, t.historyStack[t.historyIdx]); }
  };
  $("#home-btn").onclick = () => { navigate(tabs.find(x => x.id === activeTabId), HOMEPAGE); };
  $("#star-btn").onclick = () => { $("#favorites-bar").classList.toggle("show"); };
  $("#toggle-favorites-btn").onclick = () => { 
    $("#favorites-bar").classList.toggle("show"); 
    $("#menu-popup").classList.remove("show");
  };

  $("#menu-btn").onclick = (e) => { e.stopPropagation(); $("#menu-popup").classList.toggle("show"); };
  document.addEventListener("click", (e) => {
    if (!$("#menu-btn").contains(e.target) && !$("#menu-popup").contains(e.target)) {
       $("#menu-popup").classList.remove("show");
    }
  });
  $("#menu-new-tab").onclick = () => { $("#menu-popup").classList.remove("show"); createTab(); };

  $("#menu-theme-toggle").onclick = () => {
     isDarkMode = !isDarkMode;
     document.body.classList.toggle("dark-mode", isDarkMode);
     $("#theme-label").textContent = isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode";
     renderFavorites();
     if(tabs.find(x => x.id === activeTabId).url === "about:home") renderStartPage();
  };

  renderFavorites();
  createTab(HOMEPAGE);

})();