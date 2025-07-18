const Product = require('../../models/productSchema');
const Cart = require('../../models/cartSchema');
const Category = require('../../models/categorySchema');
const User = require('../../models/userSchema');
const Address = require('../../models/addressSchema');
const Order = require('../../models/orderSchema');
const Coupon = require('../../models/couponSchma');
const Wallet = require('../../models/walletSchema');
const Brand = require('../../models/brandSchema');
const Return = require('../../models/returnSchema');
const fs = require('fs');
const PaymentLock = require('../../models/paymentLockSchema');


const getProductDetails = async (req, res) => {
  try {

    const userId = req.session.user;
    const user = await User.findById(userId);
    const id = req.query.id;
    const productData = await Product.findOne({ _id: id });
    const category = await Category.findOne({ _id: productData.category });

    const productOffer = productData.productOffer || 0;
    const categoryOffer = category ? category.categoryOffer || 0 : 0;
    const highestOffer = Math.max(productOffer, categoryOffer);

    const discount = (productData.regularPrice * highestOffer) / 100;
    const finalSalePrice = productData.regularPrice - discount;

    const recommendedProducts = await Product.find({
      category: productData.category,
      _id: { $ne: productData._id }
    }).limit(4);

    res.render('product-details', {
      product: productData,
      cat: category,
      recProducts: recommendedProducts,
      user: user,
      finalSalePrice: Math.floor(finalSalePrice),
      highestOffer
    });

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
      const product = await Product.findOne({ _id: req.query.id, isBlocked: false });
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

const getCouponList = async (req, res) => {
  try {

    const user = req.session.user;
    if (!user) {
      return res.redirect('/login');
    }

    const coupons = await Coupon.find({
      isList: true,
      userId: { $ne: user },
    });

    res.render('coupon-list', { coupons });

  } catch (error) {

  }
}


const applyCoupon = async (req, res) => {
  try {
    const { couponCode, totalPrice } = req.body;
    const userId = req.session.user;

    const coupon = await Coupon.findOne({
      name: couponCode,
      isList: true,
      expireOn: { $gt: new Date() }
    });

    if (!coupon) {
      return res.json({
        success: false,
        message: 'Invalid or expired coupon code'
      });
    }

    if (coupon.userId.includes(userId)) {
      return res.json({
        success: false,
        message: 'Coupon has already been used by this user'
      });
    }

    let discountAmount = (totalPrice * coupon.offerPercentage) / 100;

    if (coupon.minimumPrice && totalPrice < coupon.minimumPrice) {
      return res.json({
        success: false,
        message: `Minimum purchase amount of ${coupon.minimumPrice} required`
      });
    }

    const discountedTotal = totalPrice - discountAmount;


    return res.json({
      success: true,
      message: 'Coupon applied successfully!',
      discountedTotal: discountedTotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2)
    });

  } catch (error) {
    console.error('Error applying coupon:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to apply coupon'
    });
  }
};

const removeCoupon = async (req, res) => {
  try {

    const { totalPrice } = req.body;

    const discountAmount = 0;
    const finalTotal = totalPrice;

    res.json({
      success: true,
      discountAmount,
      finalTotal,
    });

  } catch (error) {
    console.error("Error removing coupon", error);
    res.status(500);
  }
}

