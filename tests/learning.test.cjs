const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const repo=path.resolve(__dirname,'..');
const context=vm.createContext({});context.window=context;
for(const file of ['data/meta.js','data/learning.js'])vm.runInContext(fs.readFileSync(path.join(repo,file),'utf8'),context);
const {LEARNING,SITE_META}=context;
test('full route contains all knowledge lectures once and respects prerequisite order',()=>{
  const ids=Array.from(LEARNING.tracks.full.ids);
  assert.equal(ids.length,17);assert.equal(new Set(ids).size,17);
  assert.deepEqual([...ids].sort(),Array.from(SITE_META.order).filter(id=>!LEARNING.midterms.includes(id)).sort());
  for(const id of ids)for(const before of LEARNING.lessons[id][2])assert.ok(ids.indexOf(before)<ids.indexOf(id),`${id} must follow ${before}`);
});
test('all track steps link to real lecture, example and assignment files',()=>{
  for(const t of Object.values(LEARNING.tracks)){
    assert.deepEqual(Array.from(t.ids),Array.from(t.phases.flatMap(p=>p.ids)));
    for(const id of t.ids)assert.ok(fs.existsSync(path.join(repo,'lectures',id+'.html')));
    for(const p of t.phases)assert.ok(fs.existsSync(path.join(repo,p.work.split(/[?#]/)[0])));
  }
  for(const l of Object.values(LEARNING.lessons))if(l[3])assert.ok(fs.existsSync(path.join(repo,'examples',l[3])));
});
test('source labels preserve 9 video, 8 reading and 3 project distinction',()=>{
  const all=Array.from(SITE_META.order);
  assert.equal(all.filter(id=>LEARNING.source(id).startsWith('视频')).length,9);
  assert.equal(all.filter(id=>LEARNING.source(id).startsWith('论文')).length,8);
  assert.equal(all.filter(id=>LEARNING.source(id).startsWith('期中')).length,3);
});
test('coverage model handles boundary cases and increasing budgets',()=>{
  assert.equal(LEARNING.coverage(0,32),0);assert.equal(LEARNING.coverage(1,1),1);
  assert.ok(Math.abs(LEARNING.coverage(.2,1)-.2)<1e-12);
  for(let k=1;k<32;k++)assert.ok(LEARNING.coverage(.2,k+1)>=LEARNING.coverage(.2,k));
});
test('relative advantages stay finite at zero variance and have expected normalization',()=>{
  for(const r of [[0,0,0,0],[.5,.5,.5,.5],[1,1,1,1]])assert.ok(LEARNING.advantages(r).every(a=>a===0));
  const a=LEARNING.advantages([0,0,1,1]);assert.deepEqual(Array.from(a),[-1,-1,1,1]);
  const b=LEARNING.advantages([0,.2,.6,1]);assert.ok(b.every(Number.isFinite));assert.ok(Math.abs(b.reduce((s,x)=>s+x,0))<1e-12);
});
test('all changed HTML inline and external scripts parse without syntax errors',()=>{
  for(const dir of ['', 'lectures'])for(const name of fs.readdirSync(path.join(repo,dir)).filter(n=>n.endsWith('.html'))){
    const file=path.join(repo,dir,name),html=fs.readFileSync(file,'utf8');
    for(const [,attrs,body]of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
      const src=attrs.match(/src="([^"]+)"/);
      if(src){if(!/^https?:/.test(src[1]))assert.ok(fs.existsSync(path.resolve(path.dirname(file),src[1])),src[1]);}
      else if(!attrs.includes('application/ld+json'))new vm.Script(body,{filename:file});
    }
  }
});
