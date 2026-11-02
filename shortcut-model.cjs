'use strict';

// This module is deliberately independent of Obsidian and the DOM. Destinations
// are inert data; the host resolves supported kinds through its own APIs.
const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const str = value => typeof value === 'string' ? value : '';
const choice = (value, values, fallback) => values.includes(value) ? value : fallback;
const number = (value, fallback, min, max) => typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;

function vaultPath(value) {
  let path = str(value).trim().replace(/\\/g, '/');
  if (!path || /^[a-z][a-z\d+.-]*:/i.test(path) || path.startsWith('/') || /[\x00-\x1f]/.test(path)) return null;
  const parts = path.split('/').filter(part => part && part !== '.');
  if (parts.some(part => part === '..' || part.includes(':'))) return null;
  return parts.length ? parts.join('/') : null;
}

function icon(value) {
  const raw = record(value);
  const path = vaultPath(raw.src);
  return {
    kind: choice(raw.kind, ['book', 'room', 'generated', 'symbol', 'image'], 'book'),
    type: str(raw.type).trim(),
    style: str(raw.style).trim(),
    src: path && /\.(?:png|jpe?g|webp|gif|avif|svg)$/i.test(path) ? path : '',
    symbol: /^[a-z][a-z\d-]*$/.test(str(raw.symbol)) ? raw.symbol : '',
  };
}

function target(value) {
  const raw = record(value);
  const kind = raw.kind;
  let path = str(raw.path).trim();
  const profileId = str(raw.profileId).trim();
  const panelId = str(raw.panelId).trim();
  if (kind === 'file' || kind === 'folder') {
    path = vaultPath(path);
    if (path === null) return null;
  } else if (kind === 'web') {
    if (!/^(?:https?:\/\/|mailto:|obsidian:\/\/)\S+$/i.test(path) || /[\x00-\x1f]/.test(path)) return null;
    if (/^https?:/i.test(path)) {
      try { if (!new URL(path).hostname) return null; } catch { return null; }
    }
  } else if (kind === 'command' || kind === 'tag') {
    if (!path || /[\x00-\x1f]/.test(path)) return null;
  } else if (kind === 'panel') {
    if (!panelId) return null;
  } else if (kind !== 'daily') return null;
  return { kind, path, profileId, panelId };
}

function uniqueId(value, fallback, used) {
  const base = str(value).trim() || fallback;
  let id = base;
  let suffix = 2;
  while (used.has(id)) id = `${base}-${suffix++}`;
  used.add(id);
  return id;
}

function override(value) {
  const raw = record(value);
  const result = {};
  if (typeof raw.label === 'string') result.label = raw.label;
  if (raw.icon && typeof raw.icon === 'object') result.icon = icon(raw.icon);
  if (typeof raw.shelfId === 'string') result.shelfId = raw.shelfId.trim();
  if (typeof raw.hidden === 'boolean') result.hidden = raw.hidden;
  if (has(raw, 'scale')) result.scale = number(raw.scale, 1, 0.5, 2);
  return result;
}

function normalize(value) {
  const raw = record(value);
  const shelfIds = new Set();
  const itemIds = new Set();
  const shelves = (Array.isArray(raw.shelves) ? raw.shelves : [{}]).map((value, index) => {
    const shelf = record(value);
    return { id: uniqueId(shelf.id, `shelf-${index + 1}`, shelfIds), label: str(shelf.label), height: number(shelf.height, 160, 72, 480), look: choice(shelf.look, ['auto', 'none', 'line', 'wood', 'glass', 'soft', 'pixel'], 'auto') };
  });
  const items = (Array.isArray(raw.items) ? raw.items : []).map((value, index) => {
    const item = record(value);
    // The notebook namespace is reserved for automatically derived folders.
    const itemId = str(item.id).startsWith('notebook:') ? `item:${item.id}` : item.id;
    return { id: uniqueId(itemId, `item-${index + 1}`, itemIds), label: str(item.label), icon: icon(item.icon), target: target(item.target), shelfId: str(item.shelfId).trim(), scale: number(item.scale, 1, 0.5, 2) };
  });
  const order = [...new Set((Array.isArray(raw.order) ? raw.order : []).filter(id => typeof id === 'string' && id.trim()).map(id => id.trim()))];
  const notebookOverrides = Object.fromEntries(Object.entries(record(raw.notebookOverrides)).map(([id, value]) => [id, override(value)]));
  return {
    version: 1,
    iconSize: number(raw.iconSize, 96, 36, 240),
    gap: number(raw.gap, 16, 0, 48),
    layout: choice(raw.layout, ['shelves', 'grid', 'list'], 'shelves'),
    labelMode: choice(raw.labelMode, ['below', 'hover', 'hidden'], 'below'),
    fitMode: choice(raw.fitMode, ['fit', 'manual'], 'fit'),
    showNotebooks: raw.showNotebooks !== false,
    artStyle: choice(raw.artStyle, ['auto', 'modern', 'cute', 'minimal', 'natural', 'geek'], 'auto'),
    shelves, items, order, notebookOverrides,
  };
}

