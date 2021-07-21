require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;

const ejs = require('ejs');

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended:true}));

const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');
// const md5 = require("md5");
// const bcrypt = require('bcrypt');
// const salt = 10;


const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

app.use(session({
    secret: 'My little secret',
    resave: false,
    saveUninitialized: false
    // cookie: { secure: true }
  }));

app.use(passport.initialize());
app.use(passport.session()) 

mongoose.Promise = global.Promise;

// Connect MongoDB at default port 27017.
mongoose.connect('mongodb://localhost:27017/secretDB', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
}, (err) => {
    if (!err) {
        console.log('MongoDB Connection Succeeded.')
    } else {
        console.log('Error in DB connection: ' + err)
    }
});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        // required: true
    },
    password: {
        type: String,
        // required: true
    },
    secret:String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get('/', (req, res) =>{
    res.render("home");
});

app.get("/login",(req, res) =>{
    res.render("login");
});

app.get('/register', (req, res) =>{
    res.render("register");
});

app.get("/secrets", function(req, res){
    User.find({"secret": {$ne: null}}, function(err, foundUsers){
      if (err){
        console.log(err);
      } else {
        if (foundUsers) {
          res.render("secrets", {usersWithSecrets: foundUsers});
        }
      }
    });
  });

app.get('/logout', (req,res)=>{
    req.logout();
    res.redirect("/");
});

app.get('/Submit', function (req, res){
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
});

app.post('/submit', function(req,res){
    const submittedSecret = req.body.secret;
    User.findById(req.user.id, function(err, foundUser){
       if(err){
           console.log(err);
       } 
       else{
           if(foundUser){
               foundUser.secret = submittedSecret;
               foundUser.save(function(){
                   res.redirect("/secrets");
               })
           }
       }
    })

})
app.post('/register', (req, res) =>{
    User.register({username: req.body.username, active: false}, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req, res,function(){
                res.redirect("/secrets");
            });
        }
    });



    //console.log(req.body.username);
    // bcrypt.hash(req.body.password, salt, function(err, hash) {
    //     const newUser = new User({
    //         email: req.body.username,
    //         password: hash
    //     });
    //     newUser.save((err) =>{
    //         if(err) {
    //             console.log(err);
    //         }else{
    //             res.render("secrets");
    //         }
    //     })
    // });
    
});


app.post('/login',(req, res)=>{

    const user = new User({
        username : req.body.username,
        password : req.body.password
    });

    req.login(user, function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req, res,function(){
                res.redirect("/secrets");
            });
        }

    });



    // const username = req.body.username;
    // const password = req.body.password;
    // User.findOne({
    //     email: username,
    // }).then((foundUser) => {
    //     if (!foundUser) {
    //         console.log("no such user")
    //     } else{
    //         bcrypt.compare(password, foundUser.password, function(err, result) {
    //             if(result == true){
    //                 res.render("secrets");
    //             }
    //             else{
    //                 res.send("wrong password! try again");
    //             }
    //         });    
    //     }
    // });
});


app.listen(3000, function() {
    console.log("Server started on port 3000");
});
  
