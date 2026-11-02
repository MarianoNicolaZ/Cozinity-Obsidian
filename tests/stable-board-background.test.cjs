const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
class Base{};const api={Plugin:Base,ItemView:Base,Modal:Base,Notice:Base,PluginSettingTab:Base,FuzzySuggestModal:Base,normalizePath:p=>p};
const ctx={module:{exports:{}},require:()=>api,URL,console,Date,setTimeout,clearTimeout};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../main.js'),'utf8')+'\nmodule.exports.audit={normalizeSettings};',ctx);
const {normalizeSettings}=ctx.module.exports.audit;
test('board images default to fixed width for new and existing dashboards',()=>{
 assert.equal(normalizeSettings({panelLayout:[]}).boardBackgroundSizing,'fixed');
 assert.equal(normalizeSettings({boardBackgroundImagePath:'Assets/image.png',boardBackgroundPositionY:73,panelLayout:[]}).boardBackgroundSizing,'fixed');
 assert.equal(normalizeSettings({boardBackgroundSizing:'invalid',panelLayout:[]}).boardBackgroundSizing,'fixed');
});
test('an explicit cover choice survives settings normalization and profile snapshots',()=>{
 const s=normalizeSettings({boardBackgroundSizing:'cover',activeDashboardProfileId:'a',dashboardProfiles:[{id:'a',label:'A',snapshot:{boardBackgroundSizing:'cover',panelLayout:[]}},{id:'b',label:'B',snapshot:{boardBackgroundSizing:'fixed',panelLayout:[]}}],panelLayout:[]});
 assert.equal(s.boardBackgroundSizing,'cover');assert.equal(s.dashboardProfiles[0].snapshot.boardBackgroundSizing,'cover');assert.equal(s.dashboardProfiles[1].snapshot.boardBackgroundSizing,'fixed');
 const reload=normalizeSettings(JSON.parse(JSON.stringify(s)));assert.equal(reload.dashboardProfiles[0].snapshot.boardBackgroundSizing,'cover');
});
