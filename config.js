require('dotenv').config();

/**
 * M-Pesa Integration Configuration
 * 
 * This file contains all the necessary configuration variables for the M-Pesa integration.
 */

module.exports = {
    // Safaricom M-Pesa API URL
    baseUrl: process.env.MPESA_BASE_URL || 'https://sandbox.safaricom.co.ke',

    consumerKey: process.env.MPESA_CONSUMER_KEY || '',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
    
    // M-Pesa Shortcode
    shortCode: process.env.MPESA_SHORTCODE || '174379',
    
    // M-Pesa Passkey
    passKey: process.env.MPESA_PASSKEY || '',
    
    // Transaction Type
    transactionType: process.env.MPESA_TRANSACTION_TYPE || 'CustomerPayBillOnline',
    
    // Callback URL
    callbackUrl: process.env.MPESA_CALLBACK_URL || '',
    
    // Optional: organization name for reference
    organizationName: process.env.ORGANIZATION_NAME || '',
    
    // Optional: default description for transactions
    defaultDescription: 'Payment for services',
    
    // Optional: minimum and maximum allowed amount
    minAmount: 1,
    maxAmount: 150000,
    
    // Optional: Default currency (KES for Kenyan Shillings)
    currency: 'KES'
};