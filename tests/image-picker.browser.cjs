const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {setup,root}=require('./helpers/cozy-window-fixture.cjs');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:900,height:760}});page.setDefaultTimeout(4000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await setup(page);await page.addStyleTag({content:'#dashboard{width:min(620px,calc(100% - 32px));box-sizing:border-box;margin:24px auto}.image-picker-fixture{border:1px solid var(--background-modifier-border);border-radius:8px;overflow:hidden}.image-picker-fixture h2{padding:12px;margin:0;font-size:18px}.image-picker-fixture .suggestion-item{cursor:pointer;border-top:1px solid var(--background-modifier-border)}'});
 await page.route('https://thumbnails.local/**',route=>{const key=decodeURIComponent(new URL(route.request().url()).pathname.slice(1));if(key.includes('unavailable'))return route.fulfill({status:404,body:'not found'});return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="'+(key.includes('Montañas')?'#384958':'#ae7c50')+'"/><path d="M0 180 90 40 180 180 250 75 320 180" fill="#7d9c8a"/><circle cx="260" cy="35" r="20" fill="#f7d98b"/></svg>'})});
 await page.evaluate(()=>{
  view.contentEl.empty();document.body.style.cssText='background:var(--background-primary);color:var(--text-normal)';
  window.picker=Object.create(auditApi.ImageSuggestModal.prototype);picker.app=plugin.app;picker.onChoose=file=>{window.chosen=file.path};
  files.push(new testApi.TFile('Fondos/Montañas.png'),new testApi.TFile('Imágenes/Montañas.png'),new testApi.TFile('Fondos/unavailable.webp'),new testApi.TFile('Notas/ignore.txt'));
  plugin.app.vault.getResourcePath=file=>'https://thumbnails.local/'+encodeURIComponent(file.path);
  plugin.app.vault.modify=()=>{throw Error('Selecting an image must not modify files')};
  const list=view.contentEl.createDiv({cls:'image-picker-fixture'});list.createEl('h2',{text:'Elegir imagen del vault'});
  for(const file of picker.getItems()){const row=list.createDiv({cls:'suggestion-item',attr:{role:'option','data-path':file.path}});picker.renderSuggestion({item:file,match:{score:1,matches:[]}},row);row.addEventListener('click',()=>picker.onChooseItem(file));}
 });
 const row=page.locator('[data-path="Fondos/Montañas.png"]');await row.locator('img').waitFor();await page.waitForFunction(()=>Array.from(document.querySelectorAll('[data-path="Fondos/Montañas.png"] img')).every(img=>img.complete&&img.naturalWidth>0));
 assert.equal(await row.locator('.suggestion-title').innerText(),'Montañas.png');assert.equal(await row.locator('.suggestion-note').innerText(),'Fondos/Montañas.png');
 const image=await row.locator('img').boundingBox();assert.ok(image.width>=96&&image.height>=64,'preview is large enough to recognize');
 assert.equal(await page.locator('[data-path="Notas/ignore.txt"]').count(),0);assert.equal(await page.evaluate(()=>picker.getItemText(files.find(f=>f.path==='Imágenes/Montañas.png'))),'Imágenes/Montañas.png','full path remains searchable');
 const broken=page.locator('[data-path="Fondos/unavailable.webp"]');await page.waitForFunction(()=>!document.querySelector('[data-path="Fondos/unavailable.webp"] img'));assert.equal(await broken.locator('.cozy-nest-image-suggestion-fallback').isVisible(),true);
 await row.click();assert.equal(await page.evaluate(()=>chosen),'Fondos/Montañas.png');await broken.click();assert.equal(await page.evaluate(()=>chosen),'Fondos/unavailable.webp','missing thumbnail does not prevent selection');
 await page.setViewportSize({width:400,height:760});const narrow=await row.boundingBox();assert.ok(narrow.x>=0&&narrow.x+narrow.width<=400,'image and file details fit narrow picker');
 for(const mode of ['light','dark']){await page.evaluate(mode=>document.body.className='theme-'+mode,mode);const contrast=await row.evaluate(el=>{const s=getComputedStyle(el.querySelector('.suggestion-title'));return s.color});assert.notEqual(contrast,'rgba(0, 0, 0, 0)');}
 await page.setViewportSize({width:900,height:760});fs.mkdirSync(path.join(root,'tests/artifacts'),{recursive:true});await page.locator('.image-picker-fixture').screenshot({path:path.join(root,'tests/artifacts','image-picker.png')});assert.deepEqual(errors,[]);
 console.log('PASS: real image suggestion thumbnails, distinguishable paths, image filtering, selection and missing-image fallback, light/dark and narrow layout; no vault writes.');
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
