(()=>{
  'use strict';

  function closeExpiryForm(form){
    if(!form)return;
    form.classList.remove('open');
    form.reset?.();
    const custom=form.querySelector('.profile-doc-custom');
    if(custom)custom.hidden=true;
    const customInput=form.elements?.customTitle;
    if(customInput)customInput.required=false;
  }

  document.addEventListener('click',event=>{
    const cancel=event.target.closest('.profile-doc-cancel');
    if(!cancel)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    closeExpiryForm(cancel.closest('.profile-doc-form'));
  },true);

  document.addEventListener('submit',event=>{
    const form=event.target.closest('.profile-doc-form');
    if(!form)return;
    requestAnimationFrame(()=>{
      document.querySelectorAll('.profile-doc-form.open').forEach(closeExpiryForm);
    });
    setTimeout(()=>{
      document.querySelectorAll('.profile-doc-form.open').forEach(closeExpiryForm);
    },80);
  },true);
})();