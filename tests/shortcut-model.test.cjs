const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalize, deriveEntries, calculateFit, renamePaths, moveEntry } = require('../shortcut-model.cjs');

test('normalization repairs malformed values without discarding duplicate objects or labels', () => {
  const raw = { iconSize:999, gap:0, shelves:[{id:'s',height:1},{id:'s',height:999}], items:[{id:'x',label:'  Café  '},{id:'x'},{id:'x-2'}] };
  const value = normalize(raw);
  assert.equal(value.iconSize,240);
  assert.equal(value.gap,0);
  assert.deepEqual(value.shelves.map(s=>[s.id,s.height]),[['s',72],['s-2',480]]);
  assert.equal(value.items.length,3);
  assert.equal(new Set(value.items.map(i=>i.id)).size,3);
  assert.equal(value.items[0].label,'  Café  ');
  assert.deepEqual(normalize(value),value);
  assert.equal(raw.items[1].id,'x');
});

test('missing defaults and explicit empty shelves are distinct and stable', () => {
  assert.equal(normalize().shelves[0].id,'shelf-1');
  assert.deepEqual(normalize({shelves:[],items:[],showNotebooks:false}).shelves,[]);
  assert.equal(normalize({showNotebooks:false}).showNotebooks,false);
  assert.equal(normalize({fitMode:'manual',layout:'list',labelMode:'hidden',artStyle:'cute'}).fitMode,'manual');
});

test('all unsafe targets remain unbound objects', () => {
  const targets = [ {kind:'web',path:'javascript:alert(1)'}, {kind:'web',path:'file:///C:/x'}, {kind:'file',path:'../secret.md'}, {kind:'file',path:'C:\\secret.md'}, {kind:'folder',path:'//server/share'}, {kind:'folder',path:'/tmp'}, {kind:'file',path:'a/../b'}, {kind:'command',path:' '}, {kind:'eval',path:'run()'}, {kind:'panel',panelId:''} ];
  const result = normalize({items:targets.map((target,i)=>({id:String(i),target}))});
  assert.equal(result.items.length,targets.length);
  assert.ok(result.items.every(item=>item.target===null));
});

test('target normalization keeps supported destinations as inert data', () => {
  const targets = [{kind:'file',path:'.\\Notas\\Hola.md'},{kind:'folder',path:'Notas//Ideas'},{kind:'web',path:'https://example.com'},{kind:'web',path:'mailto:a@example.com'},{kind:'web',path:'obsidian://open?vault=x'},{kind:'command',path:'app:open-settings'},{kind:'panel',profileId:'work',panelId:'recent'},{kind:'tag',path:'#work'},{kind:'daily'}];
  const result = normalize({items:targets.map(target=>({target}))});
  assert.equal(result.items[0].target.path,'Notas/Hola.md');
  assert.equal(result.items[1].target.path,'Notas/Ideas');
  assert.ok(result.items.every(item=>item.target));
  assert.equal(result.items[6].target.profileId,'work');
  assert.equal(result.items[6].target.panelId,'recent');
});

test('image and symbol icons reject scheme injection while preserving safe artwork', () => {
  const value=normalize({items:[{icon:{kind:'image',src:'javascript:x'}},{icon:{kind:'image',src:'../x.png'}},{icon:{kind:'image',src:'assets/books/cozy.webp'}},{icon:{kind:'symbol',symbol:'<script>'}},{icon:{kind:'symbol',symbol:'book-open'}}]});
  assert.equal(value.items[0].icon.src,'');
  assert.equal(value.items[1].icon.src,'');
  assert.equal(value.items[2].icon.src,'assets/books/cozy.webp');
  assert.equal(value.items[3].icon.symbol,'');
  assert.equal(value.items[4].icon.symbol,'book-open');
});

test('entries combine notebooks and objects using persisted ordering and overrides', () => {
  const notebooks=[{folder:'A',label:'Alpha'},{folder:'B',label:'Beta'},{folder:'C',label:'Gamma'}];
  const value=deriveEntries({items:[{id:'lamp',label:'Lamp'}],order:['lamp','notebook:B'],notebookOverrides:{'notebook:B':{label:'Trabajo',scale:1.5},'notebook:C':{hidden:true}}},notebooks);
  assert.deepEqual(value.map(i=>i.id),['lamp','notebook:B','notebook:A']);
  assert.equal(value[1].label,'Trabajo');
  assert.equal(value[1].scale,1.5);
  assert.equal(value[1].notebook,true);
  assert.equal(value[1].target.path,'B');
  assert.equal(value[2].icon.kind,'book');
  assert.equal(value[2].notebookRecord,notebooks[0]);
});

test('legacy shelf arrays map only to existing shelf records when order is absent', () => {
  const raw={shelves:[{id:'top'},{id:'bottom'}]};
  const notebooks=[{folder:'A',label:'A'},{folder:'B',label:'B'}];
  assert.deepEqual(deriveEntries(raw,notebooks,[['B'],['A']]).map(e=>[e.id,e.shelfId]),[['notebook:B','top'],['notebook:A','bottom']]);
  assert.deepEqual(deriveEntries({...raw,order:['notebook:A']},notebooks,[['B'],['A']]).map(e=>e.id),['notebook:A','notebook:B']);
  assert.equal(deriveEntries({showNotebooks:false,items:[{id:'x'}]},notebooks).length,1);
});

