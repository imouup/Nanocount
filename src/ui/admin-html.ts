import { ADMIN_ICON_SPRITE, adminIcon } from "./admin-icons";

export const ADMIN_HTML = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="theme-color" content="#ffffff">
  <title>Nanocount · 轻量访问计数</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/admin/assets/app.css?v=5">
</head>
<body>
  ${ADMIN_ICON_SPRITE}

  <main id="login-view" class="login-view is-hidden" aria-labelledby="login-title">
    <button class="icon-button theme-toggle login-theme-toggle" type="button" aria-label="切换到黑夜模式" title="切换到黑夜模式">${adminIcon("moon")}</button>
    <section class="login-card">
      <header class="login-heading">
        <span class="brand-mark" aria-hidden="true">${adminIcon("chart")}</span>
        <div>
          <p class="eyebrow">PRIVATE ANALYTICS</p>
          <h1 id="login-title">Nanocount</h1>
        </div>
      </header>
      <p class="subtle login-intro">登录后查看和维护你的网站访问数据。</p>
      <form id="login-form">
        <label for="password">管理员密码</label>
        <div class="password-wrap">
          <span class="input-leading" aria-hidden="true">${adminIcon("lock")}</span>
          <input id="password" name="password" type="password" autocomplete="current-password" required autofocus placeholder="至少 12 个字符">
          <button id="toggle-password" class="input-action" type="button" aria-label="显示密码" title="显示密码">${adminIcon("eye")}</button>
        </div>
        <p id="login-error" class="form-error" role="alert"></p>
        <button class="button button-primary button-wide" type="submit"><span>登录后台</span>${adminIcon("arrowRight")}</button>
      </form>
      <p class="privacy-note">${adminIcon("shield")}<span>密码仅用于创建同源的签名会话</span></p>
    </section>
  </main>

  <div id="dashboard-view" class="app-shell is-hidden">
    <header class="topbar">
      <a class="brand" href="/admin" aria-label="Nanocount 后台首页">
        <span class="brand-mark brand-mark-small" aria-hidden="true">${adminIcon("chart")}</span>
        <span>Nanocount</span>
      </a>
      <div class="topbar-actions">
        <span class="status-dot"><i></i>服务正常</span>
        <button class="icon-button theme-toggle" type="button" aria-label="切换到黑夜模式" title="切换到黑夜模式">${adminIcon("moon")}</button>
        <button id="refresh-button" class="icon-button" type="button" aria-label="刷新数据" title="刷新数据">${adminIcon("refresh")}</button>
        <button id="logout-button" class="button button-quiet" type="button">${adminIcon("logout")}<span>退出</span></button>
      </div>
    </header>

    <main class="dashboard">
      <section class="welcome-row">
        <div>
          <p class="eyebrow">OVERVIEW</p>
          <h1>访问概览</h1>
          <p class="subtle">不识别访客，只记录页面被打开的次数。</p>
        </div>
        <button id="open-snippet" class="button button-primary" type="button">${adminIcon("code")}<span>获取计数代码</span></button>
      </section>

      <section class="stats-grid" aria-label="统计摘要">
        <article class="stat-card">
          <span class="stat-icon" aria-hidden="true">${adminIcon("views")}</span>
          <p>总访问量</p>
          <strong id="stat-views">—</strong>
          <span id="stat-updated">等待数据</span>
        </article>
        <article class="stat-card">
          <span class="stat-icon stat-icon-pink" aria-hidden="true">${adminIcon("pages")}</span>
          <p>页面数量</p>
          <strong id="stat-pages">—</strong>
          <span>已记录 URL</span>
        </article>
        <article class="stat-card">
          <span class="stat-icon stat-icon-violet" aria-hidden="true">${adminIcon("domains")}</span>
          <p>域名数量</p>
          <strong id="stat-hosts">—</strong>
          <span>允许的站点</span>
        </article>
      </section>

      <section class="content-card">
        <div class="card-heading">
          <div>
            <p class="eyebrow">PAGE VIEWS</p>
            <h2>页面数据</h2>
          </div>
          <div class="domain-total"><span>当前范围</span><strong id="domain-total">全部</strong></div>
        </div>

        <div class="toolbar">
          <label class="field select-field">
            <span>域名</span>
            <select id="host-filter"><option value="">全部域名</option></select>
          </label>
          <label class="field search-field">
            <span>搜索路径</span>
            <input id="search-input" type="search" placeholder="例如 /posts/hello" autocomplete="off">
          </label>
          <label class="field compact-field">
            <span>排序</span>
            <select id="sort-filter">
              <option value="views-desc">访问量 ↓</option>
              <option value="views-asc">访问量 ↑</option>
              <option value="updated-desc">最近更新</option>
              <option value="path-asc">路径 A–Z</option>
            </select>
          </label>
        </div>

        <div class="table-wrap">
          <table>
            <thead><tr><th>页面</th><th>访问量</th><th>最后访问</th><th><span class="sr-only">操作</span></th></tr></thead>
            <tbody id="pages-body"></tbody>
          </table>
          <div id="empty-state" class="empty-state is-hidden">
            <span>${adminIcon("empty")}</span><h3>还没有页面数据</h3><p>添加计数脚本并访问网站后，数据会出现在这里。</p>
          </div>
        </div>
        <footer class="pagination">
          <span id="page-summary">0 个页面</span>
          <div><button id="prev-page" class="icon-button" type="button" aria-label="上一页">${adminIcon("previous")}</button><span id="page-number">1 / 1</span><button id="next-page" class="icon-button" type="button" aria-label="下一页">${adminIcon("next")}</button></div>
        </footer>
      </section>
    </main>
  </div>

  <dialog id="edit-dialog" class="modal">
    <form id="edit-form" method="dialog">
      <div class="modal-heading"><div><p class="eyebrow">EDIT COUNT</p><h2>修改访问量</h2></div><button class="icon-button" value="cancel" formmethod="dialog" aria-label="关闭">${adminIcon("close")}</button></div>
      <p id="edit-target" class="target-path"></p>
      <label for="edit-views">访问次数</label>
      <input id="edit-views" type="number" min="0" max="9007199254740991" step="1" required>
      <p class="hint">修改会立即生效，并记录新的更新时间。</p>
      <div class="modal-actions"><button class="button button-quiet" value="cancel" formmethod="dialog">取消</button><button class="button button-primary" value="default" type="submit">${adminIcon("edit")}<span>保存修改</span></button></div>
    </form>
  </dialog>

  <dialog id="snippet-dialog" class="modal modal-wide">
    <form method="dialog">
      <div class="modal-heading"><div><p class="eyebrow">INSTALL</p><h2>添加到你的网站</h2></div><button class="icon-button" value="cancel" aria-label="关闭">${adminIcon("close")}</button></div>
      <p class="subtle">将脚本放在页面的 <code>&lt;/body&gt;</code> 前。下面两个元素可按需放在任意位置。</p>
      <pre><code id="snippet-code"></code></pre>
      <div class="modal-actions"><button class="button button-quiet" value="cancel">完成</button><button id="copy-snippet" class="button button-primary" type="button">${adminIcon("copy")}<span>复制代码</span></button></div>
    </form>
  </dialog>

  <div id="toast" class="toast" role="status" aria-live="polite"></div>
  <script src="/admin/assets/app.js?v=5" defer></script>
</body>
</html>`;
