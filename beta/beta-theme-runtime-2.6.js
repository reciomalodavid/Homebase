(()=>{
  const VERSION='2.6';
  const KEY='homebase_beta_appearance';
  const mq=window.matchMedia('(prefers-color-scheme: dark)');
  const root=document.documentElement;

  const css=`
/* Beta identity */
body::after{content:'BETA ${VERSION}';position:fixed;top:calc(7px + env(safe-area-inset-top));right:9px;z-index:100000;padding:6px 10px;border-radius:999px;background:#7357d5;color:#fff;font:800 11px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;letter-spacing:.7px;box-shadow:0 5px 16px rgba(32,18,78,.28);pointer-events:none}
.brand-title::after{content:' Beta';color:#7357d5;font-size:.58em;font-weight:850}
.new-btn{display:none!important}

/* Shared */
html,body{transition:background-color .18s ease,color .18s ease}
.appearance-card{margin:16px 0;padding:16px;border-radius:20px}
.appearance-card h3{margin:0 0 4px;font-size:17px}.appearance-card p{margin:0 0 12px;font-size:12px}.appearance-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.appearance-options button{min-width:0;border-radius:12px;padding:10px 5px;font-weight:800}

/* LIGHT: explicit reset, independent of system setting */
html[data-hb-theme='light']{color-scheme:light!important;background:#eef6fd!important;--bg:#eef6fd!important;--surface:#fff!important;--surface-2:#f5f8fc!important;--text:#182230!important;--muted:#7e8793!important;--line:#dce5ef!important;--accent:#d9781f!important;--accent-soft:#fff0df!important}
html[data-hb-theme='light'] body{background:radial-gradient(circle at 7% 2%,rgba(255,255,255,.96),transparent 30%),radial-gradient(circle at 96% 8%,rgba(170,218,255,.28),transparent 34%),linear-gradient(180deg,#f5faff,#eef6fd 48%,#e7f2fc)!important;color:#182230!important}
html[data-hb-theme='light'] body::before{background:rgba(238,246,253,.62)!important}
html[data-hb-theme='light'] .topbar,html[data-hb-theme='light'] .bottom-nav,html[data-hb-theme='light'] .card,html[data-hb-theme='light'] .calendar-shell,html[data-hb-theme='light'] .today-focus,html[data-hb-theme='light'] .today-stats,html[data-hb-theme='light'] .list-card,html[data-hb-theme='light'] .panel,html[data-hb-theme='light'] .sync-section,html[data-hb-theme='light'] .appearance-card{background:rgba(255,255,255,.76)!important;color:#182230!important;border-color:rgba(255,255,255,.94)!important;box-shadow:0 14px 38px rgba(45,94,139,.10)!important}
html[data-hb-theme='light'] dialog,html[data-hb-theme='light'] dialog[open],html[data-hb-theme='light'] .modal,html[data-hb-theme='light'] .modal-body,html[data-hb-theme='light'] .dialog-body,html[data-hb-theme='light'] .sheet,html[data-hb-theme='light'] .sheet-body{background:#f7f9fc!important;background-image:none!important;color:#182230!important;border-color:#dce5ef!important}
html[data-hb-theme='light'] .modal-head,html[data-hb-theme='light'] .dialog-head,html[data-hb-theme='light'] .sheet-head{background:#fff!important;color:#182230!important;border-bottom:1px solid #e2e8f0!important}
html[data-hb-theme='light'] .hero-row h1,html[data-hb-theme='light'] .section-head h2,html[data-hb-theme='light'] .event-title,html[data-hb-theme='light'] .task-title,html[data-hb-theme='light'] .calendar-title,html[data-hb-theme='light'] .week-name,html[data-hb-theme='light'] .week-num,html[data-hb-theme='light'] .modal h1,html[data-hb-theme='light'] .modal h2,html[data-hb-theme='light'] .modal h3,html[data-hb-theme='light'] label,html[data-hb-theme='light'] legend,html[data-hb-theme='light'] .detail-value,html[data-hb-theme='light'] .profile-row strong{color:#182230!important;-webkit-text-fill-color:#182230!important}
html[data-hb-theme='light'] .brand-sub,html[data-hb-theme='light'] .event-meta,html[data-hb-theme='light'] .hero-date,html[data-hb-theme='light'] .section-head span,html[data-hb-theme='light'] .weekdays div,html[data-hb-theme='light'] .detail-label,html[data-hb-theme='light'] .help,html[data-hb-theme='light'] .hint,html[data-hb-theme='light'] .subtitle{color:#7e8793!important;-webkit-text-fill-color:#7e8793!important}
html[data-hb-theme='light'] input,html[data-hb-theme='light'] select,html[data-hb-theme='light'] textarea,html[data-hb-theme='light'] input[type='date'],html[data-hb-theme='light'] input[type='time'],html[data-hb-theme='light'] input[type='file']{background:#fff!important;background-image:none!important;color:#182230!important;-webkit-text-fill-color:#182230!important;border:1px solid #dce5ef!important;color-scheme:light!important;opacity:1!important}
html[data-hb-theme='light'] input::placeholder,html[data-hb-theme='light'] textarea::placeholder{color:#9aa5b3!important;-webkit-text-fill-color:#9aa5b3!important}
html[data-hb-theme='light'] .form-section,html[data-hb-theme='light'] .field-group,html[data-hb-theme='light'] .switch-line,html[data-hb-theme='light'] .profile-row,html[data-hb-theme='light'] .trash-item,html[data-hb-theme='light'] .trash-empty,html[data-hb-theme='light'] .empty-state,html[data-hb-theme='light'] .detail-row,html[data-hb-theme='light'] .detail-grid>div,html[data-hb-theme='light'] .import-info,html[data-hb-theme='light'] .privacy-box,html[data-hb-theme='light'] .import-dropzone,html[data-hb-theme='light'] .upload-zone,html[data-hb-theme='light'] .file-zone,html[data-hb-theme='light'] .member-pick,html[data-hb-theme='light'] .filter-item,html[data-hb-theme='light'] .week-picks label{background:#fff!important;background-image:none!important;color:#182230!important;border-color:#dce5ef!important}
html[data-hb-theme='light'] .day{background:rgba(255,255,255,.90)!important;color:#182230!important;border-color:#e2e8f0!important}
html[data-hb-theme='light'] .day.other{opacity:.35!important}.day.selected .day-number,html[data-hb-theme='light'] .day.selected .day-number{color:#fff!important;-webkit-text-fill-color:#fff!important}
html[data-hb-theme='light'] .day.selected{background:linear-gradient(180deg,#ed9138,#cf6d16)!important;color:#fff!important;outline-color:rgba(255,255,255,.72)!important}
html[data-hb-theme='light'] .bottom-nav .nav-btn{color:#707b88!important}.bottom-nav .nav-btn.active{color:#e0781c!important}
html[data-hb-theme='light'] .appearance-options button{background:#f5f8fc!important;color:#263448!important;border:1px solid #dce5ef!important}.appearance-options button.active{background:#d9781f!important;color:#fff!important;border-color:#d9781f!important}

/* DARK: explicit, independent of system setting */
html[data-hb-theme='dark']{color-scheme:dark!important;background:#08111e!important;--bg:#08111e!important;--surface:#142238!important;--surface-2:#1b2a40!important;--text:#f7f9fc!important;--muted:#aeb9c8!important;--line:rgba(255,255,255,.11)!important;--accent:#ef8a2d!important;--accent-soft:rgba(239,138,45,.16)!important}
html[data-hb-theme='dark'] body{background:radial-gradient(circle at 12% -5%,rgba(56,112,181,.24),transparent 34%),radial-gradient(circle at 96% 0%,rgba(119,86,207,.18),transparent 30%),linear-gradient(180deg,#101c2e,#0b1625 48%,#07101c)!important;color:#f7f9fc!important}
html[data-hb-theme='dark'] body::before{background:rgba(7,16,28,.58)!important}
html[data-hb-theme='dark'] .topbar,html[data-hb-theme='dark'] .bottom-nav,html[data-hb-theme='dark'] .card,html[data-hb-theme='dark'] .calendar-shell,html[data-hb-theme='dark'] .today-focus,html[data-hb-theme='dark'] .today-stats,html[data-hb-theme='dark'] .list-card,html[data-hb-theme='dark'] .panel,html[data-hb-theme='dark'] .sync-section,html[data-hb-theme='dark'] .appearance-card{background:linear-gradient(150deg,rgba(28,42,61,.97),rgba(13,24,39,.97))!important;color:#f7f9fc!important;border-color:rgba(255,255,255,.11)!important;box-shadow:0 18px 44px rgba(0,0,0,.22)!important}
html[data-hb-theme='dark'] dialog,html[data-hb-theme='dark'] dialog[open],html[data-hb-theme='dark'] .modal,html[data-hb-theme='dark'] .modal-body,html[data-hb-theme='dark'] .dialog-body,html[data-hb-theme='dark'] .sheet,html[data-hb-theme='dark'] .sheet-body{background:#101c2c!important;background-image:linear-gradient(155deg,#17263b,#0d1928)!important;color:#f7f9fc!important;border-color:rgba(255,255,255,.12)!important;box-shadow:0 24px 70px rgba(0,0,0,.48)!important}
html[data-hb-theme='dark'] .modal-head,html[data-hb-theme='dark'] .dialog-head,html[data-hb-theme='dark'] .sheet-head{background:#18263a!important;color:#fff!important;border-bottom:1px solid rgba(255,255,255,.10)!important}
html[data-hb-theme='dark'] dialog::backdrop{background:rgba(1,6,13,.78)!important;backdrop-filter:blur(12px)!important}
html[data-hb-theme='dark'] .hero-row h1,html[data-hb-theme='dark'] .section-head h2,html[data-hb-theme='dark'] .event-title,html[data-hb-theme='dark'] .task-title,html[data-hb-theme='dark'] .calendar-title,html[data-hb-theme='dark'] .week-name,html[data-hb-theme='dark'] .week-num,html[data-hb-theme='dark'] .modal h1,html[data-hb-theme='dark'] .modal h2,html[data-hb-theme='dark'] .modal h3,html[data-hb-theme='dark'] label,html[data-hb-theme='dark'] legend,html[data-hb-theme='dark'] .detail-value,html[data-hb-theme='dark'] .profile-row strong{color:#f7f9fc!important;-webkit-text-fill-color:#f7f9fc!important}
html[data-hb-theme='dark'] .brand-sub,html[data-hb-theme='dark'] .event-meta,html[data-hb-theme='dark'] .hero-date,html[data-hb-theme='dark'] .section-head span,html[data-hb-theme='dark'] .weekdays div,html[data-hb-theme='dark'] .detail-label,html[data-hb-theme='dark'] .help,html[data-hb-theme='dark'] .hint,html[data-hb-theme='dark'] .subtitle{color:#aeb9c8!important;-webkit-text-fill-color:#aeb9c8!important}
html[data-hb-theme='dark'] input,html[data-hb-theme='dark'] select,html[data-hb-theme='dark'] textarea,html[data-hb-theme='dark'] input[type='date'],html[data-hb-theme='dark'] input[type='time'],html[data-hb-theme='dark'] input[type='file']{background:#22334d!important;background-image:none!important;color:#f7f9fc!important;-webkit-text-fill-color:#f7f9fc!important;border:1px solid rgba(255,255,255,.14)!important;color-scheme:dark!important;opacity:1!important}
html[data-hb-theme='dark'] input::placeholder,html[data-hb-theme='dark'] textarea::placeholder{color:#8291a6!important;-webkit-text-fill-color:#8291a6!important}
html[data-hb-theme='dark'] .form-section,html[data-hb-theme='dark'] .field-group,html[data-hb-theme='dark'] .switch-line,html[data-hb-theme='dark'] .profile-row,html[data-hb-theme='dark'] .trash-item,html[data-hb-theme='dark'] .trash-empty,html[data-hb-theme='dark'] .empty-state,html[data-hb-theme='dark'] .detail-row,html[data-hb-theme='dark'] .detail-grid>div,html[data-hb-theme='dark'] .import-info,html[data-hb-theme='dark'] .privacy-box,html[data-hb-theme='dark'] .import-dropzone,html[data-hb-theme='dark'] .upload-zone,html[data-hb-theme='dark'] .file-zone,html[data-hb-theme='dark'] .member-pick,html[data-hb-theme='dark'] .filter-item,html[data-hb-theme='dark'] .week-picks label{background:#1a2940!important;background-image:none!important;color:#f7f9fc!important;border-color:rgba(255,255,255,.11)!important}
html[data-hb-theme='dark'] .day{background:#1d2a3d!important;color:#f7f9fc!important;border-color:rgba(255,255,255,.14)!important}
html[data-hb-theme='dark'] .day.other{opacity:.35!important}html[data-hb-theme='dark'] .day.selected{background:linear-gradient(180deg,#ed9138,#cf6d16)!important;color:#fff!important;outline-color:rgba(255,255,255,.72)!important}html[data-hb-theme='dark'] .day.selected .day-number{color:#fff!important;-webkit-text-fill-color:#fff!important}
html[data-hb-theme='dark'] .pill,html[data-hb-theme='dark'] .roster-badge,html[data-hb-theme='dark'] [class*='roster'][class*='badge']{background:#29496d!important;color:#dceeff!important;-webkit-text-fill-color:#dceeff!important;border:1px solid rgba(151,200,255,.28)!important}
html[data-hb-theme='dark'] .bottom-nav .nav-btn{color:#aeb9c8!important}html[data-hb-theme='dark'] .bottom-nav .nav-btn.active{color:#ff9a3d!important;background:rgba(255,255,255,.08)!important}
html[data-hb-theme='dark'] .appearance-options button{background:#263850!important;color:#c8d2df!important;border:1px solid rgba(255,255,255,.10)!important}html[data-hb-theme='dark'] .appearance-options button.active{background:#d9781f!important;color:#fff!important;border-color:#d9781f!important}
`;

  function ensureStyle(){let s=document.getElementById('hb-theme-26');if(!s){s=document.createElement('style');s.id='hb-theme-26';document.head.appendChild(s)}s.textContent=css}
  function choice(){const v=localStorage.getItem(KEY);return ['light','dark','system'].includes(v)?v:'system'}
  function resolved(v){return v==='system'?(mq.matches?'dark':'light'):v}
  function apply(v=choice()){
    ensureStyle();
    root.dataset.hbTheme=resolved(v);
    root.dataset.hbThemeChoice=v;
    root.classList.toggle('hb-dark',resolved(v)==='dark');
    root.classList.toggle('hb-light',resolved(v)==='light');
    const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=resolved(v)==='dark'?'#08111e':'#eef6fd';
    document.querySelectorAll('[data-theme-choice]').forEach(b=>b.classList.toggle('active',b.dataset.themeChoice===v));
  }
  function addControls(){
    if(document.querySelector('.appearance-card')){apply();return}
    const pages=[...document.querySelectorAll('.page')];
    const target=pages.find(p=>/Sincronización familiar|Roster de/i.test(p.textContent||''))||pages.at(-1);if(!target)return;
    const card=document.createElement('section');card.className='appearance-card card';
    card.innerHTML='<h3>Apariencia</h3><p>Elige cómo quieres ver Homebase Beta.</p><div class="appearance-options"><button type="button" data-theme-choice="light">☀️ Claro</button><button type="button" data-theme-choice="dark">🌙 Oscuro</button><button type="button" data-theme-choice="system">⚙️ Sistema</button></div>';
    card.addEventListener('click',e=>{const b=e.target.closest('[data-theme-choice]');if(!b)return;e.preventDefault();localStorage.setItem(KEY,b.dataset.themeChoice);apply(b.dataset.themeChoice)});
    target.prepend(card);apply();
  }

  ensureStyle();apply();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addControls,{once:true});else addControls();
  mq.addEventListener?.('change',()=>{if(choice()==='system')apply('system')});
  new MutationObserver(()=>{ensureStyle();addControls();apply()}).observe(document.documentElement,{subtree:true,childList:true});
})();