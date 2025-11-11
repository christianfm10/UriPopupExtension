/**
 * Background Service Worker
 * 
 * Este script maneja las peticiones a la API de pump.fun sin restricciones CORS
 * ya que los service workers de extensiones tienen privilegios especiales.
 */

// Listener para mensajes desde el content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchTokenInfo') {
        // Hacer la petición a la API
        console.log('🔄 Fetching token info for mint:', request.mintAddress);
        fetchTokenInfo(request.mintAddress)
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
 * Realiza una petición GET a la API de pump.fun
 * @param {string} mintAddress - Dirección del mint
 * @returns {Promise<object>} - Datos del token
 */
async function fetchTokenInfo(mintAddress) {
    const url = `https://frontend-api-v3.pump.fun/coins/${mintAddress}`;
    console.log('🌐 Fetching from URL:', url);

    try {
        const response = await fetch(url);
        console.log('📥 Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('✅ Successfully fetched token info');
        console.log('📄 Response data:', await response.clone().json());

        return await response.json();
    } catch (error) {
        console.error('Error fetching token info:', error);
        throw error;
    }
}

console.log('🚀 Pump.fun Mint Info background service worker initialized');
