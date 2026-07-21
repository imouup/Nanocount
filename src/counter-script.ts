export const COUNTER_SCRIPT = String.raw`(() => {
  "use strict";
  const script = document.currentScript;
  if (!script || window.__nanocountLoaded) return;
  window.__nanocountLoaded = true;

  const origin = new URL(script.src, location.href).origin;
  const includeQuery = script.dataset.query === "true";
  const host = location.hostname;
  const path = location.pathname + (includeQuery ? location.search : "");
  const target = { host, path, includeQuery };
  const pageNodes = document.querySelectorAll("[data-nanocount-page]");
  const siteNodes = document.querySelectorAll("[data-nanocount-site]");

  const render = (payload) => {
    const data = payload && payload.data;
    if (!data) return;
    pageNodes.forEach((node) => { node.textContent = Number(data.pageViews || 0).toLocaleString(); });
    siteNodes.forEach((node) => { node.textContent = Number(data.siteViews || 0).toLocaleString(); });
    window.dispatchEvent(new CustomEvent("nanocount:ready", { detail: data }));
  };

  const readonly = script.dataset.readonly === "true";
  const endpoint = readonly
    ? origin + "/api/v1/count?host=" + encodeURIComponent(host) + "&path=" + encodeURIComponent(path) + (includeQuery ? "&includeQuery=true" : "")
    : origin + "/api/v1/hit";
  const options = readonly
    ? { credentials: "omit", mode: "cors" }
    : { method: "POST", body: JSON.stringify(target), credentials: "omit", mode: "cors", keepalive: true };

  fetch(endpoint, options)
    .then((response) => response.ok ? response.json() : Promise.reject(new Error("Nanocount request failed")))
    .then(render)
    .catch((error) => {
      if (script.dataset.debug === "true") console.warn("[nanocount]", error);
      window.dispatchEvent(new CustomEvent("nanocount:error", { detail: error }));
    });
})();`;