test('fit selects the largest real geometry that fits and reserves label height', () => {
  const fit=calculateFit({width:220,height:220,count:4,iconSize:100,gap:10,labelMode:'below',layout:'grid'});
  assert.equal(fit.iconSize,81);
  assert.equal(fit.columns,2);
  assert.equal(fit.rows,2);
  assert.equal(fit.rowHeight,105);
  assert.equal(fit.requiredHeight,220);
  assert.equal(fit.fitPossible,true);
  assert.equal(fit.overflowY,false);
});

test('impossible fit retains minimum usability and reports scroll overflow', () => {
  const fit=calculateFit({width:50,height:50,count:20,iconSize:96,gap:4,labelMode:'hidden',layout:'grid'});
  assert.equal(fit.iconSize,36);
  assert.equal(fit.rows,20);
  assert.equal(fit.requiredHeight,796);
  assert.equal(fit.fitPossible,false);
  assert.equal(fit.overflowY,true);
  assert.equal(fit.overflowX,false);
  assert.equal(calculateFit({width:10,height:100,count:1}).overflowX,true);
  assert.equal(calculateFit({width:0,height:0,count:0}).requiredHeight,0);
});

test('list geometry keeps one column and scales configured shelf height honestly', () => {
  const fit=calculateFit({width:500,height:200,count:2,iconSize:100,rowHeight:200,gap:10,labelMode:'hidden',layout:'list'});
  assert.equal(fit.iconSize,47);
  assert.equal(fit.rowHeight,94);
  assert.equal(fit.columns,1);
  assert.equal(fit.requiredHeight,198);
});

test('folder renames update descendants, image assets, notebook ids and ordering only', () => {
  const raw={items:[{id:'file',target:{kind:'file',path:'A/Note.md'},icon:{kind:'image',src:'A/cover.png'}},{id:'web',target:{kind:'web',path:'https://example.com/A'}},{id:'tag',target:{kind:'tag',path:'A'}},{id:'other',target:{kind:'folder',path:'AB'}}],order:['notebook:A','file'],notebookOverrides:{'notebook:A':{label:'Kept'},'notebook:A/Sub':{hidden:true}}};
  const moved=renamePaths(raw,'A','New/A');
  assert.equal(moved.items[0].target.path,'New/A/Note.md');
  assert.equal(moved.items[0].icon.src,'New/A/cover.png');
  assert.equal(moved.items[1].target.path,'https://example.com/A');
  assert.equal(moved.items[2].target.path,'A');
  assert.equal(moved.items[3].target.path,'AB');
  assert.deepEqual(moved.order,['notebook:New/A','file']);
  assert.equal(moved.notebookOverrides['notebook:New/A'].label,'Kept');
  assert.equal(moved.notebookOverrides['notebook:New/A/Sub'].hidden,true);
  assert.equal(raw.items[0].target.path,'A/Note.md');
});

test('move reorders existing entries without mutation and records notebook shelf override', () => {
  const raw={shelves:[{id:'s1'},{id:'s2'}],items:[{id:'a'},{id:'b'}],order:['a','notebook:N','b']};
  const moved=moveEntry(raw,'notebook:N','a','s2');
  assert.deepEqual(moved.order,['notebook:N','a','b']);
  assert.equal(moved.notebookOverrides['notebook:N'].shelfId,'s2');
  assert.deepEqual(moveEntry(moved,'a',null,'s1').order,['notebook:N','b','a']);
  assert.equal(moveEntry(moved,'b','a','s2').items[1].shelfId,'s2');
  assert.deepEqual(raw.order,['a','notebook:N','b']);
});


test('shelf fitting counts each region and keeps scaled icons usable when space is insufficient', () => {
  const { calculateShelfFit } = require('../shortcut-model.cjs');
  const result=calculateShelfFit({width:400,height:180,library:{iconSize:96,gap:16,shelves:[{id:'a',look:'none'},{id:'b',look:'none'},{id:'c',look:'none'}]},entries:[{shelfId:'a',scale:2},{shelfId:'b',scale:1},{shelfId:'c',scale:1}]});
  assert.equal(result.iconSize,36);
  assert.equal(result.columns,4);
  assert.deepEqual(result.regions.map(region=>[region.id,region.rows,region.rowHeight,region.requiredHeight]),[['a',1,116,116],['b',1,116,116],['c',1,116,116]]);
  assert.equal(result.requiredHeight,380);
  assert.equal(result.fitPossible,false);
  assert.equal(result.overflowY,true);
  assert.equal(result.overflowX,false);
});

