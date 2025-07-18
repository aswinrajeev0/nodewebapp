const Order = require('../../models/orderSchema');
const User = require('../../models/userSchema');
const PDFDocument = require('pdfkit');


const getSalesReport = async (req, res) => {
    try {

        const limit = 10;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const { startDate, endDate } = req.query;

        let filter = {
            status: { $nin: ['Cancelled', 'Returned'] }
        };

        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const orders = await Order.find(filter)
            .populate('user')
            .populate('orderedItems.product')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit);

        let totalSales = 0;
        let totalDiscount = 0;
        const uniqueCustomers = new Set();

        const filterdOrders = await Order.find(filter).populate('user');

        filterdOrders.forEach(order => {
            totalSales += order.finalAmount || 0;
            totalDiscount += order.discount || 0;
            if (order.user?.username) uniqueCustomers.add(order.user.username);
        });

        const count = await Order.countDocuments(filter);
        const dateRange = req.query.dateRange || '';
        res.render('sales-report', {
            orders,
            count,
            totalSales,
            totalDiscount,
            totalCustomers: uniqueCustomers.size,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            startDate,
            endDate,
            dateRange
        });

    } catch (error) {
        console.error("Error loading sales report page", error);
        res.redirect('/admin/pageerror');
    }
}

const downLoadPdf = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const filter = {
            paymentStatus: 'Completed',
            status: { $nin: ['Cancelled', 'Returned'] }
        };

        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            };
        }

        const orders = await Order.find(filter)
            .populate('user')
            .populate('orderedItems.product')
            .sort({ createdAt: -1 });

        // Prepare summary values
        let totalSales = 0;
        let totalDiscount = 0;
        const uniqueCustomers = new Set();

        orders.forEach(order => {
            totalSales += order.finalAmount || 0;
            totalDiscount += order.discount || 0;
            if (order.user?.username) uniqueCustomers.add(order.user.username);
        });

        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');

        doc.pipe(res);

        // Title
        doc.fontSize(20).text('Sales Report', { align: 'center' }).moveDown(0.5);
        doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`).moveDown();

        // Summary
        doc.fontSize(14).text('Summary:', { underline: true }).moveDown(0.5);
        doc.fontSize(12).text(`Total Sales: ₹${totalSales.toLocaleString()}`);
        doc.text(`Total Orders: ${orders.length}`);
        doc.text(`Total Discount: ₹${totalDiscount.toLocaleString()}`);
        doc.text(`Total Customers: ${uniqueCustomers.size}`).moveDown();

        // Table Header
        doc.fontSize(14).text('Detailed Orders:', { underline: true }).moveDown(0.5);
        doc.fontSize(10);

        // Table Columns
        const tableTop = doc.y + 10;
        const itemSpacing = 20;

        doc.text('Sl No', 30, tableTop);
        doc.text('User Name', 70, tableTop);
        doc.text('Products', 150, tableTop);
        doc.text('Qty', 300, tableTop);
        doc.text('Date', 340, tableTop);
        doc.text('Discount', 400, tableTop);
        doc.text('Final Amt', 470, tableTop);

        let y = tableTop + 15;
        let k = 1;

        orders.forEach(order => {
            const productNames = order.orderedItems.map(item => item.product?.productName || 'N/A').join(', ');
            const quantities = order.orderedItems.map(item => item.quantity).join(', ');

            doc.text(k++, 30, y);
            doc.text(order.user?.username || '-', 70, y);
            doc.text(productNames, 150, y, { width: 130 });
            doc.text(quantities, 300, y);
            doc.text(order.createdAt.toLocaleDateString(), 340, y);
            doc.text(`₹${order.discount.toLocaleString()}`, 400, y);
            doc.text(`₹${order.finalAmount.toLocaleString()}`, 470, y);
            y += itemSpacing;

            if (y > 750) {
                doc.addPage();
                y = 50;
            }
        });

        doc.end();

    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).send('Failed to generate report.');
    }
}

module.exports = {
    getSalesReport,
    downLoadPdf
}