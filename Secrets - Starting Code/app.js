require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;

const ejs = require('ejs');

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended:true}));

const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

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

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

userSchema.plugin(encrypt,{secret: process.env.SECRET, encryptedFields:["password"]});

const User = new mongoose.model('User', userSchema);


app.get('/', (req, res) =>{
    res.render("home");
});

app.get("/login",(req, res) =>{
    res.render("login");
});

app.get('/register', (req, res) =>{
    res.render("register");
});

app.post('/register', (req, res) =>{
    //console.log(req.body.username);
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });
    newUser.save((err) =>{
        if(err) {
            console.log(err);
        }else{
            res.render("secrets");
        }
    })
});


app.post('/login',(req, res)=>{
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({
        email: username,
    }).then((doc) => {
        if (!doc) {
            console.log("no such user")
        } else{
            if(doc.password === password) {
                res.render("secrets");
            }
            else{
                res.send("wrong password! try again");
            }
        }
    });
});


app.listen(3000, function() {
    console.log("Server started on port 3000");
});
  
