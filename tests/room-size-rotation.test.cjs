const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class Base {}
const context = { module: { exports: {} }, require: () => ({ Plugin: Base, ItemView: Base, Modal: Base,
  PluginSettingTab: Base, FuzzySuggestModal: Base, TFile: Base, TFolder: Base, Notice: Base,
  normalizePath: p => p, getAllTags: () => [], parseLinktext: p => ({ path: p, subpath: '' }) }),
  console, setTimeout, clearTimeout, URL, Date, HTMLElement: Base };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8') +
  '\nmodule.exports.roomApi={normalizeCozyHouse,changeCozyHouse,getCozyObjectScale,normalizeSettings};', context);
const api = context.module.exports.roomApi;
const plain = value => JSON.parse(JSON.stringify(value));
const house = size => ({ version: 2, activeRoomId: 'r', rooms: [{ id: 'r', name: 'Office', size, objects: [
  { id: 'desk', type: 'desk', x: 5.25, y: .5, rotation: 90, binding: { kind: 'folder', path: 'Work' } },
  { id: 'pc', type: 'laptop', x: 5.25, y: .25 },
] }] });

test('room size and cardinal furniture orientation survive settings reload without moving or unlinking objects', () => {
  const settings = api.normalizeSettings({ panelLayout: [{ id: 'room', type: 'cozy_room', room: house('small') }] });
  const restored = api.normalizeSettings(plain(settings)).panelLayout[0].room.rooms[0];
  assert.equal(restored.size, 'small');
  assert.equal(restored.objects[0].rotation, 90);
  assert.deepEqual(plain(restored.objects.map(o => [o.id, o.x, o.y])), [['desk', 5.25, .5], ['pc', 5.25, .25]]);
  assert.deepEqual(plain(restored.objects[0].binding), { kind: 'folder', path: 'Work' });
});

test('smaller rooms enlarge the same furniture without changing relative object proportions', () => {
  assert.ok(Math.abs(api.getCozyObjectScale('desk', 'medium') / api.getCozyObjectScale('desk') - 1.3) < .001);
  assert.ok(Math.abs(api.getCozyObjectScale('desk', 'small') / api.getCozyObjectScale('desk') - 1.7) < .001);
  assert.ok(api.getCozyObjectScale('laptop', 'small') < api.getCozyObjectScale('desk', 'small'));
  assert.equal(api.getCozyObjectScale('desk', 'invalid'), api.getCozyObjectScale('desk'));
});

test('invalid sizes and unsupported or non-cardinal rotations fall back without deleting furniture', () => {
  const h = house('giant');
  h.rooms[0].objects.push({ id: 'chair', type: 'office_chair', rotation: -90 },
    { id: 'bad', type: 'desk', rotation: 45 }, { id: 'lamp', type: 'lamp', rotation: 180 });
  const room = api.normalizeCozyHouse(h).rooms[0];
  assert.equal(room.size, 'large');
  assert.equal(room.objects[2].rotation, 270);
  assert.equal(room.objects[3].rotation || 0, 0);
  assert.equal(room.objects[4].rotation || 0, 0);
  assert.equal(room.objects.length, 5);
});

test('creating and duplicating smaller rooms retains independent size, orientation and bindings', () => {
  let h = api.changeCozyHouse(house('medium'), 'duplicate');
  assert.equal(h.rooms[1].size, 'medium');
  assert.equal(h.rooms[1].objects[0].rotation, 90);
  h.rooms[1].objects[0].rotation = 270;
  assert.equal(h.rooms[0].objects[0].rotation, 90);
  h = api.changeCozyHouse(h, 'add', { template: 'office', name: 'Small office', size: 'small' });
  assert.equal(h.rooms[2].size, 'small');
  assert.ok(h.rooms[2].objects.some(o => o.type === 'desk'));
});

test('the two supplied studio templates open empty and retain their backdrop after reload and duplication', () => {
  for (const template of ['detuco-neon', 'detuco-studio']) {
    let h = api.changeCozyHouse(house('large'), 'add', { template, name: template, size: 'medium' });
    const added = h.rooms[1];
    assert.equal(added.backdrop, template);
    assert.equal(added.size, 'medium');
    assert.deepEqual(plain(added.objects), []);
    h = api.normalizeSettings({ panelLayout: [{ id: 'room', type: 'cozy_room', room: h }] }).panelLayout[0].room;
    assert.equal(h.rooms[1].backdrop, template);
    h = api.changeCozyHouse(h, 'duplicate');
    assert.equal(h.rooms[2].backdrop, template);
    assert.deepEqual(plain(h.rooms[2].objects), []);
  }
});

test('unrecognized backdrop names cannot become arbitrary asset paths', () => {
  const h = house('large');
  h.rooms[0].backdrop = '../other.png';
  assert.equal(api.normalizeCozyHouse(h).rooms[0].backdrop, '');
});
