const Order = require('../../models/orderSchema');
const User = require('../../models/userSchema');


const getSalesReport = async (req,res) => {
    try {
        
        const orders = await Order.find().populate('user').populate('orderedItems.product');
        res.render('sales-report',{orders});

    } catch (error) {
        console.error("Error loading sales report page",error);
        res.redirect('/admin/pageerror');
    }
}

module.exports = {
    getSalesReport
}