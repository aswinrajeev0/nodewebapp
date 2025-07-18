const express = require('express');
const router = express.Router()
const adminController = require('../controllers/admin/adminController')
const customerController = require('../controllers/admin/customerController')
const categoryController = require('../controllers/admin/categoryController')
const brandController = require('../controllers/admin/brandController')
const productController = require('../controllers/admin/productController')
const bannerController = require('../controllers/admin/bannerController');
const orderController = require('../controllers/admin/orderController');
const stockController = require('../controllers/admin/stockController');
const couponController = require('../controllers/admin/couponController');
const saleReportController = require('../controllers/admin/salesReportController');
const returnController = require('../controllers/admin/returnController');
const { userAuth, adminAuth } = require('../middlewares/auth')
const multer = require('multer');
// const storage = require('../helpers/multer')
const upload = require('../helpers/multer');

router.use(express.static('public'));


router.get('/pageerror', adminController.pageError)
router.get('/login', adminController.loadLogin);
router.post('/login', adminController.login);
router.get('/', adminAuth, adminController.loadDashboard);
router.get('/logout', adminController.logout)

//customer management
router.get('/users', adminAuth, customerController.customerInfo)
router.patch('/blockcustomer', adminAuth, customerController.customerBlocked);
router.patch('/unblockcustomer', adminAuth, customerController.customerUnblocked)

//category management
router.get('/category', adminAuth, categoryController.categoryInfo);
router.post('/addcategory', adminAuth, categoryController.addCategory);
router.post('/addcategoryoffer', adminAuth, categoryController.addCategoryOffer)
router.post('/removecategoryoffer', adminAuth, categoryController.removeCategoryOffer)
router.patch('/listcategory', adminAuth, categoryController.listCategory);
router.patch('/unlistcategory', adminAuth, categoryController.unlistCategory);
router.get('/editcategory', adminAuth, categoryController.getEditCategory);
router.post('/editcategory/:id', adminAuth, categoryController.editCategory)

//brand management
router.get('/brands', adminAuth, brandController.getBrandPage)
router.post('/addbrand', adminAuth, upload.single('image'), brandController.addBrand)
router.get('/blockbrand', adminAuth, brandController.blockBrand);
router.get('/unblockbrand', adminAuth, brandController.unblockBrand);
router.get('/deletebrand', adminAuth, brandController.deleteBrand);

//product management
router.get('/addproduct', adminAuth, productController.getProductAddPage);
router.post('/addproduct', adminAuth, upload.array('images', 4), productController.addProducts);
router.get('/products', adminAuth, productController.getAllProducts);
router.post('/addproductoffer', adminAuth, productController.addProductOffer);
router.post('/removeproductoffer', adminAuth, productController.removeProductOffer);
router.get('/blockproduct', adminAuth, productController.blockProduct);
router.get('/unblockproduct', adminAuth, productController.unBlockProduct);
router.get('/editproduct', adminAuth, productController.getEditProduct);
router.post('/editproduct/:id', adminAuth, upload.array('images', 4), productController.editProduct);
router.post('/deleteimage', adminAuth, productController.deleteSingleImage);

//banner management
router.get('/banner', adminAuth, bannerController.getBannerPage);
router.get('/addbanner', adminAuth, bannerController.getAddBannerPage);
router.post('/addbanner', adminAuth, upload.single('images'), bannerController.addBanner);
router.get('/deletebanner', adminAuth, bannerController.deleteBanner);

//order controller
router.get('/orders', adminAuth, orderController.getOrderPage);
router.post('/update-order-status', orderController.updateOrderStatus)
router.get('/return-approvals', adminAuth, returnController.getReturnApprovals)
router.post('/returnDataUpdate', adminAuth, returnController.returnUpdate);

//stock management
router.get('/stocks', adminAuth, stockController.getStocks);
router.post('/update-stock', adminAuth, stockController.updateStock);

//coupon management
router.get('/coupons', adminAuth, couponController.getCouponPage);
router.post('/save-coupon', adminAuth, couponController.addCoupon);
router.get('/delete-coupon', adminAuth, couponController.deleteCoupon);

//sales report
router.get('/sales-report', adminAuth, saleReportController.getSalesReport)
router.get('/sales-report/pdf', adminAuth, saleReportController.downLoadPdf)



module.exports = router