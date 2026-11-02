# Revisión privada de Cozinity / Beta testing

[Inicio ES](README.es.md) · [English home](README.md)

**0.1.11 · escritorio / desktop · beta pública con validación nativa pendiente / public beta with native validation pending.**

## Castellano

Usa un vault limpio con datos ficticios y respaldo completo. La beta pública no significa que todas las versiones de Obsidian o plugins estén certificadas. Las demostraciones de navegador usan renderers reales con límites nativos simulados; no sustituyen estas pruebas en la aplicación.

### Recorrido recomendado

- [ ] Instalar el ZIP completo en `.obsidian/plugins/cozynity/`; comprobar nombre Cozinity y versión 0.1.11.
- [ ] Confirmar modo seguro inicial; navegar notas existentes sin habilitar creación.
- [ ] Cambiar Castellano/English en Personalizar → Avanzado; revisar encabezado, menús, ventanas y ajustes sin cambiar el texto de notas.
- [ ] Crear un Escritorio y una Habitación; alternar botones, renombrar y guardar una copia; recargar y comprobar persistencia.
- [ ] Agregar, mover, dimensionar y cerrar ventanas; probar escritorio estrecho y ancho, teclado y menús.
- [ ] Crear accesos de nota/carpeta/etiqueta; probar edición, estantes, búsqueda, ajuste de altura y arrastre que crea referencias sin mover archivos.
- [ ] Escribir un borrador ficticio, cambiar de espacio y recargar; confirmar que permanece. Exportarlo antes de probar cierre/reset.
- [ ] Probar favoritos en Recientes, calendario y tareas Markdown.
- [ ] Cambiar temas, Claro/Oscuro, fuente y opacidad global; probar override por ventana y regreso a 100 %. Comprobar Ajustes → Cozinity → Apariencia del dashboard → Abrir Personalizar y Recargar temas; verificar que las opciones únicas avanzadas sigan accesibles.
- [ ] Decorar un ambiente, mover/girar objetos compatibles, vincular carpeta/tag y abrir inventario; quitar un objeto y confirmar que su carpeta sigue existiendo.
- [ ] Abrir nota/carpeta/tag en la flotante, Volver, Escape y Abrir en pestaña.
- [ ] Con funciones correspondientes activas, integrar `.base`, `.canvas`, TaskNotes, Notion Bases y Task Genius disponibles; cambiar pestaña/espacio y volver.
- [ ] Ocultar/mostrar controles de Bases/TaskNotes y comprobar que no pierde filtros/vista.
- [ ] Probar timer local, cuenta regresiva/cronómetro y tres diseños. Solo en tareas ficticias, probar TaskNotes vinculado: registra tiempo y puede completar la tarea, aun con modo seguro.
- [ ] Guardar un punto, cambiar distribución, deshacer/rehacer y restaurar; recargar para confirmar punto persistente e historial de sesión vacío.
- [ ] Exportar JSON, importar como copias, comprobar nombres repetidos y vínculos internos; confirmar que no reemplaza tableros existentes.
- [ ] Eliminar y recuperar un dashboard ficticio; comprobar borrador, ventanas y punto tras recargar. Probar el último dashboard solo en el vault de prueba.
- [ ] Desactivar una integración de prueba, comprobar mensaje/reintento local y activar de nuevo. Durante una carga pendiente, probar cerrar la flotante o abrir otro destino sin quedar bloqueado; comprobar que resultados tardíos no sustituyan el destino actual.
- [ ] Habilitar escritura solo si quieres probar crear notas, guardar borrador, editar tarea o mover archivo con confirmación. Comprobar las rutas y cambios reales.

El permiso de Cozinity no es un sandbox de otros plugins, comandos ni vistas nativas. Para una comparación sin cambios, conserva una copia anterior del vault; no confíes únicamente en el modo seguro.

### Informar un problema

Copia esta ficha y abre un issue con información que puedas compartir públicamente. No publiques contenido personal ni un `data.json` sin revisar.

