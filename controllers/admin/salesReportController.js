const Order = require('../../models/orderSchema');
const User = require('../../models/userSchema');


const getSalesReport = async (req, res) => {
    try {

        const limit = 10;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const orders = await Order.find().populate('user').populate('orderedItems.product')
            .limit(limit)
            .skip((page - 1) * limit);
        const count = await Order.countDocuments();
        res.render('sales-report', { orders, count, totalPages:Math.ceil(count/limit), currentPage:page });

    } catch (error) {
        console.error("Error loading sales report page", error);
        res.redirect('/admin/pageerror');
    }
}

module.exports = {
    getSalesReport
}