test('shelf fitting preserves variable configured heights and title and plank space', () => {
  const { calculateShelfFit } = require('../shortcut-model.cjs');
  const result=calculateShelfFit({width:400,height:1000,library:{iconSize:80,gap:10,fitMode:'manual',labelMode:'hidden',shelves:[{id:'a',height:200,label:'Top',look:'wood'},{id:'b',height:100,look:'none'}]},entries:[{shelfId:'a',scale:1},{shelfId:'b',scale:1}]});
  assert.equal(result.iconSize,80);
  assert.equal(result.columns,4);
  assert.deepEqual(result.regions.map(region=>[region.id,region.rowHeight,region.requiredHeight]),[['a',200,236],['b',100,100]]);
  assert.equal(result.requiredHeight,346);
  assert.equal(result.fitPossible,true);
});

test('empty shelves retain usable drop regions, including headers and planks', () => {
  const { calculateShelfFit } = require('../shortcut-model.cjs');
  const result=calculateShelfFit({width:400,height:500,library:{gap:16,shelves:[{id:'a',label:'Empty',look:'glass'},{id:'b',look:'none'}]},entries:[]});
  assert.equal(result.iconSize,96);
  assert.deepEqual(result.regions.map(region=>[region.id,region.rows,region.requiredHeight]),[['a',0,84],['b',0,48]]);
  assert.equal(result.requiredHeight,148);
  assert.equal(result.fitPossible,true);
});

test('list fitting uses one row per entry without reserving below-caption rows', () => {
  const { calculateShelfFit } = require('../shortcut-model.cjs');
  const result=calculateShelfFit({width:300,height:200,library:{layout:'list',iconSize:80,gap:10},entries:[{scale:1},{scale:1},{scale:1}]});
  assert.equal(result.iconSize,48);
  assert.equal(result.columns,1);
  assert.deepEqual(result.regions,[{id:'',rows:3,rowHeight:60,requiredHeight:200}]);
  assert.equal(result.requiredHeight,200);
  assert.equal(result.fitPossible,true);
});

test('manual sizing reports horizontal overflow instead of shrinking user-selected icons', () => {
  const { calculateShelfFit } = require('../shortcut-model.cjs');
  const result=calculateShelfFit({width:100,height:500,library:{layout:'grid',fitMode:'manual',iconSize:80,labelMode:'hidden',gap:8},entries:[{scale:2}]});
  assert.equal(result.iconSize,80);
  assert.equal(result.columns,1);
  assert.equal(result.regions[0].rowHeight,172);
  assert.equal(result.requiredHeight,172);
  assert.equal(result.overflowX,true);
  assert.equal(result.fitPossible,false);
});

test('shelf fitting puts orphaned assignments on first shelf without losing entries', () => {
  const { calculateShelfFit } = require('../shortcut-model.cjs');
  const result=calculateShelfFit({width:200,height:1000,library:{iconSize:80,fitMode:'manual',labelMode:'hidden',gap:8,shelves:[{id:'a',height:100,look:'none'},{id:'b',height:100,look:'none'}]},entries:[{shelfId:'missing'},{shelfId:'a'},{shelfId:'b'}]});
  assert.equal(result.columns,2);
  assert.deepEqual(result.regions.map(region=>[region.id,region.rows,region.requiredHeight]),[['a',1,100],['b',1,100]]);
  assert.equal(result.requiredHeight,208);
});

test('profile copies retarget only their own panel shortcuts without changing the source library', () => {
  const { remapProfileTargets } = require('../shortcut-model.cjs');
  const source={items:[{id:'own',target:{kind:'panel',profileId:'work',panelId:'recent'}},{id:'foreign',target:{kind:'panel',profileId:'other',panelId:'recent'}},{id:'file',target:{kind:'file',path:'Notes/A.md'}},{id:'command',target:{kind:'command',path:'test:macro',profileId:'work'}}]};
  const result=remapProfileTargets(source,'work','copy');
  assert.equal(result.items[0].target.profileId,'copy');
  assert.equal(result.items[0].target.panelId,'recent');
  assert.equal(result.items[1].target.profileId,'other');
  assert.equal(result.items[2].target.path,'Notes/A.md');
  assert.equal(result.items[3].target.profileId,'work');
  assert.equal(source.items[0].target.profileId,'work');
});

test('unnamed profile migration recognizes both legacy empty and canonical current identifiers', () => {
  const { remapProfileTargets } = require('../shortcut-model.cjs');
  const source={items:[{id:'legacy',target:{kind:'panel',profileId:'',panelId:'note'}},{id:'current',target:{kind:'panel',profileId:'__current__',panelId:'note'}},{id:'foreign',target:{kind:'panel',profileId:'saved',panelId:'note'}}]};
  const result=remapProfileTargets(source,null,'archive');
  assert.deepEqual(result.items.map(item=>item.target.profileId),['archive','archive','saved']);
  const back=remapProfileTargets(result,'archive',null);
  assert.deepEqual(back.items.map(item=>item.target.profileId),['__current__','__current__','saved']);
});

test('zero gap packs fixed-width icon cells without stretching across free space',()=>{const {calculateShelfFit}=require('../shortcut-model.cjs');const r=calculateShelfFit({width:700,height:300,library:{layout:'grid',iconSize:64,fitMode:'manual',gap:0},entries:[{},{}]});assert.equal(r.cellWidth,72);assert.equal(r.columns,9);assert.equal(normalize({gap:0}).gap,0);});
