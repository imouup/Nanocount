export const ADMIN_CSS = String.raw`
:root {
  --ink: #261a22;
  --muted: #776670;
  --faint: #9e8994;
  --line: #f0e7ec;
  --line-strong: #dfd1d9;
  --panel: #fff;
  --surface: #fff4f9;
  --surface-strong: #fbe7f1;
  --page: #fff;
  --topbar: rgba(255, 255, 255, .97);
  --field: #fff;
  --table-head: #fcf9fb;
  --row-hover: #fff9fc;
  --accent-soft: #fff0f7;
  --pink-soft: #fff0f6;
  --violet: #8735b8;
  --violet-soft: #f8efff;
  --code-bg: #281d24;
  --code-ink: #fff4f9;
  --modal: #fff;
  --backdrop: rgba(20, 10, 16, .52);
  --modal-shadow: 0 26px 80px rgba(55, 17, 38, .24);
  --accent: #c01872;
  --accent-hover: #a30f5e;
  --pink: #ea438f;
  --success: #347359;
  --danger: #c11d57;
  --radius: 10px;
  --radius-small: 7px;
  --shadow: 0 10px 30px rgba(91, 25, 61, .08);
  --shadow-soft: 0 5px 18px rgba(91, 25, 61, .075);
  color: var(--ink);
  background: var(--page);
  color-scheme: light;
  font-family: "Noto Sans SC", "Noto Sans", "Source Han Sans SC", "Microsoft YaHei", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-synthesis: none;
}

:root[data-theme="dark"] {
  --ink: #f7edf3;
  --muted: #c5b1bd;
  --faint: #9e8994;
  --line: #3d2b35;
  --line-strong: #604251;
  --panel: #241b21;
  --surface: #351d29;
  --surface-strong: #4a2539;
  --page: #0e0a0d;
  --topbar: rgba(14, 10, 13, .97);
  --field: #181216;
  --table-head: #2a1f25;
  --row-hover: #2d2027;
  --accent: #ff4da6;
  --accent-hover: #ff6db5;
  --accent-soft: #361929;
  --pink: #ff6aaf;
  --pink-soft: #351923;
  --violet: #c978f0;
  --violet-soft: #2d1d37;
  --success: #64c89a;
  --danger: #ff6b93;
  --code-bg: #0c090b;
  --code-ink: #fff0f7;
  --modal: #32242c;
  --backdrop: rgba(4, 2, 3, .78);
  --modal-shadow: 0 34px 100px rgba(0, 0, 0, .72), 0 10px 32px rgba(255, 77, 166, .08);
  --shadow: 0 16px 42px rgba(0, 0, 0, .45);
  --shadow-soft: 0 10px 28px rgba(0, 0, 0, .34);
  color-scheme: dark;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    --ink: #f7edf3;
    --muted: #c5b1bd;
    --faint: #9e8994;
    --line: #3d2b35;
    --line-strong: #604251;
    --panel: #241b21;
    --surface: #351d29;
    --surface-strong: #4a2539;
    --page: #0e0a0d;
    --topbar: rgba(14, 10, 13, .97);
    --field: #181216;
    --table-head: #2a1f25;
    --row-hover: #2d2027;
    --accent: #ff4da6;
    --accent-hover: #ff6db5;
    --accent-soft: #361929;
    --pink: #ff6aaf;
    --pink-soft: #351923;
    --violet: #c978f0;
    --violet-soft: #2d1d37;
    --success: #64c89a;
    --danger: #ff6b93;
    --code-bg: #0c090b;
    --code-ink: #fff0f7;
    --modal: #32242c;
    --backdrop: rgba(4, 2, 3, .78);
    --modal-shadow: 0 34px 100px rgba(0, 0, 0, .72), 0 10px 32px rgba(255, 77, 166, .08);
    --shadow: 0 16px 42px rgba(0, 0, 0, .45);
    --shadow-soft: 0 10px 28px rgba(0, 0, 0, .34);
    color-scheme: dark;
  }
}

* { box-sizing: border-box; }
html { min-width: 320px; }
body { margin: 0; min-height: 100vh; background: var(--page); }
button, input, select { font: inherit; }
button { cursor: pointer; }
button:disabled { cursor: not-allowed; }
::selection { color: #fff; background: var(--accent); }

.is-hidden { display: none !important; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.icon-sprite { position: absolute; width: 0; height: 0; overflow: hidden; }
.fa-icon { display: inline-block; width: 1em; height: 1em; overflow: visible; fill: currentColor; flex: 0 0 auto; }

.eyebrow {
  margin: 0 0 7px;
  color: var(--accent);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .14em;
}
.subtle { margin: 6px 0; color: var(--muted); line-height: 1.65; }

.brand-mark {
  display: inline-grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: var(--radius);
  color: #fff;
  background: var(--accent);
  box-shadow: 0 4px 12px rgba(192, 24, 114, .2);
}
.brand-mark .fa-icon { width: 18px; height: 18px; }
.brand-mark-small { width: 31px; height: 31px; border-radius: var(--radius-small); box-shadow: none; }
.brand-mark-small .fa-icon { width: 14px; height: 14px; }

.login-view { position: relative; min-height: 100vh; display: grid; place-items: center; padding: 26px; }
.login-theme-toggle { position: absolute; top: 20px; right: 20px; }
.login-card {
  width: min(100%, 410px);
  padding: 34px;
  border: 0;
  border-radius: 12px;
  background: var(--panel);
  box-shadow: var(--shadow);
}
.login-heading { display: flex; align-items: center; gap: 14px; padding-bottom: 8px; }
.login-heading .eyebrow { margin-bottom: 3px; }
.login-card h1 { margin: 0; font-size: 30px; font-weight: 600; line-height: 1; letter-spacing: -.015em; }
.login-intro { margin-top: 21px; font-size: 14px; }
.login-card form { margin-top: 24px; }
.login-card label, .modal label { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 700; }
.password-wrap { position: relative; }
.input-leading { position: absolute; left: 13px; top: 50%; display: grid; place-items: center; color: var(--faint); transform: translateY(-50%); pointer-events: none; }
.input-leading .fa-icon { width: 13px; height: 13px; }
.password-wrap input { padding-left: 38px !important; padding-right: 42px !important; }
.input-action { position: absolute; right: 5px; top: 5px; display: grid; place-items: center; width: 34px; height: 34px; padding: 0; border: 0; border-radius: var(--radius-small); color: var(--muted); background: transparent; }
.input-action:hover { color: var(--accent); background: var(--surface); }

.login-card input, .modal input {
  width: 100%;
  height: 44px;
  padding: 0 13px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-small);
  outline: 0;
  color: var(--ink);
  background: var(--field);
  transition: border-color .15s, box-shadow .15s;
}
.login-card input:focus, .modal input:focus, .field input:focus, .field select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(192, 24, 114, .13);
}
.form-error { min-height: 22px; margin: 8px 0; color: var(--danger); font-size: 12px; }
.privacy-note { display: flex; justify-content: center; align-items: center; gap: 7px; margin: 22px 0 0; color: var(--faint); font-size: 11px; }
.privacy-note .fa-icon { width: 11px; height: 11px; color: var(--accent); }

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 38px;
  padding: 9px 14px;
  border: 0;
  border-radius: var(--radius-small);
  color: var(--ink);
  background: var(--surface-strong);
  font-size: 13px;
  font-weight: 700;
  transition: color .15s, background .15s, box-shadow .15s, transform .15s;
}
.button:hover { background: var(--surface-strong); }
.button:focus-visible, .icon-button:focus-visible, .input-action:focus-visible, .edit-button:focus-visible { outline: 0; box-shadow: 0 0 0 3px rgba(192, 24, 114, .22); }
.button .fa-icon { width: 13px; height: 13px; }
.button-primary { color: #fff; background: var(--accent); box-shadow: 0 4px 12px rgba(192, 24, 114, .18); }
.button-primary:hover { background: var(--accent-hover); box-shadow: 0 6px 16px rgba(192, 24, 114, .24); transform: translateY(-1px); }
.button-wide { width: 100%; justify-content: space-between; min-height: 44px; padding: 10px 14px; }
.button-quiet { color: var(--muted); background: var(--surface); }
.button-quiet:hover { color: var(--accent); background: var(--surface-strong); }

.app-shell { min-height: 100vh; }
.topbar {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 62px;
  padding: 0 clamp(18px, 5vw, 64px);
  background: var(--topbar);
  box-shadow: 0 3px 14px rgba(72, 22, 49, .035);
}
.brand { display: flex; align-items: center; gap: 10px; color: var(--ink); text-decoration: none; font-size: 16px; font-weight: 700; }
.topbar-actions { display: flex; align-items: center; gap: 8px; }
.status-dot { display: flex; align-items: center; gap: 7px; margin-right: 7px; color: var(--muted); font-size: 11px; }
.status-dot i { width: 6px; height: 6px; border-radius: 50%; background: var(--success); box-shadow: 0 0 0 3px rgba(52, 115, 89, .1); }
.icon-button {
  display: inline-grid;
  place-items: center;
  width: 35px;
  height: 35px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-small);
  color: var(--muted);
  background: var(--surface);
}
.icon-button:hover { color: var(--accent); background: var(--surface-strong); }
.icon-button:disabled { opacity: .38; }
.icon-button .fa-icon { width: 13px; height: 13px; }

.dashboard { width: min(1120px, calc(100% - 40px)); margin: 0 auto; padding: 42px 0 64px; }
.welcome-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 27px; }
.welcome-row h1 { margin: 0; font-size: clamp(30px, 4vw, 39px); font-weight: 600; line-height: 1.1; letter-spacing: -.025em; }
.welcome-row .subtle { margin-top: 8px; font-size: 13px; }

.stats-grid { display: grid; grid-template-columns: 1.25fr 1fr 1fr; gap: 12px; margin-bottom: 15px; }
.stat-card {
  position: relative;
  min-height: 148px;
  padding: 21px;
  border: 0;
  border-radius: var(--radius);
  background: var(--panel);
  box-shadow: var(--shadow-soft);
}
.stat-card p { margin: 20px 0 7px; color: var(--muted); font-size: 12px; font-weight: 700; }
.stat-card strong { display: block; font-size: 34px; font-weight: 600; line-height: 1; letter-spacing: -.025em; font-variant-numeric: tabular-nums; }
.stat-card > span:last-child { display: block; margin-top: 10px; color: var(--faint); font-size: 11px; }
.stat-icon { position: absolute; right: 18px; top: 18px; display: grid; place-items: center; width: 31px; height: 31px; border: 0; border-radius: var(--radius-small); color: var(--accent); background: var(--accent-soft); }
.stat-icon .fa-icon { width: 13px; height: 13px; }
.stat-icon-pink { color: var(--pink); background: var(--pink-soft); }
.stat-icon-violet { color: var(--violet); background: var(--violet-soft); }

.content-card { overflow: hidden; border: 0; border-radius: var(--radius); background: var(--panel); box-shadow: var(--shadow); }
.card-heading { display: flex; align-items: center; justify-content: space-between; padding: 23px 24px 18px; }
.card-heading h2, .modal-heading h2 { margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -.012em; }
.domain-total { text-align: right; }
.domain-total span { display: block; margin-bottom: 2px; color: var(--faint); font-size: 10px; }
.domain-total strong { font-size: 15px; font-weight: 600; }

.toolbar { display: grid; grid-template-columns: 1fr 1.5fr .8fr; gap: 10px; padding: 0 24px 20px; }
.field { display: block; }
.field > span { display: block; margin: 0 0 6px 1px; color: var(--muted); font-size: 10px; font-weight: 700; letter-spacing: .07em; }
.field input, .field select { width: 100%; height: 40px; padding: 0 11px; border: 1px solid var(--line-strong); border-radius: var(--radius-small); outline: 0; color: var(--ink); background: var(--field); }

.table-wrap { min-height: 265px; overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th { padding: 12px 24px; color: var(--faint); background: var(--table-head); font-size: 10px; font-weight: 700; letter-spacing: .07em; text-align: left; }
td { padding: 14px 24px; border-top: 1px solid var(--line); font-size: 13px; }
tbody tr:hover { background: var(--row-hover); }
th:nth-child(2), td:nth-child(2) { text-align: right; }
th:last-child, td:last-child { width: 78px; text-align: right; }
.page-cell { display: flex; align-items: center; gap: 11px; min-width: 260px; }
.page-cell-icon { display: grid; place-items: center; flex: 0 0 auto; width: 30px; height: 30px; border: 0; border-radius: var(--radius-small); color: var(--accent); background: var(--surface); }
.page-cell-icon .fa-icon { width: 11px; height: 11px; }
.page-cell strong { display: block; max-width: 430px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
.page-cell small { display: block; margin-top: 3px; color: var(--faint); }
.views-value { color: var(--ink); font-size: 15px; font-weight: 700; font-variant-numeric: tabular-nums; }
.date-value { color: var(--muted); white-space: nowrap; }
.edit-button { display: inline-flex; align-items: center; gap: 6px; padding: 6px 8px; border: 0; border-radius: var(--radius-small); color: var(--accent); background: var(--surface); font-size: 11px; font-weight: 700; }
.edit-button:hover { background: var(--surface-strong); }
.edit-button .fa-icon { width: 10px; height: 10px; }

.empty-state { padding: 49px 20px; color: var(--muted); text-align: center; }
.empty-state > span { display: grid; place-items: center; width: 38px; height: 38px; margin: 0 auto 13px; border: 0; border-radius: var(--radius-small); color: var(--accent); background: var(--surface); }
.empty-state > span .fa-icon { width: 15px; height: 15px; }
.empty-state h3 { margin: 0 0 5px; color: var(--ink); font-size: 16px; font-weight: 600; }
.empty-state p { margin: 0; font-size: 12px; }
.pagination { display: flex; justify-content: space-between; align-items: center; padding: 13px 24px; border-top: 1px solid var(--line); color: var(--muted); font-size: 11px; }
.pagination > div { display: flex; align-items: center; gap: 11px; }
.pagination .icon-button { width: 29px; height: 29px; }

.modal { width: min(calc(100% - 32px), 460px); padding: 0; border: 0; border-radius: 12px; color: var(--ink); background: var(--modal); box-shadow: var(--modal-shadow); }
.modal::backdrop { background: var(--backdrop); backdrop-filter: blur(2px); }
.modal form { padding: 24px; }
.modal-heading { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
.target-path { padding: 10px 11px; border: 0; border-radius: var(--radius-small); overflow-wrap: anywhere; color: var(--muted); background: var(--surface); font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 12px; }
.hint { color: var(--muted); font-size: 11px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 22px; }
.modal-wide { width: min(calc(100% - 32px), 640px); }
code, pre { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
code { color: var(--accent); }
pre { padding: 16px; overflow: auto; border-radius: var(--radius-small); color: var(--code-ink); background: var(--code-bg); font-size: 12px; line-height: 1.65; white-space: pre-wrap; }
pre code { color: inherit; }

.toast { position: fixed; left: 50%; bottom: 24px; z-index: 20; padding: 10px 14px; border: 0; border-radius: var(--radius-small); color: #fff; background: #281f25; box-shadow: 0 10px 28px rgba(40, 31, 37, .18); font-size: 12px; opacity: 0; pointer-events: none; transform: translate(-50%, 12px); transition: opacity .2s, transform .2s; }
.toast.show { opacity: 1; transform: translate(-50%, 0); }

@media (max-width: 760px) {
  .topbar { padding: 0 14px; }
  .status-dot { display: none; }
  .dashboard { width: min(100% - 24px, 1120px); padding-top: 29px; }
  .welcome-row { align-items: flex-start; flex-direction: column; }
  .welcome-row h1 { font-size: 31px; }
  .stats-grid { grid-template-columns: 1fr; }
  .stat-card { min-height: 135px; }
  .toolbar { grid-template-columns: 1fr; padding: 0 17px 17px; }
  .card-heading { padding: 20px 17px 16px; }
  th, td { padding-left: 17px; padding-right: 17px; }
  .pagination { padding: 12px 17px; }
  .login-card { padding: 27px 22px; }
  .topbar .button-quiet { width: 35px; padding: 0; }
  .topbar .button-quiet span { display: none; }
  .date-value { font-size: 11px; }
}

@media (max-width: 520px) {
  table { table-layout: fixed; }
  th, td { padding-left: 12px; padding-right: 12px; }
  th:nth-child(2), td:nth-child(2) { width: 54px; }
  th:nth-child(3), td:nth-child(3) { display: none; }
  th:last-child, td:last-child { width: 52px; }
  .page-cell { min-width: 0; gap: 9px; }
  .page-cell strong { max-width: 160px; }
  .edit-button { width: 30px; height: 30px; justify-content: center; padding: 0; font-size: 0; }
  .edit-button .fa-icon { width: 11px; height: 11px; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; }
}
`;
