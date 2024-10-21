const express = require('express');
const router = express.Router();
const userControler = require('../controllers/user/userController');
const passport = require('passport');



router.use(express.static('public'));



router.get('/page-not-found',userControler.pageNotFound)
router.get('/',userControler.loadHomepage)
router.get('/signup',userControler.loadSignup)
router.post('/signup',userControler.signup)
router.post('/verify-otp',userControler.verifyOtp)
router.post('/resend-otp',userControler.resendOtp);
router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}))
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
    res.redirect('/')
})
router.get('/login',userControler.loadLogin)
router.post('/login',userControler.login);
router.get('/logout',userControler.logout)





module.exports = router;