(()=>{
  'use strict';
  try{
    if(typeof cloudDb!=='undefined'&&cloudDb)window.cloudDb=cloudDb;
  }catch(error){
    console.warn('Homebase production Firestore bridge',error);
  }
})();