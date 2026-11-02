# Medios de Cozinity / Cozinity media

## GIF aportado por el autor / Author-provided GIF

[cozinity-dashboard-demo.gif](cozinity-dashboard-demo.gif): grabación aportada y autorizada para la página principal e instrucciones; muestra una versión anterior en Obsidian. / Recording supplied and authorized for the homepage and instructions; shows an earlier version in Obsidian.

1922 × 1082 · 255 frames · 10.37 s · original unchanged. This recording is separate from the fictional browser demonstrations below. / Esta grabación es distinta de las demos ficticias de navegador que siguen.

[Inicio ES](../../README.es.md) · [English home](../../README.md)

## Castellano

Demostraciones de **Cozinity 0.1.9** para revisión privada. Son capturas de navegador con datos ficticios, no de un vault personal ni de una sesión real de Obsidian.

| Archivo | Contenido | Tamaño de imagen |
| --- | --- | --- |
| [overview-es.png](overview-es.png) | Vista general en castellano: accesos/cuadernos, timer, Base y nota | 1200 × 920 |
| [overview-en.png](overview-en.png) | La misma composición con interfaz en inglés | 1200 × 920 |
| [dashboards.gif](dashboards.gif) | Clics para alternar Estudio, Habitación y Enfoque | 960 × 736 |
| [windows.gif](windows.gif) | Abrir carpeta, abrir nota en flotante, Volver y cerrar | 960 × 736 |
| [recovery.gif](recovery.gif) | Guardar punto, cambiar texto en Personalizar, restaurar, deshacer y rehacer | 960 × 736 |

Los GIF duran aproximadamente 7–9 segundos y pesan menos de 1.5 MB cada uno en esta captura. Se capturaron fotogramas reales durante las interacciones; no se dibujaron transiciones ni se montaron pantallas inventadas. La reducción a 960 px y la paleta GIF pueden suavizar texto y colores respecto de los PNG.

### Qué es real y qué se simula

- **Real:** `main.js`, `styles.css`, render completo del dashboard, perfiles, biblioteca de accesos, timer, habitación y sus objetos, navegación flotante, Personalizar, recuperación y acciones de historial.
- **Recursos reales del paquete:** temas Lo-fi Cafe, Stardew Cozy y Minimal OS, portadas y atlas de objetos existentes; no se descargaron imágenes ni se generó arte nuevo para estas demos.
- **Simulado:** APIs de Obsidian, archivos/carpetas y persistencia en memoria, contenido Markdown y tabla de Bases. La tabla no ejecuta el motor real de Bases. Se usa el fixture de navegador existente del repositorio, que carga CSS nativo local si está disponible y, en caso contrario, un estilo portátil de respaldo. La entrega no redistribuye la aplicación ni su CSS; la superficie nativa simulada puede variar al reproducir sin ese archivo local.
- El marco exterior con versión y aviso de demo pertenece a la presentación de captura. El menú y la cruz genérica del modal representan los límites nativos simulados; las acciones disparadas son las del plugin.

Se bloquean operaciones de creación, modificación, renombre y borrado del vault simulado. No se abre Obsidian ni se leen notas/configuración personal. El buen resultado de estas demos no certifica compatibilidad de integraciones en la aplicación real.

### Reproducir

Desde el repositorio fuente, con Node, el módulo `playwright`, Microsoft Edge y FFmpeg disponibles:

```text
node scripts/capture-private-demo.cjs
```

`NODE_PATH` puede señalar la instalación local de dependencias. `FFMPEG_PATH` permite indicar el ejecutable. `COZY_MEDIA_WORK` elige una carpeta temporal para fotogramas e informe; sin ella se usa la carpeta temporal del sistema. `COZY_MEDIA_PREVIEW_ONLY=1` genera solo la vista previa ES. El script escribe los medios en `docs/media/`, sin modificar runtime o datos de usuario. El informe temporal registra fotogramas, duración aproximada, bytes y SHA-256 del runtime/CSS usados.

### Procedencia y licencia

Se reutilizan los recursos ya incluidos en el repositorio, cuya licencia principal es [MIT](../../LICENSE). La documentación histórica de arte identifica generación previa con Image Gen para los atlas de objetos. Estas demos no incorporan assets oficiales descargados de videojuegos ni material nuevo de terceros. Los nombres de integraciones y temas no implican afiliación; este registro no reemplaza la revisión de procedencia antes de una publicación pública.

## English

These are private-review demonstrations of **Cozinity 0.1.9**, captured in a browser with fictional data. They are not screenshots of a personal vault or a live Obsidian session.

The PNGs show Spanish/English overviews at 1200 × 920. The 960 × 736 GIFs demonstrate dashboard switching, folder/note floating navigation, and saving/restoring a recovery point with undo/redo. They run for roughly 7–9 seconds and are under 1.5 MB each for this capture. Frames record actual interactions; there are no fabricated screen transitions. GIF scaling/palette reduction can soften text and colors.

Production `main.js`, `styles.css`, theme packs, notebook/object art and complete dashboard renderers are used. Obsidian APIs, vault files, memory persistence, Markdown contents and the native Bases table are simulated through the repository's existing browser fixture. The Bases engine is not running. The existing fixture uses local native CSS when available and a portable fallback otherwise; the application/native CSS is not redistributed, and that simulated surface can vary when reproduced without the local file. The outer version/demo banner is capture presentation; generic menu/modal chrome is part of the simulated native boundary. Plugin actions behind those controls are real.

No real Obsidian session is opened, no personal notes/settings are read, and simulated vault writes are blocked. This evidence does not certify third-party integration behavior in real Obsidian.

Reproduce from the source repository with Node, Playwright, Edge and FFmpeg using the command above. Optional environment variables are `NODE_PATH`, `FFMPEG_PATH`, `COZY_MEDIA_WORK` and `COZY_MEDIA_PREVIEW_ONLY`. Output media go to `docs/media/`; temporary frames and the runtime/CSS hash report go to the selected work directory or system temporary directory.

The existing bundled assets are reused under the repository's main [MIT license](../../LICENSE); historical artwork notes document earlier Image Gen creation of object atlases. No new remote images or official downloaded game assets are introduced by this capture script. Integration/theme names imply no affiliation, and this provenance note does not replace a pre-publication asset review.
