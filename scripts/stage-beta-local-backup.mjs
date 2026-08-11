import fs from 'node:fs';
import crypto from 'node:crypto';

const TARGET_PROJECT='homebase-beta-72767';
const MIGRATION_ID='beta-local-backup-20260811';
const CHUNK_SIZE=300000;

const file=process.argv[2];
if(!file)throw new Error('Usage: node scripts/stage-beta-local-backup.mjs <backup.json>');

const raw=fs.readFileSync(file,'utf8');
const data=JSON.parse(raw);
if(data?.format!=='homebase-beta-local-backup'||data?.version!==2||data?.environment!=='beta'){
  throw new Error('Backup format is not Homebase Beta v2');
}
const code=String(data?.localStorage?.homebase_sync_code||'').trim();
if(!code)throw new Error('Backup has no family sync code');

const project=process.env.GOOGLE_CLOUD_PROJECT||process.env.GCLOUD_PROJECT||'';
if(project!==TARGET_PROJECT)throw new Error(`Target guard failed: ${project||'(empty)'}`);
const token=process.env.TARGET_ACCESS_TOKEN;
if(!token)throw new Error('TARGET_ACCESS_TOKEN is required');

const sha256=value=>crypto.createHash('sha256').update(value).digest('hex');
const hash=sha256(raw);
const chunks=[];
for(let i=0;i<raw.length;i+=CHUNK_SIZE)chunks.push(raw.slice(i,i+CHUNK_SIZE));

const base=`https://firestore.googleapis.com/v1/projects/${TARGET_PROJECT}/databases/(default)/documents`;
function fv(value){
  if(value===null)return {nullValue:null};
  if(typeof value==='string')return {stringValue:value};
  if(typeof value==='boolean')return {booleanValue:value};
  if(typeof value==='number')return Number.isInteger(value)?{integerValue:String(value)}:{doubleValue:value};
  if(Array.isArray(value))return {arrayValue:{values:value.map(fv)}};
  if(typeof value==='object')return {mapValue:{fields:Object.fromEntries(Object.entries(value).map(([k,v])=>[k,fv(v)]))}};
  throw new Error(`Unsupported value type: ${typeof value}`);
}
async function request(url,options={}){
  const res=await fetch(url,options);
  const text=await res.text();
  let body={};try{body=text?JSON.parse(text):{}}catch{}
  if(!res.ok)throw new Error(`${res.status} ${body?.error?.message||text}`);
  return body;
}
async function patch(path,obj){
  const fields=Object.fromEntries(Object.entries(obj).map(([k,v])=>[k,fv(v)]));
  return request(`${base}/${path}`,{method:'PATCH',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({fields})});
}
async function get(path){return request(`${base}/${path}`,{headers:{authorization:`Bearer ${token}`}})}
function value(v){
  if(!v)return null;
  if('stringValue'in v)return v.stringValue;
  if('integerValue'in v)return Number(v.integerValue);
  if('doubleValue'in v)return v.doubleValue;
  if('booleanValue'in v)return v.booleanValue;
  if('nullValue'in v)return null;
  return null;
}

const root=`homebaseMigrationStaging/${MIGRATION_ID}`;
for(let i=0;i<chunks.length;i++){
  await patch(`${root}/chunks/${String(i).padStart(4,'0')}`,{index:i,data:chunks[i],sha256:sha256(chunks[i])});
}
await patch(root,{
  format:data.format,
  version:data.version,
  environment:data.environment,
  createdAt:data.createdAt||'',
  sourceOrigin:data.origin||'',
  familyCode:code,
  targetHomeId:`BETA_${code}`,
  sha256:hash,
  byteLength:Buffer.byteLength(raw),
  chunkCount:chunks.length,
  stagedAt:new Date().toISOString(),
  status:'staged-verified'
});

let rebuilt='';
for(let i=0;i<chunks.length;i++){
  const doc=await get(`${root}/chunks/${String(i).padStart(4,'0')}`);
  rebuilt+=String(value(doc.fields?.data)||'');
}
if(sha256(rebuilt)!==hash)throw new Error('Staging verification hash mismatch');
JSON.parse(rebuilt);
console.log(`Staging backup verified: family=BETA_${code}, bytes=${Buffer.byteLength(raw)}, chunks=${chunks.length}, sha256=${hash}`);
