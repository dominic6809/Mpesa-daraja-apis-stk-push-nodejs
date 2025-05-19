const axios = require('axios');
const config = require('../config');

/**
 * Helper to generate the auth token for M-Pesa API
 * @returns {Promise<string>} - The access token
 */
const getAccessToken = async () => {
    try {
        const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
        const response = await axios.get(
            `${config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
            {
                headers: {
                    'Authorization': `Basic ${auth}`
                }
            }
        );
        
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting access token:', error.response?.data || error.message);
        throw new Error(`Failed to get access token: ${error.message}`);
    }
};

/**
 * Get current timestamp in YYYYMMDDHHmmss format for M-Pesa API
 * @returns {string} - Formatted timestamp
 */
const getTimestamp = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

/**
 * Helper to generate the password for the STK Push
 * @param {string} timestamp - Optional timestamp to use
 * @returns {Object} - Password and the timestamp used
 */
const generatePassword = (timestamp) => {
    const timestampToUse = timestamp || getTimestamp();
    
    const passwordString = `${config.shortCode}${config.passKey}${timestampToUse}`;
    const password = Buffer.from(passwordString).toString('base64');
    
    return {
        password,
        timestamp: timestampToUse
    };
};

/**
 * Process phone number to ensure it's in the correct format for M-Pesa
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} - Formatted phone number
 */
const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return null;
    
    // Remove any non-digit characters
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    
    // If it doesn't start with 254, format appropriately
    if (!formattedPhone.startsWith('254')) {
        // If it starts with 0, replace it with 254
        formattedPhone = formattedPhone.startsWith('0') ? 
            `254${formattedPhone.substring(1)}` : `254${formattedPhone}`;
    }
    
    return formattedPhone;
};

/**
 * Controller for initiating STK Push
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.stkPush = async (req, res) => {
    try {
        const { phoneNumber, amount, accountReference } = req.body;
        
        // Validate required fields
        if (!phoneNumber || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and amount are required'
            });
        }
        
        // Format and validate phone number
        const formattedPhone = formatPhoneNumber(phoneNumber);
        
        if (!formattedPhone) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format'
            });
        }
        
        // Validate amount
        const paymentAmount = parseInt(amount);
        if (isNaN(paymentAmount) || paymentAmount < 1) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be a valid number greater than 0'
            });
        }
        
        // Default account reference if not provided
        const paymentRef = accountReference || "MPesaPayment";
        
        try {
            // Get access token for API authentication
            const accessToken = await getAccessToken();
            
            // Generate timestamp and password
            const timestamp = getTimestamp();
            const { password } = generatePassword(timestamp);
            
            // Prepare the STK Push request payload
            const stkPushPayload = {
                BusinessShortCode: config.shortCode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: config.transactionType,
                Amount: paymentAmount,
                PartyA: formattedPhone,
                PartyB: config.shortCode,
                PhoneNumber: formattedPhone,
                CallBackURL: config.callbackUrl,
                AccountReference: paymentRef,
                TransactionDesc: "Payment via STK Push"
            };
            
            // Make the STK Push request to Safaricom
            const response = await axios.post(
                `${config.baseUrl}/mpesa/stkpush/v1/processrequest`,
                stkPushPayload,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000 // 30 seconds timeout
                }
            );
            
            // Save the request to database
            // saveTransaction(response.data, phoneNumber, amount);
            
            // Return response to client
            return res.status(200).json({
                success: true,
                message: 'STK Push initiated successfully',
                data: response.data
            });
            
        } catch (apiError) {
            console.error('M-Pesa API Error:', apiError);
            
            let errorMessage = 'Failed to initiate payment';
            let statusCode = 500;
            let errorDetails = {};
            
            if (apiError.response) {
                const { status, data } = apiError.response;
                statusCode = status;
                errorMessage = data.errorMessage || 'Payment processing failed';
                errorDetails = data;
                
                // Handle specific M-Pesa error codes
                if (data.errorCode) {
                    switch (data.errorCode) {
                        case '500.001.1001':
                            errorMessage = 'Invalid M-Pesa credentials';
                            break;
                        case '400.002.02':
                            errorMessage = 'Invalid phone number format';
                            break;
                        case '501.001.1007':
                            errorMessage = 'M-Pesa system is currently down, please try again later';
                            break;
                        case '500.001.1029':
                            errorMessage = 'Payment request timed out, please try again';
                            break;
                        default:
                            errorMessage = data.errorMessage || errorMessage;
                    }
                }
            } else if (apiError.request) {
                errorMessage = 'No response received from payment provider, please try again';
                errorDetails = { request: 'No response received' };
            } else {
                errorMessage = apiError.message;
                errorDetails = { message: apiError.message };
            }
            
            return res.status(statusCode).json({
                success: false,
                message: errorMessage,
                error: apiError.message,
                details: errorDetails
            });
        }
        
    } catch (error) {
        console.error('STK Push Error:', error);
        
        return res.status(500).json({
            success: false,
            message: 'An unexpected error occurred while processing your payment',
            error: error.message
        });
    }
};

/**
 * Controller for handling M-Pesa callback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.callback = async (req, res) => {
    try {
        const callbackData = req.body;
        
        console.log('M-Pesa Callback Received:', JSON.stringify(callbackData, null, 2));
        
        // Extract the body from the callback
        const { Body } = callbackData;
        
        if (Body && Body.stkCallback) {
            const { ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback;
            
            // Process the callback based on result code
            if (ResultCode === 0) {
                // Transaction successful
                // Extract transaction details from metadata
                const metadata = {};
                
                if (CallbackMetadata && CallbackMetadata.Item) {
                    CallbackMetadata.Item.forEach(item => {
                        if (item.Name && item.Value) {
                            metadata[item.Name] = item.Value;
                        }
                    });
                }
                
                // Process the successful transaction
                // This is where i would update your database
                // and possibly send a notification to your user
                console.log('Transaction Successful:', metadata);
                
                //  emit this event to connected clients via WebSockets if implemented
                // io.emit('transaction_complete', { success: true, data: metadata });
            } else {
                // Transaction failed
                console.log('Transaction Failed:', ResultDesc);
                
                // emit this event to connected clients via WebSockets if implemented
                // io.emit('transaction_complete', { success: false, message: ResultDesc });
            }
        }
        
        res.status(200).json({
            ResultCode: 0,
            ResultDesc: 'Success'
        });
        
    } catch (error) {
        console.error('Callback Processing Error:', error);
        
        // return a success response to avoid M-Pesa retries
        res.status(200).json({
            ResultCode: 0,
            ResultDesc: 'Success'
        });
    }
};