const placeOrderInitial = async (req, res) => {
  try {
    const { cart, totalPrice, addressId, singleProduct, payment_method, finalPrice, coupon, discount } = req.body;
    const userId = req.session.user;

    const lock = await PaymentLock.create({ userId });

    let orderedItems = [];
    if (singleProduct) {
      const product = JSON.parse(singleProduct);

      const dbProduct = await Product.findById(product._id);

      if (!dbProduct || dbProduct.quantity < 1) {
        await PaymentLock.deleteOne({ userId });
        return res.status(400).json({ success: false, message: 'Insufficient stock for the selected product.' });
      }

      orderedItems.push({
        product: product._id,
        quantity: 1,
        price: product.salePrice,
      });
      await Product.findByIdAndUpdate(product._id, {
        $inc: { quantity: -1 }
      });

    } else if (cart) {
      const cartItems = JSON.parse(cart);

      for (const item of cartItems) {
        const dbProduct = await Product.findById(item.productId);
        if (!dbProduct || dbProduct.quantity < item.quantity) {
          await PaymentLock.deleteOne({ userId });
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for "${dbProduct?.name || 'a product'}". Available: ${dbProduct?.quantity || 0}, Requested: ${item.quantity}`
          });
        }
      }

      orderedItems = cartItems.map(item => ({
        product: item.productId,
        quantity: item.quantity,
        price: item.totalPrice / item.quantity,
      }));
      cartItems.forEach(async item => {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { quantity: -item.quantity }
        })
      })
    }

    const addressDoc = await Address.findOne({ userId });
    const address = addressDoc.addresses.find(addr => addr._id.toString() === addressId);

    const newOrder = new Order({
      orderedItems,
      totalPrice,
      discount: discount,
      finalAmount: finalPrice,
      user: userId,
      address: address,
      status: 'Pending',
      paymentMethod: payment_method,
      paymentStatus: 'Pending',
      couponCode: coupon,
      couponApplied: Boolean(coupon && discount)
    });

    if (coupon) {
      await Coupon.findOneAndUpdate(
        { name: coupon },
        { $push: { userId: userId } }
      );
    }

    await newOrder.save();
    await PaymentLock.deleteOne({ userId });
    res.status(200).json({ success: true, orderId: newOrder._id, razorpayKey: process.env.RAZOR_KEY_ID });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(429).json({ success: false, message: 'Payment already in progress. Please complete it before trying again.' });
    }
    console.error("Error placing initial order:", error);
    await PaymentLock.deleteOne({ userId });
    res.status(500).json({ success: false, message: 'Failed to save order. Please try again.' });
  }
};


const placeOrder = async (req, res) => {
  try {
    const { orderId, paymentDetails, paymentSuccess } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (paymentSuccess) {
      order.paymentStatus = 'Completed';
    } else {
      order.paymentStatus = 'Pending';
    }

    if (paymentDetails) {
      order.paymentDetails = paymentDetails;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: `Order ${paymentSuccess ? 'completed' : 'pending due to payment failure'}`,
      orderId: order._id
    });
  } catch (error) {
    console.error("Error updating order payment status:", error);
    res.status(500).json({ success: false, message: 'Failed to update order. Please try again.' });
  }
};

const orderConfirm = async (req, res) => {
  try {

    const id = req.query.id
    const order = await Order.findById(id);
    res.render('order-confirmation', { order });

  } catch (error) {
    console.error("Error loading cofirmation page", error);
    res.redirect('/page-not-found');
  }
}

const getOrders = async (req, res) => {
  try {
    const { user: userId } = req.session;

    if (userId) {
      const user = await User.findById(userId);
      const limit = 10;
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const orders = await Order.find({ user: userId })
        .populate('orderedItems.product')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);
      const count = await Order.find({ user: userId })
      if (orders.length > 0) {
        res.render('orders', { orders, user, totalPages: Math.ceil(count.length / limit), currentPage: page });
      } else {
        res.render('orders', { orders: [], message: "No orders found.", user });
      }
    } else {
      return res.redirect('/login');
    }
  } catch (error) {
    console.error("Error loading orders page", error);
    res.status(500).redirect('/page-not-found');
  }
};

const cancelOrder = async (req, res) => {
  try {

    const userId = req.session.user;
    const id = req.query.id;
    const reason = req.query.reason;
    await Order.findByIdAndUpdate(id, { $set: { status: 'Cancelled', cancellationReason: reason } });
    const order = await Order.findOne({ user: userId, _id: id });
    for (const item of order.orderedItems) {
      const productId = item.product._id;
      const qtyToRestore = item.quantity;

      await Product.findByIdAndUpdate(
        productId,
        { $inc: { quantity: qtyToRestore } },
        { new: true }
      );
    }

    if (order.paymentMethod && order.paymentMethod.trim().toLowerCase() === "online" && !order.paymentStatus === "pending") {
      const walletData = {
        $inc: { balance: order.totalPrice },
        $push: {
          transactions: {
            type: "Refund",
            amount: order.totalPrice,
            orderId: order._id
          }
        }
      }

      const walletUpdate = await Wallet.findOneAndUpdate(
        { userId: userId },
        walletData,
        { upsert: true, new: true }
      );

      if (!walletUpdate) {
        throw new Error("Failed to update wallet");
      }
    }

    res.redirect('/orders')

  } catch (error) {
    console.error("Error loading orders page", error);
    res.status(500).redirect('/page-not-found');
  }
}

const orderDetails = async (req, res) => {
  try {
    const orderId = req.query.id;
    const userId = req.session.user;

    if (!userId) {
      return res.redirect('/login');
    }
    const user = await User.findById(userId);
    const order = await Order.findOne({ _id: orderId });
    const address = order.address

    const products = await Promise.all(
      order.orderedItems.map(async (item) => {
        return await Product.findOne({ _id: item.product });
      })
    );

    res.render('order-details', { order, products, address: address, user });
  } catch (error) {
    console.error("Error getting order details", error);
    res.redirect('/page-not-found');
  }
};

const searchProduct = async (req, res) => {
  const { category, q } = req.query;
  const searchCriteria = {};

  if (category) {
    searchCriteria.category = category
  }

  if (q) {
    searchCriteria.productName = { $regex: q, $options: 'i' };
  }

  try {

    console.log(category);
    const limit = 12;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const products = await Product.find(searchCriteria)
      .populate('category', 'name')
      .limit(limit)
      .skip((page - 1) * limit);

    const count = await Product.countDocuments(searchCriteria);

    res.render('search-results', {
      products,
      searchTerm: q,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });

  } catch (error) {
    console.error("Error fetching search results:", error);
    res.status(500).send("Internal Server Error");
  }
}

const getAllProducts = async (req, res) => {
  try {

    const limit = 12;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const products = await Product.find({ isBlocked: false })
      .limit(limit)
      .skip((page - 1) * limit);

    const count = await Product.countDocuments();

    res.render('all-products', {
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    })

  } catch (error) {

  }
}

const getBrands = async (req, res) => {
  try {

    const brands = await Brand.find();
    res.render('brand-list', { brands });

  } catch (error) {

  }
}

const returnOrder = async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    const userId = req.session.user;

    const orderData = await Order.findById(orderId);
    if (!orderData) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await Order.findByIdAndUpdate(orderId, { $set: { status: 'Return Request' } })

    const Existingreturn = await Return.findOne({ orderId });
    if (Existingreturn) {
      return res.status(404).json({ message: 'Return request already submited for this order' })
    }

    const reasonData = new Return({
      userId,
      orderId,
      reason,
      refundAmount: orderData.finalAmount,
    });

    await reasonData.save();

    return res.status(200).json({ message: "Return Request Submitted Successfully" });

  } catch (error) {
    console.error("Error processing return request:", error);
    return res.status(500).json({ message: 'Something went wrong, please try again later.' });
  }
};


module.exports = {
  getProductDetails,
  getCheckout,
  placeOrderInitial,
  placeOrder,
  orderConfirm,
  getOrders,
  cancelOrder,
  orderDetails,
  searchProduct,
  getCouponList,
  applyCoupon,
  removeCoupon,
  getAllProducts,
  getBrands,
  returnOrder
}