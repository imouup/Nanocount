(() => {
  "use strict";

  const root = document.documentElement;
  const themeToggle = document.querySelector("#theme-toggle");
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  let savedTheme = null;

  try {
    savedTheme = localStorage.getItem("nanocount-site-theme");
  } catch {
    savedTheme = null;
  }

  function applyTheme(theme, persist = false) {
    const dark = theme === "dark";
    root.dataset.theme = dark ? "dark" : "light";
    themeToggle?.setAttribute("aria-pressed", String(dark));
    themeToggle?.setAttribute("aria-label", dark ? "切换浅色模式" : "切换深色模式");
    themeColor?.setAttribute("content", dark ? "#110d10" : "#ffffff");

    if (persist) {
      savedTheme = dark ? "dark" : "light";
      try {
        localStorage.setItem("nanocount-site-theme", savedTheme);
      } catch {
        // Storage may be disabled; the theme still applies for this page view.
      }
    }
  }

  applyTheme(savedTheme === "dark" || savedTheme === "light" ? savedTheme : media.matches ? "dark" : "light");

  themeToggle?.addEventListener("click", () => {
    applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
  });

  media.addEventListener?.("change", (event) => {
    if (!savedTheme) applyTheme(event.matches ? "dark" : "light");
  });

  const toast = document.querySelector("#toast");
  let toastTimer;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 1800);
  }

  async function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) throw new Error("Copy failed");
  }

  document.querySelectorAll("[data-copy-target]").forEach((button) => {
    button.addEventListener("click", async () => {
      const target = document.getElementById(button.dataset.copyTarget || "");
      if (!target) return;
      try {
        await copyText(target.textContent.trim());
        showToast("代码已复制");
      } catch {
        showToast("复制失败，请手动选择");
      }
    });
  });

  const year = document.querySelector("#current-year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
