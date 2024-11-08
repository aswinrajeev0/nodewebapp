const Order = require('../../models/orderSchema');
const User = require('../../models/userSchema');


const getSalesReport = async (req,res) => {
    try {
        
        const orders = await Order.find().populate('user').populate('orderedItems.product');
        const count = await Order.countDocuments();
        res.render('sales-report',{orders,count});

    } catch (error) {
        console.error("Error loading sales report page",error);
        res.redirect('/admin/pageerror');
    }
}

module.exports = {
    getSalesReport
}