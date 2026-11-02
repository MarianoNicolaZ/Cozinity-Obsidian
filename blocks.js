/* ============================================================
   Cozy Nest · Bloques — esqueleto JS vanilla
   Guardar como blocks.js y cargar desde main.js del plugin.
   ============================================================ */

(function () {
  'use strict';

  // --- Config -----------------------------------------------------
  const GRID_UNIT_W_COLS = 6;   // columnas del grid
  const GRID_UNIT_H_PX   = 80;  // alto de fila en px
  const MIN_BW = 2, MIN_BH = 2, MAX_BW = 6, MAX_BH = 8;

  const COLOR_SWATCHES = [
    '',                         // default (sin custom)
    'var(--cozy-accent)',
    'var(--cozy-accent-2)',
    'var(--cozy-accent-3)',
    'var(--cozy-group-1)',
    'var(--cozy-group-2)',
    'var(--cozy-group-3)',
    'var(--cozy-chip-bg)',
    'var(--cozy-panel-bottom)',
    'var(--cozy-calendar-today)',
  ];

  // --- API principal ----------------------------------------------
  // Llamar desde main.js para activar interacciones en un grid ya
  // renderizado. Grid = elemento .cozy-dash-grid con .cozy-block adentro.
  window.CozyBlocks = {
    init(gridEl, opts = {}) {
      this.onChange = opts.onChange || (() => {});
      gridEl.querySelectorAll('.cozy-block').forEach(b => this.attach(b));
      return this;
    },

    attach(block) {
      attachDrag(block, this);
      attachResize(block, this);
      attachColorPicker(block, this);
      attachInlineEdit(block, this);
    },

    save(block) {
      this.onChange({
        id:    block.dataset.id,
        type:  block.dataset.blockType,
        w:     +block.style.getPropertyValue('--bw') || MIN_BW,
        h:     +block.style.getPropertyValue('--bh') || MIN_BH,
        title: block.querySelector('.cozy-block__title')?.textContent?.trim() || '',
        color: block.style.getPropertyValue('--cozy-panel-custom-bg') || '',
      });
    },
  };

  // --- Drag (mover) ------------------------------------------------
  function attachDrag(block, ctl) {
    const grip = block.querySelector('.cozy-block__grip');
    if (!grip) return;

    grip.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const grid = block.parentElement;
      const ghost = block.cloneNode(true);
      ghost.style.opacity = '0.45';
      ghost.style.pointerEvents = 'none';
      block.style.visibility = 'hidden';
      grid.appendChild(ghost);

      const move = (ev) => {
        const target = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.cozy-block');
        if (target && target !== block && target !== ghost) {
          grid.insertBefore(block, target);
        }
      };
      const up = () => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        ghost.remove();
        block.style.visibility = '';
        ctl.save(block);
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    });
  }

  // --- Resize (esquina) --------------------------------------------
  function attachResize(block, ctl) {
    const handle = block.querySelector('.cozy-block__resize');
    if (!handle) return;

    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const grid = block.parentElement;
      const rect = grid.getBoundingClientRect();
      const colWidth = rect.width / GRID_UNIT_W_COLS;
      const startX = e.clientX, startY = e.clientY;
      const startBw = +block.style.getPropertyValue('--bw') || MIN_BW;
      const startBh = +block.style.getPropertyValue('--bh') || MIN_BH;

      const move = (ev) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        const bw = clamp(Math.round(startBw + dx / colWidth), MIN_BW, MAX_BW);
        const bh = clamp(Math.round(startBh + dy / GRID_UNIT_H_PX), MIN_BH, MAX_BH);
        block.style.setProperty('--bw', bw);
        block.style.setProperty('--bh', bh);
      };
      const up = () => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        ctl.save(block);
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    });
  }

  // --- Color picker -----------------------------------------------
  function attachColorPicker(block, ctl) {
    const dot = block.querySelector('.cozy-block__dot');
    if (!dot) return;

    let pop = block.querySelector('.cozy-block__color-popover');
    if (!pop) {
      pop = document.createElement('div');
      pop.className = 'cozy-block__color-popover';
      pop.innerHTML = COLOR_SWATCHES.map(c => {
        const bg = c || 'transparent';
        const label = c ? '' : '×';
        return `<button type="button" data-color="${c}" style="background:${bg}">${label}</button>`;
      }).join('');
      block.appendChild(pop);
    }

    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      pop.classList.toggle('open');
    });
    document.addEventListener('click', () => pop.classList.remove('open'));

    pop.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const color = btn.dataset.color || '';
      if (color) block.style.setProperty('--cozy-panel-custom-bg', color);
      else block.style.removeProperty('--cozy-panel-custom-bg');
      ctl.save(block);
      pop.classList.remove('open');
    });
  }

  // --- Inline edit del título -------------------------------------
  function attachInlineEdit(block, ctl) {
    const title = block.querySelector('.cozy-block__title');
    if (!title) return;

    title.setAttribute('contenteditable', 'true');
    title.setAttribute('spellcheck', 'false');

    title.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); title.blur(); }
    });
    title.addEventListener('blur', () => ctl.save(block));
  }

  // --- Helpers -----------------------------------------------------
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  /* ============================================================
     Renderers por tipo — stubs
     Cada uno completa el .cozy-block__body usando los data-* attrs
     del bloque. Implementalos leyendo el vault de Obsidian.
     ============================================================ */
  window.CozyBlockRenderers = {
    /* HTML esperado:
       <div class="cozy-block" data-block-type="md" data-path="ruta.md"> */
    async md(block, { app }) {
      const body = block.querySelector('.cozy-block__body');
      const path = block.dataset.path;
      const file = app.vault.getAbstractFileByPath(path);
      if (!file) { body.textContent = '— nota no encontrada —'; return; }
      const md = await app.vault.read(file);
      // Obsidian MarkdownRenderer: renderizá acá.
      body.textContent = md.slice(0, 600);
      if (!block.querySelector('.md-footer')) {
        const f = document.createElement('div');
        f.className = 'md-footer';
        f.innerHTML = `<span>→ ${path}</span><span>edit</span>`;
        block.appendChild(f);
      }
    },

    /* <div class="cozy-block" data-block-type="pomodoro"
            data-duration="1500" data-remaining="1122"> */
    pomodoro(block) {
      const body = block.querySelector('.cozy-block__body');
      const total = +block.dataset.duration || 1500;
      const rem   = +block.dataset.remaining || total;
      const pct   = Math.round(100 - (rem / total) * 100);
      const mm = String(Math.floor(rem / 60)).padStart(2, '0');
      const ss = String(rem % 60).padStart(2, '0');
      body.innerHTML = `
        <div class="pomo-ring" data-time="${mm}:${ss}" style="--p:${pct}"></div>
        <div class="pomo-controls">
          <button data-act="play">▶ play</button>
          <button data-act="pause">⏸ pause</button>
          <button data-act="reset">↺ reset</button>
        </div>
      `;
    },

    /* <div class="cozy-block" data-block-type="gallery" data-folder="assets/img"> */
    async gallery(block, { app }) {
      const body = block.querySelector('.cozy-block__body');
      const folder = block.dataset.folder || '';
      const files = app.vault.getFiles()
        .filter(f => f.path.startsWith(folder) && /\.(png|jpg|jpeg|webp|gif)$/i.test(f.path))
        .slice(0, 24);
      body.innerHTML = files.map(f =>
        `<div><img src="${app.vault.getResourcePath(f)}" alt=""></div>`
      ).join('') || '<em>— sin imágenes —</em>';
    },

    /* <div class="cozy-block" data-block-type="embed" data-note="ruta.md"> */
    async embed(block, { app }) {
      const body = block.querySelector('.cozy-block__body');
      const path = block.dataset.note;
      const file = app.vault.getAbstractFileByPath(path);
      if (!file) { body.textContent = '— nota no encontrada —'; return; }
      const md = await app.vault.read(file);
      const first = md.split('\n').slice(0, 6).join('\n');
      body.innerHTML = `
        <div>${first.replace(/</g,'&lt;')}</div>
        <div class="embed-meta">
          <span class="embed-tag">work</span>
          <span class="embed-tag">retro</span>
          <span style="margin-left:auto">→ ${path}</span>
        </div>
      `;
    },

    /* <div class="cozy-block" data-block-type="kanban" data-source="Notas/tareas.md"> */
    async kanban(block, { app }) {
      const body = block.querySelector('.cozy-block__body');
      const path = block.dataset.source;
      const file = app.vault.getAbstractFileByPath(path);
      if (!file) { body.textContent = '— archivo no encontrado —'; return; }
      const md = await app.vault.read(file);

      // Parseá por headings: "## To-do", "## Doing", "## Done"
      const cols = { 'to-do': [], 'doing': [], 'done': [] };
      let cur = null;
      for (const line of md.split('\n')) {
        const h = line.match(/^##\s+(to-do|doing|done)\s*$/i);
        if (h) { cur = h[1].toLowerCase(); continue; }
        const t = line.match(/^-\s*\[[ x]\]\s+(.+)$/);
        if (t && cur) cols[cur].push(t[1]);
      }
      body.innerHTML = Object.entries(cols).map(([name, items]) => `
        <div class="kanban-col">
          <h4>${name}</h4>
          ${items.map(t => `<div class="kanban-card" draggable="true">${t}</div>`).join('')}
        </div>
      `).join('');
    },

    /* <div class="cozy-block" data-block-type="links" data-links='[{...}]'> */
    links(block) {
      const body = block.querySelector('.cozy-block__body');
      let items = [];
      try { items = JSON.parse(block.dataset.links || '[]'); } catch (e) {}
      body.innerHTML = items.map(it => {
        const host = (() => { try { return new URL(it.url).host; } catch { return 'vault'; } })();
        return `<a class="link-row" href="${it.url}">
          <span class="fav"></span>
          <span>${it.title || it.url}</span>
          <span class="host">${host}</span>
        </a>`;
      }).join('');
    },
  };

})();
