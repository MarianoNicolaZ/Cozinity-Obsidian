'use strict';
const {readTaskNotesCandidates,createPetReminderController,parseTaskDate}=require('./pet-reminders');
const coordinators=new WeakMap();
function getCoordinator(plugin){
 if(coordinators.has(plugin))return coordinators.get(plugin);
 const entries=new Set();let owner=null,controller=null,disposed=false;
 const coordinator={
  add(entry){entries.add(entry);coordinator.update();},
  remove(entry){entries.delete(entry);coordinator.update();},
  update(){
   if(disposed)return;
   const next=[...entries].find(e=>e.eligible())||null;
   const key=next?.key();
   if(next===owner&&key===coordinator.key)return;
   controller?.dispose();controller=null;owner?.active(false);owner=next;coordinator.key=key;
   if(!owner)return;
   const target=owner,settings=plugin.settings.petReminders||{};owner.active(true);
   controller=createPetReminderController({minMs:Number(settings.minMinutes??20)*60000,maxMs:Number(settings.maxMinutes??40)*60000,
    loadCandidates:async()=>{const result=await readTaskNotesCandidates(await plugin.getTaskNotesApi(),new Date());target.available=result.available;return result;},
    present:item=>target.present(item),dismiss:()=>target.dismiss(),getRecent:()=>plugin.settings.petReminders?.recent||[],
    saveRecent:recent=>{plugin.settings.petReminders={...plugin.settings.petReminders,recent};return plugin.savePluginSettings({silent:true});}
   });controller.setActive(true);
  },
  close(){controller?.close();},
  dispose(){if(disposed)return;disposed=true;controller?.dispose();owner?.active(false);owner=null;for(const e of [...entries])e.dispose();entries.clear();coordinators.delete(plugin);}
 };
 coordinators.set(plugin,coordinator);plugin.register?.(()=>coordinator.dispose());return coordinator;
}
function attachRoomPet({plugin,panel,scene,getContext,asset,t,notice,artFolder="pet-dog"}){
 const doc=panel.ownerDocument,win=doc.defaultView,coordinator=getCoordinator(plugin);
 let manifest=null,disposed=false,enabled=false,frameTimer=null,wakeResolve=null,bubble=null,sequence=0,currentState='sleep',manifestFailed=false,framesReady=false;
 const urls=new Map(),decoded=new Map(),hearts=new Map();let pointerDrag=null,suppressClickUntil=0;
 const reduced=win.matchMedia('(prefers-reduced-motion: reduce)');
 const pets=()=>[...scene.querySelectorAll('[data-furniture-type="reminder_dog"] .cozy-nest-room-sprite')];
 const firstObject=()=>getContext().objects.find(o=>o.type==='reminder_dog');
 const inViewport=()=>{const r=scene.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.right>0&&r.top<win.innerHeight&&r.left<win.innerWidth&&win.getComputedStyle(scene).visibility!=='hidden';};
 const stopAnimation=()=>{sequence++;win.clearTimeout(frameTimer);frameTimer=null;if(wakeResolve){const resolve=wakeResolve;wakeResolve=null;resolve(false);}};
 const applyFrame=frame=>{const url=urls.get(frame.file);if(!url)return;for(const sprite of pets()){sprite.style.backgroundImage=`url("${url}")`;sprite.style.backgroundSize='100% 100%';sprite.style.backgroundPosition='center';}};
 function preload(parsed){
  const files=[...new Set(Object.values(parsed.states).flat().map(f=>f.file))];
  return Promise.all(files.map(file=>{
   const url=asset(artFolder+'/'+file);urls.set(file,url);
   const image=new win.Image();image.src=url;
   const ready=typeof image.decode==='function'?image.decode():new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;});
   return Promise.resolve(ready).then(()=>decoded.set(file,image));
  }));
 }
 function animate(state){
  stopAnimation();currentState=state;if(!manifest||!framesReady)return Promise.resolve(false);
  const frames=manifest.states[state],version=sequence;
  if(!frames?.length)return Promise.resolve(false);
  if(state==='sleep'){applyFrame(frames[0]);return Promise.resolve(true);}
  const loop=state==='alert';
  return new Promise(resolve=>{
   if(!loop)wakeResolve=resolve;
   let index=0;
   const step=()=>{
    if(disposed||version!==sequence){resolve(false);return;}
    const frame=frames[index];applyFrame(frame);
    if(reduced.matches||!enabled){wakeResolve=null;resolve(true);return;}
    frameTimer=win.setTimeout(()=>{index++;if(index>=frames.length){if(loop)index=0;else{wakeResolve=null;resolve(true);return;}}step();},Math.max(40,Number(frame.ms)||150));
   };step();if(loop)resolve(true);
  });
 }
 function dismiss(){
  bubble?.remove();bubble=null;
  if(enabled&&!disposed)void animate('settle').then(ok=>{if(ok&&enabled&&!disposed)void animate('sleep');});
  else{stopAnimation();if(framesReady)applyFrame(manifest.states.sleep[0]);}
 }
 const position=()=>{
  if(!bubble)return;
  const pet=pets()[0],box=scene.getBoundingClientRect(),dog=pet?.getBoundingClientRect();if(!dog)return;
  bubble.style.maxWidth=Math.max(80,box.width-16)+'px';
  const b=bubble.getBoundingClientRect();
  bubble.style.left=Math.max(8,Math.min(box.width-b.width-8,dog.left-box.left+dog.width/2-b.width/2))+'px';
  bubble.style.top=Math.max(8,Math.min(box.height-b.height-8,dog.top-box.top-b.height-8))+'px';
 };
 async function present(item){
  const ready=await animate('wake');if(!ready||!entry.eligible()||!enabled)return false;
  // Task may have been completed while the head was rising.
  const fresh=await readTaskNotesCandidates(await plugin.getTaskNotesApi(),new Date());
  if(disposed||!enabled||!entry.eligible()||!fresh.items.some(x=>x.id===item.id))return false;
  bubble=doc.createElement('div');bubble.className='cozynity-pet-bubble';bubble.setAttribute('role','status');bubble.setAttribute('aria-live','polite');
  const message=doc.createElement('button');message.type='button';message.className='cozynity-pet-message';
  const parsed=parseTaskDate(item.date),locale=t('es-AR','en-US');
  const when=item.kind==='today'?t('hoy','today'):parsed?.date.toLocaleDateString(locale,{weekday:'long'});
  const time=item.hasTime&&parsed?parsed.date.toLocaleTimeString(locale,{hour:'numeric',minute:'2-digit'}):'';
  message.textContent=t('Acordate de: ','Remember: ')+item.title+' — '+when+(time?' · '+time:'');
  const close=doc.createElement('button');close.type='button';close.className='cozynity-pet-close';close.textContent='×';close.setAttribute('aria-label',t('Cerrar recordatorio','Close reminder'));
  close.addEventListener('click',e=>{e.stopPropagation();coordinator.close();});
  message.addEventListener('click',e=>{e.stopPropagation();const context=getContext();coordinator.close();const file=plugin.app.vault.getAbstractFileByPath(item.path);if(!file){notice(t('La tarea ya no existe.','The task no longer exists.'));return;}Promise.resolve(plugin.openDashboardOverlay({kind:'file',path:item.path,title:item.title,launchContext:'room-object',roomStyle:context.style})).catch(()=>notice(t('No se pudo abrir la tarea.','Could not open the task.')));});
  bubble.append(message,close);scene.append(bubble);position();void animate('alert');return true;
 }
 const entry={
  available:null,artFolder,
  key:()=>getContext().roomId+':'+(firstObject()?.id||'')+':'+JSON.stringify([plugin.settings.petReminders?.minMinutes,plugin.settings.petReminders?.maxMinutes]),
  eligible:()=>!disposed&&framesReady&&!doc.hidden&&panel.isConnected&&!!panel.getClientRects().length&&inViewport()&&!scene.closest('[hidden]')&&!getContext().editing&&!!firstObject(),
  active(value){enabled=value;if(value){if(framesReady)void animate('sleep');}else{stopAnimation();bubble?.remove();bubble=null;clearHearts();if(framesReady)applyFrame(manifest.states.sleep[0]);}},
  present,dismiss,
  refresh(){if(disposed)return;coordinator.update();},
  dispose(){if(disposed)return;disposed=true;stopAnimation();bubble?.remove();bubble=null;clearHearts();scene.removeEventListener('click',sleepClick);scene.removeEventListener('pointerdown',pointerDown,true);scene.removeEventListener('pointermove',pointerMove,true);scene.removeEventListener('pointerup',pointerUp,true);scene.removeEventListener('pointercancel',pointerUp,true);win.clearInterval(poll);doc.removeEventListener('visibilitychange',visibility);win.removeEventListener('resize',position);reduced.removeEventListener?.('change',motion);coordinator.remove(entry);},
  getStatus(){return manifestFailed?'art-unavailable':!framesReady?'loading':entry.available===false?'tasknotes-unavailable':'ready';}
 };
 const visibility=()=>{if(doc.hidden)clearHearts();entry.refresh();},motion=()=>{if(framesReady&&currentState!=='sleep')void animate(currentState)};
 function clearHearts(){for(const heart of hearts.values()){win.clearTimeout(heart.timer);heart.el.remove();}hearts.clear();}
 function sleepClick(event){
  win.queueMicrotask(()=>sleepClickReady(event));
 }
 function sleepClickReady(event){
  if(event.defaultPrevented||!enabled||disposed||!framesReady||currentState!=='sleep'||getContext().editing||!inViewport()||Date.now()<suppressClickUntil)return;
  const dog=event.target?.closest?.('[data-furniture-type="reminder_dog"]');if(!dog||!scene.contains(dog)||dog.classList.contains('is-dragging')||dog.hasAttribute('data-dragging'))return;
  const id=dog.getAttribute('data-object-id')||'dog';if(hearts.has(id))return;
  const box=(dog.querySelector('.cozy-nest-room-sprite')||dog).getBoundingClientRect(),sceneBox=scene.getBoundingClientRect(),heart=doc.createElement('span');
  heart.className='cozynity-pet-heart';heart.setAttribute('aria-hidden','true');heart.textContent='♥';
  heart.style.position='absolute';heart.style.left=Math.max(12,Math.min(sceneBox.width-12,box.left-sceneBox.left+box.width/2))+'px';heart.style.top=Math.max(36,Math.min(sceneBox.height-24,box.top-sceneBox.top+box.height*.28-24))+'px';scene.append(heart);
  const timer=win.setTimeout(()=>{heart.remove();hearts.delete(id);},1200);hearts.set(id,{el:heart,timer});
 }
 const pointerDown=e=>{const dog=e.target?.closest?.('[data-furniture-type="reminder_dog"]');if(dog)pointerDrag={dog,x:e.clientX,y:e.clientY,moved:false};};
 const pointerMove=e=>{if(pointerDrag&&Math.hypot(e.clientX-pointerDrag.x,e.clientY-pointerDrag.y)>6)pointerDrag.moved=true;};
 const pointerUp=()=>{if(pointerDrag?.moved)suppressClickUntil=Date.now()+350;pointerDrag=null;};
 scene.addEventListener('pointerdown',pointerDown,true);scene.addEventListener('pointermove',pointerMove,true);scene.addEventListener('pointerup',pointerUp,true);scene.addEventListener('pointercancel',pointerUp,true);scene.addEventListener('click',sleepClick);
 doc.addEventListener('visibilitychange',visibility);win.addEventListener('resize',position);reduced.addEventListener?.('change',motion);
 const poll=win.setInterval(()=>{if(!panel.isConnected){entry.dispose();return;}entry.refresh();},1000);
 coordinator.add(entry);
 plugin.app.vault.adapter.read(plugin.getPluginResourcePath('assets/room/'+artFolder+'/frames.json')).then(async raw=>{
  if(disposed)return;const parsed=JSON.parse(raw);
  for(const state of ['sleep','wake','alert','settle'])if(!Array.isArray(parsed.states?.[state])||!parsed.states[state].length||parsed.states[state].some(f=>!/^[-\w]+\.png$/.test(f.file)))throw Error('Invalid pet frames');
  manifest=parsed;await preload(parsed);if(disposed)return;framesReady=true;entry.refresh();
 }).catch(()=>{manifestFailed=true;});
 return entry;
}
module.exports={attachRoomPet};
