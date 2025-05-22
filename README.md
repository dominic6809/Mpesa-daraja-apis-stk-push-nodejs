# M-Pesa STK Push API Implementation with Node.js

![M-Pesa Daraja API](https://developers.safaricom.co.ke/sites/all/themes/sanaa_new/assets/img/logo-daraja.svg)

## Overview

This project implements the Safaricom Daraja API's STK Push functionality using Node.js. The STK Push feature enables businesses to initiate M-Pesa transactions on behalf of customers through a simple API request, prompting the customer's phone to display a payment authorization screen.

## Features

- 🔐 OAuth Authentication with Daraja API
- 💸 STK Push initiation for customer payments
- 🔄 Transaction status query
- 📊 Callback handling for payment notifications
- ⚡ Simple and lightweight implementation

## Prerequisites

- Node.js (v14+)
- NPM or Yarn
- Safaricom Developer Account
- Registered App on Daraja portal
- M-Pesa Paybill or Till Number

## Error Handling

The implementation includes comprehensive error handling for:
- Network failures
- Authentication errors
- Invalid parameters
- Timeout issues
- Callback processing errors

## Security Considerations

- Store credentials securely using environment variables
- Implement proper validation for all inputs
- Use HTTPS for all API communications
- Validate callback requests to prevent fraud

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.