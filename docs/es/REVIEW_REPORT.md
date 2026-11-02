> Informe histórico de la revisión privada. Esta copia se publica como beta 0.1.11 por decisión del autor; no convierte las pruebas pendientes en pruebas realizadas.

# Revisión privada de Cozinity 0.1.9

Fecha: 1 de noviembre de 2026. Objetivo: preparar una versión privada para revisión y prueba antes de compartirla públicamente.

## Problemas reproducidos y cambios

| Problema | Cambio | Evidencia automatizada |
| --- | --- | --- |
| Una apertura nativa pendiente bloqueaba las aperturas siguientes, abrir en pestaña y limpieza al cerrar la ventana flotante | La navegación pendiente se cancela al cambiar de destino o cerrar; sus resultados tardíos se limpian en su propio leaf | `loading-recovery.browser.cjs` |
| Un primer candidato nativo que no respondía impedía probar el siguiente | Intentos con límite de 15 s y un leaf distinto por candidato; cancelación al desmontar | `loading-recovery.browser.cjs` |
| Una consulta terminada sin cambios DOM podía quedar bajo el aviso de demora | Comprobación moderada cada segundo mientras la ventana demorada esté visible | `loading-recovery.browser.cjs` |
| Las notas editables usaban un camino separado sin esos controles | Se comparte el montaje nativo, conservando el manejo de editor/scroll y Excalidraw | `loading-recovery.browser.cjs`, `window-cleanup.browser.cjs` |
| El editor básico podía habilitar un documento vacío después de fallar la lectura | Permanece deshabilitado hasta completar una lectura y ofrece reintento | `loading-recovery.browser.cjs` |
| Una escritura lenta del editor básico reconocía texto posterior como guardado | Se captura el texto antes del await y se serializan las escrituras | Regresión A→B en `loading-recovery.browser.cjs` |
| Un fallo del escaneo de tareas dejaba una promesa rechazada reutilizable; un escaneo viejo podía reemplazar una caché nueva | Promesa limpiada al finalizar y resultados aceptados solo si siguen vigentes | `task-recovery.test.cjs` |
| La lectura opcional de TaskNotes podía esperar indefinidamente | Límite de 8 s y recuperación en una lectura posterior; el timer local sigue disponible | `task-recovery.test.cjs` |
| Actualizar 20 ventanas repetía 20 contextos y 20 capturas/restauraciones globales de scroll | Un contexto y una captura/restauración compartidos por lote; los cambios de presentación no recalculan el contexto | `batched-refresh.browser.cjs` |
| Mensajes/comandos sin traducción y riesgo de traducir nombres del usuario | Cadenas propias ES/EN, protección de nombres y contenido nativo, índice de nombres reutilizado | `i18n-private-review.test.cjs`, `i18n-private-review.browser.cjs` |

La reducción de 20 operaciones a una corresponde a una prueba controlada de actualización de ventanas. No es una medición de CPU, FPS ni tiempo total dentro de Obsidian.

## Opciones simplificadas

Se quitaron ocho controles duplicados de Ajustes: título, subtítulo, fuente global, imagen de encabezado, imagen de tablero, tema visual, color global y opacidad global. Sus funciones siguen en **Personalizar**. Ajustes tiene **Apariencia del dashboard → Abrir Personalizar** y **Recargar temas**.

Se conservaron idioma, modo seguro, carpetas, plantillas, preset visual, colores por tipo de archivo, inicio de semana y restablecimientos. Se eliminaron solicitudes duplicadas de refresco en esos controles. No se eliminaron campos de configuración ni se borraron dashboards/borradores para simplificar la interfaz.

## Idioma, nombre y compatibilidad

La marca visible es **Cozinity**. El identificador de instalación `cozynity`, las claves de datos y selectores internos históricos se conservan para mantener las configuraciones existentes. Los contenidos del usuario y las interfaces de otros plugins mantienen su idioma propio.

## Verificación y límites

La suite de desarrollo y las nuevas regresiones se ejecutaron antes de preparar la entrega. El repositorio incluye pruebas funcionales portátiles; las pruebas históricas de generación de arte y sus imágenes fuente no son parte del paquete de instalación. `npm test` ejecuta las pruebas unitarias incluidas y `npm run test:browser` las de navegador seleccionadas.

Las pruebas de navegador usan renderizadores reales del plugin y límites simulados de Obsidian. Las capturas/GIF usan datos ficticios. La CLI de la instalación de Obsidian del autor estaba desactivada y el runtime de control nativo no estaba disponible en esta sesión; por ello no se presenta la prueba automatizada como validación interactiva de Obsidian abierto.

Pendiente antes de considerar una publicación pública: recargar el candidato en Obsidian, repetir abrir/cerrar/cambiar dashboards y probar los plugins instalados en un vault de prueba. Un plugin externo que no responda puede seguir fallando; Cozinity limita su espera y ofrece recuperación. Los límites de tiempo no interrumpen el código interno de terceros. Conviene revisar las licencias/procedencia de todos los recursos antes de una distribución pública.

## Entrega

Instalación manual mediante ZIP completo, documentación ES/EN y medios ficticios. La entrega excluye `data.json`, notas, configuración del vault, cachés, registros y capturas personales. El repositorio y la versión de revisión permanecen privados.

## Actualización 0.1.10

Se añadieron Enviar al dashboard para notas/Bases y el fondo fijo al ancho con repetición vertical. El modo anterior Cubrir y ampliar sigue disponible. Las nuevas regresiones comprueban contenido original intacto, vista de Base, doble clic, cancelación por navegación, píxeles estables al pasar de 700 a 1800 px de altura, repetición vertical, elección de modo, persistencia por dashboard, Deshacer e intercambio de configuración. La verificación en Obsidian abierto sigue siendo manual.