```text
Cozinity / Obsidian / SO:
Versiones de integraciones implicadas:
Idioma / tema / Claro-Oscuro / opacidad:
Modo seguro activo o edición permitida:
Vault limpio o copia; tipo de archivo/ventana:
Pasos para reproducir:
Resultado esperado:
Resultado real:
Frecuencia; persiste después de recargar:
Error de consola o informe de diagnóstico depurado:
Captura o GIF con datos ficticios:
```

Diagnóstico: ⋮ → Diagnóstico → Iniciar registro, reproduce y vuelve para Actualizar/Copiar informe. Es temporal, optativo y limitado a 200 eventos; revisa metadatos/errores antes de compartir. No mide CPU/GPU/RAM/FPS. Registra por separado si una prueba fue automatizada de navegador o realizada en Obsidian real.

Antes de proponer una versión estable: revisar evidencia, resolver fallos relevantes y completar las pruebas nativas. El repositorio público no implica que estas pruebas hayan terminado.

## English

Use a clean vault with fictional data and a full backup. This public beta does not certify every Obsidian/plugin version. Browser demonstrations use production renderers with simulated native boundaries and do not replace real-app testing.

### Recommended checks

- [ ] Install the complete ZIP in `.obsidian/plugins/cozynity/`; confirm Cozinity name/version 0.1.11 and initial Safe Mode.
- [ ] Switch English/Spanish; inspect header, menus, windows and settings without translating note contents.
- [ ] Create Desk/Room spaces; switch buttons, rename, save a copy and check persistence after reload.
- [ ] Add/move/resize/close windows in wide/narrow views and with keyboard controls.
- [ ] Create note/folder/tag shortcuts; edit shelves, search, fit content and confirm library drops create references without moving files.
- [ ] Keep a fictional draft across space switches/reload; export before testing removal/reset.
- [ ] Check recent/favorites, calendar and Markdown tasks.
- [ ] Check themes, native Light/Dark, fonts, global/window opacity overrides and return to 100%. Check Settings → Cozinity → Dashboard appearance → Open Customize and Reload themes; verify unique advanced settings remain accessible.
- [ ] Decorate, rotate supported furniture, bind a folder/tag and use inventory; remove an object without removing its source folder.
- [ ] Check floating navigation, Back, Escape and explicit Open in tab.
- [ ] Test available Bases/Canvas/TaskNotes/Notion Bases/Task Genius native windows, hiding/showing toolbars and returning after tab/space switches.
- [ ] Test local countdown/stopwatch and all three layouts. Test linked TaskNotes only with disposable tasks: tracking/completion may write even in Safe Mode.
- [ ] Save a recovery point; change layout, undo/redo, restore; reload and verify persistent point versus empty session history.
- [ ] Export/import as copies, duplicate names and internal links; confirm existing spaces remain.
- [ ] Delete/restore a fictional dashboard and verify windows/draft/recovery point after reload. Test last-dashboard removal only in the test vault.
- [ ] Disable an optional integration and check local recovery messaging, then enable it again. During a pending load, close the overlay or open another destination; confirm it stays responsive and late results do not replace the current destination.
- [ ] Intentionally enable editing only for file creation, draft-to-note, task edits and confirmed file moves; inspect real destinations/changes.

Cozinity's guard is not a sandbox for other plugins, commands or native views. Keep an independent pre-test vault copy for comparisons.

### Feedback template

```text
Cozinity / Obsidian / operating system:
Relevant integration versions:
Language / theme / Light-Dark / opacity:
Safe Mode or editing permission:
Clean/copied vault; file/window type:
Steps to reproduce:
Expected behavior:
Actual behavior:
Frequency; still occurs after reload:
Sanitized console error or diagnostics:
Screenshot/GIF with fictional data:
```

Open an issue using information you can share publicly. Do not share personal notes or unchecked `data.json`. For diagnostics: ⋮ → Diagnostics → Start recording, reproduce, then Refresh/Copy report. Recording is opt-in, in memory and capped at 200 events; review metadata/errors. It is not CPU/GPU/RAM/FPS profiling. State whether evidence comes from browser automation or real Obsidian.

Before proposing a stable release, review evidence, fix material failures and complete native tests. The public repository does not imply these tests have been completed.
