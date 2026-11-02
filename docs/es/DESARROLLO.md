# Desarrollo y verificación

El paquete de instalación contiene el plugin listo para ejecutar. El usuario no necesita Node, npm ni compilar.

Para verificar el código fuente, usar Node 20 o posterior e instalar las dependencias de desarrollo fijadas:

```sh
npm install
npm test
npm run verify:release
```

En el entorno Windows de referencia, Microsoft Edge es el navegador utilizado por:

```sh
npm run test:browser
```

La suite usa renderizadores de producción y límites nativos simulados. No abre Obsidian ni modifica un vault real. No se redistribuye la aplicación Obsidian ni su CSS nativo. El fixture puede leer CSS nativo local mediante `COZYNITY_NATIVE_CSS`; si no existe, usa un respaldo portátil escrito para las pruebas. Las comprobaciones cubren ciclo de vida, persistencia, idioma y navegación; no certifican todos los plugins externos.

La copia limpia incluye 185 pruebas unitarias en 25 archivos funcionales y diez scripts de regresión de navegador. El árbol de desarrollo original también ejecutó sus pruebas de arte/recursos: 207 pruebas unitarias en total. Los scripts de generación de arte y sus imágenes de exploración no son necesarios para ejecutar el plugin y quedan fuera de esta copia limpia.

Para reproducir capturas y GIFs con datos ficticios, instalar FFmpeg y ejecutar:

```sh
npm run media:capture
```

La [guía de medios](../media/README.md) explica variables de entorno y límites de la captura.

Para crear un ZIP de instalación manual en Windows:

```sh
node scripts/package-plugin.cjs
```

El script verifica la entrega, copia solo runtime/recursos/documentación a `dist/install/cozynity`, genera el ZIP y calcula SHA-256. Excluye `data.json`, configuración del vault, registros locales y cachés de desarrollo. El ID y la carpeta `cozynity` conservan compatibilidad; el nombre visible del producto es Cozinity.

Revisar el [informe de revisión](REVIEW_REPORT.md), completar la [lista de pruebas beta](../../BETA_TESTING.md) y probar el ZIP completo en un vault limpio antes de proponer una versión estable. Este repositorio publica la beta de escritorio; la validación nativa sigue pendiente.