function deriveEntries(value, notebooks, legacyShelves = []) {
  const library = normalize(value);
  const entries = [];
  const seen = new Set();
  const legacy = new Map();
  const legacyOrder = [];
  if (!library.order.length && Array.isArray(legacyShelves)) legacyShelves.forEach((folders, index) => {
    if (!Array.isArray(folders)) return;
    folders.forEach(folder => {
      const path = vaultPath(folder);
      if (!path) return;
      const id = `notebook:${path}`;
      if (!legacyOrder.includes(id)) legacyOrder.push(id);
      if (library.shelves[index]) legacy.set(id, library.shelves[index].id);
    });
  });
  if (library.showNotebooks && Array.isArray(notebooks)) notebooks.forEach(value => {
    const notebook = record(value);
    const folder = vaultPath(notebook.folder);
    if (!folder) return;
    const id = `notebook:${folder}`;
    if (seen.has(id)) return;
    seen.add(id);
    const saved = library.notebookOverrides[id] || {};
    if (saved.hidden) return;
    entries.push({ id, label: has(saved, 'label') ? saved.label : str(notebook.label), icon: saved.icon || icon({kind:'book', type:'notebook'}), target: target({kind:'folder',path:folder}), shelfId: has(saved, 'shelfId') ? saved.shelfId : legacy.get(id) || '', scale: saved.scale || 1, notebook: true, notebookRecord: notebook });
  });
  entries.push(...library.items);
  const rank = new Map((library.order.length ? library.order : legacyOrder).map((id,index) => [id,index]));
  return entries.map((entry,index) => ({entry,index})).sort((a,b) => (rank.has(a.entry.id) ? rank.get(a.entry.id) : Infinity) - (rank.has(b.entry.id) ? rank.get(b.entry.id) : Infinity) || a.index-b.index).map(value => value.entry);
}

function calculateFit(options = {}) {
  const opts = record(options);
  const width = number(opts.width, 0, 0, 1000000);
  const height = number(opts.height, 0, 0, 1000000);
  const count = Math.floor(number(opts.count, 0, 0, 1000000));
  const min = Math.ceil(number(opts.minIconSize, 36, 1, 240));
  const requested = Math.max(min, Math.floor(number(opts.iconSize, 96, 1, 240)));
  const gap = number(opts.gap, 16, 0, 1000);
  const labelHeight = opts.labelMode === 'hidden' || opts.labelMode === 'hover' ? 0 : 24;
  const requestedRow = number(opts.rowHeight, requested + labelHeight, 0, 10000);
  const geometry = size => {
    const rowHeight = Math.max(size + labelHeight, Math.ceil(requestedRow * size / requested));
    const columns = count ? (opts.layout === 'list' ? 1 : Math.max(1, Math.floor((width + gap) / (size + gap)))) : 0;
    const rows = columns ? Math.ceil(count / columns) : 0;
    const requiredHeight = rows ? rows * rowHeight + (rows - 1) * gap : 0;
    const overflowX = count > 0 && size > width;
    const overflowY = requiredHeight > height;
    return {iconSize:size,rowHeight,columns,rows,overflowX,overflowY,requiredHeight,fitPossible:!overflowX && !overflowY};
  };
  for (let size = requested; size >= min; size--) {
    const result = geometry(size);
    if (result.fitPossible || size === min) return result;
  }
}

