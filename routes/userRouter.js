const express = require('express');
const router = express.Router();
const userControler = require('../controllers/user/userController')



router.use(express.static('public'));



router.get('/page-not-found',userControler.pageNotFound)
router.get('/',userControler.loadHomepage)


module.exports = router;