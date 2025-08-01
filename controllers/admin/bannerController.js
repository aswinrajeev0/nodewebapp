const Banner = require('../../models/bannerSchema')
const path = require('path');
const fs = require('fs');



const getBannerPage = async (req, res) => {
    try {

        const findBanner = await Banner.find();
        res.render('banner', { data: findBanner });

    } catch (error) {
        res.redirect('/admin/pageerror')
    }
}

const getAddBannerPage = async (req, res) => {
    try {

        res.render('add-banner')

    } catch (error) {
        res.redirect('/admin/pageerror')
    }
}

const addBanner = async (req, res) => {
    try {

        const data = req.body;
        const image = req.file.path;
        const newBanner = new Banner({
            image: image,
            title: data.title,
            description: data.description,
            startDate: new Date(data.startDate + "T00:00:00"),
            endDate: new Date(data.endDate + "T00:00:00"),
            link: data.link
        })
        await newBanner.save();
        res.redirect('/admin/banner');

    } catch (error) {
        console.error(error);
        res.redirect('/admin/pageerror')
    }
}

const deleteBanner = async (req,res) => {
    try {
        
        const id = req.query.id;
        await Banner.deleteOne({_id:id});
        res.redirect('/admin/banner');

    } catch (error) {
        console.error("Error deleting banner",error);
    }
}


module.exports = {
    getBannerPage,
    getAddBannerPage,
    addBanner,
    deleteBanner
}