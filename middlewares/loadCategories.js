const Category = require('../models/categorySchema');

const loadCategories = async (req, res, next) => {
    try {
        const categories = await Category.find({});
        res.locals.categories = categories;
        next();
    } catch (error) {
        console.error("Error fetching categories", error);
        next(error);
    }
};

module.exports = {
    loadCategories
}