// Geometry used by the library renderer and Fit window. Keep the constants in
// this function aligned with CSS: tile padding 8x12, labels 32, title 24,
// plank 12, and an empty shelf drop area of 48 CSS pixels.
function calculateShelfFit(options = {}) {
  const opts = record(options);
  const library = normalize(opts.library);
  const entries = Array.isArray(opts.entries) ? opts.entries : [];
  const width = number(opts.width, 0, 0, 1000000);
  const height = number(opts.height, 0, 0, 1000000);
  const requested = library.iconSize;
  const minimum = Math.min(requested, Math.ceil(number(opts.minIconSize, 36, 1, 240)));
  const maxScale = entries.length ? entries.reduce((max, entry) => Math.max(max, number(record(entry).scale, 1, 0.5, 2)), 0.5) : 1;
  const shelves = library.layout === 'shelves'
    ? (library.shelves.length ? library.shelves : [{id:'',label:'',height:160,look:'none'}])
    : [{id:'',label:'',height:0,look:'none'}];
  const shelfIds = new Set(shelves.map(shelf => shelf.id));
  const groups = new Map(shelves.map(shelf => [shelf.id, []]));
  for (const entry of entries) {
    const id = library.layout === 'shelves' && shelfIds.has(record(entry).shelfId) ? entry.shelfId : shelves[0].id;
    groups.get(id).push(entry);
  }
  const geometry = size => {
    const largest = size * maxScale;
    const cellWidth = largest + 8;
    const columns = library.layout === 'list' ? 1 : Math.max(1, Math.floor((width + library.gap) / (largest + 8 + library.gap)));
    const labelReserved = library.labelMode === 'below' ? 32 : 0;
    const regions = shelves.map(shelf => {
      const count = groups.get(shelf.id).length;
      const rows = Math.ceil(count / columns);
      let rowHeight;
      if (!count) rowHeight = 48;
      else if (library.layout === 'list') rowHeight = Math.max(48, largest + 12);
      else if (library.layout === 'shelves') rowHeight = Math.max(largest + labelReserved + 12, shelf.height * (library.fitMode === 'fit' ? size / requested : 1));
      else rowHeight = largest + labelReserved + 12;
      const title = library.layout === 'shelves' && shelf.label ? 24 : 0;
      const plank = library.layout === 'shelves' && shelf.look !== 'none' ? 12 : 0;
      const emptyHeight = library.layout === 'shelves' ? 48 : 0;
      const requiredHeight = (rows ? rows * rowHeight + (rows - 1) * library.gap : emptyHeight) + title + plank;
      return {id:shelf.id,rows,rowHeight,requiredHeight};
    });
    const requiredHeight = regions.reduce((sum, region) => sum + region.requiredHeight, 0) + Math.max(0, regions.length - 1) * library.gap;
    const overflowX = entries.length > 0 && largest + 16 > width;
    const overflowY = requiredHeight > height;
    return {iconSize:size,cellWidth,columns,regions,requiredHeight,fitPossible:!overflowX && !overflowY,overflowX,overflowY};
  };
  let candidate = requested;
  for (;;) {
    const result = geometry(candidate);
    if (library.fitMode === 'manual' || result.fitPossible || candidate === minimum) return result;
    candidate = Math.max(minimum, candidate - 1);
  }
}
function renamePaths(value, oldPath, newPath) {
  const library = normalize(value);
  const oldValue = vaultPath(oldPath);
  const newValue = vaultPath(newPath);
  if (!oldValue || !newValue) return library;
  const rename = path => path === oldValue || path.startsWith(`${oldValue}/`) ? newValue + path.slice(oldValue.length) : path;
  const renameId = id => id.startsWith('notebook:') ? `notebook:${rename(id.slice(9))}` : id;
  library.items.forEach(item => {
    if (item.target && ['file', 'folder'].includes(item.target.kind)) item.target.path = rename(item.target.path);
    if (item.icon.src) item.icon.src = rename(item.icon.src);
  });
  library.order = library.order.map(renameId);
  library.notebookOverrides = Object.fromEntries(Object.entries(library.notebookOverrides).map(([id,saved]) => {
    if (saved.icon && saved.icon.src) saved.icon.src = rename(saved.icon.src);
    return [renameId(id),saved];
  }));
  return normalize(library);
}

function moveEntry(value, id, beforeId, shelfId) {
  const library = normalize(value);
  const isNotebook = typeof id === 'string' && id.startsWith('notebook:');
  const item = library.items.find(entry => entry.id === id);
  if ((!item && !isNotebook) || id === beforeId) return library;
  // Keep omitted item ids reachable when the first drag establishes an order.
  const order = [...new Set([...library.order, ...library.items.map(entry => entry.id)])].filter(entry => entry !== id);
  const index = order.indexOf(beforeId);
  order.splice(index < 0 ? order.length : index, 0, id);
  library.order = order;
  if (typeof shelfId === 'string' && (!shelfId || library.shelves.some(shelf => shelf.id === shelfId))) {
    if (item) item.shelfId = shelfId;
    else Object.defineProperty(library.notebookOverrides, id, {value:{...library.notebookOverrides[id],shelfId},enumerable:true,writable:true,configurable:true});
  }
  return library;
}

function remapProfileTargets(value, sourceId, targetId) {
  const library = normalize(value);
  const canonical = id => str(id).trim() || '__current__';
  const source = canonical(sourceId);
  const destination = canonical(targetId);
  for (const item of library.items) {
    if (item.target?.kind === 'panel' && canonical(item.target.profileId) === source) item.target.profileId = destination;
  }
  return library;
}
module.exports = { normalize, deriveEntries, calculateFit, calculateShelfFit, renamePaths, moveEntry, remapProfileTargets };


