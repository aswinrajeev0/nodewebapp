const Coupon = require('../../models/couponSchma');


const getCouponPage = async (req,res) => {
    try {
        
        const coupons = await Coupon.find();
        res.render('coupons',{coupons});

    } catch (error) {
        
    }
}

const addCoupon = async (req,res) => {
    try {
        
        const {couponCode,discountPrice,minimumPrice,createdDate,endDate} = req.body;
        const coupon = new Coupon({
            name:couponCode,
            createdOn:createdDate,
            expireOn:endDate,
            offerPrice:discountPrice,
            minimumPrice:minimumPrice
        })

        await coupon.save();
        res.redirect('/admin/coupons');

    } catch (error) {
        console.error("Error loading coupon page",error);
        res.redirect('/admin/pageerror');
    }
}

const deleteCoupon = async (req,res) => {
    try {
        
        const id = req.query.id;
        await Coupon.findByIdAndDelete(id);
        res.redirect('/admin/coupons');

    } catch (error) {
        
    }
}

module.exports = {
    getCouponPage,
    addCoupon,
    deleteCoupon
}