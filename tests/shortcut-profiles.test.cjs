const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const plain = value => JSON.parse(JSON.stringify(value));
const panels = [{id:'library',type:'notebooks'},{id:'note',type:'quick_note_draft',quickDraftText:'Draft to keep'}];
const library = profileId => ({items:[
  {id:'own',label:'Own panel',target:{kind:'panel',profileId,panelId:'note'}},
  {id:'foreign',label:'Foreign panel',target:{kind:'panel',profileId:'outside',panelId:'other-note'}},
  {id:'note-file',target:{kind:'file',path:'Notes/Keep.md'}},
]});

function fixture({unnamed=false}={}) {
  class Base {}
  const notices=[];
  const context={module:{exports:{}},console,URL,Date,HTMLElement:Base,promptLabel:null,
    require:()=>({Plugin:Base,ItemView:Base,Modal:Base,PluginSettingTab:Base,FuzzySuggestModal:Base,
      Notice:class {constructor(message){notices.push(message)}},normalizePath:value=>String(value).replace(/\\/g,'/')})};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','main.js'),'utf8')+`
    // Replace only the native text-input boundary; profile operations remain real.
    TextPromptModal=class {constructor(app,options){this.options=options}open(){this.options.resolve(globalThis.promptLabel)}};
    module.exports.api={NestBoardPlugin,normalizeSettings};`,context);
  const {NestBoardPlugin,normalizeSettings}=context.module.exports.api;
  const plugin=Object.create(NestBoardPlugin.prototype);
  const active=unnamed?'':'a';
  plugin.settings=normalizeSettings({language:'en',dashboardTitle:unnamed?'Unnamed':'Alpha',panelLayout:panels,shortcutLibrary:library(unnamed?'__current__':'a'),activeDashboardProfileId:active,
    dashboardProfiles:unnamed?[]:[
      {id:'a',label:'Alpha',snapshot:{dashboardTitle:'Alpha',panelLayout:panels,shortcutLibrary:library('a')}},
      {id:'b',label:'Beta',snapshot:{dashboardTitle:'Beta',panelLayout:panels,shortcutLibrary:{items:[{id:'beta-file',target:{kind:'file',path:'Beta/Only.md'}}]}}},
    ]});
  plugin._shortcutProfileEpoch=7;
  plugin.app={workspace:{getLeavesOfType:()=>[]}};
  const writes=[];
  let flushes=0;
  plugin.flushQuickDraftSaves=async()=>{flushes++};
  plugin.saveData=async data=>{writes.push(plain(data))};
  plugin.invalidateTaskBoard=()=>{};
  plugin.invalidateVaultIndex=()=>{};
  plugin.refreshViews=()=>{};
  return {plugin,writes,notices,setPrompt:value=>{context.promptLabel=value},flushes:()=>flushes};
}

function ownTarget(value){return value.items.find(item=>item.id==='own').target}

test('creating a starter archives unnamed panel shortcuts under the archive profile',async()=>{
  const {plugin,writes}=fixture({unnamed:true});
  plugin.settings.shortcutLibrary.items.push({id:'legacy-current',target:{kind:'panel',profileId:'',panelId:'note'}});
  const id=await plugin.createWorkspaceProfile('room','New room');
  const archive=plugin.settings.dashboardProfiles.find(profile=>profile.id!==id);
  assert.ok(archive);
  assert.equal(ownTarget(archive.snapshot.shortcutLibrary).profileId,archive.id);
  assert.equal(archive.snapshot.shortcutLibrary.items.find(item=>item.id==='legacy-current').target.profileId,archive.id);
  assert.equal(archive.snapshot.shortcutLibrary.items.find(item=>item.id==='foreign').target.profileId,'outside');
  assert.equal(archive.snapshot.panelLayout.find(panel=>panel.id==='note').quickDraftText,'Draft to keep');
  assert.equal(plugin.settings.activeDashboardProfileId,id);
  assert.equal(plugin._shortcutProfileEpoch,8);
  assert.equal(writes.length,1);
  const persistedArchive=writes[0].dashboardProfiles.find(profile=>profile.id===archive.id);
  assert.equal(ownTarget(persistedArchive.snapshot.shortcutLibrary).profileId,archive.id);
});

test('duplicate starter names leave existing library contexts valid and do not persist',async()=>{
  const {plugin,writes}=fixture();
  const before=plain(plugin.settings.shortcutLibrary);
  await assert.rejects(plugin.createWorkspaceProfile('desk','ALPHA'),/already exists/);
  assert.equal(plugin._shortcutProfileEpoch,7);
  assert.equal(plugin.settings.activeDashboardProfileId,'a');
  assert.deepEqual(plain(plugin.settings.shortcutLibrary),before);
  assert.equal(plugin.settings.dashboardProfiles.length,2);
  assert.equal(writes.length,0);
});

test('failed starter persistence restores library and epoch and a retry succeeds',async()=>{
  const {plugin}=fixture();
  const previous=plugin.settings,before=plain(previous.shortcutLibrary);
  plugin.saveData=async()=>{throw Error('Disk unavailable')};
  await assert.rejects(plugin.createWorkspaceProfile('room','New room'),/Disk unavailable/);
  assert.equal(plugin.settings,previous);
  assert.deepEqual(plain(plugin.settings.shortcutLibrary),before);
  assert.equal(plugin.settings.activeDashboardProfileId,'a');
  assert.equal(plugin._shortcutProfileEpoch,7);
  plugin.saveData=async()=>{};
  await plugin.createWorkspaceProfile('room','New room');
  assert.notEqual(plugin.settings.activeDashboardProfileId,'a');
  assert.equal(plugin._shortcutProfileEpoch,8);
});

test('activating an unknown profile leaves shortcut epoch and current library untouched',async()=>{
  const {plugin,writes,flushes}=fixture();
  const before=plain(plugin.settings.shortcutLibrary);
  await plugin.activateDashboardProfile('missing');
  assert.equal(plugin._shortcutProfileEpoch,7);
  assert.equal(plugin.settings.activeDashboardProfileId,'a');
  assert.deepEqual(plain(plugin.settings.shortcutLibrary),before);
  assert.equal(flushes(),0);
  assert.equal(writes.length,0);
});

test('profile activation persists the departing library and restores the selected library independently',async()=>{
  const {plugin,writes}=fixture();
  plugin.settings.shortcutLibrary.items[0].label='Latest label';
  await plugin.activateDashboardProfile('b');
  assert.equal(plugin.settings.activeDashboardProfileId,'b');
  assert.equal(plugin._shortcutProfileEpoch,8);
  assert.deepEqual(Array.from(plugin.settings.shortcutLibrary.items,item=>item.id),['beta-file']);
  const departed=plugin.settings.dashboardProfiles.find(profile=>profile.id==='a');
  assert.equal(departed.snapshot.shortcutLibrary.items[0].label,'Latest label');
  assert.equal(ownTarget(departed.snapshot.shortcutLibrary).profileId,'a');
  assert.equal(writes[0].activeDashboardProfileId,'b');
  await plugin.activateDashboardProfile('a');
  assert.equal(plugin.settings.shortcutLibrary.items[0].label,'Latest label');
  assert.equal(plugin._shortcutProfileEpoch,9);
});

test('failed activation restores the original settings and epoch before a successful retry',async()=>{
  const {plugin}=fixture();
  const previous=plugin.settings;
  plugin.saveData=async()=>{throw Error('Disk unavailable')};
  await assert.rejects(plugin.activateDashboardProfile('b'),/Disk unavailable/);
  assert.equal(plugin.settings,previous);
  assert.equal(plugin.settings.activeDashboardProfileId,'a');
  assert.equal(ownTarget(plugin.settings.shortcutLibrary).profileId,'a');
  assert.equal(plugin._shortcutProfileEpoch,7);
  plugin.saveData=async()=>{};
  await plugin.activateDashboardProfile('b');
  assert.equal(plugin.settings.activeDashboardProfileId,'b');
  assert.equal(plugin._shortcutProfileEpoch,8);
});

test('save as copies local panel targets to the new profile while preserving source and foreign links',async()=>{
  const {plugin,writes,setPrompt}=fixture();
  setPrompt('Copied space');
  await plugin.promptAndSaveDashboardProfile();
  const targetId=plugin.settings.activeDashboardProfileId;
  assert.notEqual(targetId,'a');
  assert.equal(ownTarget(plugin.settings.shortcutLibrary).profileId,targetId);
  assert.equal(plugin.settings.shortcutLibrary.items.find(item=>item.id==='foreign').target.profileId,'outside');
  assert.equal(plugin.settings.shortcutLibrary.items.find(item=>item.id==='note-file').target.path,'Notes/Keep.md');
  assert.equal(plugin.settings.dashboardProfiles.length,3);
  assert.equal(ownTarget(plugin.settings.dashboardProfiles.find(profile=>profile.id==='a').snapshot.shortcutLibrary).profileId,'a');
  assert.equal(ownTarget(writes[0].dashboardProfiles.find(profile=>profile.id===targetId).snapshot.shortcutLibrary).profileId,targetId);
  assert.equal(plugin._shortcutProfileEpoch,8);
});

test('save as from unnamed workspace canonicalizes both legacy and current panel links',async()=>{
  const {plugin,setPrompt}=fixture({unnamed:true});
  plugin.settings.shortcutLibrary.items.push({id:'legacy',target:{kind:'panel',profileId:'',panelId:'note'}});
  setPrompt('First saved space');
  await plugin.promptAndSaveDashboardProfile();
  const id=plugin.settings.activeDashboardProfileId;
  assert.ok(id);
  assert.equal(ownTarget(plugin.settings.shortcutLibrary).profileId,id);
  assert.equal(plugin.settings.shortcutLibrary.items.find(item=>item.id==='legacy').target.profileId,id);
  assert.equal(plugin.settings.dashboardProfiles.length,1);
});

test('saving under an existing name updates that profile without duplicating it or changing source links',async()=>{
  const {plugin,setPrompt}=fixture();
  setPrompt('BETA');
  await plugin.promptAndSaveDashboardProfile();
  assert.equal(plugin.settings.dashboardProfiles.length,2);
  assert.equal(plugin.settings.activeDashboardProfileId,'b');
  assert.equal(ownTarget(plugin.settings.shortcutLibrary).profileId,'b');
  assert.equal(ownTarget(plugin.settings.dashboardProfiles.find(profile=>profile.id==='a').snapshot.shortcutLibrary).profileId,'a');
  assert.equal(plugin._shortcutProfileEpoch,8);
});

test('failed save as restores profile list and epoch and cancellation leaves the library untouched',async()=>{
  const {plugin,setPrompt,writes}=fixture();
  const previous=plugin.settings;
  setPrompt('Failed copy');
  plugin.saveData=async()=>{throw Error('Disk unavailable')};
  await assert.rejects(plugin.promptAndSaveDashboardProfile(),/Disk unavailable/);
  assert.equal(plugin.settings,previous);
  assert.equal(plugin.settings.activeDashboardProfileId,'a');
  assert.equal(plugin.settings.dashboardProfiles.length,2);
  assert.equal(ownTarget(plugin.settings.shortcutLibrary).profileId,'a');
  assert.equal(plugin._shortcutProfileEpoch,7);
  setPrompt(null);
  await plugin.promptAndSaveDashboardProfile();
  assert.equal(plugin._shortcutProfileEpoch,7);
  assert.equal(writes.length,0);
});
