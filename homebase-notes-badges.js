(()=>{
'use strict';
// Notes are owned by the network-first mobile module.
// Keep this legacy loader harmless so older cached version-display files
// cannot create a second badge or attach competing observers.
function apply(){try{window.HOMEBASE_MOBILE_NAV?.notes?.refresh?.()}catch{}}
window.HOMEBASE_NOTES_BADGES={apply};
})();
