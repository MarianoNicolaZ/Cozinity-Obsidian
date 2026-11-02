# Solución de problemas de Cozinity

[Inicio](../../README.es.md) · [Guía](GUIA_DE_USO.md) · [English](../en/TROUBLESHOOTING.md)

Beta pública 0.1.9. Conserva una copia del vault y del `data.json` del plugin antes de resetear/reinstalar. La exportación de configuración ayuda, pero no contiene archivos ni todos los registros de recuperación.

## El plugin no aparece, está desactivado o muestra otra versión

1. Usa Obsidian de escritorio y habilita plugins comunitarios.
2. Comprueba `.obsidian/plugins/cozynity/manifest.json`, directamente al lado de `main.js` y `styles.css`, sin otra carpeta de versión anidada.
3. Conserva carpeta/ID histórico `cozynity`; el nombre visible es Cozinity. Busca instalaciones antiguas duplicadas antes de activar una.
4. Usa el ZIP privado completo. Recarga el plugin o reinicia Obsidian después de guardar tu trabajo.
5. Revisa la versión del manifiesto instalado. Si falla la carga, recoge el error de consola antes de resetear.

El mínimo declarado es Obsidian 1.5.0; las funciones nativas posteriores requieren una versión que las incluya. Móvil y distribución por el catálogo oficial quedan fuera de esta entrega.

## Faltan temas, iconos u objetos

Comprueba que `assets/` y `themes/` estén completos junto al runtime y conserva los módulos acompañantes. Usa **Ajustes → Cozinity → Apariencia del dashboard → Recargar temas** y vuelve a abrir la vista. **Abrir Personalizar** lleva al diálogo de apariencia; se quitaron campos duplicados sin borrar sus valores guardados. Comprueba que existan las imágenes referenciadas del vault. Si falta arte de un objeto, puede mostrar un reemplazo sin perder su destino guardado.

No cambies el ID ni borres `data.json` por un recurso ausente. Una instalación limpia separada permite distinguir problemas de paquete y configuración.

## No aparecen cuadernos/accesos o resultados

Revisa **Raíz de cuadernos** y carpetas reales. Vacío detecta las principales; la vista clásica puede excluir ocultas/journals. Un acceso puede estar oculto o filtrado: limpia la búsqueda, revisa estantes o usa Cuadernos clásicos. La búsqueda superior coincide con rutas/nombres Markdown y muestra una lista corta; no es búsqueda de todo el contenido. Un dashboard copiado sigue necesitando los archivos referenciados en este vault.

## No permite crear, mover o editar tareas

Las instalaciones nuevas activan modo seguro. **Personalizar → Avanzado → Permitir crear y editar notas** habilita las operaciones propias. **Modo seguro** en ajustes expresa lo inverso. Revisa carpetas/plantillas antes de habilitar escritura.

Esto no bloquea globalmente Obsidian, vistas nativas, comandos ni relojes vinculados a TaskNotes. Cambiarlo tampoco resuelve plugins ausentes o permisos del sistema de archivos.

## Vista nativa vacía, cargando o ausente de Agregar ventana

- Activa el plugin principal/comunitario y abre primero el destino normalmente.
- Bases: comprueba que esté activo y que el `.base` funcione en una pestaña normal.
- TaskNotes: abre tareas para crear/configurar sus `.base` y activa Bases.
- Notion Bases: crea/abre la base local y elige `_database.md` o su pestaña.
- Task Genius: activa `obsidian-task-progress-bar`; la vista depende de su configuración.
- Canvas: abre un `.canvas` y arrastra archivo/pestaña al tablero; no necesita aparecer como elemento independiente en Agregar ventana.
- Web: activa Web viewer de Obsidian o usa la salida explícita al navegador externo.

Usa **Reintentar** cuando aparezca o **Abrir en pestaña** para aislar la integración. Una carga visible de unos 12 segundos puede ofrecer reintento local; el tiempo oculto no consume ese plazo. Evita agregar copias mientras la original carga.

Esta entrega permite cancelar cargas nativas pendientes y limita cada intento a unos 15 segundos. Cerrar una flotante o abrir otro destino no necesita esperar la carga anterior. Las consultas tardías visibles se siguen comprobando aproximadamente cada segundo; los resultados obsoletos no deberían sustituir una ventana nueva. Los eventos compartidos de navegación reducen manejo repetido al agregar paneles. Son mejoras puntuales de recuperación, no una garantía de que vistas de terceros o peticiones de red nunca fallen.

