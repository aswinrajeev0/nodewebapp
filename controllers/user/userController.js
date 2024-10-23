const User = require("../../models/userSchema");
const env = require("dotenv").config();
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

const pageNotFound = async (req, res) => {
  try {
    return res.render("page-404");
  } catch (error) {}
};

const loadHomepage = async (req, res) => {
    try {
      const userId = req.session.user;  // Assuming `req.session.user` stores the user ID
      if (userId) {
        const userData = await User.findById(userId);  // Find user by ID
        if (userData) {
          return res.render('home', { user: userData });
        }
      }
      return res.render("home");
    } catch (error) {
      console.log("Home page not found:", error);
      res.status(500).send("Server error");
    }
  };
  

const loadSignup = async (req, res) => {
  try {
    return res.render("signup");
  } catch (error) {
    console.log("Sign Up page not loading :", error);
    res.status(500).send("Server Error");
  }
};

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
  
      console.log("Sending email to:", email);  // Check if this is undefined
  
      const info = await transporter.sendMail({
        from: process.env.NODEMAILER_EMAIL,
        to: email,
        subject: "Verify your account",
        text: `Your OTP is ${otp}`,
        html: `<b><h4>Your OTP: ${otp}</h4></b>`,
      });
  
      return info.accepted.length > 0;
    } catch (error) {
      console.error("Error sending email", error);
    }
  }
  

const signup = async (req, res) => {
  try {
    const { username, phone, email, password, cpassword } = req.body;

    if (password != cpassword) {
      return res.render("signup", { message: "Passwords do not match" });
    }

    const findUser = await User.findOne({ email });
    if (findUser) {
      return res.render("signup", {
        message: "User with this email already exists",
      });
    }

    const otp = generateOtp();
    console.log(email)
    const emailSent = await sendVerificationEmail(email, otp);

    if (!emailSent) {
      return res.json("email-error");
    }

    req.session.userOtp = otp;
    req.session.userData = { username, phone, email, password };

    res.render("verify-OTP");
    console.log("OTP sent", otp);
  } catch (error) {
    console.error("Signup eror", error);
    res.redirect("/pageNotFound");
  }
};

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {}
};

const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    console.log(otp);

    if (otp === req.session.userOtp) {
      const user = req.session.userData;
      const passwordHash = await securePassword(user.password);

      const saveUserData = new User({
        username: user.username,
        email: user.email,
        phone: user.phone,
        password: passwordHash,
        ...(user.googleId && { googleId: user.googleId })
      });

      await saveUserData.save();
      req.session.user = saveUserData._id;
      res.json({ success: true, redirectUrl: "/" });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Invalid OTP, Please try again" });
    }
  } catch (error) {
    console.error("Error verifying OTP", error);
    res.status(500).json({ success: false, message: "An error occured" });
  }
};

const resendOtp = async (req,res) => {
    try {
        
        const {email} = req.session.userData;
        console.log(email)
        if(!email){
            return res.status(400).json({success:false,message:"Email not found in session"})
        }

        const otp = generateOtp();
        req.session.userOtp = otp;

        const emailSent = await sendVerificationEmail(email,otp);
        if(emailSent){
            console.log("Resend OTP: ",otp);
            res.status(200).json({success:true,message:"OTP resend "})
        }else{
            res.status(500).json({success:false,message:"failed to resend OYP. Please try again"})
        }

    } catch (error) {
        console.error("Error resending OTP",error);
        res.status(500).json({success:false,message:"Internal server error. Please try again"})
    }
}

const loadLogin = async (req, res) => {
  try {

    const message = req.query.message || ""

    if(!req.session.user){
        return res.render('login',{message})
    }else{
        res.redirect('/');
    }

  } catch (error) {
    res.redirect('/pageNotFound')
    // console.log("Login page not loading :", error);
    // res.status(500).send("Server Error");
  }
};

const login = async (req,res) => {
    try {
        
        const {email,password} = req.body;
        const findUser = await User.findOne({
            isAdmin:0,
            email:email
        })

        if(!findUser){
            return res.redirect('/login?message=User not found')
        }

        if(findUser.isBlocked){
            return res.render('login',{message:"User is blocked by admin"})
        }

        const passwordMatch = await bcrypt.compare(password,findUser.password);

        if(!passwordMatch){
            return res.render('login',{message:"Incorrect password"})
        }

        req.session.user = findUser._id;
        res.redirect('/')

    } catch (error) {
        console.error("Login error",error)
        res.render('login',{message:"Login failed. Please try again later"});
    }
}

const logout = async (req,res) => {
    try {
        
        req.session.destroy((err)=>{
            if(err){
                console.log("Session destruction error",err);
                return res.redirect('/pageNotFound')
            }
            return res.redirect('/login')
        })

    } catch (error) {
        console.log("Logout error",error);
        res.redirect('/pageNotFound');
    }
}

module.exports = {
  loadHomepage,
  pageNotFound,
  loadSignup,
  signup,
  verifyOtp,
  resendOtp,
  loadLogin,
  login,
  logout
};
