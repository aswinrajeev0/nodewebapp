const Return = require("../../models/returnSchema");
const Wallet = require("../../models/walletSchema");
const Order = require("../../models/orderSchema");
const { Transaction } = require("mongodb");


const getReturnApprovals = async (req, res) => {
    try {
        const returnData = await Return.find().populate('orderId userId'); 
        res.render('return-order', {
            returns: returnData,
        });
    } catch (error) {
        console.error('Error fetching return approvals:', error);
        res.status(500).send('Server error');
    }
};

const returnUpdate = async (req, res) => {
    try {
        const returnId = req.query.id;
        const { status } = req.body;


        const returnData = await Return.findById(returnId);
        if (!returnData) {
            return res.status(404).json({ message: "Return request not found" });
        }

        const userId = returnData.userId;
        const orderId = returnData.orderId;
        const amount = returnData.refundAmount;

        if (status === "approved") {
            await Wallet.findOneAndUpdate(
                { userId },
                {
                  $inc: { balance: amount },
                  $push: {
                    transactions: {
                      type: 'Refund',
                      amount: amount,
                      description: "Refund for your returned product",
                      orderId,
                      date: new Date()
                    }
                  }
                },
                { new: true }
              );
              

            returnData.returnStatus = status;
            await returnData.save();

            await Order.findOneAndUpdate(
                { _id: orderId },
                { $set: { status: "Returned" } }
            );
        } else if (status === "rejected") {
            returnData.returnStatus = status;
            await returnData.save();

            await Order.findOneAndUpdate(
                { _id: orderId },
                { $set: { status: "Return Request" } }
            );
        } else {
            return res.status(400).json({ message: "Invalid status value" });
        }

        return res.redirect('/admin/return-approvals');
    } catch (error) {
        console.error("Error in Updating Return Status:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


module.exports={
    getReturnApprovals,
    returnUpdate
}