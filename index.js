
const express=require("express");
const shortid = require('shortid');  // generator ID unique
const bodyParser=require("body-parser");
const app=express();
const cookieParser=require('cookie-parser');
// const md5=require('md5');

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded


const sql=require('mssql');
// const multer=require('multer');



app.set('view engine','pug');
app.set('views','./views');
// var urlencodedParser = bodyParser.urlencoded({ extended: false });

const config = {
    user: 'sa',
    password: '1710929',
    server: 'localhost', // You can use 'localhost\\instance' to connect to named instance
    database: 'Elearning',
    port: 1433
}

app.use(express.static('public'));
app.use(cookieParser());




var user;
app.post('/signup', function(req, res){
    user = req.body;
    sql.connect(config).then(pool => {
        return pool.request().query("SELECT username, email FROM Users");
    }).then(result =>{

        const findEmail = result.recordset.filter((item)=>{
            return item.email === user.email; 
        })
        if(findEmail.length !== 0){ // đã có email dùng trước đó
            res.render("layouts/signup", {
                error: "Email is already taken"
            });
        }
        else{
            const findUsername = result.recordset.filter((item)=>{
                return item.username === user.username; 
            })

            if(findUsername.length !== 0){
                res.render("layouts/signup", {
                    error: "Account already exists"
                });
            }
            else{
                var today = new Date();
                var dd = String(today.getDate()).padStart(2, '0');
                var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
                var yyyy = today.getFullYear();

                today = dd + '/' + mm + '/' + yyyy;
                
                var queryInsert = "EXEC InsertUser '"+shortid.generate()+"',N'"+user.name+"','"+user.username+"','"+
                user.password+"','"+user.email+"','"+user.phone+"','"+today+"',"+1+
                ",'"+user.country+"'";
                // console.log(queryInsert);
                
                sql.connect(config).then(pool => {
                    return pool.request().query(queryInsert);
                }).then(result =>{
                    res.render("layouts/signup", {
                        success: "You have successfully registered"
                    });
                }).catch(err=>{
                    console.log(err);
                });

            }
        }
            
    }).catch(err=>{
        console.log(err);
    });


});

app.post('/login', function(req, res){
    user = req.body;
    sql.connect(config).then(pool => {
        return pool.request().query('SELECT * FROM Users');
    }).then(result =>{
        var result = result.recordset;
        const filterUser = result.filter((item)=>{
            return item.username === user.username && item.password === user.password;
        })

        if(filterUser.length !== 0){
            
            if(filterUser[0].userType === 1){
                res.cookie('user', filterUser[0]);
                res.redirect('/home');
            }
        }
        else{
            res.render("layouts/login", {
                error: 1
            });
        }

    }).catch(err=>{
        console.log(err);
    });

});

app.post('/change_pass', function(req, res){

    console.log(req.cookies.user)
    if( req.body.username !== req.cookies.user.username){
        res.render('layouts/change_pass',{
            error: "Username not correct."
        });
    }
    else{
        if(req.body.old_password !== req.cookies.user.password){
            res.render('layouts/change_pass',{
                error: "Old password not correct."
            });
        }
        else{
            if(req.body.new_password !== req.body.confirm_password){
                res.render('layouts/change_pass',{
                    error: "Confirm password not correct."
                });
            }
            else{
                console.log(req.body.new_password);
                sql.connect(config).then(pool => {
                    return pool.request().query("EXEC UpdatePasswordUser '"+req.body.new_password+"','"+req.cookies.user.userID+"'");
                }).then(result =>{
                    res.render('layouts/change_pass',{
                        success: "You have change password succecfully."
                    });
                }).catch(err=>{
                    console.log(err);
                });
                    
            }
        }
    }
});

app.post('/edit_profile', function(req, res){
    sql.connect(config).then(pool => {
        return pool.request().query("EXEC UpdateProfileUser N'"+req.body.name+
        "','"+req.body.phone+"','"+req.body.address+"','"+req.body.country+"','"+req.cookies.user.userID+"'");
    }).then(result =>{
        sql.connect(config).then(pool => {
            return pool.request().query("SELECT * FROM Users WHERE userID = '"+req.cookies.user.userID+"'");
        }).then(result1 =>{
            res.cookie('user',result1.recordset[0]);
            res.render('layouts/profile',{
                title: "Profile",
                user: result1.recordset[0]
            });
        }).catch(err=>{
            console.log(err);
        });
    }).catch(err=>{
        console.log(err);
    });
});

app.post('/courses/search', function(req, res){
    var key = req.body.key;
    sql.connect(config).then(pool => {
        return pool.request().query('SELECT * FROM Course');
    }).then(result =>{
        var ListCourse=getListCourseByName(key,result.recordset);
        res.render('layouts/search_course',{
            title: "Search",
            user: req.cookies.user,
            result: ListCourse,
            num: ListCourse.length,
            key:key,
        })

    }).catch(err=>{
        console.log(err);
    });

});



