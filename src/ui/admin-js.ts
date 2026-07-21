export const ADMIN_JS = String.raw`(() => {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const createIcon = (name) => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    icon.setAttribute("class", "fa-icon");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("focusable", "false");
    use.setAttribute("href", "#fa-" + name);
    icon.append(use);
    return icon;
  };
  const setIcon = (node, name) => node.querySelector("use")?.setAttribute("href", "#fa-" + name);
  const themeMedia = window.matchMedia("(prefers-color-scheme: dark)");
  let savedTheme;
  try { savedTheme = localStorage.getItem("nanocount-theme"); } catch { savedTheme = null; }

  function applyTheme(theme, persist = false) {
    const dark = theme === "dark";
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#0e0a0d" : "#ffffff");
    document.querySelectorAll(".theme-toggle").forEach((button) => {
      const label = dark ? "切换到浅色模式" : "切换到黑夜模式";
      setIcon(button, dark ? "sun" : "moon");
      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
      button.setAttribute("aria-pressed", String(dark));
    });
    if (persist) {
      savedTheme = dark ? "dark" : "light";
      try { localStorage.setItem("nanocount-theme", savedTheme); } catch {}
    }
  }

  applyTheme(savedTheme === "dark" || savedTheme === "light" ? savedTheme : (themeMedia.matches ? "dark" : "light"));
  document.querySelectorAll(".theme-toggle").forEach((button) => {
    button.addEventListener("click", () => applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true));
  });
  themeMedia.addEventListener?.("change", (event) => {
    if (!savedTheme) applyTheme(event.matches ? "dark" : "light");
  });

  const loginView = $("#login-view");
  const dashboardView = $("#dashboard-view");
  const pagesBody = $("#pages-body");
  const emptyState = $("#empty-state");
  const hostFilter = $("#host-filter");
  const searchInput = $("#search-input");
  const sortFilter = $("#sort-filter");
  const editDialog = $("#edit-dialog");
  const snippetDialog = $("#snippet-dialog");
  const state = { page: 1, pageSize: 15, total: 0, hosts: [], edit: null };
  let toastTimer;
  let searchTimer;

  const formatNumber = (value) => Number(value || 0).toLocaleString("zh-CN");
  const formatDate = (value) => value ? new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : "尚无访问";
  const showToast = (message) => {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  };

  async function api(path, options = {}) {
    const response = await fetch(path, {
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
    let payload;
    try { payload = await response.json(); } catch { payload = { error: { message: "服务器返回了无效响应" } }; }
    if (response.status === 401) {
      showLogin();
      throw new Error("登录已过期");
    }
    if (!response.ok) throw new Error(payload.error?.message || "请求失败");
    return payload.data;
  }

  function showLogin() {
    dashboardView.classList.add("is-hidden");
    loginView.classList.remove("is-hidden");
    setTimeout(() => $("#password").focus(), 0);
  }

  function showDashboard() {
    loginView.classList.add("is-hidden");
    dashboardView.classList.remove("is-hidden");
  }

  async function loadOverview() {
    const [summary, hosts] = await Promise.all([api("/admin/api/summary"), api("/admin/api/hosts")]);
    $("#stat-views").textContent = formatNumber(summary.views);
    $("#stat-pages").textContent = formatNumber(summary.pages);
    $("#stat-hosts").textContent = formatNumber(summary.hosts);
    $("#stat-updated").textContent = summary.updatedAt ? "更新于 " + formatDate(summary.updatedAt) : "等待首次访问";
    state.hosts = hosts;
    const selected = hostFilter.value;
    hostFilter.replaceChildren(new Option("全部域名", ""));
    hosts.forEach((item) => hostFilter.add(new Option(item.host + " · " + formatNumber(item.views), item.host)));
    if (hosts.some((item) => item.host === selected)) hostFilter.value = selected;
    updateDomainTotal();
  }

  function updateDomainTotal() {
    const host = hostFilter.value;
    const item = state.hosts.find((entry) => entry.host === host);
    $("#domain-total").textContent = item ? formatNumber(item.views) + " 次" : "全部";
  }

  function pageRow(page) {
    const row = document.createElement("tr");
    const pageColumn = document.createElement("td");
    const cell = document.createElement("div");
    cell.className = "page-cell";
    const icon = document.createElement("span");
    icon.className = "page-cell-icon";
    icon.append(createIcon("external"));
    const labels = document.createElement("div");
    const path = document.createElement("strong");
    path.textContent = page.path;
    path.title = page.path;
    const host = document.createElement("small");
    host.textContent = page.host;
    labels.append(path, host);
    cell.append(icon, labels);
    pageColumn.append(cell);

    const viewsColumn = document.createElement("td");
    viewsColumn.className = "views-value";
    viewsColumn.textContent = formatNumber(page.views);
    const dateColumn = document.createElement("td");
    dateColumn.className = "date-value";
    dateColumn.textContent = formatDate(page.lastViewedAt);
    const actionColumn = document.createElement("td");
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "edit-button";
    edit.append(createIcon("edit"), document.createTextNode("编辑"));
    edit.setAttribute("aria-label", "修改 " + page.host + page.path + " 的访问量");
    edit.addEventListener("click", () => openEdit(page));
    actionColumn.append(edit);
    row.append(pageColumn, viewsColumn, dateColumn, actionColumn);
    return row;
  }

  async function loadPages() {
    const [sort, order] = sortFilter.value.split("-");
    const params = new URLSearchParams({ page: String(state.page), pageSize: String(state.pageSize), sort, order });
    if (hostFilter.value) params.set("host", hostFilter.value);
    if (searchInput.value.trim()) params.set("search", searchInput.value.trim());
    const result = await api("/admin/api/pages?" + params);
    state.total = result.total;
    pagesBody.replaceChildren(...result.items.map(pageRow));
    emptyState.classList.toggle("is-hidden", result.items.length !== 0);
    const totalPages = Math.max(1, Math.ceil(result.total / state.pageSize));
    $("#page-summary").textContent = formatNumber(result.total) + " 个页面";
    $("#page-number").textContent = state.page + " / " + totalPages;
    $("#prev-page").disabled = state.page <= 1;
    $("#next-page").disabled = state.page >= totalPages;
  }

  async function refresh(all = true) {
    try {
      if (all) await loadOverview();
      await loadPages();
    } catch (error) {
      showToast(error.message);
    }
  }

  function openEdit(page) {
    state.edit = page;
    $("#edit-target").textContent = page.host + page.path;
    $("#edit-views").value = String(page.views);
    editDialog.showModal();
    setTimeout(() => $("#edit-views").select(), 0);
  }

  $("#login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector("button[type=submit]");
    const errorNode = $("#login-error");
    errorNode.textContent = "";
    button.disabled = true;
    try {
      await api("/admin/api/login", { method: "POST", body: JSON.stringify({ password: $("#password").value }) });
      $("#password").value = "";
      showDashboard();
      await refresh();
    } catch (error) {
      errorNode.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });

  $("#toggle-password").addEventListener("click", () => {
    const input = $("#password");
    const visible = input.type === "text";
    input.type = visible ? "password" : "text";
    const toggle = $("#toggle-password");
    setIcon(toggle, visible ? "eye" : "eyeSlash");
    toggle.setAttribute("aria-label", visible ? "显示密码" : "隐藏密码");
    toggle.setAttribute("title", visible ? "显示密码" : "隐藏密码");
  });

  $("#logout-button").addEventListener("click", async () => {
    try { await api("/admin/api/logout", { method: "POST", body: "{}" }); } catch {}
    showLogin();
  });
  $("#refresh-button").addEventListener("click", async (event) => {
    event.currentTarget.disabled = true;
    await refresh();
    event.currentTarget.disabled = false;
    showToast("数据已刷新");
  });
  hostFilter.addEventListener("change", () => { state.page = 1; updateDomainTotal(); refresh(false); });
  sortFilter.addEventListener("change", () => { state.page = 1; refresh(false); });
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.page = 1; refresh(false); }, 280);
  });
  $("#prev-page").addEventListener("click", () => { if (state.page > 1) { state.page -= 1; refresh(false); } });
  $("#next-page").addEventListener("click", () => {
    if (state.page * state.pageSize < state.total) { state.page += 1; refresh(false); }
  });

  $("#edit-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.edit) return;
    const views = Number($("#edit-views").value);
    if (!Number.isSafeInteger(views) || views < 0) return showToast("请输入有效的非负整数");
    try {
      await api("/admin/api/pages", {
        method: "PATCH",
        body: JSON.stringify({ host: state.edit.host, path: state.edit.path, views }),
      });
      editDialog.close();
      showToast("访问量已更新");
      await refresh();
    } catch (error) { showToast(error.message); }
  });

  $("#open-snippet").addEventListener("click", () => {
    $("#snippet-code").textContent = '<script defer src="' + location.origin + '/nano.js"><\/script>\n\n页面访问量：<span data-nanocount-page>--</span>\n站点总访问量：<span data-nanocount-site>--</span>';
    snippetDialog.showModal();
  });
  $("#copy-snippet").addEventListener("click", async () => {
    await navigator.clipboard.writeText($("#snippet-code").textContent);
    showToast("代码已复制");
  });

  api("/admin/api/session")
    .then(async (session) => {
      if (!session.authenticated) return showLogin();
      showDashboard();
      await refresh();
    })
    .catch(showLogin);
})();`;
