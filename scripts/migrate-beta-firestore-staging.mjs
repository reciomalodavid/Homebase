import crypto from 'node:crypto';

const SOURCE_PROJECT='homebase-85f2b';
const SOURCE_API_KEY='AIzaSyBkupxh_fJIqX7ThvSnjIL9cxEZXYzU1WQ';
const TARGET_PROJECT='homebase-beta-72767';
const MIGRATION_ID='beta-separation-20260811';

const sourceBase=`https://firestore.googleapis.com/v1/projects/${SOURCE_PROJECT}/databases/(default)/documents`;
const targetBase=`https://firestore.googleapis.com/v1/projects/${TARGET_PROJECT}/databases/(default)/documents`;

function stable(value){
  if(Array.isArray(value))return value.map(stable);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));
  return value;
}
function digest(value){return crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex')}
async function jsonFetch(url,options={}){
  const res=await fetch(url,options);
  const text=await res.text();
  let body={};
  try{body=text?JSON.parse(text):{}}catch{throw new Error(`Non-JSON response ${res.status}`)}
  if(!res.ok)throw new Error(`${res.status} ${body?.error?.message||text}`);
  return body;
}
async function sourceAuth(){
  const body=await jsonFetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${SOURCE_API_KEY}`,{
    method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({returnSecureToken:true})
  });
  if(!body.idToken)throw new Error('Source anonymous auth did not return an ID token');
  return body.idToken;
}
async function listDocs(base,path,token){
  const docs=[];let pageToken='';
  do{
    const url=new URL(`${base}/${path}`);url.searchParams.set('pageSize','300');if(pageToken)url.searchParams.set('pageToken',pageToken);
    const body=await jsonFetch(url,{headers:{authorization:`Bearer ${token}`}});
    docs.push(...(body.documents||[]));pageToken=body.nextPageToken||'';
  }while(pageToken);
  return docs;
}
async function writeTarget(path,fields,token){
  const url=new URL(`${targetBase}/${path}`);
  const body=await jsonFetch(url,{method:'PATCH',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({fields})});
  return body;
}
async function getTarget(path,token){return jsonFetch(`${targetBase}/${path}`,{headers:{authorization:`Bearer ${token}`}})}
function docId(doc){return decodeURIComponent(doc.name.split('/').at(-1))}

const targetToken=process.env.TARGET_ACCESS_TOKEN;
if(!targetToken)throw new Error('TARGET_ACCESS_TOKEN is required');
if(process.env.GOOGLE_CLOUD_PROJECT!==TARGET_PROJECT&&process.env.GCLOUD_PROJECT!==TARGET_PROJECT)throw new Error('Target project guard failed');

const sourceToken=await sourceAuth();
const homes=(await listDocs(sourceBase,'homebaseSyncs',sourceToken)).filter(d=>docId(d).startsWith('BETA_'));
if(!homes.length)throw new Error('No BETA_ home documents found in source project');

let snapshotCount=0,chunkCount=0;
const sourceHashes=[];
for(const home of homes){
  const id=docId(home);
  const stagingHome=`homebaseMigrationStaging/${MIGRATION_ID}/homebaseSyncs/${encodeURIComponent(id)}`;
  await writeTarget(stagingHome,home.fields||{},targetToken);
  sourceHashes.push(['home',digest(home.fields||{})]);

  const snapshots=await listDocs(sourceBase,`homebaseBackups/${encodeURIComponent(id)}/snapshots`,sourceToken).catch(()=>[]);
  snapshotCount+=snapshots.length;
  for(const snap of snapshots){
    const sid=docId(snap);
    const stagingSnap=`homebaseMigrationStaging/${MIGRATION_ID}/homebaseBackups/${encodeURIComponent(id)}/snapshots/${encodeURIComponent(sid)}`;
    await writeTarget(stagingSnap,snap.fields||{},targetToken);
    sourceHashes.push(['snapshot',digest(snap.fields||{})]);
    const chunks=await listDocs(sourceBase,`homebaseBackups/${encodeURIComponent(id)}/snapshots/${encodeURIComponent(sid)}/chunks`,sourceToken).catch(()=>[]);
    chunkCount+=chunks.length;
    for(const chunk of chunks){
      const cid=docId(chunk);
      const stagingChunk=`homebaseMigrationStaging/${MIGRATION_ID}/homebaseBackups/${encodeURIComponent(id)}/snapshots/${encodeURIComponent(sid)}/chunks/${encodeURIComponent(cid)}`;
      await writeTarget(stagingChunk,chunk.fields||{},targetToken);
      sourceHashes.push(['chunk',digest(chunk.fields||{})]);
    }
  }
}

let verifiedHomes=0,verifiedSnapshots=0,verifiedChunks=0;
for(const home of homes){
  const id=docId(home);
  const staged=await getTarget(`homebaseMigrationStaging/${MIGRATION_ID}/homebaseSyncs/${encodeURIComponent(id)}`,targetToken);
  if(digest(staged.fields||{})!==digest(home.fields||{}))throw new Error('Home verification hash mismatch');
  verifiedHomes++;
  const snapshots=await listDocs(sourceBase,`homebaseBackups/${encodeURIComponent(id)}/snapshots`,sourceToken).catch(()=>[]);
  for(const snap of snapshots){
    const sid=docId(snap);
    const stagedSnap=await getTarget(`homebaseMigrationStaging/${MIGRATION_ID}/homebaseBackups/${encodeURIComponent(id)}/snapshots/${encodeURIComponent(sid)}`,targetToken);
    if(digest(stagedSnap.fields||{})!==digest(snap.fields||{}))throw new Error('Snapshot verification hash mismatch');
    verifiedSnapshots++;
    const chunks=await listDocs(sourceBase,`homebaseBackups/${encodeURIComponent(id)}/snapshots/${encodeURIComponent(sid)}/chunks`,sourceToken).catch(()=>[]);
    for(const chunk of chunks){
      const cid=docId(chunk);
      const stagedChunk=await getTarget(`homebaseMigrationStaging/${MIGRATION_ID}/homebaseBackups/${encodeURIComponent(id)}/snapshots/${encodeURIComponent(sid)}/chunks/${encodeURIComponent(cid)}`,targetToken);
      if(digest(stagedChunk.fields||{})!==digest(chunk.fields||{}))throw new Error('Chunk verification hash mismatch');
      verifiedChunks++;
    }
  }
}

console.log(`Staging copy verified: homes=${verifiedHomes}, snapshots=${verifiedSnapshots}, chunks=${verifiedChunks}`);