Muestra la barra de Bases/TaskNotes desde **⋮** si está oculta. El título/ruta externos pueden estar suprimidos intencionalmente. Estas vistas usan APIs que cambian: informa las versiones exactas de Obsidian y de la integración.

## No coincide transparencia o fuente

Un valor por ventana tiene prioridad sobre el global. Limpia esa elección para seguir el valor general. A 100 % vuelven las superficies opacas. Selección, edición, deshabilitado y encabezados fijos pueden conservar contraste nativo. Claro/Oscuro cambia el modo global de Obsidian. Las fuentes pueden usar alternativas si no están instaladas.

## El temporizador no registra en TaskNotes

Comprueba que existan tarea y plugin activo. El reloj local funciona sin TaskNotes; registrar/completar depende de su API y versión. La consulta opcional de tareas deja de esperar tras unos 8 segundos; comprueba TaskNotes y reintenta. Las lecturas fallidas o rechazadas pueden volver a intentarse y las respuestas obsoletas se descartan, sin sustituir resultados más recientes. Esto no certifica todas las versiones de TaskNotes. La cuenta regresiva vinculada completa a cero si se admite; el cronómetro no lo hace. Revisa TaskNotes antes de confiar en su registro. Para pruebas sin escritura, no vincules tareas aunque tengas modo seguro activo.

## Falla una página, embed o imagen remota

Algunos sitios impiden integrarse, piden login o dependen de restricciones de red/navegador. Prueba la URL en Web viewer normal y navegador externo. Multimedia reconoce enlaces compatibles de YouTube/Spotify o la URL de su código de integración, no HTML arbitrario. La imagen web debe responder como raster compatible: no se aceptan SVG ni páginas que no sean imágenes; el límite de datos importados es 25 MB. Guardar una importación necesita permiso; un enlace común no copia automáticamente el remoto al vault.

## Parece faltar un cambio, dashboard o borrador

Comprueba el botón del espacio activo. Busca tableros quitados en **⋮ → Dashboards eliminados**. Para distribución/apariencia usa Deshacer de sesión o un punto guardado. El historial desaparece al recargar y no restaura texto de notas ni ediciones de biblioteca.

Importa una exportación anterior como copias para inspeccionarla sin reemplazar tus espacios. Recupera contenido real desde respaldo del vault o las funciones de recuperación de Obsidian. Si puede sobrescribirse un archivo, deja de editarlo y conserva el original antes de investigar. Reset no es recuperación: borra el estado del plugin, incluidos borradores y registros de recuperación.

## Se rechaza la importación

Usa una exportación de configuración sin modificar, no un JSON cualquiera ni `data.json` directo. Se admite versión 1, hasta 10 MB, 100 perfiles y 500 ventanas por perfil. Una copia válida muestra nombres antes de **Agregar dashboards de la copia**. Conserva los espacios actuales, idioma y permiso local. No restaura imágenes/notas ausentes.

## Diagnosticar un problema reproducible

1. Abre **⋮ → Diagnóstico** o su comando de Cozinity.
2. Pulsa **Iniciar registro**, cierra y reproduce el problema.
3. Vuelve, usa **Actualizar informe** y **Copiar informe** si hace falta.
4. Detén el registro y revisa el informe antes de compartirlo privadamente.

Empieza desactivado, conserva los últimos 200 eventos en memoria y desaparece al recargar. Iniciar otro borra la sesión previa. Registra identificadores/estados/duraciones de paneles, cargas y refrescos, no contenido de notas; metadatos/errores pueden revelar contexto. No guarda informes automáticamente en el vault. Son duraciones de operaciones, no mediciones de CPU/GPU/RAM/FPS; no reconstruyen actividad anterior.

Incluye versiones de Cozinity/Obsidian/SO/integraciones, idioma, modo seguro, tema, pasos exactos, resultado esperado/real y una captura/informe depurado. Consulta [Pruebas beta](../../BETA_TESTING.md). Una demostración de navegador con límites simulados no sustituye reproducirlo en un vault limpio real.
