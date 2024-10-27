const Product = require('../../models/productSchema');
const Cart = require('../../models/cartSchema');
const Category = require('../../models/categorySchema');
const User = require('../../models/userSchema');
const Address = require('../../models/addressSchema');


const getProductDetails = async (req, res) => {
  try {

    const id = req.query.id;
    const productData = await Product.findOne({ _id: id });
    const category = await Category.findOne({ _id: productData.category });

    res.render('product-details', { product: productData, cat: category });

  } catch (error) {
    res.redirect('/page-not-found')
  }
}

const getCheckout = async (req, res) => {
  try {
    const user = req.session.user;

    if (!user) {
      return res.redirect('login');
    }
    const cartItems = await Cart.findOne({ userId: user }).populate('items.productId');
    if (!cartItems) {
      return res.render('checkout', { cart: null, products: [] });
    }

    
    const addressDoc = await Address.findOne({ userId: user });

    const addresses = addressDoc ? addressDoc.addresses : [];

    res.render('checkout', { cart: cartItems, products: cartItems.items, address: addresses || []});

  } catch (error) {
    console.error("Error loading checkout page:", error);
    res.redirect('/page-not-found');
  }
};



module.exports = {
  getProductDetails,
  getCheckout
}