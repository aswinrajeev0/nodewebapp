const User = require('../../models/userSchema')


const customerInfo = async (req, res) => {
    try {

        let search = '';
        if (req.query.search) {
            search = req.query.search;
        }

        let page = 1;
        if (req.query.page) {
            page = req.query.page
        }

        const limit = 8;
        const userData = await User.find({
            isAdmin: false,
            $or: [
                { name: { $regex: '.*' + search + '.*', $options: 'i' } }, // Case-insensitive
                { email: { $regex: '.*' + search + '.*', $options: 'i' } } // Case-insensitive
            ],
        })
            .limit(limit)
            .skip((page - 1) * limit)
            .exec();

        const count = await User.find({
            isAdmin: false,
            $or: [
                { name: { $regex: '.*' + search + '.*', $options: 'i' } },
                { email: { $regex: '.*' + search + '.*', $options: 'i' } }
            ],
        }).countDocuments();

        res.render('customers', {
            data: userData,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            searchQuery: search || ""
        })

    } catch (error) {
        res.redirect('/pageerror')
    }
}

const customerBlocked = async (req, res) => {
    try {
        const { id } = req.body;
        await User.updateOne({ _id: id }, { $set: { isBlocked: true } });
        res.status(200).json({ status: true, message: 'User blocked successfully' });
    } catch (error) {
        console.error("Error blocking customer:", error);
        res.status(500).json({ status: false, message: 'Server error' });
    }
};

const customerUnblocked = async (req, res) => {
    try {
        const { id } = req.body;
        await User.findByIdAndUpdate(id, { isBlocked: false });
        return res.json({ status: true, blocked: false });
    } catch (error) {
        console.error("Unblock error:", error);
        return res.status(500).json({ status: false });
    }
};

module.exports = {
    customerInfo,
    customerBlocked,
    customerUnblocked
}