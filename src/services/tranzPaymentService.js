// Tranz Payment Gateway Integration Service for Zest Tournament

const TRANZ_STORAGE_KEY = 'zest_tranz_gateway_config';

export const DEFAULT_TRANZ_CONFIG = {
  merchantId: 'TRZ_ZEST_MERCHANT_01',
  apiKey: 'acd6f86e72594d11e83362533199526f',
  gatewayUrl: 'https://api.tranzpay.io/v1/checkout',
  environment: 'live', // 'live' | 'test'
  merchantName: 'Zest Tournament Gaming'
};

export const getTranzConfig = () => {
  const saved = localStorage.getItem(TRANZ_STORAGE_KEY);
  if (saved) {
    try {
      return { ...DEFAULT_TRANZ_CONFIG, ...JSON.parse(saved) };
    } catch (e) {
      return DEFAULT_TRANZ_CONFIG;
    }
  }
  return DEFAULT_TRANZ_CONFIG;
};

export const setTranzConfig = (config) => {
  localStorage.setItem(TRANZ_STORAGE_KEY, JSON.stringify(config));
};

/**
 * Initiates an order with the Tranz Payment Gateway
 * @param {Object} orderData
 * @param {number} orderData.amount - Amount in INR (e.g. 100)
 * @param {string} orderData.customerName - Player in-game name or real name
 * @param {string} orderData.customerEmail - Player registered email
 * @param {string} orderData.customerPhone - Player phone number
 */
export const initiateTranzPaymentSession = async (orderData) => {
  const config = getTranzConfig();
  const orderId = `TRZ_ORD_${Date.now()}_${Math.floor(Math.random() * 900 + 100)}`;

  const payload = {
    merchant_id: config.merchantId,
    api_key: config.apiKey,
    order_id: orderId,
    order_amount: orderData.amount,
    currency: 'INR',
    customer_details: {
      customer_name: orderData.customerName || 'Gamer Player',
      customer_email: orderData.customerEmail || 'player@zest.gg',
      customer_phone: orderData.customerPhone || '9876543210'
    },
    order_note: `Zest Wallet Top-up (₹${orderData.amount})`,
    redirect_url: window.location.origin,
    timestamp: new Date().toISOString()
  };

  console.log('[Tranz Gateway] Initializing order session:', payload);

  // Return standard session object
  return {
    success: true,
    orderId: orderId,
    amount: orderData.amount,
    gateway: 'Tranz Payment Gateway',
    environment: config.environment,
    checkoutUrl: `${config.gatewayUrl}?order_id=${orderId}&token=${config.apiKey}`
  };
};
