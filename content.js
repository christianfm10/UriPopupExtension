/**
 * Pump.fun Mint Info Extension - Content Script
 * 
 * Este script se inyecta en axiom.trade y detecta enlaces con direcciones de 
 * mint de pump.fun al pasar el cursor sobre ellos. Muestra un popup con información
 * del token obtenida desde la API de pump.fun.
 */

// Compatibilidad Chrome/Firefox
const browserAPI = typeof chrome !== 'undefined' ? chrome : browser;

// Estado global para controlar el popup activo
let activePopup = null;
let currentMintAddress = null;
let hoverTimeout = null;

/**
 * Expresión regular para detectar direcciones de mint de pump.fun
 * - Base58 caracteres (1-9, A-Z, a-z, excepto 0, O, I, l)
 * - Longitud típica: 32-44 caracteres
 * - Debe terminar en "pump"
 */
const PUMP_MINT_REGEX = /\b[1-9A-HJ-NP-Za-km-z]{28,40}pump\b/g;

/**
 * Extrae la dirección de mint desde una URL de pump.fun
 * @param {string} url - URL a analizar
 * @returns {string|null} - Dirección de mint encontrada o null
 */
function extractMintFromUrl(url) {
    if (!url) return null;

    // Regex para URLs de pump.fun: https://pump.fun/coin/[mint]
    const urlPattern = /https?:\/\/pump\.fun\/coin\/([1-9A-HJ-NP-Za-km-z]{28,44}pump)/i;
    const match = url.match(urlPattern);

    if (match && match[1]) {
        return match[1];
    }

    return null;
}

/**
 * Verifica si un elemento es un enlace que contiene una dirección de pump.fun
 * @param {HTMLElement} element - Elemento a verificar
 * @returns {string|null} - Dirección de mint encontrada o null
 */
function extractPumpMintFromLink(element) {
    // Buscar el elemento <a> más cercano
    const link = element.closest('a');

    if (!link || !link.href) {
        return null;
    }

    // Extraer mint de la URL del href
    return extractMintFromUrl(link.href);
}

/**
 * Realiza una petición a la API de pump.fun a través del background script
 * para evitar problemas de CORS
 * @param {string} mintAddress - Dirección del mint
 * @returns {Promise<object>} - Datos del token
 */
async function fetchTokenInfo(mintAddress) {
    return new Promise((resolve, reject) => {
        browserAPI.runtime.sendMessage(
            { action: 'fetchTokenInfo', mintAddress: mintAddress },
            (response) => {
                console.log('🔔 Received response from background:', response);
                if (browserAPI.runtime.lastError) {
                    reject(new Error(browserAPI.runtime.lastError.message));
                    return;
                }

                if (response.success) {
                    resolve(response.data);
                } else {
                    reject(new Error(response.error));
                }
            }
        );
    });
}

/**
 * Crea y muestra el popup con la información del token
 * @param {object} data - Datos del token
 * @param {HTMLElement} element - Elemento sobre el que se hizo hover
 * @param {MouseEvent} event - Evento del mouse para posicionar el popup
 */
function showPopup(data, element, event) {
    console.log('💡 Showing popup with data:', data);
    // Eliminar popup existente si lo hay
    removePopup();

    // Crear contenedor del popup
    const popup = document.createElement('div');
    popup.id = 'pump-mint-popup';
    popup.className = 'pump-mint-popup';

    // Formatear JSON de manera legible
    const formattedData = JSON.stringify(data, null, 2);

    // Crear contenido del popup
    popup.innerHTML = `
    <div class="pump-popup-header">
      <span class="pump-popup-title">🚀 Pump.fun Token Info</span>
      <button class="pump-popup-close" onclick="this.closest('.pump-mint-popup').remove()">×</button>
    </div>
    <div class="pump-popup-content">
      <pre class="pump-popup-json">${escapeHtml(formattedData)}</pre>
    </div>
  `;

    // Agregar popup al body
    document.body.appendChild(popup);
    activePopup = popup;

    // Posicionar el popup
    positionPopup(popup, element, event);

    // Agregar event listener para cerrar al hacer hover fuera
    popup.addEventListener('mouseleave', () => {
        removePopup();
    });
}

/**
 * Muestra un popup de carga mientras se obtienen los datos
 * @param {HTMLElement} element - Elemento sobre el que se hizo hover
 * @param {MouseEvent} event - Evento del mouse
 */
function showLoadingPopup(element, event) {
    removePopup();

    const popup = document.createElement('div');
    popup.id = 'pump-mint-popup';
    popup.className = 'pump-mint-popup loading';

    popup.innerHTML = `
    <div class="pump-popup-header">
      <span class="pump-popup-title">🚀 Pump.fun Token Info</span>
    </div>
    <div class="pump-popup-content">
      <div class="pump-popup-loading">
        <div class="pump-loading-spinner"></div>
        <p>Cargando información...</p>
      </div>
    </div>
  `;

    document.body.appendChild(popup);
    activePopup = popup;

    positionPopup(popup, element, event);
}

