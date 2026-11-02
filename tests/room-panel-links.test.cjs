const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class Base {}
const api = {
  Modal: Base,
  Plugin: Base,
  ItemView: Base,
  PluginSettingTab: Base,
  FuzzySuggestModal: Base,
  Notice: class {},
  TFile: class {},
  TFolder: class {},
  normalizePath: value => String(value).replace(/\\/g, '/').replace(/\/{2,}/g, '/'),
  parseLinktext: value => ({ path: value, subpath: '' }),
  getAllTags: () => [],
};
const source = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
const context = {
  module: { exports: {} },
  require: () => api,
  console,
  setTimeout,
  clearTimeout,
  URL,
  Date,
  HTMLElement: Base,
  window: { setTimeout, clearTimeout },
};
vm.runInNewContext(source + `
module.exports.panelTesting = {
  normalizeCozyBinding,
  normalizeCozyHouse,
  getDashboardPanelLinkTargets,
  isSafeDashboardPanelTarget,
  NestBoardPlugin,
  normalizeSettings,
  remapCozyPanelBindings: typeof remapCozyPanelBindings === 'function' ? remapCozyPanelBindings : undefined,
  getCozyBindingLabel: typeof getCozyBindingLabel === 'function' ? getCozyBindingLabel : undefined,
};`, context);

const { normalizeCozyBinding, normalizeCozyHouse, getDashboardPanelLinkTargets, isSafeDashboardPanelTarget, NestBoardPlugin } = context.module.exports.panelTesting;
const plain = value => JSON.parse(JSON.stringify(value));

test('panel furniture bindings preserve profile and panel ids while rejecting recursion', () => {
  assert.deepEqual(plain(normalizeCozyBinding({ kind: 'panel', profileId: 'work', panelId: 'recent' })), {
    kind: 'panel', profileId: 'work', panelId: 'recent',
  });
  assert.equal(normalizeCozyBinding({ kind: 'panel', profileId: 'work', panelId: '' }), null);
  assert.equal(isSafeDashboardPanelTarget({ type: 'cozy_room' }), false);
  assert.equal(isSafeDashboardPanelTarget({ type: 'recent' }), true);
});

test('an unprofiled shortcut cannot resolve an unrelated saved dashboard panel', () => {
  const plugin = Object.create(NestBoardPlugin.prototype);
  plugin.settings = { activeDashboardProfileId: 'work', panelLayout: [{ id: 'quick', type: 'quick_note_draft' }] };
  assert.equal(plugin.resolveDashboardPanelBinding({ kind: 'panel', profileId: '__current__', panelId: 'quick' }), null);
});

test('switching profiles saves pending quick-note text in the departing profile snapshot', async () => {
  const plugin = Object.create(NestBoardPlugin.prototype);
  const { normalizeSettings } = context.module.exports.panelTesting;
  const quick = { id: 'quick', type: 'quick_note_draft', quickDraftText: 'Old saved draft' };
  plugin.settings = normalizeSettings({ activeDashboardProfileId: 'work', panelLayout: [quick], dashboardProfiles: [
    { id: 'work', label: 'Work', snapshot: { panelLayout: [quick] } },
    { id: 'home', label: 'Home', snapshot: { panelLayout: [{ ...quick, quickDraftText: 'Home draft' }] } },
  ] });
  plugin.saveData = async settings => { plugin.persisted = plain(settings); };
  plugin.invalidateTaskBoard = () => {};
  plugin.invalidateVaultIndex = () => {};
  plugin.refreshViews = () => {};
  plugin.queuePanelQuickDraftSave('quick', { quickDraftText: 'Last unsaved keystroke' });
  await plugin.activateDashboardProfile('home');
  assert.equal(plugin.persisted.dashboardProfiles.find(p => p.id === 'work').snapshot.panelLayout[0].quickDraftText, 'Last unsaved keystroke');
  assert.equal(plugin.settings.panelLayout[0].quickDraftText, 'Home draft');
  assert.equal(plugin.quickDraftSaveTimers.size, 0);
});

