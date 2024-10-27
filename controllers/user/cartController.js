const Product = require('../../models/productSchema');
const Cart = require('../../models/cartSchema');
const Category = require('../../models/categorySchema');

const addToCart = async (req, res) => {
    try {
        const productId = req.query.id;
        const user = req.session.user;
        
        if (!user) {
            return res.redirect('/login');
        }

        const product = await Product.findById(productId);
        const quantity = parseInt(req.body.quantity, 10);
        const totalPrice = product.salePrice * quantity;

        const cartDoc = await Cart.findOne({ userId: user });

        if (cartDoc) {
            const existingItemIndex = cartDoc.items.findIndex(item => item.productId.toString() === productId);

            if (existingItemIndex >= 0) {
                cartDoc.items[existingItemIndex].quantity += quantity;
                cartDoc.items[existingItemIndex].totalPrice += totalPrice;
            } else {
                cartDoc.items.push({ productId, quantity, price: product.salePrice, totalPrice });
            }
            await cartDoc.save();
        } else {
            const newCart = new Cart({
                userId: user,
                items: [{ productId, quantity, price: product.salePrice, totalPrice }]
            });
            await newCart.save();
        }

        res.redirect('/cart');
    } catch (error) {
        console.error("Error adding to cart", error);
        res.status(500).json({ message: "Something went wrong" });
    }
};


const getCart = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) {
            return res.redirect('/login');
        }

        const cartItems = await Cart.findOne({ userId: userId }).populate('items.productId');

        if (!cartItems) {
            return res.render('cart', { cart: null, products: [] });
        }

        res.render('cart', { cart: cartItems, products: cartItems.items });
    } catch (error) {
        console.error(error);
        res.redirect('/page-not-found');
    }
};

const removeCartItem = async (req, res) => {
    try {

        const userId = req.session.user;
        const { productId } = req.body;

        await Cart.findOneAndUpdate(
            { userId: userId },
            { $pull: { items: { productId: productId } } }
        );

        res.redirect("/cart");

    } catch (error) {
        console.error("Error removing item from cart:", error);
        res.redirect("/page-not-found");
    }
}


module.exports = {
    addToCart,
    getCart,
    removeCartItem
}