const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const Brand = require('../../models/brandSchema');
const User = require('../../models/userSchema');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');


const getProductAddPage = async (req, res) => {
    try {
        const category = await Category.find({ isListed: true });
        const brand = await Brand.find({ isBlocked: false });
        res.render('add-product', {
            cat: category,
            brand: brand
        });
    } catch (error) {
        console.error("Error fetching categories and brands:", error);
        res.status(500).render('page-error', { message: "Failed to load categories and brands" });
    }
};


const addProducts = async (req, res) => {
    try {
        const products = req.body;
        const productExists = await Product.findOne({
            productName: products.productName
        })

        if (!productExists) {
            const images = req.files.map((file) => file.path);

            const categoryId = await Category.findOne({ name: products.category })

            if (!categoryId) {
                return res.status(400).json("Invalid category name")
            }

            const newProduct = new Product({
                productName: products.productName,
                description: products.description,
                brand: products.brand,
                category: categoryId._id,
                regularPrice: products.regularPrice,
                salePrice: products.salePrice,
                createdAt: new Date(),
                quantity: products.quantity,
                size: products.size,
                color: products.color,
                productImage: images,
                status: "Available",
            })

            await newProduct.save();
            return res.redirect('/admin/addproduct')

        } else {
            return res.status(400).json("Product already exists, please try with another name");
        }

    } catch (error) {
        console.error("Error adding product", error)
        res.redirect('/admin/pageerror')
    }
}

const getAllProducts = async (req, res) => {
    try {

        const search = req.query.search || "";
        const page = req.query.page || 1;
        const limit = 8;

        const productData = await Product.find({
            $or: [
                { productName: { $regex: ".*" + search + ".*", $options: "i" } },
                { brand: { $regex: ".*" + search + ".*", $options: "i" } }
            ]
        }).sort({ createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit).populate('category').exec();
        const count = await Product.find({
            $or: [
                { productName: { $regex: ".*" + search + ".*", $options: "i" } },
                { brand: { $regex: ".*" + search + ".*", $options: "i" } }
            ]
        }).countDocuments();

        const category = await Category.find({ isListed: true });
        const brand = await Brand.find({ isBlocked: false });

        if (category && brand) {
            res.render('products', {
                data: productData,
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                // cat:category,
                // brand:brand
            });
        } else {
            res.render("")
        }

    } catch (error) {
        res.redirect('/admin/pageerror');
        res.status(500).json({ status: false, message: "Internal server error" })
    }
}

const addProductOffer = async (req, res) => {
    try {
        const { productId, percentage } = req.body;
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ status: false, message: "Product not found" });
        }

        product.productOffer = parseInt(percentage, 10);
        const category = await Category.findById(product.category);
        const effectiveOffer = category ? Math.max(percentage, category.categoryOffer) : percentage;
        product.salePrice = product.regularPrice - Math.floor(product.regularPrice * (effectiveOffer / 100));
        await product.save();

        res.json({ status: true });
    } catch (error) {
        console.error("Error adding product offer:", error);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
};


const removeProductOffer = async (req, res) => {
    try {

        const { productId } = req.body;
        const findProduct = await Product.findOne({ _id: productId });
        findProduct.salePrice = findProduct.regularPrice;
        findProduct.productOffer = 0;
        await findProduct.save();
        return res.json({ status: true });

    } catch (error) {
        res.redirect('/admin/pageerror')
    }
}

const blockProduct = async (req, res) => {
    try {

        let id = req.query.id;
        await Product.updateOne({ _id: id }, { $set: { isBlocked: true } })
        res.redirect('/admin/products');

    } catch (error) {
        res.redirect('/admin/pageerror')
    }
}

const unBlockProduct = async (req, res) => {
    try {

        let id = req.query.id;
        await Product.updateOne({ _id: id }, { $set: { isBlocked: false } });
        res.redirect('/admin/products')

    } catch (error) {
        res.redirect('/admin/pageerror')
    }
}

const getEditProduct = async (req, res) => {
    try {

        const id = req.query.id;
        const product = await Product.findOne({ _id: id }).populate("category", "name");
        const category = await Category.find({});
        const brand = await Brand.find({});
        res.render('edit-product', {
            message: "",
            product: product,
            productCategory: product.category.name,
            cat: category,
            brand: brand,
        });

    } catch (error) {
        res.redirect('/admin/pageerror');
    }
}

const editProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const product = await Product.findOne({ _id: id });
        const data = req.body;
        const existingProduct = await Product.findOne({
            productName: data.productName,
            _id: { $ne: id }
        })

        if (existingProduct) {
            res.status(400).json({ error: "Product with this name already exists. Please try with another name" })
            res.render('edit-product', { message: "Product with this name already exists. Please try with another name" })
            return;
        }

        const images = req.files.map((file) => file.path);

        const category = await Category.findOne({ name: data.category })

        const updateFields = {
            productName: data.productName,
            description: data.description,
            brand: data.brand,
            category: category._id,
            regularPrice: data.regularPrice,
            salePrice: data.salePrice,
            quantity: data.quantity,
            color: data.color
        }

        if (req.files.length > 0) {
            updateFields.$push = { productImage: { $each: images } };
        }

        await Product.findByIdAndUpdate(id, updateFields, { new: true });
        res.redirect('/admin/products');

    } catch (error) {
        console.error(error);
        res.redirect('/admin/pageerror')
    }
}

const deleteSingleImage = async (req, res) => {
    try {

        const { imageNameToServer, productIdToServer } = req.body;
        await Product.findByIdAndUpdate(productIdToServer, { $pull: { productImage: imageNameToServer } });
        const imagePath = path.join("public", "uploads", "re-image", imageNameToServer);
        if (fs.existsSync(imagePath)) {
            await fs.unlinkSync(imagePath);
            console.log(`Image ${imageNameToServer} deleted succefully`);
        } else {
            console.log(`Imaage ${imageNameToServer} not found`);
        }
        res.send({ status: true });

    } catch (error) {
        res.redirect('/admin/pageerror')
    }
}

module.exports = {
    getProductAddPage,
    addProducts,
    getAllProducts,
    addProductOffer,
    removeProductOffer,
    blockProduct,
    unBlockProduct,
    getEditProduct,
    editProduct,
    deleteSingleImage
}