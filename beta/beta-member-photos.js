(()=>{
  const decorate=()=>{
    if(typeof avatarHtml!=="function"||typeof esc!=="function")return;

    document.querySelectorAll('#personPicks .member-pick').forEach(label=>{
      if(label.dataset.photoReady==='1')return;

      const input=label.querySelector('input[name="eventPerson"]');
      const text=label.querySelector('span');
      if(!input||!text)return;

      const name=input.value;
      text.classList.add('member-pick-content');
      text.innerHTML=`${avatarHtml(name)}<span class="member-pick-name">${esc(name)}</span>`;
      label.dataset.photoReady='1';
    });
  };

  const style=document.createElement('style');
  style.textContent=`
    #personPicks .member-pick-content{
      display:flex;
      align-items:center;
      justify-content:center;
      gap:10px;
      min-width:0;
    }
    #personPicks .member-pick-content .avatar{
      width:38px;
      height:38px;
      flex:0 0 38px;
      cursor:inherit;
      font-size:12px;
    }
    #personPicks .member-pick-content .avatar img{
      width:100%;
      height:100%;
      object-fit:cover;
      border-radius:inherit;
    }
    #personPicks .member-pick-name{
      min-width:0;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    }
  `;
  document.head.appendChild(style);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorate,{once:true});
  else decorate();

  const observer=new MutationObserver(()=>decorate());
  observer.observe(document.body,{childList:true,subtree:true});
})();
