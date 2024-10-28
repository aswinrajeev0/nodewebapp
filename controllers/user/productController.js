const Product = require('../../models/productSchema');
const Cart = require('../../models/cartSchema');
const Category = require('../../models/categorySchema');
const User = require('../../models/userSchema');
const Address = require('../../models/addressSchema');
const Order = require('../../models/orderSchema');


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
      return res.redirect('/login');
    }

    const addressDoc = await Address.findOne({ userId: user });
    const addresses = addressDoc ? addressDoc.addresses : [];

    let totalPrice = 0;

    if (req.query.id) {
      const product = await Product.findById(req.query.id);
      if (!product) {
        return res.redirect('/page-not-found');
      }
      totalPrice = product.salePrice;
      return res.render('checkout', { cart: null, product, address: addresses, totalPrice });
    } else {
      const cartItems = await Cart.findOne({ userId: user }).populate('items.productId');
      if (!cartItems) {
        return res.render('checkout', { cart: null, products: [], address: addresses, totalPrice, product: null });
      }
      totalPrice = cartItems.items.reduce((sum, item) => sum + item.totalPrice, 0);
      return res.render('checkout', { cart: cartItems, products: cartItems.items, address: addresses, totalPrice, product: null });
    }
  } catch (error) {
    console.error("Error loading checkout page:", error);
    res.redirect('/page-not-found');
  }
};


const placeOrder = async (req, res) => {
  try {
    const { cart, totalPrice, addressId, singleProduct } = req.body;
    const userId = req.session.user;

    let orderedItems = [];

    if (singleProduct) {
      const product = JSON.parse(singleProduct);
      orderedItems.push({
        product: product._id,
        quantity: 1,
        price: product.salePrice,
      });
    } else {
      const cartItems = JSON.parse(cart);
      orderedItems = cartItems.map(item => ({
        product: item.productId,
        quantity: item.quantity,
        price: item.totalPrice / item.quantity,
      }));
    }

    const discount = 0;
    const finalAmount = totalPrice - discount;

    const newOrder = new Order({
      orderedItems,
      totalPrice,
      finalAmount,
      user:userId,
      address: addressId,
      status: 'Pending',
    });

    await newOrder.save();
    res.redirect('/order-confirmation');
  } catch (error) {
    console.error("Error placing order:", error);
    res.redirect('/checkout');
  }
};

const orderConfirm = async (req,res) => {
  try {
    
    res.render('order-confirmation');

  } catch (error) {
    console.error("Error loading cofirmation page",error);
    res.redirect('/page-not-found');
  }
}


const getOrders = async (req, res) => {
  try {
    const { user: userId } = req.session;

    if (userId) {
      const orders = await Order.find({ user: userId }).sort({ createdOn: -1 }); // Newest orders first
      if (orders.length > 0) {
        res.render('orders', { orders });
      } else {
        res.render('orders', { orders: [], message: "No orders found." }); // Message if no orders exist
      }
    } else {
      res.redirect('/login');
    }
  } catch (error) {
    console.error("Error loading orders page", error);
    res.status(500).redirect('/page-not-found');
  }
};

const cancelOrder = async (req,res) => {
  try {
    
    const id = req.query.id;
    await Order.findByIdAndUpdate(id,{$set:{status:'Cancelled'}});
    res.redirect('/orders')

  } catch (error) {
    console.error("Error loading orders page", error);
    res.status(500).redirect('/page-not-found');
  }
}



module.exports = {
  getProductDetails,
  getCheckout,
  placeOrder,
  orderConfirm,
  getOrders,
  cancelOrder
}