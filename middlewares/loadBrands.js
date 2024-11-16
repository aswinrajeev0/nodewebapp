const Brand = require('../models/brandSchema');

const loadBrands = async (req,res,next) => {
    try {
        
        const brands = await Brand.find();
        res.locals.brands = brands;
        next();

    } catch (error) {
        console.error("Error loading brands",error);
        res.status(500).json({message:"Error loading brands"});
    }
}


module.exports = loadBrands;