const Wallet = require('../../models/walletSchema');


const getWallet = async (req,res) => {
    try {
        
        const userId = req.session.user;
        if(!userId){
            return res.redirect('/login');
        }

        const wallet = await Wallet.findOne({userId:userId});
        if(!wallet){
            await Wallet.create({
                userId
            })
        }
        res.render('wallet',{wallet});

    } catch (error) {
        console.error("Error loading wallet",error);
        res.redirect('/page-not-found');
    }
}



module.exports = {
    getWallet
}