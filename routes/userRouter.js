const express = require('express');
const router = express.Router();
const userController = require('../controllers/user/userController');
const profileController = require('../controllers/user/profileController.js')
const productController = require('../controllers/user/productController.js')
const cartController = require('../controllers/user/cartController.js')
const passport = require('passport');



router.use(express.static('public'));



router.get('/page-not-found',userController.pageNotFound)
router.get('/',userController.loadHomepage)
router.get('/sort',userController.sortProducts);
router.get('/signup',userController.loadSignup)
router.post('/signup',userController.signup)
router.post('/verify-otp',userController.verifyOtp)
router.post('/resend-otp',userController.resendOtp);
router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}))
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
    res.redirect('/')
})

//user authentication
router.get('/login',userController.loadLogin)
router.post('/login',userController.login);
router.get('/logout-user',userController.getLogoutPage);
router.get('/logout',userController.logout);
router.get('/forgot-password',profileController.getForgotPassword);
router.post('/forgot-email-valid',profileController.forgotEmailValid);
router.post('/verify-forgotpass-otp',profileController.verifyForgotOtp);
router.get('/reset-password',profileController.getResetPassPage);
router.post('/resend-forgot-otp',profileController.resendOtp);
router.post('/reset-password',profileController.resetPassword);

//user profile
router.get('/profile',profileController.getUserProfile);
router.post('/updateprofile',profileController.updateProfile);
router.get('/add-address',profileController.getAddAddress);
router.post('/save-address',profileController.saveAddress);
router.get('/address',profileController.getAddress);
// router.get('/edit-address',profileController.editAddress);
router.get('/delete-address',profileController.deleteAddress);

//product details
router.get('/productdetails',productController.getProductDetails);

//user cart
router.get('/cart',cartController.getCart);
router.post('/add-to-cart',cartController.addToCart);
router.post('/remove-cart-item',cartController.removeCartItem);
router.post('/update-cart-quantity',cartController.updateCart);

router.get('/checkout',productController.getCheckout);
router.post('/place-order',productController.placeOrder);

router.get('/order-confirmation',productController.orderConfirm);
router.get('/orders',productController.getOrders);
router.get('/cancel-order',productController.cancelOrder);
router.get('/order-details',productController.orderDetails);




module.exports = router;