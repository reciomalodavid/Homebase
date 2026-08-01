(()=>{
  const KEY='appearance';
  const mq=matchMedia('(prefers-color-scheme: dark)');
  const getChoice=()=>localStorage.getItem(KEY)||'system';
  const effective=choice=>choice==='system'?(mq.matches?'dark':'light'):choice;

  const css=`
html[data-hb-theme="dark"],html[data-hb-theme="dark"] body{color-scheme:dark!important;background:#08111e!important;color:#f7f9fc!important}
html[data-hb-theme="dark"] body::before{background:rgba(7,16,28,.58)!important}
html[data-hb-theme="dark"] .app,html[data-hb-theme="dark"] .page,html[data-hb-theme="dark"] main{color:#f7f9fc!important}

html[data-hb-theme="dark"] dialog,
html[data-hb-theme="dark"] dialog[open],
html[data-hb-theme="dark"] .modal,
html[data-hb-theme="dark"] .modal-body,
html[data-hb-theme="dark"] .dialog-body,
html[data-hb-theme="dark"] .sheet,
html[data-hb-theme="dark"] .sheet-body{
  background:#101c2c!important;
  background-image:linear-gradient(155deg,#17263b,#0d1928)!important;
  color:#f7f9fc!important;
  border-color:rgba(255,255,255,.12)!important;
  box-shadow:0 24px 70px rgba(0,0,0,.48)!important;
}
html[data-hb-theme="dark"] .modal-head,
html[data-hb-theme="dark"] .dialog-head,
html[data-hb-theme="dark"] .sheet-head{
  background:#18263a!important;
  background-image:none!important;
  color:#fff!important;
  border-bottom:1px solid rgba(255,255,255,.10)!important;
}
html[data-hb-theme="dark"] dialog::backdrop{background:rgba(1,6,13,.78)!important;backdrop-filter:blur(12px)!important}

html[data-hb-theme="dark"] dialog .modal > *:not(.modal-head),
html[data-hb-theme="dark"] dialog .modal-body > *,
html[data-hb-theme="dark"] .form-content,
html[data-hb-theme="dark"] .form-body,
html[data-hb-theme="dark"] .profile-list,
html[data-hb-theme="dark"] .profile-group,
html[data-hb-theme="dark"] .trash-list,
html[data-hb-theme="dark"] .import-content,
html[data-hb-theme="dark"] .roster-import,
html[data-hb-theme="dark"] .detail-grid{
  background-color:transparent!important;
  background-image:none!important;
}

html[data-hb-theme="dark"] .form-row,
html[data-hb-theme="dark"] .form-section,
html[data-hb-theme="dark"] .field-group,
html[data-hb-theme="dark"] .switch-line,
html[data-hb-theme="dark"] .profile-row,
html[data-hb-theme="dark"] .trash-item,
html[data-hb-theme="dark"] .trash-empty,
html[data-hb-theme="dark"] .empty-state,
html[data-hb-theme="dark"] .detail-row,
html[data-hb-theme="dark"] .detail-grid>div,
html[data-hb-theme="dark"] .import-info,
html[data-hb-theme="dark"] .privacy-box,
html[data-hb-theme="dark"] .import-dropzone,
html[data-hb-theme="dark"] .upload-zone,
html[data-hb-theme="dark"] .file-zone,
html[data-hb-theme="dark"] .status-box,
html[data-hb-theme="dark"] .member-pick,
html[data-hb-theme="dark"] .filter-item,
html[data-hb-theme="dark"] .week-picks label,
html[data-hb-theme="dark"] .advanced{
  background:#1a2940!important;
  background-image:none!important;
  color:#f7f9fc!important;
  border-color:rgba(255,255,255,.11)!important;
}

html[data-hb-theme="dark"] input,
html[data-hb-theme="dark"] select,
html[data-hb-theme="dark"] textarea,
html[data-hb-theme="dark"] input[type="date"],
html[data-hb-theme="dark"] input[type="time"],
html[data-hb-theme="dark"] input[type="file"]{
  background:#22334d!important;
  background-image:none!important;
  color:#f7f9fc!important;
  -webkit-text-fill-color:#f7f9fc!important;
  border:1px solid rgba(255,255,255,.14)!important;
  color-scheme:dark!important;
  opacity:1!important;
}
html[data-hb-theme="dark"] input::placeholder,
html[data-hb-theme="dark"] textarea::placeholder{color:#8291a6!important;-webkit-text-fill-color:#8291a6!important;opacity:1!important}
html[data-hb-theme="dark"] input[type="file"]::file-selector-button{background:#344762!important;color:#fff!important;border:0!important}

html[data-hb-theme="dark"] label,
html[data-hb-theme="dark"] legend,
html[data-hb-theme="dark"] .detail-value,
html[data-hb-theme="dark"] .trash-item strong,
html[data-hb-theme="dark"] .profile-row strong{color:#f7f9fc!important;-webkit-text-fill-color:#f7f9fc!important}
html[data-hb-theme="dark"] .detail-label,
html[data-hb-theme="dark"] .help,
html[data-hb-theme="dark"] .hint,
html[data-hb-theme="dark"] .description,
html[data-hb-theme="dark"] .subtitle,
html[data-hb-theme="dark"] .trash-note,
html[data-hb-theme="dark"] .import-note{color:#aeb9c8!important;-webkit-text-fill-color:#aeb9c8!important}

html[data-hb-theme="dark"] .type-switch,
html[data-hb-theme="dark"] .mode-switch,
html[data-hb-theme="dark"] .segmented,
html[data-hb-theme="dark"] .tabs{background:#15243a!important;border-color:rgba(255,255,255,.10)!important}
html[data-hb-theme="dark"] .type-switch button,
html[data-hb-theme="dark"] .mode-switch button,
html[data-hb-theme="dark"] .segmented button,
html[data-hb-theme="dark"] .tabs button{color:#aeb9c8!important;-webkit-text-fill-color:#aeb9c8!important}
html[data-hb-theme="dark"] .type-switch button.active,
html[data-hb-theme="dark"] .mode-switch button.active,
html[data-hb-theme="dark"] .segmented button.active,
html[data-hb-theme="dark"] .tabs button.active{background:#354a69!important;color:#fff!important;-webkit-text-fill-color:#fff!important}

html[data-hb-theme="dark"] .close,
html[data-hb-theme="dark"] .row-action,
html[data-hb-theme="dark"] .small-btn,
html[data-hb-theme="dark"] button.secondary{background:#34445d!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-color:rgba(255,255,255,.14)!important}
html[data-hb-theme="dark"] .save,
html[data-hb-theme="dark"] .primary,
html[data-hb-theme="dark"] .event-fab{background:linear-gradient(180deg,#ef8a2d,#d66f13)!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
html[data-hb-theme="dark"] .edit-btn{background:rgba(217,120,31,.20)!important;color:#ffd2aa!important;-webkit-text-fill-color:#ffd2aa!important}
html[data-hb-theme="dark"] .delete-btn,
html[data-hb-theme="dark"] .permanent{background:rgba(216,74,85,.20)!important;color:#ffadb4!important;-webkit-text-fill-color:#ffadb4!important}

html[data-hb-theme="dark"] .pill,
html[data-hb-theme="dark"] .roster-badge,
html[data-hb-theme="dark"] [class*="roster"][class*="badge"]{
  background:#29496d!important;
  color:#dceeff!important;
  -webkit-text-fill-color:#dceeff!important;
  border:1px solid rgba(151,200,255,.28)!important;
}

html[data-hb-theme="dark"] .appearance-card{background:linear-gradient(145deg,#1c2c43,#111f32)!important;border:1px solid rgba(255,255,255,.10)!important;color:#fff!important;margin-top:16px;padding:16px;border-radius:20px}
.appearance-card h3{margin:0 0 4px;font-size:17px}.appearance-card p{margin:0 0 12px;color:var(--muted);font-size:12px}.appearance-options{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.appearance-options button{border:1px solid var(--line);border-radius:12px;padding:10px 6px;background:var(--surface-2);color:var(--text);font-weight:800}.appearance-options button.active{background:var(--accent);border-color:var(--accent);color:#fff}
html[data-hb-theme="dark"] .appearance-options button{background:#263850!important;color:#c8d2df!important;border-color:rgba(255,255,255,.10)!important}.appearance-options button.active{background:#d9781f!important;color:#fff!important}
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
    const pages=[...document.querySelectorAll('.page')];
    const target=pages.find(p=>/Sincronización familiar/i.test(p.textContent||''))||pages.at(-1);
    if(!target)return;
    const card=document.createElement('section');
    card.className='appearance-card';
    card.innerHTML='<h3>Apariencia</h3><p>Elige cómo quieres ver Homebase Beta.</p><div class="appearance-options"><button data-theme-choice="light">☀️ Claro</button><button data-theme-choice="dark">🌙 Oscuro</button><button data-theme-choice="system">⚙️ Sistema</button></div>';
    card.addEventListener('click',e=>{const b=e.target.closest('[data-theme-choice]');if(!b)return;localStorage.setItem(KEY,b.dataset.themeChoice);apply(b.dataset.themeChoice)});
    const sync=[...target.children].find(el=>/Sincronización familiar/i.test(el.textContent||''));
    if(sync)target.insertBefore(card,sync);else target.appendChild(card);
    apply();
  }

  apply();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addAppearance,{once:true});else addAppearance();
  mq.addEventListener?.('change',()=>{if(getChoice()==='system')apply('system')});
  const observer=new MutationObserver(()=>{if(!document.getElementById('hb-dark-runtime-style'))document.head.appendChild(style);addAppearance();apply()});
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
