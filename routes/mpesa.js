const express = require('express');
const router = express.Router();
const mpesaController = require('../controllers/mpesa');

/**
 * @route   POST /api/stk-push
 * @desc    Initiate an M-Pesa STK push request
 * @access  Public
 */
router.post('/stk-push', mpesaController.stkPush);

/**
 * @route   POST /api/callback
 * @desc    Callback URL for M-Pesa responses
 * @access  Public (but only accessible to M-Pesa)
 */
router.post('/callback', mpesaController.callback);

/**
 * @route   GET /api/status/:requestId
 * @desc    Check the status of a payment (to be implemented)
 * @access  Public
 */
// router.get('/status/:requestId', mpesaController.checkStatus);

module.exports = router;