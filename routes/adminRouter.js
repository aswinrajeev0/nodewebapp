const express = require('express');
const router = express.Router()
const adminController = require('../controllers/admin/adminController')
const customerController = require('../controllers/admin/customerController')
const categoryController = require('../controllers/admin/categoryController')
const {userAuth,adminAuth} = require('../middlewares/auth')

router.use(express.static('public'));


router.get('/pageerror',adminController.pageError)
router.get('/login',adminController.loadLogin);
router.post('/login',adminController.login);
router.get('/',adminAuth,adminController.loadDashboard);
router.get('/logout',adminController.logout)

router.get('/users',adminAuth,customerController.customerInfo)
router.get('/blockcustomer',adminAuth,customerController.customerBlocked);
router.get('/unblockcustomer',adminAuth,customerController.customerUnblocked)

router.get('/category',adminAuth,categoryController.categoryInfo);
router.post('/addcategory',adminAuth,categoryController.addCategory);
router.post('/addcategoryoffer',adminAuth,categoryController.addCategoryOffer)
router.post('/removecategoryoffer',adminAuth,categoryController.removeCategoryOffer)
router.get('/listcategory',adminAuth,categoryController.getListCategory);
router.get('/unlistcategory',adminAuth,categoryController.getUnlistCategory);

module.exports = router