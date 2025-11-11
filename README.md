# 🚀 Pump.fun Mint Info Extension

Extensión para Chrome y Firefox que muestra información de tokens de pump.fun al pasar el cursor sobre enlaces que contienen direcciones de mint en la página de Axiom Trade.

## 📋 Descripción

Esta extensión detecta automáticamente enlaces a pump.fun cuando pasas el cursor sobre ellos en https://axiom.trade/pulse?chain=sol y muestra un popup flotante con la información del token obtenida desde la API de pump.fun.

## ✨ Características

- ✅ Detección automática de enlaces a pump.fun
- ✅ Extrae direcciones de mint desde URLs (https://pump.fun/coin/[mint])
- ✅ Popup flotante con diseño moderno y tema oscuro
- ✅ Información en tiempo real desde la API de pump.fun
- ✅ Compatible con Chrome y Firefox (Manifest V3)
- ✅ No requiere configuración adicional
- ✅ Se cierra automáticamente al quitar el cursor
- ✅ Muestra JSON formateado y legible

## 🛠️ Instalación

### Chrome / Chromium / Edge / Brave

1. Descarga o clona este repositorio
2. Abre Chrome y ve a `chrome://extensions/`
3. Activa el "Modo de desarrollador" en la esquina superior derecha
4. Haz clic en "Cargar extensión sin empaquetar"
5. Selecciona la carpeta que contiene los archivos de la extensión
6. La extensión debería aparecer en tu lista de extensiones

### Firefox

1. Descarga o clona este repositorio
2. Abre Firefox y ve a `about:debugging#/runtime/this-firefox`
3. Haz clic en "Cargar complemento temporal..."
4. Navega hasta la carpeta de la extensión y selecciona el archivo `manifest.json`
5. La extensión se cargará temporalmente (se eliminará al cerrar Firefox)

**Nota para Firefox:** Para una instalación permanente, necesitas empaquetar y firmar la extensión a través de [AMO (addons.mozilla.org)](https://addons.mozilla.org/developers/).

## 📖 Uso

1. Navega a https://axiom.trade/pulse?chain=sol
2. Pasa el cursor sobre cualquier enlace que apunte a pump.fun (por ejemplo, dentro de iconos o textos con href)
3. Espera aproximadamente 300ms y aparecerá un popup flotante
4. El popup mostrará:
   - Estado de carga mientras obtiene los datos
   - Información del token en formato JSON
   - Mensaje de error si no se puede obtener la información
5. El popup desaparecerá automáticamente cuando quites el cursor

### Ejemplo de enlace válido:
```html
<a href="https://pump.fun/coin/qFGuhffs17sGD9dNJgni8DZr7sxKxDGiuPQdQp1pump" target="_blank" rel="noopener noreferrer">
  <i class="icon-pill"></i>
</a>
```

## 📁 Estructura del proyecto

```
UriPopup/
├── manifest.json    # Configuración de la extensión (Manifest V3)
├── background.js    # Service worker para peticiones API sin CORS
├── content.js       # Script principal con lógica de detección
├── popup.css        # Estilos del popup flotante
└── README.md        # Este archivo
```

## 🔧 Archivos principales

### manifest.json
Configuración de la extensión con:
- Manifest V3 para compatibilidad moderna
- Permisos para la API de pump.fun
- Background service worker para evitar CORS
- Content script inyectado en axiom.trade
- Configuración específica para Firefox

### background.js
Service worker en segundo plano:
- Maneja peticiones a la API sin restricciones CORS
- Recibe mensajes desde el content script
- Retorna datos del token al content script
- Los service workers tienen permisos especiales para evitar CORS

### content.js
Lógica principal:
- Detección de enlaces con URLs de pump.fun
- Extracción de direcciones de mint desde el atributo `href`
- Event listeners para hover (mouseover/mouseout)
- Comunicación con background script para peticiones API
- Gestión del ciclo de vida del popup
- Manejo de estados: carga, éxito, error

### popup.css
Estilos del popup:
- Tema oscuro semitransparente
- Bordes redondeados
- Animaciones suaves
- Scrollbar personalizado
- Diseño responsive

## 🔍 Cómo funciona

1. **Detección:** Al hacer hover sobre cualquier elemento, el script busca el enlace más cercano (`<a>`)
2. **Extracción:** Analiza el atributo `href` para detectar URLs de pump.fun con el patrón: `https://pump.fun/coin/[mint]`
3. **Validación:** La dirección debe ser base58 válida (28-44 caracteres) y terminar en "pump"
4. **Petición API:** El content script envía un mensaje al background worker, que hace el GET a la API sin restricciones CORS
5. **Respuesta:** El background worker retorna los datos al content script
6. **Visualización:** Se muestra el JSON formateado en un popup flotante posicionado cerca del cursor
7. **Cierre:** El popup se cierra al quitar el mouse o al hacer scroll

## 🎨 Personalización

Puedes personalizar fácilmente los estilos editando `popup.css`:

- **Colores:** Modifica los valores RGBA en el fondo y bordes
- **Tamaño:** Ajusta `min-width`, `max-width`, `max-height`
- **Animaciones:** Modifica los keyframes `fadeIn` y `fadeOut`
- **Posición:** Ajusta la lógica en `positionPopup()` en `content.js`

## ⚠️ Consideraciones

- La extensión solo funciona en `https://axiom.trade/*`
- Requiere conexión a internet para obtener datos de la API
- Hay un delay de 300ms antes de mostrar el popup (configurable en `content.js`)
- Los popups se cierran automáticamente al hacer scroll para evitar superposiciones
- **Solución CORS:** Usa un background service worker con permisos especiales para evitar restricciones CORS

## 🐛 Solución de problemas

### El popup no aparece
- Verifica que estés en https://axiom.trade/pulse?chain=sol
- Asegúrate de estar pasando el cursor sobre un enlace con href de pump.fun
- El enlace debe tener el formato: `https://pump.fun/coin/[mint]`
- Recarga la extensión después de instalarla
- Abre la consola del navegador (F12) y busca errores
- Verifica que la extensión esté habilitada

### Error en la petición API
- Verifica tu conexión a internet
- Comprueba que la API de pump.fun esté disponible
- La dirección del mint podría no ser válida

### Conflictos de estilo
- Si el popup se ve mal, puede haber conflictos CSS con la página
- Los estilos usan `!important` implícitamente por especificidad

## 📝 Desarrollo

Para modificar la extensión:

1. Edita los archivos necesarios
2. Recarga la extensión:
   - **Chrome:** Ve a `chrome://extensions/` y haz clic en el botón de recargar
   - **Firefox:** Ve a `about:debugging` y recarga el complemento temporal
3. Recarga la página de axiom.trade
4. Prueba los cambios

### Variables útiles en content.js:
- `extractMintFromUrl()`: Función que extrae el mint desde URLs de pump.fun
- `extractPumpMintFromLink()`: Busca el enlace más cercano y extrae el mint
- `hoverTimeout`: Delay antes de mostrar popup (300ms por defecto)
- `activePopup`: Referencia al popup actual

## 🔒 Privacidad y seguridad

- La extensión solo hace peticiones a la API de pump.fun
- No recopila ni envía datos personales
- Solo se activa en axiom.trade
- Todo el procesamiento es local en tu navegador
- El código es abierto y auditable

## 📄 Licencia

Este proyecto es de código abierto. Puedes modificarlo y distribuirlo libremente.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para cambios importantes:

1. Haz fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## ✉️ Contacto

Si tienes preguntas o sugerencias, no dudes en abrir un issue en el repositorio.

---

**Versión:** 1.0.0  
**Última actualización:** Noviembre 2025
