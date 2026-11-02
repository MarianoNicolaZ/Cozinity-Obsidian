'use strict';
// This renderer is bundled into main.js; Obsidian APIs arrive through a bridge.
module.exports = function createShortcutLibrary(bridge) {
  const {Model,Modal,Notice,setIcon}=bridge;
  const MIME='application/x-cozynity-shortcut';
  const symbols=['book-open','folder','file-text','zap','link','play','calendar','code','music','image','star','gamepad-2','coffee','heart','terminal','layout-dashboard'];
  const assetIds=['notebook','folder','app','play','console','plant','star','bolt'];
  const t=(ctx,es,en)=>ctx.p.getLanguage()==='en'?en:es;
  const node=(parent,tag,cls,text,attrs={})=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;for(const [k,v]of Object.entries(attrs))e.setAttribute(k,String(v));parent.append(e);return e;};
  const button=(parent,text,action,cls='')=>{const b=node(parent,'button','cozy-shortcut-button '+cls,text,{type:'button'});b.addEventListener('click',action);return b;};
  const field=(parent,label,tag='input',attrs={})=>{const l=node(parent,'label','cozy-shortcut-field');node(l,'span','',label);return node(l,tag,'',undefined,{'aria-label':label,...attrs});};
  const select=(parent,label,choices,value)=>{const e=field(parent,label,'select');for(const [id,name]of choices)node(e,'option','',name,{value:id});e.value=value;return e;};
  const resource=(p,path)=>p.app.vault.adapter.getResourcePath(p.getPluginResourcePath(path));
  function state(ctx){return Model.normalize(ctx.preview?.active?ctx.preview.draft:ctx.p.settings.shortcutLibrary);}
  function valid(ctx){return (!ctx.preview||ctx.preview.active)&&!ctx.p._disposed&&(ctx.p._shortcutProfileEpoch||0)===(ctx.profileEpoch||0)&&ctx.p.settings.activeDashboardProfileId===ctx.profileId&&ctx.p.settings.panelLayout.some(p=>p.id===ctx.panelItem.id&&p.type==='notebooks');}
  function entries(ctx,library=state(ctx)){return Model.deriveEntries(library,ctx.p.getNotebookGroups?.()||ctx.notebooks||[],ctx.p.settings.notebookShelves);}
  async function save(ctx,change,refresh=true){
    if(!valid(ctx))return false;
    const previous=state(ctx),next=Model.normalize(change(Model.normalize(previous))||previous);
    if(ctx.preview){ctx.preview.draft=next;ctx.preview.update();return true;}
    const revision=(ctx.p._shortcutRevision||0)+1;
    ctx.p._shortcutRevision=revision;ctx.p.settings.shortcutLibrary=next;
    try{const pending=(ctx.p._shortcutSaveQueue||Promise.resolve()).catch(()=>{}).then(()=>valid(ctx)?ctx.p.savePluginSettings({silent:true}):Promise.reject(Error("Space changed")));ctx.p._shortcutSaveQueue=pending;await pending;if(refresh&&valid(ctx))ctx.view.refreshPanelInstance(ctx.panelItem.id,{contentChanged:true});return true;}
    catch(error){if(valid(ctx)&&ctx.p._shortcutRevision===revision)ctx.p.settings.shortcutLibrary=previous;new Notice(t(ctx,'No pude guardar los accesos. Intenta de nuevo.','Could not save shortcuts. Try again.'));console.error('[Cozynity] Shortcut save:',error);return false;}
  }
  function styleFor(ctx,chosen){if(chosen&&chosen!=='auto')return chosen;const theme=ctx.p.settings.themePackId;if(/notion|minimal|obsidian-native/.test(theme))return'minimal';if(/kawaii|toybox|clay/.test(theme))return'cute';if(/botanical|cafe|stardew|harvest/.test(theme))return'natural';if(/blueprint|neo/.test(theme))return'geek';return'modern';}
  function roomStyle(ctx,chosen){if(['classic','studio','neon','clay'].includes(chosen))return chosen;const theme=ctx.p.settings.themePackId;return /clay|toybox/.test(theme)?'clay':/blueprint|neo/.test(theme)?'neon':/studio/.test(theme)?'studio':'classic';}
  function drawIcon(ctx,parent,icon,entry,index=0){
    parent.replaceChildren();const lib=state(ctx),kind=icon?.kind||'book';
    if(kind==='room'){
      const roomType=icon.type||'plant',art=bridge.getRoomArt(roomType,0),urls=bridge.getRoomAtlasUrls(roomStyle(ctx,icon.style),name=>resource(ctx.p,'assets/room/'+name));
      const [x,y,w,h]=art.crop;const e=node(parent,'span','cozy-shortcut-room-art',undefined,{'aria-hidden':'true'});
      Object.assign(e.style,{backgroundImage:'url('+JSON.stringify(urls[art.atlas])+')',backgroundSize:art.width/w*100+'% '+art.height/h*100+'%',backgroundPosition:(art.width===w?0:x/(art.width-w)*100)+'% '+(art.height===h?0:y/(art.height-h)*100)+'%',width:'calc(var(--cozy-shortcut-icon-size) * '+Math.min(1,w/h)+')',height:'calc(var(--cozy-shortcut-icon-size) * '+Math.min(1,h/w)+')'});return;
    }
    if(kind==='generated'){
      const catalog=bridge.getArtCatalog(),style=styleFor(ctx,icon.style&&icon.style!=='auto'?icon.style:lib.artStyle),pack=catalog.styles?.find(s=>s.id===style),index=Math.max(0,assetIds.indexOf(icon.type));
      if(pack){const item=catalog.items?.find(i=>i.id===icon.type)||{column:index%4,row:Math.floor(index/4)};const e=node(parent,'span','cozy-shortcut-generated-art',undefined,{'aria-hidden':'true'});const ratio=(pack.width/(pack.columns||4))/(pack.height/(pack.rows||2));Object.assign(e.style,{backgroundImage:'url('+JSON.stringify(resource(ctx.p,pack.path))+')',backgroundSize:(pack.columns||4)*100+'% '+(pack.rows||2)*100+'%',backgroundPosition:(item.column/((pack.columns||4)-1)*100)+'% '+(item.row/((pack.rows||2)-1)*100)+'%',width:'calc(var(--cozy-shortcut-icon-size) * '+Math.min(1,ratio)+')',height:'calc(var(--cozy-shortcut-icon-size) * '+Math.min(1,1/ratio)+')'});return;}
    }
    if(kind==='image'&&icon.src){const f=ctx.p.app.vault.getAbstractFileByPath(icon.src);const src=icon.src.startsWith('assets/')?resource(ctx.p,icon.src):f?ctx.p.app.vault.getResourcePath(f):'';if(src){node(parent,'img','cozy-shortcut-custom-image',undefined,{src,alt:'',loading:'lazy'});return;}}
    if(kind==='book'){
      const path=entry?.target?.kind==='folder'?entry.target.path:'',fixed=bridge.getNotebookCatalog().find(book=>book.id===icon.type);
      const url=fixed?resource(ctx.p,fixed.path):ctx.p.settings.themePackId==='stardew-valley-cozy'?ctx.p.getStardewNotebookSpriteUrl(path,index):path&&ctx.p.usesColorableNotebookArt?.()?ctx.p.getNotebookArtUrl(path,index):'';
      if(url){node(parent,'img','cozy-shortcut-book-image',undefined,{src:url,alt:'',loading:'lazy'});return;}
      const book=node(parent,'span','cozy-shortcut-book',undefined,{'aria-hidden':'true'});if(path)for(const [k,v]of Object.entries(ctx.p.getNotebookPalette?.(path,index)||{}))book.style.setProperty(k,v);node(book,'span','cozy-shortcut-book-spine');node(book,'span','cozy-shortcut-book-mark');return;
    }
    const e=node(parent,'span','cozy-shortcut-symbol',undefined,{'aria-hidden':'true'});setIcon(e,icon.symbol||'link');if(!e.childNodes.length)e.textContent='↗';
  }
  async function activate(ctx,entry){
    const target=entry.target;if(!target){new Notice(t(ctx,'Este objeto todavía no tiene un destino. Usa Editar.','This object has no destination yet. Use Edit.'));return;}
    if(!valid(ctx))return;
    try{
      if(target.kind==='command'){
        const command=ctx.p.app.commands?.commands?.[target.path];if(!command){new Notice(t(ctx,'Ese comando no está disponible. Comprueba su plugin.','That command is unavailable. Check its plugin.'));return;}
        const result=ctx.p.app.commands.executeCommandById(target.path);if(result===false)new Notice(t(ctx,'El comando no se puede ejecutar en este contexto.','This command cannot run in this context.'));return;
      }
      if(target.kind==='web'){if(/^https?:/i.test(target.path))await ctx.p.openDashboardLink(target.path);else bridge.openExternal(target.path);return;}
      if(target.kind==='daily'){await ctx.p.openOrCreateJournal(new Date());return;}
      if(target.kind==='panel'){if((target.profileId||'__current__')!==(ctx.p.settings.activeDashboardProfileId||'__current__')||target.panelId===ctx.panelItem.id||!(ctx.p.getDashboardPanelLinkTargets?.()||[]).some(p=>p.id===target.panelId&&p.profileId===(target.profileId||'__current__')))throw Error('Missing panel');await ctx.p.openDashboardOverlay({kind:'panel',profileId:target.profileId||'__current__',panelId:target.panelId});return;}
      if(target.kind==='tag'){await ctx.p.openDashboardOverlay({kind:'tag',tag:target.path,path:target.path,title:entry.label});return;}
      const f=ctx.p.app.vault.getAbstractFileByPath(target.path);if(!f)throw Error('Missing file');
      if(target.kind==='folder'){ctx.p.openNotebookBrowser(entry.notebookRecord||{folder:f.path,label:entry.label||f.name});return;}
      await ctx.p.openFile(f);
    }catch(error){new Notice(t(ctx,'El destino no está disponible. Puedes cambiarlo desde Editar.','This destination is unavailable. Change it using Edit.'));console.warn('[Cozynity] Shortcut destination:',error);}
  }
  function applyModal(modal,ctx){bridge.applyModal(modal,ctx.p);modal.modalEl.classList.add('cozy-shortcut-modal');modal.contentEl.replaceChildren();}
  function iconChoices(ctx,parent,draft,onUpdate){
    const collectionFor=icon=>icon.kind==='book'?(bridge.getNotebookCatalog().find(b=>b.id===icon.type)?.collection||'notebooks'):icon.kind==='generated'?(icon.style&&icon.style!=='auto'?icon.style:styleFor(ctx,state(ctx).artStyle)):icon.kind==='room'?'room-'+roomStyle(ctx,icon.style):icon.kind==='image'?'image':'symbols';
    const choices=[['all',t(ctx,'Todas las colecciones','All collections')],['notebooks',t(ctx,'Cuadernos originales','Original notebooks')],['stardew','Stardew'],['modern',t(ctx,'Moderna','Modern')],['cute','Cute'],['minimal','Minimal'],['natural','Natural'],['geek','Geek'],['room-classic',t(ctx,'Objetos · Cozy','Objects · Cozy')],['room-studio',t(ctx,'Objetos · Studio','Objects · Studio')],['room-neon',t(ctx,'Objetos · Geek','Objects · Geek')],['room-clay',t(ctx,'Objetos · Clay','Objects · Clay')],['symbols',t(ctx,'Símbolos','Symbols')],['image',t(ctx,'Imagen del vault','Vault image')]];
    const collection=select(parent,t(ctx,'Colección','Collection'),choices,collectionFor(draft.icon));
    const search=field(parent,t(ctx,'Buscar diseño','Find design'),'input',{type:'search'}),body=node(parent,'div','cozy-shortcut-icon-options');
    node(parent,'p','cozy-shortcut-hint',t(ctx,'Explora las colecciones y toca un diseño para elegirlo. Cambiar de colección conserva tu elección.','Browse collections and click a design to select it. Changing collections keeps your selection.'));
    const options=[];
    options.push({collection:'notebooks',label:t(ctx,'Cuaderno según el tema','Notebook matching theme'),icon:{kind:'book',type:'notebook',style:'auto'}});
    for(const book of bridge.getNotebookCatalog())options.push({collection:book.collection,label:book.label,icon:{kind:'book',type:book.id,style:'fixed'}});
    const labels={notebook:t(ctx,'Cuaderno','Notebook'),folder:t(ctx,'Carpeta','Folder'),app:t(ctx,'Aplicación','App'),play:t(ctx,'Reproducir','Play'),console:t(ctx,'Consola','Console'),plant:t(ctx,'Planta','Plant'),star:t(ctx,'Estrella','Star'),bolt:t(ctx,'Acción','Action')};
    for(const style of ['modern','cute','minimal','natural','geek'])for(const id of assetIds)options.push({collection:style,label:labels[id]+' · '+style,icon:{kind:'generated',style,type:id}});
    for(const style of ['classic','studio','neon','clay'])for(const room of bridge.getRoomCatalog())options.push({collection:'room-'+style,label:t(ctx,room.es,room.en),icon:{kind:'room',style,type:room.type}});
    for(const id of symbols)options.push({collection:'symbols',label:id,icon:{kind:'symbol',symbol:id}});
    const equal=(a,b)=>a.kind===b.kind&&(a.type||'')===(b.type||'')&&(a.style||'')===(b.style||'')&&(a.symbol||'')===(b.symbol||'');
    const paint=()=>{
      body.replaceChildren();const group=collection.value,q=search.value.trim().toLocaleLowerCase();
      if(group==='image'){
        const path=field(body,t(ctx,'Ruta de la imagen en el vault','Image path in vault'),'input',{type:'text'});path.value=draft.icon.kind==='image'?draft.icon.src||'':'';
        path.addEventListener('input',()=>{if(path.value.trim()){draft.icon={kind:'image',src:path.value.trim()};onUpdate();}});
        button(body,t(ctx,'Elegir imagen','Choose image'),()=>bridge.chooseImage(ctx.p,f=>{draft.icon={kind:'image',src:f.path};path.value=f.path;onUpdate();}));return;
      }
      const grid=node(body,'div','cozy-shortcut-object-grid',undefined,{'aria-label':t(ctx,'Diseños disponibles','Available designs')});
      const matches=options.filter(item=>(group==='all'||item.collection===group)&&(!q||(item.label+' '+item.collection).toLocaleLowerCase().includes(q)));
      for(const item of matches){const chosen=equal(draft.icon,item.icon),b=button(grid,'',()=>{draft.icon={...item.icon};paint();onUpdate();},chosen?'is-selected':'');b.setAttribute('aria-label',item.label);b.setAttribute('aria-pressed',String(chosen));b.title=item.label+' · '+(choices.find(c=>c[0]===item.collection)?.[1]||item.collection);const art=node(b,'span','cozy-shortcut-choice-art');drawIcon(ctx,art,item.icon,draft);node(b,'span','',item.label);}
      if(!matches.length)node(body,'p','cozy-shortcut-hint',t(ctx,'No hay diseños para esa búsqueda.','No designs match your search.'));
    };
    collection.addEventListener('change',()=>{search.value='';paint();});search.addEventListener('input',paint);paint();
  }
  function openRoomPicker(ctx,onChoose){
    class Picker extends Modal{
      constructor(){super(ctx.p.app);}
      onOpen(){applyModal(this,ctx);node(this.contentEl,'h2','',t(ctx,'Objetos de tus ambientes','Objects from your rooms'));const search=field(this.contentEl,t(ctx,'Buscar objeto','Find object'),'input',{type:'search'}),grid=node(this.contentEl,'div','cozy-shortcut-object-grid');
        const records=[];for(const panel of ctx.p.settings.panelLayout.filter(p=>p.type==='cozy_room')){const house=panel.room;for(const room of house?.version===2?house.rooms:[house])for(const object of room?.objects||[])records.push({object,room});}
        const paint=()=>{grid.replaceChildren();for(const {object,room}of records){const descriptor=bridge.getRoomCatalog().find(k=>k.type===object.type);const label=object.label||(descriptor?t(ctx,descriptor.es,descriptor.en):object.type);if(!(label+' '+(room.label||'')).toLocaleLowerCase().includes(search.value.toLocaleLowerCase()))continue;const item=button(grid,'',()=>{if(!valid(ctx))return;onChoose({label,icon:{kind:'room',type:object.type,style:bridge.roomStyle?.(room.backdrop)||'auto'},target:object.binding?{...object.binding}:null,scale:1});this.close();});item.setAttribute('aria-label',label);const art=node(item,'span','cozy-shortcut-choice-art');drawIcon(ctx,art,{kind:'room',type:object.type},{});node(item,'span','',label);}}
        search.addEventListener('input',paint);paint();if(!records.length)node(this.contentEl,'p','cozy-shortcut-hint',t(ctx,'No hay objetos en este espacio. También puedes elegir cualquiera del catálogo al crear un acceso.','No room objects in this space. You can also choose any catalog object when creating a shortcut.'));button(this.contentEl,t(ctx,'Cerrar','Close'),()=>this.close());
      }
      onClose(){this.contentEl.replaceChildren();}
    }new Picker().open();
  }
  function openEditor(ctx,entry=null,seed=null){
    const persisted=e=>({id:e.id,label:e.label,icon:e.icon,target:e.target,shelfId:e.shelfId,scale:e.scale});
    const originalEntry=entry?JSON.stringify(persisted(entry)):null;const lib=state(ctx),draft=entry?JSON.parse(JSON.stringify(persisted(entry))): {id:'shortcut-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),label:'',icon:{kind:'generated',type:'app',style:'auto'},target:{kind:'file',path:''},shelfId:lib.shelves[0]?.id||'',scale:1,...seed};
    class Editor extends Modal{
      constructor(){super(ctx.p.app);}
      onOpen(){
        applyModal(this,ctx);const body=this.contentEl;node(body,'h2','',t(ctx,entry?'Editar acceso':'Agregar acceso',entry?'Edit shortcut':'Add shortcut'));
        if(!entry)button(body,t(ctx,'Usar objeto de un ambiente','Use object from a room'),()=>openRoomPicker(ctx,seed=>{this.close();openEditor(ctx,null,seed);}));
        const preview=node(body,'div','cozy-shortcut-editor-preview');const icon=node(preview,'span','cozy-shortcut-icon');const caption=node(preview,'strong');const label=field(body,t(ctx,'Nombre','Name'),'input',{type:'text',maxlength:'160'});label.value=draft.label||'';
        const update=()=>{caption.textContent=label.value||t(ctx,'Tu acceso','Your shortcut');drawIcon(ctx,icon,draft.icon,draft);};label.addEventListener('input',update);
        const destination=select(body,t(ctx,'Al tocar','On click'),[['none',t(ctx,'Sin acción','No action')],['file',t(ctx,'Nota o archivo','Note or file')],['folder',t(ctx,'Cuaderno o carpeta','Notebook or folder')],['web',t(ctx,'Link externo u Obsidian','External or Obsidian link')],['command',t(ctx,'Comando o macro','Command or macro')],['panel',t(ctx,'Ventana del dashboard','Dashboard window')],['tag',t(ctx,'Etiqueta','Tag')],['daily',t(ctx,'Diario de hoy','Today’s journal')]],draft.target?.kind||'none');
        if(entry?.notebook){destination.disabled=true;node(body,'p','cozy-shortcut-hint',t(ctx,'Este cuaderno conserva su carpeta. Puedes crear otro acceso con cualquier destino.','This notebook keeps its folder. You can create another shortcut with any destination.'));}
        const targetBody=node(body,'div','cozy-shortcut-target-options');let targetInput=null;
        const drawTarget=()=>{targetBody.replaceChildren();const kind=destination.value;draft.target=kind==='none'?null:{kind,path:draft.target?.path||'',profileId:draft.target?.profileId||ctx.profileId,panelId:draft.target?.panelId||''};targetInput=null;
          if(kind==='command'){
            const commands=Object.values(ctx.p.app.commands?.commands||{}).sort((a,b)=>(a.name||a.id).localeCompare(b.name||b.id));targetInput=select(targetBody,t(ctx,'Comando disponible','Available command'),[['',t(ctx,'Elegir comando…','Choose command…')],...commands.map(c=>[c.id,c.name||c.id])],draft.target.path);
            if(draft.target.path&&!commands.some(c=>c.id===draft.target.path)){node(targetInput,'option','',draft.target.path,{value:draft.target.path});targetInput.value=draft.target.path;}
          }else if(kind==='panel'){
            targetInput=select(targetBody,t(ctx,'Ventana','Window'),[['',t(ctx,'Elegir ventana…','Choose window…')],...(ctx.p.getDashboardPanelLinkTargets?.()||[]).filter(p=>p.id!==ctx.panelItem.id).map(p=>[p.id,p.title||p.type])],draft.target.panelId);
          }else if(['file','folder','web','tag'].includes(kind)){
            targetInput=field(targetBody,t(ctx,kind==='web'?'Enlace':kind==='tag'?'Etiqueta':'Ruta',kind==='web'?'Link':kind==='tag'?'Tag':'Path'),'input',{type:kind==='web'?'url':'text'});targetInput.value=draft.target.path;
            if(kind==='file'||kind==='folder'){const list=node(targetBody,'datalist','',undefined,{id:'shortcut-target-'+draft.id});targetInput.setAttribute('list',list.id);const files=kind==='file'?ctx.p.app.vault.getFiles():ctx.p.app.vault.getAllLoadedFiles().filter(f=>bridge.isFolder(f));for(const f of files)node(list,'option','',undefined,{value:f.path});}
          }
        };destination.addEventListener('change',()=>{draft.target=null;drawTarget();});drawTarget();
        iconChoices(ctx,body,draft,update);
        const shelf=select(body,t(ctx,'Estante','Shelf'),[['',t(ctx,'Primer estante','First shelf')],...lib.shelves.map((s,i)=>[s.id,s.label||t(ctx,'Estante ','Shelf ')+(i+1)])],draft.shelfId||'');
        const scale=field(body,t(ctx,'Tamaño de este objeto','This object’s size'),'input',{type:'range',min:'.5',max:'2',step:'.1'});scale.value=String(draft.scale||1);scale.addEventListener('input',()=>{preview.style.setProperty('--cozy-shortcut-icon-size',Math.round(96*Number(scale.value))+'px');});
        const error=node(body,'p','cozy-shortcut-error','',{role:'status','aria-live':'polite'}),actions=node(body,'div','cozy-shortcut-modal-actions');button(actions,t(ctx,'Cancelar','Cancel'),()=>this.close());
        const submit=button(actions,t(ctx,'Guardar acceso','Save shortcut'),async()=>{
          if(!valid(ctx)){error.textContent=t(ctx,'Este espacio ya cambió. Cierra esta ventana.','This space has changed. Close this dialog.');return;}
          draft.label=label.value.trim();draft.shelfId=shelf.value;draft.scale=Number(scale.value);
          if(draft.target){if(draft.target.kind==='panel'){draft.target.panelId=targetInput?.value||'';draft.target.profileId=ctx.profileId||'__current__';}else if(targetInput)draft.target.path=targetInput.value.trim();}
          const checked=Model.normalize({items:[draft]}).items[0];if(draft.target&&!checked.target){error.textContent=t(ctx,'Elige un destino válido.','Choose a valid destination.');return;}
          if(draft.icon.kind==='image'&&!checked.icon.src){error.textContent=t(ctx,'Elige una imagen válida del vault.','Choose a valid image from your vault.');return;}
          if(entry){const current=entries(ctx).find(e=>e.id===entry.id);if(!current||JSON.stringify(persisted(current))!==originalEntry){error.textContent=t(ctx,"Este acceso cambió o fue eliminado. Cierra y vuelve a abrir el editor.","This shortcut changed or was removed. Close and reopen the editor.");return;}}
          submit.disabled=true;const ok=await save(ctx,state=>{if(entry?.notebook)state.notebookOverrides[entry.id]={...state.notebookOverrides[entry.id],label:draft.label,icon:draft.icon,shelfId:draft.shelfId,scale:draft.scale};else{const i=state.items.findIndex(x=>x.id===draft.id);if(i<0)state.items.push(draft);else state.items[i]=draft;}return state;});if(ok)this.close();else submit.disabled=false;
        },'is-primary');update();
      }
      onClose(){this.contentEl.replaceChildren();}
    }
    const modal=new Editor();modal.open();return modal;
  }
  function openSettings(ctx){
    if(ctx.view._shortcutPreview?.active&&ctx.view._shortcutPreview.profileId===ctx.profileId&&ctx.view._shortcutPreview.profileEpoch===ctx.profileEpoch){ctx.view._shortcutPreview.modal?.modalEl.focus();return ctx.view._shortcutPreview.modal;}
    ctx.view._shortcutPreview?.modal?.close();
    const original=state(ctx),preview={active:true,profileId:ctx.profileId,profileEpoch:ctx.profileEpoch,draft:Model.normalize(original)};
    const editCtx={...ctx,preview};
    class Settings extends Modal{
      constructor(){super(ctx.p.app);preview.modal=this;}
      onOpen(){
        applyModal(this,ctx);this.modalEl.classList.add('cozy-shortcut-settings');
        const body=this.contentEl;node(body,'h2','',t(ctx,'Editar estantes','Edit shelves'));
        const workspace=node(body,'div','cozy-shortcut-settings-workspace'),canvas=node(workspace,'div','cozy-shortcut-settings-canvas'),tools=node(workspace,'div','cozy-shortcut-settings-tools');
        const toolbar=node(canvas,'div','cozy-shortcut-toolbar');button(toolbar,t(ctx,'Agregar acceso','Add shortcut'),()=>openEditor(editCtx));
        node(canvas,'p','cozy-shortcut-hint',t(ctx,'Toca un objeto para editarlo. Arrastra para ordenar o cambiar de estante. Los cambios se ven al instante.','Click an object to edit it. Drag to reorder or move between shelves. Changes appear instantly.'));
        const surface=node(canvas,'div','cozy-nest-dashboard-root cozy-shortcut-live-preview',undefined,{'data-theme-pack':ctx.p.settings.themePackId});ctx.p.applyThemePackTokens(surface);
        const actual=ctx.view.contentEl.querySelector('.cozy-shortcut-library');surface.style.height=Math.max(240,Math.min(540,actual?.clientHeight||360))+'px';
        const previewView=Object.create(ctx.view);previewView._shortcutEditing=true;previewView._shortcutSearchOpen=false;previewView._shortcutSearch='';previewView._shortcutCleanups=new Map();previewView._shortcutPreview=preview;
        const repaint=()=>{if(!preview.active||!valid(ctx))return;surface.replaceChildren();const panel=render(previewView,surface,ctx.notebooks,ctx.panelItem);ctx.view.applyPanelTitlePresentation?.(panel,ctx.panelItem);};
        previewView.refreshPanelInstance=repaint;this.previewView=previewView;
        preview.update=()=>{repaint();if(valid(ctx))ctx.view.refreshPanelInstance(ctx.panelItem.id,{contentChanged:true});};ctx.view._shortcutPreview=preview;
        const choice=(label,choices,key)=>{const input=select(tools,label,choices,preview.draft[key]);input.addEventListener('change',()=>{preview.draft[key]=input.value;preview.update();});return input;};
        choice(t(ctx,'Distribución','Layout'),[['shelves',t(ctx,'Estantes','Shelves')],['grid',t(ctx,'Cuadrícula','Grid')],['list',t(ctx,'Lista','List')]],'layout');
        choice(t(ctx,'Nombres','Labels'),[['below',t(ctx,'Debajo del icono','Below icon')],['hover',t(ctx,'Al pasar el mouse o enfocar','On hover or focus')],['hidden',t(ctx,'Ocultos','Hidden')]],'labelMode');
        choice(t(ctx,'Ajuste de tamaño','Sizing'),[['fit',t(ctx,'Ajustar al espacio disponible','Fit available space')],['manual',t(ctx,'Tamaño manual','Manual size')]],'fitMode');
        const range=(label,key,min,max,step)=>{const input=field(tools,label,'input',{type:'range',min,max,step});input.value=String(preview.draft[key]);const out=node(tools,'output','cozy-shortcut-hint',input.value+' px');input.addEventListener('input',()=>{preview.draft[key]=Number(input.value);out.textContent=input.value+' px';preview.update();});};
        range(t(ctx,'Tamaño de los iconos (px)','Icon size (px)'),'iconSize',36,240,4);range(t(ctx,'Separación (px)','Spacing (px)'),'gap',0,48,2);
        choice(t(ctx,'Diseños predeterminados','Default designs'),[['auto',t(ctx,'Según el tema','Match theme')],['modern',t(ctx,'Moderno','Modern')],['cute','Cute'],['minimal','Minimal'],['natural','Natural'],['geek','Geek']],'artStyle');
        const notebooks=field(tools,t(ctx,'Mostrar cuadernos del vault','Show vault notebooks'),'input',{type:'checkbox'});notebooks.checked=preview.draft.showNotebooks;notebooks.addEventListener('change',()=>{preview.draft.showNotebooks=notebooks.checked;preview.update();});
        const shelfRows=node(tools,'div','cozy-shortcut-shelf-settings');
        const paintShelves=()=>{shelfRows.replaceChildren();preview.draft.shelves.forEach((s,i)=>{const row=node(shelfRows,'section','cozy-shortcut-shelf-editor'),set=(key,value)=>{const shelf=preview.draft.shelves.find(item=>item.id===s.id);if(shelf){shelf[key]=value;preview.update();}};
          const title=field(row,t(ctx,'Nombre del estante ','Shelf name ')+(i+1),'input',{type:'text'});title.value=s.label;title.addEventListener('input',()=>set('label',title.value));
          const height=field(row,t(ctx,'Altura del estante (px)','Shelf height (px)'),'input',{type:'range',min:'72',max:'480',step:'8'});height.value=String(s.height);const out=node(row,'output','cozy-shortcut-hint',s.height+' px');height.addEventListener('input',()=>{out.textContent=height.value+' px';set('height',Number(height.value));});
          const look=select(row,t(ctx,'Aspecto del estante','Shelf look'),[['auto',t(ctx,'Según el tema','Match theme')],['none',t(ctx,'Sin estante','No shelf')],['line',t(ctx,'Línea sutil','Subtle line')],['wood',t(ctx,'Madera','Wood')],['glass',t(ctx,'Cristal','Glass')],['soft',t(ctx,'Suave','Soft')],['pixel',t(ctx,'Pixel','Pixel')]],s.look);look.addEventListener('change',()=>set('look',look.value));
          const remove=button(row,t(ctx,'Quitar estante','Remove shelf'),()=>{preview.draft.shelves=preview.draft.shelves.filter(item=>item.id!==s.id);paintShelves();preview.update();});remove.disabled=preview.draft.shelves.length<=1;
        });};paintShelves();
        button(tools,t(ctx,'Agregar estante','Add shelf'),()=>{if(preview.draft.shelves.length>=32)return;preview.draft.shelves.push({id:'shelf-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),label:'',height:160,look:'auto'});paintShelves();preview.update();});
        if(Object.values(preview.draft.notebookOverrides).some(o=>o.hidden))button(tools,t(ctx,'Mostrar cuadernos ocultos','Show hidden notebooks'),()=>{for(const override of Object.values(preview.draft.notebookOverrides))override.hidden=false;preview.update();});
        const error=node(body,'p','cozy-shortcut-error','',{role:'status','aria-live':'polite'}),actions=node(body,'div','cozy-shortcut-modal-actions');button(actions,t(ctx,'Cancelar','Cancel'),()=>this.close());
        const submit=button(actions,t(ctx,'Guardar cambios','Save changes'),async()=>{
          if(!valid(ctx)||!preview.active){error.textContent=t(ctx,'Este espacio cambió. Cierra y vuelve a abrir el editor.','This space changed. Close and reopen the editor.');return;}
          const latest=state(ctx),draft=Model.normalize(preview.draft),merged=Model.normalize(latest);let conflict=false;
          const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
          const merge=(base,edited,current)=>{if(equal(base,edited))return current;if(!equal(current,base)&&!equal(current,edited)){conflict=true;return current;}return edited;};
          for(const key of ['layout','labelMode','fitMode','iconSize','gap','artStyle','showNotebooks','shelves','order'])merged[key]=merge(original[key],draft[key],latest[key]);
          const oldItems=new Map(original.items.map(i=>[i.id,i])),draftItems=new Map(draft.items.map(i=>[i.id,i])),latestItems=new Map(latest.items.map(i=>[i.id,i]));
          for(const id of new Set([...oldItems.keys(),...draftItems.keys()])){const value=merge(oldItems.get(id),draftItems.get(id),latestItems.get(id));if(value)latestItems.set(id,value);else latestItems.delete(id);}merged.items=[...latestItems.values()];
          for(const id of new Set([...Object.keys(original.notebookOverrides),...Object.keys(draft.notebookOverrides)])){const value=merge(original.notebookOverrides[id],draft.notebookOverrides[id],latest.notebookOverrides[id]);if(value)merged.notebookOverrides[id]=value;else delete merged.notebookOverrides[id];}
          if(conflict){error.textContent=t(ctx,'Otro editor modificó las mismas opciones. Cierra y vuelve a abrir para conservar esos cambios.','Another editor changed the same options. Close and reopen to preserve those changes.');return;}
          submit.disabled=true;if(await save(ctx,()=>merged))this.close();else submit.disabled=false;
        },'is-primary');preview.update();
      }
      onClose(){preview.active=false;if(ctx.view._shortcutPreview===preview)delete ctx.view._shortcutPreview;for(const cleanup of this.previewView?._shortcutCleanups?.values()||[])cleanup();ctx.p._shortcutViews?.delete(this.previewView);if(valid(ctx))ctx.view.refreshPanelInstance(ctx.panelItem.id,{contentChanged:true});this.contentEl.replaceChildren();}
    }const modal=new Settings();modal.open();return modal;
  }
  async function removeEntry(ctx,entry){await save(ctx,s=>{if(entry.notebook)s.notebookOverrides[entry.id]={...s.notebookOverrides[entry.id],hidden:true};else s.items=s.items.filter(i=>i.id!==entry.id);s.order=s.order.filter(id=>id!==entry.id);return s;});}
  async function move(ctx,id,beforeId,shelfId){await save(ctx,s=>{s.order=entries(ctx,s).map(e=>e.id);return Model.moveEntry(s,id,beforeId,shelfId);});}
  async function fitWindow(ctx,panel){
    if(!valid(ctx))return;
    const library=state(ctx),all=entries(ctx);const measured=Model.calculateShelfFit({width:Math.max(80,panel.clientWidth-32),height:100000,library:{...library,fitMode:'manual'},entries:all});
    const chrome=[...panel.children].filter(e=>!e.classList.contains('cozy-shortcut-stage')).reduce((sum,e)=>sum+e.getBoundingClientRect().height,0);
    const height=Math.max(180,measured.requiredHeight+chrome+40);
    await ctx.p.updatePanel(ctx.panelItem.id,{gridH:Math.max(8,Math.ceil(height/24)),height});
  }
  function render(view,parent,notebooks,panelItem){
    const p=view.plugin; p._shortcutViews ||= new Set(); p._shortcutViews.add(view); const ctx={view,p,parent,notebooks,panelItem,profileId:p.settings.activeDashboardProfileId,profileEpoch:p._shortcutProfileEpoch||0,preview:view._shortcutPreview?.active&&view._shortcutPreview.profileId===p.settings.activeDashboardProfileId&&view._shortcutPreview.profileEpoch===(p._shortcutProfileEpoch||0)?view._shortcutPreview:null};
    const panel=view.createPanel(parent,panelItem.title||t(ctx,'Cuadernos','Notebooks'));panel.classList.add('cozy-nest-notebooks-panel','cozy-shortcut-library');panel.setAttribute('data-label-mode',state(ctx).labelMode);
    const search=document.createElement('input');search.type='search';search.className='cozy-shortcut-search';search.setAttribute('aria-label',t(ctx,'Buscar accesos','Find shortcuts'));search.placeholder=t(ctx,'Buscar accesos…','Find shortcuts…');search.value=view._shortcutSearch||'';
    if(view._shortcutSearchOpen){const bar=node(panel,'div','cozy-shortcut-search-bar');bar.append(search);const close=button(bar,'×',()=>{view._shortcutSearch='';view._shortcutSearchOpen=false;view.refreshPanelInstance(panelItem.id,{contentChanged:true});});close.setAttribute('aria-label',t(ctx,'Cerrar búsqueda','Close search'));}
    const stage=node(panel,'div','cozy-shortcut-stage',undefined,{role:'list','aria-label':t(ctx,'Accesos del espacio','Space shortcuts')});const status=node(panel,'div','cozy-shortcut-fit-status','',{role:'status','aria-live':'polite'});
    let disposed=false,queued=0,observer=null,lastSize='',items=[];
    const cleanup=()=>{disposed=true;observer?.disconnect();cancelAnimationFrame(queued);};
    view._shortcutCleanups ||= new Map();view._shortcutCleanups.get(panelItem.id)?.();view._shortcutCleanups.set(panelItem.id,cleanup);
    const fit=()=>{
      if(disposed||!panel.isConnected||!valid(ctx)){cleanup();return;}
      const library=state(ctx);
      const result=Model.calculateShelfFit({width:Math.max(40,stage.clientWidth-8),height:Math.max(40,stage.clientHeight-10),library,entries:items});
      stage.style.setProperty('--cozy-shortcut-base-size',result.iconSize+'px');
      stage.style.setProperty('--cozy-shortcut-gap',library.gap+'px');
      stage.style.setProperty('--cozy-shortcut-columns',String(result.columns));
      stage.style.setProperty('--cozy-shortcut-cell-width',result.cellWidth+'px');
      for(const block of stage.querySelectorAll('.cozy-shortcut-shelf')){const region=result.regions.find(r=>r.id===block.getAttribute('data-shelf-id'));if(region)block.style.setProperty('--cozy-shortcut-row-height',region.rowHeight+'px');}
      status.textContent=library.fitMode==='fit'&&!result.fitPossible&&items.length?t(ctx,'Hay más accesos de los que caben legiblemente. Reduce el tamaño, agrega espacio o elige Lista desde Editar estantes.','More shortcuts than fit legibly. Reduce size, add space or choose List in Edit shelves.'):'';
    };
    const paint=()=>{
      stage.replaceChildren();const library=state(ctx);stage.setAttribute('data-layout',library.layout);stage.setAttribute('data-editing',String(Boolean(view._shortcutEditing)));panel.setAttribute('data-label-mode',library.labelMode);
      const q=search.value.trim().toLocaleLowerCase();items=entries(ctx,library).filter(e=>!q||(e.label+' '+(e.target?.path||'')).toLocaleLowerCase().includes(q));
      if(!items.length){node(stage,'p','cozy-shortcut-empty',t(ctx,'Agrega un acceso, elige un objeto o arrastra una nota o carpeta aquí.','Add a shortcut, choose an object or drop a note or folder here.'));fit();return;}
      const shelves=library.layout==='shelves'?(library.shelves.length?library.shelves:[{id:'',label:'',height:160,look:'none'}]):[{id:'',label:'',height:160,look:'none'}];
      const first=shelves[0].id;
      shelves.forEach((s,shelfIndex)=>{
        const group=library.layout==='shelves'?items.filter(e=>(shelves.some(s=>s.id===e.shelfId)?e.shelfId:first)===s.id):items;if(!group.length&&q)return;
        const block=node(stage,'section','cozy-shortcut-shelf',undefined,{'data-shelf-id':s.id,'data-look':s.look==='auto'?(/stardew|harvest/.test(p.settings.themePackId)?'pixel':styleFor(ctx,'auto')==='natural'?'wood':styleFor(ctx,'auto')==='minimal'?'none':'line'):s.look});
        block.style.setProperty('--cozy-shortcut-shelf-height',s.height+'px');if(s.label)node(block,'h3','cozy-shortcut-shelf-title',s.label);
        const grid=node(block,'div','cozy-shortcut-grid');if(!group.length)node(grid,'p','cozy-shortcut-empty-shelf',t(ctx,'Arrastra un acceso aquí','Drop a shortcut here'));

        group.forEach((entry,index)=>{
          const tile=node(grid,'div','cozy-shortcut-tile',undefined,{'data-shortcut-id':entry.id,role:'listitem',draggable:String(Boolean(view._shortcutEditing))});tile.style.setProperty('--cozy-shortcut-item-scale',String(entry.scale||1));
          const label=entry.label||entry.target?.path||t(ctx,'Acceso sin nombre','Untitled shortcut');const launch=button(tile,'',()=>{if(view._shortcutEditing)openEditor(ctx,entry);else void activate(ctx,entry);},'cozy-shortcut-launch');launch.setAttribute('aria-label',label);launch.title=label+(entry.target?'\n'+(entry.target.path||entry.target.kind):'');
          const art=node(launch,'span','cozy-shortcut-icon');drawIcon(ctx,art,entry.icon,entry,index);node(launch,'span','cozy-shortcut-caption',label);if(!entry.target)node(launch,'span','cozy-shortcut-unbound',t(ctx,'Sin acción','No action'));
          launch.addEventListener('contextmenu',event=>{event.preventDefault();openEditor(ctx,entry);});
          tile.addEventListener('dragstart',event=>{if(!view._shortcutEditing)return;event.stopPropagation();event.dataTransfer.setData(MIME,JSON.stringify({id:entry.id,profileId:ctx.profileId}));event.dataTransfer.effectAllowed='move';});
          tile.addEventListener('dragover',event=>{if(Array.from(event.dataTransfer.types).includes(MIME)){event.preventDefault();event.stopPropagation();event.dataTransfer.dropEffect='move';}});
          tile.addEventListener('drop',event=>{let data;try{data=JSON.parse(event.dataTransfer.getData(MIME));}catch{return;}if(data.profileId!==ctx.profileId||!items.some(e=>e.id===data.id))return;event.preventDefault();event.stopPropagation();void move(ctx,data.id,entry.id,s.id);});
          if(view._shortcutEditing){const actions=node(tile,'div','cozy-shortcut-item-actions');const configure=button(actions,'',()=>openEditor(ctx,entry));configure.setAttribute('aria-label',t(ctx,'Editar ','Edit ')+label);setIcon(configure,'pencil');const remove=button(actions,'',()=>{void removeEntry(ctx,entry);});remove.setAttribute('aria-label',t(ctx,'Quitar ','Remove ')+label);setIcon(remove,'x');const previous=items[items.findIndex(x=>x.id===entry.id)-1];const left=button(actions,'←',()=>{if(previous)void move(ctx,entry.id,previous.id,s.id);});left.disabled=!previous;left.setAttribute('aria-label',t(ctx,'Mover antes ','Move before ')+label);}
        });
        block.addEventListener('dragover',event=>{if(Array.from(event.dataTransfer.types).includes(MIME)){event.preventDefault();event.stopPropagation();}});block.addEventListener('drop',event=>{let data;try{data=JSON.parse(event.dataTransfer.getData(MIME));}catch{return;}if(data.profileId!==ctx.profileId)return;event.preventDefault();event.stopPropagation();void move(ctx,data.id,null,s.id);});
      });fit();
    };
    search.addEventListener('input',()=>{view._shortcutSearch=search.value;paint();});
    stage.addEventListener('dragover',event=>{if(!Array.from(event.dataTransfer.types).includes(MIME)){event.preventDefault();event.stopPropagation();event.dataTransfer.dropEffect='copy';}});
    stage.addEventListener('drop',event=>{if(Array.from(event.dataTransfer.types).includes(MIME))return;event.preventDefault();event.stopPropagation();void(async()=>{const drag=p.app.dragManager?.draggable;const native=[drag?.file,drag?.folder,...(Array.isArray(drag?.files)?drag.files:[])].filter(e=>bridge.isFile(e)||bridge.isFolder(e));const dropped=[...new Map([...native,...p.resolveDroppedVaultEntries(event.dataTransfer)].map(e=>[e.path,e])).values()];if(!valid(ctx))return;const list=dropped.filter(e=>bridge.isFile(e)||bridge.isFolder(e));if(!list.length){const raw=(event.dataTransfer.getData('text/uri-list')||event.dataTransfer.getData('text/plain')).trim();const checked=Model.normalize({items:[{target:{kind:'web',path:raw}}]}).items[0];if(checked.target)openEditor(ctx,null,{label:/^https?:/i.test(raw)?new URL(raw).hostname:raw,icon:{kind:'symbol',symbol:'link'},target:checked.target});return;}await save(ctx,s=>{for(const f of list)s.items.push({id:'shortcut-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),label:f.basename||f.name,icon:{kind:bridge.isFolder(f)?'book':'symbol',symbol:bridge.isFolder(f)?'folder':'file-text'},target:{kind:bridge.isFolder(f)?'folder':'file',path:f.path},shelfId:s.shelves[0]?.id||'',scale:1});return s;});})();});
    if(typeof ResizeObserver!=='undefined'){observer=new ResizeObserver(()=>{cancelAnimationFrame(queued);queued=requestAnimationFrame(()=>{const key=stage.clientWidth+':'+stage.clientHeight;if(key!==lastSize){lastSize=key;fit();}});});observer.observe(stage);}
    paint();queued=requestAnimationFrame(fit);return panel;
  }
  function getMenuActions(view,panelItem){
    const p=view.plugin,ctx={view,p,panelItem,notebooks:p.getNotebookGroups?.()||[],profileId:p.settings.activeDashboardProfileId,profileEpoch:p._shortcutProfileEpoch||0};
    const action=(es,en,icon,run)=>({title:t(ctx,es,en),icon,onClick:()=>{if(valid(ctx))return run();}});
    return[
      action('Agregar acceso','Add shortcut','plus',()=>openEditor(ctx)),
      action('Editar estantes','Edit shelves','pencil',()=>openSettings(ctx)),
      action('Buscar accesos','Find shortcuts','search',()=>{view._shortcutSearchOpen=true;view.refreshPanelInstance(panelItem.id,{contentChanged:true});})
    ];
  }

  return {getMenuActions,render,openEditor,openSettings,activate,fitWindow,dispose(view){for(const cleanup of view._shortcutCleanups?.values()||[])cleanup();view._shortcutCleanups?.clear();view.plugin?._shortcutViews?.delete(view);}};
};