app.get('/', function(req, res){
    
    res.clearCookie('user');
    sql.connect(config).then(pool => {
        return pool.request().query('select * from Course');
    }).then(result =>{
        res.render('layouts/home',{
            title: "BKLearning",
            result: result.recordset
        });
    }).catch(err=>{
        console.log(err);
    });
    
});

app.get('/home', function(req, res){ 

    
    var num =0;
    sql.connect(config).then(pool => {
        return pool.request().query("select * from Cart WHERE Cart.userID = '"+req.cookies.user.userID+"'");
    }).then(result =>{
        num = result.recordset.length; 
    }).catch(err=>{
        console.log(err);
    });

    sql.connect(config).then(pool => {
        return pool.request().query('select * from Course');
    }).then(result =>{

        res.render('layouts/home_user',{
            title: "Home",
            result: result.recordset,
            user: req.cookies.user,
            num: num
        });
    }).catch(err=>{
        console.log(err);
    });

});

app.get('/login', function(req, res){ 
    res.clearCookie('user');
    res.render('layouts/login',{
        title: "Login",
    }); 
});

app.get('/signup', function(req, res){ 
    res.render('layouts/signup',{
        title: "Signup"
    }); 
});

app.get('/change_password', function(req, res){ 
    res.render('layouts/change_pass',{
        title: "Change Password"
    }); 
});

app.get('/logout', function(req, res){ 
    res.clearCookie("user");
    res.redirect('/');
});
app.get('/go-home', function(req, res){ 
    res.redirect('/home');
});

app.get('/profile', function(req, res){ 
    sql.connect(config).then(pool => {
        return pool.request().query("EXEC ViewUser '"+req.cookies.user.userID+"'");
    }).then(result =>{ 
        res.render('layouts/profile',{
            title: "Profile",
            user: result.recordset[0]
        });
    }).catch(err=>{
        console.log(err);
    });
     
});

app.get('/Add_Cart/:id', function(req, res){
    var num =0;
    sql.connect(config).then(pool => {
        return pool.request().query("select * from Cart WHERE Cart.userID = '"+req.cookies.user.userID+"'");
    }).then(result =>{
        num = result.recordset.length; 
    }).catch(err=>{
        console.log(err);
    });

    sql.connect(config).then(pool => {
        return pool.request().query("SELECT * FROM Course WHERE courseID ='"+req.params.id+"'");
    }).then(result =>{ 

        sql.connect(config).then(pool => {
            return pool.request().query("INSERT INTO Cart VALUES ('"+req.cookies.user.userID+"','"+req.params.id+"')");
        }).then(result1 =>{ 
            res.render('layouts/course_detail',{
                title: 'Course Detail',
                user: req.cookies.user,
                result: result.recordset[0],
                success: 1,
                num:num
            })

        }).catch(err=>{
            res.render('layouts/course_detail',{
                title: 'Course Detail',
                user: req.cookies.user,
                result: result.recordset[0],
                error: 1,
                num:num
            })
            
        });

    }).catch(err=>{
        console.log(err);
    });

    
});

app.get('/cart', function(req, res){


    sql.connect(config).then(pool => {
        return pool.request().query("SELECT Course.courseID, Course.title, Course.price ,Course.description, Course.linkImg FROM Cart , Course WHERE Cart.courseID = Course.courseID AND Cart.userID = '"+req.cookies.user.userID+"'"+ "ORDER BY Course.price DESC");
    }).then(result =>{ 
        var n = result.recordset.length
        var total = 0;
        for(var i=0;i<n;i++){
            total += result.recordset[i].price  
        }

        res.render('layouts/shopping_cart',{
            title: 'Cart',
            cart: result.recordset,
            num: n,
            total: total,
            user: req.cookies.user

        })
    }).catch(err=>{
        console.log(err);
    });
    
});

app.get('/remove_cart/:id', function(req, res){
    sql.connect(config).then(pool => {
        return pool.request().query("DELETE FROM Cart WHERE courseID = '"+req.params.id+"'");
    }).then(result =>{ 
        res.redirect('/cart');
    }).catch(err=>{
        console.log(err);
    });
    
});

app.get('/course_detail/:id', function(req, res){

    var num =0;
    sql.connect(config).then(pool => {
        return pool.request().query("select * from Cart WHERE Cart.userID = '"+req.cookies.user.userID+"'");
    }).then(result =>{
        num = result.recordset.length; 
    }).catch(err=>{
        console.log(err);
    });

    sql.connect(config).then(pool => {
        return pool.request().query("SELECT * FROM Course WHERE courseID = '"+req.params.id+"'");
    }).then(result =>{ 
        res.render('layouts/course_detail',{
            result: result.recordset[0],
            title:"Detail Course",
            user: req.cookies.user,
            num:num
        })
    }).catch(err=>{
        console.log(err);
    });
    
});




app.listen("3000",()=>{
    console.log("Server is running on port 3000...");
});




// function

function getListCourseByName(name,arr){
    var arrResult=[];
    for(var i=0;i<arr.length;i++){
        if(arr[i].title.toLowerCase().indexOf(name.toLowerCase()) !== -1){
            arrResult.push(arr[i]);
        }
    }
    return arrResult;
}