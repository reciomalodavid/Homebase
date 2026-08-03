(()=>{
  if(typeof setPeople!=="function"||typeof avatarHtml!=="function")return;

  const originalSetPeople=setPeople;

  setPeople=function(){
    originalSetPeople();

    document.querySelectorAll('#personPicks .member-pick').forEach(label=>{
      const input=label.querySelector('input[name="eventPerson"]');
      const text=label.querySelector('span');
      if(!input||!text)return;

      const name=input.value;
      text.classList.add('member-pick-content');
      text.innerHTML=`${avatarHtml(name)}<span class="member-pick-name">${esc(name)}</span>`;
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
    #personPicks .member-pick-name{
      min-width:0;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    }
  `;
  document.head.appendChild(style);

  setPeople();
})();
