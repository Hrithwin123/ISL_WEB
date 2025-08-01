// ISL Integration helper for Express backend
const ISL_API_URL = process.env.ISL_API_URL || 'http://localhost:5001';

/**
 * Send image to ISL API for gesture prediction
 * @param {string} imageData - Base64 encoded image data
 * @returns {Promise<Object>} Prediction result
 */
async function predictGesture(imageData) {
    try {
        const response = await fetch(`${ISL_API_URL}/api/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: imageData })
        });

        if (!response.ok) {
            throw new Error(`ISL API error: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error calling ISL API:', error);
        return {
            gesture: null,
            confidence: 0.0,
            hand_detected: false,
            message: `Error: ${error.message}`
        };
    }
}

/**
 * Check if ISL API is healthy
 * @returns {Promise<boolean>} Health status
 */
async function checkISLHealth() {
    try {
        const response = await fetch(`${ISL_API_URL}/api/health`);
        if (response.ok) {
            const health = await response.json();
            return health.model_loaded;
        }
        return false;
    } catch (error) {
        console.error('ISL API health check failed:', error);
        return false;
    }
}

export {
    predictGesture,
    checkISLHealth
}; 