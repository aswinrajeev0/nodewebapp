const Product = require('../../models/productSchema');
const Cart = require('../../models/cartSchema');
const Category = require('../../models/categorySchema');


const getProductDetails = async (req,res) => {
    try {
      
      const id = req.query.id;
      const productData = await Product.findOne({_id:id});
      const category = await Category.findOne({_id:productData.category});
      
      res.render('product-details',{product:productData, cat:category});
  
    } catch (error) {
      
    }
  }


module.exports = {
    getProductDetails
}