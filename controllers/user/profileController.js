const User = require('../../models/userSchema');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const env = require('dotenv').config();
const session = require('express-session');


function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, otp) {
    try {
        console.log("Email in sendVerificationEmail:", email);  // Log to check
        const transporter = nodemailer.createTransport({
            service: "gmail",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD,
            },
        });

        console.log("Sending email to:", email);

        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Your OTP for password reset",
            text: `Your OTP is ${otp}`,
            html: `<b><h4>Your OTP: ${otp}</h4></b>`,
        });

        return info.accepted.length > 0;
    } catch (error) {
        console.error("Error sending email", error);
    }
}

const securePassword = async (password) => {
    try {
        
        const passwordHash = await bcrypt.hash(password,10);
        return passwordHash;

    } catch (error) {
        
    }
}

const getForgotPassword = async (req, res) => {
    try {

        const message = req.query.msg || ""
        res.render('forgot-password',{message})

    } catch (error) {
        res.redirect('/page-not-found')
    }
}

const forgotEmailValid = async (req, res) => {
    try {

        const { email } = req.body;
        const findUser = await User.findOne({ email: email });

        if (findUser) {
            const otp = generateOtp();
            const emailSent = await sendVerificationEmail(email, otp);
            if(emailSent){
                req.session.forgOtp = otp;
                req.session.email = email;
                res.render("forgotPass-otp")
                console.log("OTP: "+otp);
            }else{
                res.json({success:false,message:"Failed to send OTP. Please try again"})
            }
        }else{
            res.redirect("/forgot-password?msg=User with this email does not exist")
        }

    } catch (error) {
        res.redirect('/page-not-found')
    }
}

const verifyForgotOtp = async (req, res) => {
    try {
        const enteredOtp = req.body.otp;

        console.log("Entered OTP:", enteredOtp);  // Log to check
        console.log("Stored OTP:", req.session.forgOtp);  // Log to check

        if (enteredOtp === req.session.forgOtp) {
            res.json({ success: true, redirectUrl: '/reset-password' });
        } else {
            res.json({ success: false, message: "OTP does not match. Please try again." });
        }
    } catch (error) {
        console.error("Error verifying OTP", error);  // Log the error
        res.status(500).json({ success: false, message: "An error occurred. Please try again." });
    }
};


const getResetPassPage = async (req,res) => {
    try {
        
        const message = req.query.msg || ""
        res.render('reset-password',message);

    } catch (error) {
        res.redirect('/page-not-found');
    }
}

const resendOtp = async (req,res) => {
    try {
        
        const otp = generateOtp();
        req.session.forgOtp = otp;
        const email = req.session.email;
        console.log("Resending OTP to email: "+otp);
        const emailSent = await sendVerificationEmail(email,otp);
        if(emailSent){
            console.log("Resemd OTP:",otp);
            res.status(200).json({success:true,message:"Resend OTP Successful"})
        }

    } catch (error) {
        console.error("Error in resend OTP ",error);
        res.status(500).json({success:false,message:"Internal server error"});
    }
}

const resetPassword = async (req,res) => {
    try {
        
        const {newPass1,newPass2} = req.body;
        const email = req.session.email;
        if(newPass1 === newPass2){
            const passwordHash = await securePassword(newPass1);
            await User.updateOne({email:email},{$set:{password:passwordHash}})
            res.redirect('/login')
        }else{
            res.redirect('/reset-password?msg=Password do not match')
        }

    } catch (error) {
        res.redirect('/page-not-found')
    }
}

module.exports = {
    getForgotPassword,
    forgotEmailValid,
    verifyForgotOtp,
    getResetPassPage,
    resendOtp,
    resetPassword
}