

const pageNotFound = async (req,res) => {
    try {
        
        return res.render('page-404')

    } catch (error) {
        
    }
}

const loadHomepage = async (req,res) => {
    try {

        return res.render('home')

    } catch (error) {
    console.log("Home page not fount");
    res.status(500).send('Server error')        
    }
}


module.exports = {
    loadHomepage,
    pageNotFound
}