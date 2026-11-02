# Cozinity changelog / Registro de cambios

## 0.1.11 — Private review / Revisión privada — 2026-11-01

- ES: Miniaturas en el selector de imágenes del vault para fondos del tablero y barra superior, con nombre, ruta y símbolo de respaldo si la vista previa no carga. Se conserva la búsqueda y selección nativas.
- EN: Vault image picker thumbnails for board and top-bar backgrounds, with filenames, paths and a fallback for unavailable previews. Native searching and selection are retained.

## 0.1.10 — Private review / Revisión privada — 2026-11-01

### Castellano

- Enviar una nota o Base desde la flotante al dashboard como ventana vinculada; se conserva el archivo original y la vista de Base seleccionada.
- Fondo predeterminado fijo al ancho, alineado arriba y repetido hacia abajo, estable al crecer el tablero.
- Alternativa Cubrir y ampliar en Personalizar; elección independiente por dashboard, compatible con Deshacer y exportación/importación.

### English

- Send a note or Base from the floating view to a linked dashboard window, preserving the original file and selected Base view.
- Default board image fixed to width, top-aligned and repeated downward, stable when the board grows.
- Cover and expand alternative under Customize; per-dashboard choice with Undo and configuration export/import.

## 0.1.9 — Private review / Revisión privada — 2026-11-01

### Castellano

- Marca visible Cozinity, conservando el ID de instalación y configuraciones existentes.
- Aperturas nativas cancelables y con límite por intento; recuperación de consultas tardías, cierre y cambio de ventanas flotantes.
- Una sola ruta de carga para notas editables; editor de respaldo bloqueado si falla la lectura y escrituras serializadas para conservar el texto más reciente.
- Recuperación de cachés de tareas y límite de espera opcional para TaskNotes.
- Contexto y posiciones de scroll compartidos al actualizar varias ventanas.
- Ocho controles duplicados de apariencia concentrados en Personalizar.
- Interfaz propia y errores en español/inglés, con protección del contenido y nombres del usuario.
- Guías, solución de problemas, informe de revisión y demos ficticias en ambos idiomas.
- Repositorio privado y paquete completo para prueba manual antes de compartir públicamente.

### English

- Visible Cozinity branding while retaining the installation ID and existing settings.
- Cancellable native loads with per-attempt limits; late-query, floating-navigation and close recovery.
- One loading path for editable notes; failed reads keep the fallback editor disabled and serialized writes preserve newer text.
- Recoverable task caches and bounded optional TaskNotes reads.
- Shared render context and scroll positions across window refresh batches.
- Eight duplicate appearance controls consolidated in Customize.
- Plugin-owned UI and errors in Spanish/English, preserving user names and native content.
- Guides, troubleshooting, review report and fictional demonstrations in both languages.
- Private repository and complete manual-test package before public sharing.

## Earlier installations / Instalaciones anteriores

This clean review repository starts at 0.1.9. Existing 0.1.8 dashboards remain compatible; keep your installation's `data.json` when updating. / Este repositorio de revisión comienza en 0.1.9. Los dashboards 0.1.8 siguen siendo compatibles; conservá el `data.json` de tu instalación al actualizar.
