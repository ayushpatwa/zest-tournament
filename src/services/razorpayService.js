// Razorpay Payment Gateway Integration Service for Zest Tournament

const RAZORPAY_STORAGE_KEY = 'zest_razorpay_gateway_config';

export const DEFAULT_RAZORPAY_CONFIG = {
  keyId: 'rzp_test_ZestEsports01', // Default Key (can be updated with live key in Admin Panel)
  merchantName: 'Zest Tournament Esports',
  themeColor: '#00e5ff'
};

export const getRazorpayConfig = () => {
  const saved = localStorage.getItem(RAZORPAY_STORAGE_KEY);
  if (saved) {
    try {
      return { ...DEFAULT_RAZORPAY_CONFIG, ...JSON.parse(saved) };
    } catch (e) {
      return DEFAULT_RAZORPAY_CONFIG;
    }
  }
  return DEFAULT_RAZORPAY_CONFIG;
};

export const setRazorpayConfig = (config) => {
  localStorage.setItem(RAZORPAY_STORAGE_KEY, JSON.stringify(config));
};

/**
 * Loads the Razorpay Checkout script dynamically if not already loaded
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Opens the official Razorpay standard checkout popup
 * @param {Object} paymentData
 * @param {number} paymentData.amount - Amount in INR (e.g. 100)
 * @param {string} paymentData.customerName - Player nickname or real name
 * @param {string} paymentData.customerEmail - Player registered email
 * @param {string} paymentData.customerPhone - Player phone number
 * @param {Function} paymentData.onSuccess - Callback on successful payment
 * @param {Function} paymentData.onDismiss - Callback on modal close/dismiss
 */
export const openRazorpayCheckout = async ({
  amount,
  customerName = 'Zest Player',
  customerEmail = 'player@zest.gg',
  customerPhone = '9876543210',
  onSuccess,
  onDismiss,
  onError
}) => {
  const isLoaded = await loadRazorpayScript();
  const config = getRazorpayConfig();

  if (!isLoaded) {
    if (onError) onError('Failed to load Razorpay SDK. Please check your internet connection.');
    return;
  }

  const orderId = `pay_${Date.now()}_${Math.floor(Math.random() * 899 + 100)}`;

  const options = {
    key: config.keyId,
    amount: amount * 100, // Razorpay takes amount in paise (1 INR = 100 paise)
    currency: 'INR',
    name: config.merchantName,
    description: `Wallet Deposit (₹${amount})`,
    image: 'https://cdn-icons-png.flaticon.com/512/808/808439.png', // Gaming flame logo
    prefill: {
      name: customerName,
      email: customerEmail,
      contact: customerPhone.replace(/[^0-9]/g, '').slice(-10)
    },
    notes: {
      purpose: 'Zest Tournament Wallet Recharge',
      orderId: orderId
    },
    theme: {
      color: config.themeColor || '#00e5ff',
      backdrop_color: 'rgba(7, 9, 14, 0.85)'
    },
    modal: {
      ondismiss: () => {
        if (onDismiss) onDismiss();
      }
    },
    handler: function (response) {
      console.log('[Razorpay] Payment successful response:', response);
      if (onSuccess) {
        onSuccess({
          paymentId: response.razorpay_payment_id || orderId,
          orderId: response.razorpay_order_id || orderId,
          signature: response.razorpay_signature || 'verified',
          amount: amount
        });
      }
    }
  };

  try {
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
      console.error('[Razorpay] Payment failed:', response.error);
      if (onError) onError(response.error.description || 'Payment Failed');
    });
    rzp.open();
  } catch (err) {
    console.error('[Razorpay] Exception opening checkout:', err);
    if (onError) onError(err.message);
  }
};