test('house normalization keeps panel bindings and legacy folder/tag bindings intact', () => {
  const house = normalizeCozyHouse({ version: 2, rooms: [{ id: 'room', objects: [
    { id: 'panel', type: 'tv', binding: { kind: 'panel', profileId: 'work', panelId: 'control' } },
    { id: 'folder', type: 'plant', binding: { kind: 'folder', path: 'Notes' } },
    { id: 'tag', type: 'lamp', binding: { kind: 'tag', path: 'ideas' } },
  ] }] });
  assert.deepEqual(plain(house.rooms[0].objects.map(item => item.binding)), [
    { kind: 'panel', profileId: 'work', panelId: 'control' },
    { kind: 'folder', path: 'Notes' },
    { kind: 'tag', path: '#ideas' },
  ]);
});

test('saving a dashboard copy retargets its own furniture panel links, never foreign links or folders', () => {
  const { remapCozyPanelBindings } = context.module.exports.panelTesting;
  assert.equal(typeof remapCozyPanelBindings, 'function', 'dashboard copies must retarget furniture panel links');
  const panels = [{id:'room',type:'cozy_room',room:normalizeCozyHouse({version:2,rooms:[{id:'office',objects:[
    {id:'one',type:'tv',binding:{kind:'panel',profileId:'work',panelId:'recent'}},
    {id:'two',type:'plant',binding:{kind:'panel',profileId:'other',panelId:'recent'}},
    {id:'three',type:'bookshelf',binding:{kind:'folder',path:'Work'}},
  ]}]})}];
  const copy=remapCozyPanelBindings(panels,'work','home');
  assert.deepEqual(plain(copy[0].room.rooms[0].objects.map(o=>o.binding)),[
    {kind:'panel',profileId:'home',panelId:'recent'},
    {kind:'panel',profileId:'other',panelId:'recent'},
    {kind:'folder',path:'Work'},
  ]);
  assert.equal(panels[0].room.rooms[0].objects[0].binding.profileId,'work');
});

test('furniture identifies linked dashboard panels instead of claiming Not linked', () => {
  const { getCozyBindingLabel } = context.module.exports.panelTesting;
  assert.equal(typeof getCozyBindingLabel, 'function', 'panel furniture needs a readable target label');
  const plugin={settings:{activeDashboardProfileId:'work',panelLayout:[{id:'quick',type:'quick_note_draft',title:'Ideas'}]},getLanguage:()=> 'en',t:s=>s};
  assert.equal(getCozyBindingLabel(plugin,{kind:'panel',profileId:'work',panelId:'quick'}),'Ideas');
  assert.equal(getCozyBindingLabel(plugin,{kind:'folder',path:'Work'}),'Work');
});

test('panel picker targets only current-profile safe existing panels', () => {
  const plugin = { settings: {
    activeDashboardProfileId: 'work',
    panelLayout: [
      { id: 'room', type: 'cozy_room', title: 'Room' },
      { id: 'recent', type: 'recent', title: 'Recent notes' },
      { id: 'quick', type: 'quick_note_draft', title: 'Quick note' },
      { id: 'old', type: 'customization', title: 'Deprecated' },
    ],
  } };
  assert.deepEqual(getDashboardPanelLinkTargets(plugin).map(item => item.id), ['recent', 'quick']);
  assert.equal(getDashboardPanelLinkTargets(plugin)[0].profileId, 'work');
});

test('panel resolver is profile-scoped and fails closed for removed or recursive panels', () => {
  const plugin = Object.create(NestBoardPlugin.prototype);
  plugin.settings = { activeDashboardProfileId: 'work', panelLayout: [
    { id: 'recent', type: 'recent' },
    { id: 'room', type: 'cozy_room' },
  ] };
  assert.equal(plugin.resolveDashboardPanelBinding({ kind: 'panel', profileId: 'work', panelId: 'recent' }).id, 'recent');
  assert.equal(plugin.resolveDashboardPanelBinding({ kind: 'panel', profileId: 'other', panelId: 'recent' }), null);
  assert.equal(plugin.resolveDashboardPanelBinding({ kind: 'panel', profileId: 'work', panelId: 'room' }), null);
  plugin.settings.panelLayout = [];
  assert.equal(plugin.resolveDashboardPanelBinding({ kind: 'panel', profileId: 'work', panelId: 'recent' }), null);
});
