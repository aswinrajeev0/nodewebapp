const express = require('express');
const router = express.Router()
const adminController = require('../controllers/admin/adminController')
const customerController = require('../controllers/admin/customerController')
const categoryController = require('../controllers/admin/categoryController')
const brandController = require('../controllers/admin/brandController')
const {userAuth,adminAuth} = require('../middlewares/auth')
const multer = require('multer');
const storage = require('../helpers/multer')
const upload = multer({storage:storage});

router.use(express.static('public'));


router.get('/pageerror',adminController.pageError)
router.get('/login',adminController.loadLogin);
router.post('/login',adminController.login);
router.get('/',adminAuth,adminController.loadDashboard);
router.get('/logout',adminController.logout)

//customer management

router.get('/users',adminAuth,customerController.customerInfo)
router.get('/blockcustomer',adminAuth,customerController.customerBlocked);
router.get('/unblockcustomer',adminAuth,customerController.customerUnblocked)

//category management

router.get('/category',adminAuth,categoryController.categoryInfo);
router.post('/addcategory',adminAuth,categoryController.addCategory);
router.post('/addcategoryoffer',adminAuth,categoryController.addCategoryOffer)
router.post('/removecategoryoffer',adminAuth,categoryController.removeCategoryOffer)
router.get('/listcategory',adminAuth,categoryController.getListCategory);
router.get('/unlistcategory',adminAuth,categoryController.getUnlistCategory);
router.get('/editcategory',adminAuth,categoryController.getEditCategory);
router.post('/editcategory/:id',adminAuth,categoryController.editCategory)

//brand management

router.get('/brands',adminAuth,brandController.getBrandPage)

module.exports = router