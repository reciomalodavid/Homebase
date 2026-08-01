(()=>{
  const KEY='appearance';
  const mq=matchMedia('(prefers-color-scheme: dark)');
  const getChoice=()=>localStorage.getItem(KEY)||'system';
  const effective=choice=>choice==='system'?(mq.matches?'dark':'light'):choice;

  const css=`
/* Beta version badge: single source of truth */
body::after{content:'BETA 2.5'!important}

/* Never turn native checks/radios into full-width text fields */
input[type="checkbox"],input[type="radio"]{width:auto!important;min-height:0!important;padding:0!important;background:initial!important;-webkit-text-fill-color:initial!important}

/* Appearance panel */
.appearance-card{margin:14px 0 18px;padding:15px;border-radius:20px;border:1px solid var(--line);background:var(--surface);color:var(--text)}
.appearance-card h3{margin:0 0 4px;font-size:17px}.appearance-card p{margin:0 0 12px;color:var(--muted);font-size:12px}.appearance-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.appearance-options button{min-width:0;border:1px solid var(--line);border-radius:12px;padding:10px 4px;background:var(--surface-2);color:var(--text);font-weight:800}.appearance-options button.active{background:#d9781f!important;border-color:#d9781f!important;color:#fff!important;-webkit-text-fill-color:#fff!important}

/* Explicit LIGHT mode must beat the old system dark media query */
html[data-hb-theme="light"],html[data-hb-theme="light"] body{color-scheme:light!important;background:#eef6fd!important;color:#182230!important}
html[data-hb-theme="light"] body::before{background:rgba(238,246,253,.88)!important}
html[data-hb-theme="light"] .app,html[data-hb-theme="light"] .page,html[data-hb-theme="light"] main{color:#182230!important}
html[data-hb-theme="light"] .topbar,html[data-hb-theme="light"] .bottom-nav,html[data-hb-theme="light"] .card,html[data-hb-theme="light"] .calendar-shell,html[data-hb-theme="light"] dialog,html[data-hb-theme="light"] .today-focus,html[data-hb-theme="light"] .today-stats,html[data-hb-theme="light"] .list-card,html[data-hb-theme="light"] .roster-card,html[data-hb-theme="light"] .sync-section>.card{background:rgba(255,255,255,.72)!important;background-image:none!important;color:#182230!important;border-color:rgba(255,255,255,.88)!important}
html[data-hb-theme="light"] .modal,html[data-hb-theme="light"] .modal-body,html[data-hb-theme="light"] .dialog-body,html[data-hb-theme="light"] .sheet,html[data-hb-theme="light"] .sheet-body,html[data-hb-theme="light"] .form-body,html[data-hb-theme="light"] .form-content,html[data-hb-theme="light"] .profile-list,html[data-hb-theme="light"] .profile-group,html[data-hb-theme="light"] .trash-list,html[data-hb-theme="light"] .import-content,html[data-hb-theme="light"] .roster-import,html[data-hb-theme="light"] .detail-grid{background:#f7f8fa!important;background-image:none!important;color:#182230!important}
html[data-hb-theme="light"] .modal-head,html[data-hb-theme="light"] .dialog-head,html[data-hb-theme="light"] .sheet-head{background:#fffdf9!important;color:#182230!important;border-bottom-color:#e6e8ec!important}
html[data-hb-theme="light"] label,html[data-hb-theme="light"] legend,html[data-hb-theme="light"] .detail-value,html[data-hb-theme="light"] .profile-row strong,html[data-hb-theme="light"] .trash-item strong{color:#182230!important;-webkit-text-fill-color:#182230!important}
html[data-hb-theme="light"] input:not([type="checkbox"]):not([type="radio"]),html[data-hb-theme="light"] select,html[data-hb-theme="light"] textarea{background:#fff!important;color:#182230!important;-webkit-text-fill-color:#182230!important;border-color:#dfe3e8!important;color-scheme:light!important}
html[data-hb-theme="light"] input::placeholder,html[data-hb-theme="light"] textarea::placeholder{color:#8a929d!important;-webkit-text-fill-color:#8a929d!important}
html[data-hb-theme="light"] .form-section,html[data-hb-theme="light"] .field-group,html[data-hb-theme="light"] .switch-line,html[data-hb-theme="light"] .profile-row,html[data-hb-theme="light"] .trash-item,html[data-hb-theme="light"] .trash-empty,html[data-hb-theme="light"] .empty-state,html[data-hb-theme="light"] .detail-row,html[data-hb-theme="light"] .detail-grid>div,html[data-hb-theme="light"] .import-info,html[data-hb-theme="light"] .privacy-box,html[data-hb-theme="light"] .import-dropzone,html[data-hb-theme="light"] .upload-zone,html[data-hb-theme="light"] .file-zone,html[data-hb-theme="light"] .status-box,html[data-hb-theme="light"] .member-pick,html[data-hb-theme="light"] .filter-item,html[data-hb-theme="light"] .week-picks label,html[data-hb-theme="light"] .advanced{background:#fff!important;background-image:none!important;color:#182230!important;border-color:#e2e6eb!important}
html[data-hb-theme="light"] .bottom-nav .nav-btn{color:#7e8793!important}html[data-hb-theme="light"] .bottom-nav .nav-btn.active{color:#d9781f!important;background:rgba(217,120,31,.08)!important}
html[data-hb-theme="light"] .appearance-card{background:rgba(255,255,255,.72)!important;color:#182230!important}
html[data-hb-theme="light"] .appearance-options button{background:#f3f6f9!important;color:#344054!important;border-color:#dfe4ea!important;-webkit-text-fill-color:#344054!important}

/* DARK mode */
html[data-hb-theme="dark"],html[data-hb-theme="dark"] body{color-scheme:dark!important;background:#08111e!important;color:#f7f9fc!important}
html[data-hb-theme="dark"] body::before{background:rgba(7,16,28,.58)!important}
html[data-hb-theme="dark"] .app,html[data-hb-theme="dark"] .page,html[data-hb-theme="dark"] main{color:#f7f9fc!important}
html[data-hb-theme="dark"] .topbar,html[data-hb-theme="dark"] .bottom-nav,html[data-hb-theme="dark"] .card,html[data-hb-theme="dark"] .calendar-shell,html[data-hb-theme="dark"] .today-focus,html[data-hb-theme="dark"] .today-stats,html[data-hb-theme="dark"] .list-card,html[data-hb-theme="dark"] .roster-card,html[data-hb-theme="dark"] .sync-section>.card{background:linear-gradient(145deg,rgba(31,45,65,.92),rgba(13,24,39,.94))!important;color:#f7f9fc!important;border-color:rgba(255,255,255,.11)!important}
html[data-hb-theme="dark"] dialog,html[data-hb-theme="dark"] dialog[open],html[data-hb-theme="dark"] .modal,html[data-hb-theme="dark"] .modal-body,html[data-hb-theme="dark"] .dialog-body,html[data-hb-theme="dark"] .sheet,html[data-hb-theme="dark"] .sheet-body,html[data-hb-theme="dark"] .form-body,html[data-hb-theme="dark"] .form-content,html[data-hb-theme="dark"] .profile-list,html[data-hb-theme="dark"] .profile-group,html[data-hb-theme="dark"] .trash-list,html[data-hb-theme="dark"] .import-content,html[data-hb-theme="dark"] .roster-import,html[data-hb-theme="dark"] .detail-grid{background:#101c2c!important;background-image:linear-gradient(155deg,#17263b,#0d1928)!important;color:#f7f9fc!important;border-color:rgba(255,255,255,.12)!important;box-shadow:0 24px 70px rgba(0,0,0,.48)!important}
html[data-hb-theme="dark"] .modal-head,html[data-hb-theme="dark"] .dialog-head,html[data-hb-theme="dark"] .sheet-head{background:#18263a!important;background-image:none!important;color:#fff!important;border-bottom:1px solid rgba(255,255,255,.10)!important}
html[data-hb-theme="dark"] dialog::backdrop{background:rgba(1,6,13,.78)!important;backdrop-filter:blur(12px)!important}
html[data-hb-theme="dark"] .form-row,html[data-hb-theme="dark"] .form-section,html[data-hb-theme="dark"] .field-group,html[data-hb-theme="dark"] .switch-line,html[data-hb-theme="dark"] .profile-row,html[data-hb-theme="dark"] .trash-item,html[data-hb-theme="dark"] .trash-empty,html[data-hb-theme="dark"] .empty-state,html[data-hb-theme="dark"] .detail-row,html[data-hb-theme="dark"] .detail-grid>div,html[data-hb-theme="dark"] .import-info,html[data-hb-theme="dark"] .privacy-box,html[data-hb-theme="dark"] .import-dropzone,html[data-hb-theme="dark"] .upload-zone,html[data-hb-theme="dark"] .file-zone,html[data-hb-theme="dark"] .status-box,html[data-hb-theme="dark"] .member-pick,html[data-hb-theme="dark"] .filter-item,html[data-hb-theme="dark"] .week-picks label,html[data-hb-theme="dark"] .advanced{background:#1a2940!important;background-image:none!important;color:#f7f9fc!important;border-color:rgba(255,255,255,.11)!important}
html[data-hb-theme="dark"] input:not([type="checkbox"]):not([type="radio"]),html[data-hb-theme="dark"] select,html[data-hb-theme="dark"] textarea{background:#22334d!important;background-image:none!important;color:#f7f9fc!important;-webkit-text-fill-color:#f7f9fc!important;border:1px solid rgba(255,255,255,.14)!important;color-scheme:dark!important;opacity:1!important}
html[data-hb-theme="dark"] input::placeholder,html[data-hb-theme="dark"] textarea::placeholder{color:#8291a6!important;-webkit-text-fill-color:#8291a6!important;opacity:1!important}
html[data-hb-theme="dark"] input[type="file"]::file-selector-button{background:#344762!important;color:#fff!important;border:0!important}
html[data-hb-theme="dark"] label,html[data-hb-theme="dark"] legend,html[data-hb-theme="dark"] .detail-value,html[data-hb-theme="dark"] .trash-item strong,html[data-hb-theme="dark"] .profile-row strong{color:#f7f9fc!important;-webkit-text-fill-color:#f7f9fc!important}
html[data-hb-theme="dark"] .detail-label,html[data-hb-theme="dark"] .help,html[data-hb-theme="dark"] .hint,html[data-hb-theme="dark"] .description,html[data-hb-theme="dark"] .subtitle,html[data-hb-theme="dark"] .trash-note,html[data-hb-theme="dark"] .import-note{color:#aeb9c8!important;-webkit-text-fill-color:#aeb9c8!important}
html[data-hb-theme="dark"] .type-switch,html[data-hb-theme="dark"] .mode-switch,html[data-hb-theme="dark"] .segmented,html[data-hb-theme="dark"] .tabs{background:#15243a!important;border-color:rgba(255,255,255,.10)!important}
html[data-hb-theme="dark"] .type-switch button,html[data-hb-theme="dark"] .mode-switch button,html[data-hb-theme="dark"] .segmented button,html[data-hb-theme="dark"] .tabs button{color:#aeb9c8!important;-webkit-text-fill-color:#aeb9c8!important}
html[data-hb-theme="dark"] .type-switch button.active,html[data-hb-theme="dark"] .mode-switch button.active,html[data-hb-theme="dark"] .segmented button.active,html[data-hb-theme="dark"] .tabs button.active{background:#354a69!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
html[data-hb-theme="dark"] .close,html[data-hb-theme="dark"] .row-action,html[data-hb-theme="dark"] .small-btn,html[data-hb-theme="dark"] button.secondary{background:#34445d!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-color:rgba(255,255,255,.14)!important}
html[data-hb-theme="dark"] .save,html[data-hb-theme="dark"] .primary,html[data-hb-theme="dark"] .event-fab{background:linear-gradient(180deg,#ef8a2d,#d66f13)!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
html[data-hb-theme="dark"] .edit-btn{background:rgba(217,120,31,.20)!important;color:#ffd2aa!important;-webkit-text-fill-color:#ffd2aa!important}html[data-hb-theme="dark"] .delete-btn,html[data-hb-theme="dark"] .permanent{background:rgba(216,74,85,.20)!important;color:#ffadb4!important;-webkit-text-fill-color:#ffadb4!important}
html[data-hb-theme="dark"] .pill,html[data-hb-theme="dark"] .roster-badge,html[data-hb-theme="dark"] [class*="roster"][class*="badge"]{background:#29496d!important;color:#dceeff!important;-webkit-text-fill-color:#dceeff!important;border:1px solid rgba(151,200,255,.28)!important}
html[data-hb-theme="dark"] .appearance-card{background:linear-gradient(145deg,#1c2c43,#111f32)!important;color:#fff!important;border-color:rgba(255,255,255,.10)!important}
html[data-hb-theme="dark"] .appearance-options button{background:#263850!important;color:#c8d2df!important;border-color:rgba(255,255,255,.10)!important;-webkit-text-fill-color:#c8d2df!important}
`;

  let style=document.getElementById('hb-dark-runtime-style');
  if(!style){style=document.createElement('style');style.id='hb-dark-runtime-style';document.head.appendChild(style)}
  style.textContent=css;

  function apply(choice=getChoice()){
    const mode=effective(choice);
    document.documentElement.dataset.hbTheme=mode;
    document.documentElement.dataset.hbThemeChoice=choice;
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.content=mode==='dark'?'#08111e':'#eef6fd';
    document.querySelectorAll('.appearance-options button').forEach(b=>b.classList.toggle('active',b.dataset.themeChoice===choice));
  }

  function addAppearance(){
    if(document.querySelector('.appearance-card'))return;
    const moreButton=document.querySelector('[data-page="more"],.nav-btn[data-target="more"],.nav-btn:last-child');
    const pages=[...document.querySelectorAll('.page')];
    const target=pages.find(p=>/Sincronización familiar/i.test(p.textContent||''))||pages.at(-1);
    if(!target)return;
    const card=document.createElement('section');
    card.className='appearance-card';
    card.innerHTML='<h3>Apariencia</h3><p>Elige cómo quieres ver Homebase Beta.</p><div class="appearance-options"><button type="button" data-theme-choice="light">☀️ Claro</button><button type="button" data-theme-choice="dark">🌙 Oscuro</button><button type="button" data-theme-choice="system">⚙️ Sistema</button></div>';
    card.addEventListener('click',e=>{const b=e.target.closest('[data-theme-choice]');if(!b)return;e.preventDefault();e.stopPropagation();localStorage.setItem(KEY,b.dataset.themeChoice);apply(b.dataset.themeChoice)});
    const hero=target.querySelector('.hero-row');
    if(hero&&hero.nextSibling)target.insertBefore(card,hero.nextSibling);else target.prepend(card);
    apply();
  }

  apply();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addAppearance,{once:true});else addAppearance();
  mq.addEventListener?.('change',()=>{if(getChoice()==='system')apply('system')});
  const observer=new MutationObserver(()=>{if(!document.getElementById('hb-dark-runtime-style'))document.head.appendChild(style);addAppearance();apply()});
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();