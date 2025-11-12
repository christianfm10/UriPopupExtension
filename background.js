/**
 * Background Service Worker
 * 
 * Este script maneja las peticiones a la API de pump.fun sin restricciones CORS
 * ya que los service workers de extensiones tienen privilegios especiales.
 */

// Compatibilidad Chrome/Firefox
const browserAPI = typeof chrome !== 'undefined' ? chrome : browser;

// Listener para mensajes desde el content script
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchTokenInfo') {
        // Hacer la petición a la API y luego al metadata_uri
        fetchTokenMetadata(request.mintAddress)
            .then(data => {
                sendResponse({ success: true, data: data });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });

        // Retornar true para indicar que la respuesta será asíncrona
        return true;
    }
});

/**
 * Obtiene el metadata completo del token
 * Primero hace la petición a pump.fun, extrae el metadata_uri, y luego obtiene los metadatos
 * @param {string} mintAddress - Dirección del mint
 * @returns {Promise<object>} - Metadatos del token
 */
async function fetchTokenMetadata(mintAddress) {
    try {
        // 1. Obtener información inicial del token
        const tokenInfo = await fetchTokenInfo(mintAddress);

        // 2. Extraer metadata_uri
        if (!tokenInfo.metadata_uri) {
            throw new Error('metadata_uri no encontrado en la respuesta');
        }

        console.log('� Metadata URI found:', tokenInfo.metadata_uri);

        // 3. Hacer petición al metadata_uri
        const metadataResponse = await fetch(tokenInfo.metadata_uri);

        if (!metadataResponse.ok) {
            throw new Error(`HTTP error al obtener metadata! status: ${metadataResponse.status}`);
        }

        const metadata = await metadataResponse.json();
        console.log('✅ Successfully fetched metadata:', metadata);

        return metadata;
    } catch (error) {
        console.error('Error fetching token metadata:', error);
        throw error;
    }
}

/**
 * Realiza una petición GET a la API de pump.fun
 * @param {string} mintAddress - Dirección del mint
 * @returns {Promise<object>} - Datos del token
 */
async function fetchTokenInfo(mintAddress) {
    const url = `https://frontend-api-v3.pump.fun/coins/${mintAddress}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching token info:', error);
        throw error;
    }
}

console.log('🚀 Pump.fun Mint Info background service worker initialized');
