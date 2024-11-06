const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../../models/orderSchema');
const Address = require('../../models/addressSchema');
const env = require('dotenv').config();

const razorpay = new Razorpay({
    key_id: process.env.RAZOR_KEY_ID,
    key_secret: process.env.RAZOR_SECRET,
});

const RAZORPAY_MAX_AMOUNT = 5000000000;
const RAZORPAY_MIN_AMOUNT = 100;

const createOrder = async (req, res) => {
    try {
        const { amount, addressId } = req.body;
        const userId = req.session.user;

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount. Amount must be a positive number'
            });
        }

        if (!addressId) {
            return res.status(400).json({
                success: false,
                message: 'Delivery address is required'
            });
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const amountInPaise = Math.round(amount * 100);

        if (amountInPaise < RAZORPAY_MIN_AMOUNT) {
            return res.status(400).json({
                success: false,
                message: `Amount must be at least ₹${RAZORPAY_MIN_AMOUNT / 100}`
            });
        }

        if (amountInPaise > RAZORPAY_MAX_AMOUNT) {
            return res.status(400).json({
                success: false,
                message: `Amount exceeds maximum limit of ₹${RAZORPAY_MAX_AMOUNT / 100}`
            });
        }

        // Generate unique receipt ID
        const receipt = crypto
            .randomBytes(16)
            .toString('hex');

        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt,
            notes: {
                userId: userId.toString(),
                addressId: addressId.toString()
            }
        };

        const razorpayOrder = await razorpay.orders.create(options);

        // Store order ID in session with expiry
        req.session.razorpayOrderId = razorpayOrder.id;
        req.session.razorpayOrderExpiry = Date.now() + (30 * 60 * 1000); // 30 minutes expiry

        res.status(200).json({
            success: true,
            id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            receipt: razorpayOrder.receipt
        });

    } catch (error) {
        console.error('Razorpay order creation error:', error);
        
        // Enhanced error handling
        if (error.error && error.error.code === 'BAD_REQUEST_ERROR') {
            return res.status(400).json({
                success: false,
                message: error.error.description || 'Invalid request parameters',
                error: error.error
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create payment order',
            error: error.message
        });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Missing required payment verification parameters'
            });
        }

        if (!req.session.razorpayOrderId || !req.session.razorpayOrderExpiry || 
            Date.now() > req.session.razorpayOrderExpiry) {
            return res.status(400).json({
                success: false,
                message: 'Order session has expired'
            });
        }

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZOR_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature !== expectedSign) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment signature'
            });
        }

        if (req.session.razorpayOrderId !== razorpay_order_id) {
            return res.status(400).json({
                success: false,
                message: 'Order verification failed'
            });
        }

        const payment = await razorpay.payments.fetch(razorpay_payment_id);

        if (payment.status !== 'captured') {
            return res.status(400).json({
                success: false,
                message: `Payment not captured. Current status: ${payment.status}`
            });
        }

        delete req.session.razorpayOrderId;
        delete req.session.razorpayOrderExpiry;

        res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            paymentId: razorpay_payment_id
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Payment verification failed',
            error: error.message
        });
    }
};

const getRazorpayKey = (req, res) => {
    if (!process.env.RAZOR_KEY_ID) {
        return res.status(500).json({
            success: false,
            message: 'Razorpay key not configured'
        });
    }
    
    res.json({
        success: true,
        key: process.env.RAZOR_KEY_ID
    });
};

const getAddress = async (req,res) => {
    try {
        const user = req.session.user;
        const addressId = req.params.id;
        const addressDoc = await Address.findOne({userId:user});
        const address = addressDoc.addresses.filter((address)=>{
            address._id = addressId
        })
        
        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        res.json({
            success: true,
            name: address.name,
            email: address.email,
            phone: address.phone,
            streetAddress: address.streetAddress
        });
    } catch (error) {
        console.error('Error fetching address:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch address details'
        });
    }
}

module.exports = {
    createOrder,
    verifyPayment,
    getRazorpayKey,
    getAddress
};