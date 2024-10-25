const User = require('../../models/userSchema');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const pageError = async (req,res) => {
    try {
        
        res.render('admin-error')

    } catch (error) {
        
    }
}

const loadLogin = async (req,res) => {
    try {

        const message = req.query.msg || ""
        if(req.session.admin){
            return res.redirect('/admin/dashboard')
        }
        res.render('admin-login',{message})
    } catch (error) {
        
    }
}

const login = async (req,res) => {
    try {
        
        const {email,password} = req.body;
        const admin = await User.findOne({email:email,isAdmin:true});
        if(admin){
            const passwordMatch = await bcrypt.compare(password,admin.password);
            if(passwordMatch){
                req.session.admin = true;
                return res.redirect('/admin')
            }else{
                return res.redirect('/admin/login?msg=Incorrect Password')
            }
        }else{
            return res.redirect('/admin/login?msg=Admin not found')
        }

    } catch (error) {
        console.log('Admin login error',error);
        return res.redirect('/pageerror')
    }
}

const loadDashboard = async (req,res) => {
    try {
        
        if(req.session.admin){
            res.render('dashboard');
        }

    } catch (error) {
        res.redirect('/pageerror')
    }
}

const logout = async (req,res) => {
    try {
        
        req.session.destroy(err=>{
            if(err){
                console.log("Error destoying session",err);
                return res.redirect('/pageerror')
            }
            res.redirect('/admin/login')
        })

    } catch (error) {
        console.log("Unexpected error during logout",error);
        res.redirect('/pageerror')
    }
}

module.exports = {
    pageError,
    loadLogin,
    login,
    loadDashboard,
    logout
}