/**
 * Muestra un popup de error
 * @param {string} message - Mensaje de error
 * @param {HTMLElement} element - Elemento sobre el que se hizo hover
 * @param {MouseEvent} event - Evento del mouse
 */
function showErrorPopup(message, element, event) {
    removePopup();

    const popup = document.createElement('div');
    popup.id = 'pump-mint-popup';
    popup.className = 'pump-mint-popup error';

    popup.innerHTML = `
    <div class="pump-popup-header">
      <span class="pump-popup-title">❌ Error</span>
      <button class="pump-popup-close" onclick="this.closest('.pump-mint-popup').remove()">×</button>
    </div>
    <div class="pump-popup-content">
      <p class="pump-popup-error">${escapeHtml(message)}</p>
    </div>
  `;

    document.body.appendChild(popup);
    activePopup = popup;

    positionPopup(popup, element, event);

    popup.addEventListener('mouseleave', () => {
        removePopup();
    });
}

/**
 * Posiciona el popup cerca del cursor o debajo del elemento
 * @param {HTMLElement} popup - Elemento del popup
 * @param {HTMLElement} element - Elemento sobre el que se hizo hover
 * @param {MouseEvent} event - Evento del mouse
 */
function positionPopup(popup, element, event) {
    const rect = element.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();

    // Posición inicial: debajo del elemento
    let top = rect.bottom + window.scrollY + 10;
    let left = event.clientX + window.scrollX;

    // Ajustar si se sale de la pantalla por la derecha
    if (left + popupRect.width > window.innerWidth + window.scrollX) {
        left = window.innerWidth + window.scrollX - popupRect.width - 10;
    }

    // Ajustar si se sale de la pantalla por abajo
    if (top + popupRect.height > window.innerHeight + window.scrollY) {
        top = rect.top + window.scrollY - popupRect.height - 10;
    }

    // Asegurar que no se salga por la izquierda o arriba
    left = Math.max(10, left);
    top = Math.max(10, top);

    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
}

/**
 * Elimina el popup activo
 */
function removePopup() {
    if (activePopup && activePopup.parentNode) {
        activePopup.remove();
    }
    activePopup = null;
    currentMintAddress = null;
}

/**
 * Escapa caracteres HTML para prevenir XSS
 * @param {string} text - Texto a escapar
 * @returns {string} - Texto escapado
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Maneja el evento de hover sobre un elemento
 * @param {MouseEvent} event - Evento del mouse
 */
async function handleMouseOver(event) {
    const element = event.target;

    // Ignorar si ya hay un popup activo sobre este elemento
    if (element.classList && element.classList.contains('pump-mint-popup')) {
        return;
    }

    // Buscar si el elemento o su padre es un enlace con pump.fun
    const mintAddress = extractPumpMintFromLink(element);

    if (!mintAddress) {
        return;
    }

    // Evitar peticiones duplicadas
    if (currentMintAddress === mintAddress && activePopup) {
        return;
    }

    // Pequeño delay para evitar mostrar popup en hover rápido
    clearTimeout(hoverTimeout);

    // Capturar el mintAddress en el closure para evitar que se pierda
    const targetMintAddress = mintAddress;
    currentMintAddress = targetMintAddress;

    hoverTimeout = setTimeout(async () => {
        try {
            // Mostrar popup de carga
            showLoadingPopup(element, event);

            // Obtener información del token
            const data = await fetchTokenInfo(targetMintAddress);
            console.log('✅ Fetched token info for mint:', targetMintAddress, data);
            console.log(currentMintAddress, targetMintAddress);

            // Verificar que seguimos sobre el mismo mint
            if (mintAddress === targetMintAddress) {
                showPopup(data, element, event);
            }
        } catch (error) {
            if (mintAddress === targetMintAddress) {
                showErrorPopup(
                    `No se pudo obtener información del token: ${error.message}`,
                    element,
                    event
                );
            }
        }
    }, 300); // 300ms de delay
}

/**
 * Maneja el evento cuando el mouse sale de un elemento
 * @param {MouseEvent} event - Evento del mouse
 */
function handleMouseOut(event) {
    const element = event.target;
    const relatedTarget = event.relatedTarget;

    // No cerrar si el mouse se mueve al popup
    if (relatedTarget &&
        (relatedTarget.classList?.contains('pump-mint-popup') ||
            relatedTarget.closest('.pump-mint-popup'))) {
        return;
    }

    // Cancelar timeout si existe
    clearTimeout(hoverTimeout);

    // Cerrar popup con un pequeño delay para permitir mover el mouse al popup
    setTimeout(() => {
        if (activePopup && !activePopup.matches(':hover')) {
            removePopup();
        }
    }, 100);
}

/**
 * Inicializa la extensión
 */
function init() {
    console.log('🚀 Pump.fun Mint Info extension initialized');

    // Agregar listeners de hover a nivel de documento
    // Usamos capture para detectar eventos antes que otros handlers
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);

    // Cerrar popup al hacer scroll
    window.addEventListener('scroll', () => {
        if (activePopup) {
            removePopup();
        }
    }, true);
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
