var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var ejs = require('ejs');
var session = require('express-session');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');
var async = require('async');
var crypto = require('crypto');


passport.use(new LocalStrategy(function(username, password, done){
	User.findOne({username: username}, function(err, user){
		console.log(user);
		if(err) return done(err);
		if(!user) return done(null, false, {message: 'Incorrect username'});
		user.comparePassword(password, function(err, isMatch){
		if(isMatch){
			return done(null ,user)
		}
		else{
			return done(null ,false, {message: 'incorrect password'});
		}
});

});

}));

passport.serializeUser(function(user, done){ 
	done(null ,user.id);
});

passport.deserializeUser(function(id, done){
	User.findById(id, function(err,user){
	done(err, user);
});
});


var userSchema = new mongoose.Schema({
    username:{type:String},
    password:{type:String}
});

userSchema.pre('save', function(next) {
	var user = this;
	var SALT_FACTOR = 5;
  
	if (!user.isModified('password')) return next();
  
	bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
	  if (err) return next(err);
  
	  bcrypt.hash(user.password, salt, null, function(err, hash) {
		if (err) return next(err);
		user.password = hash;
		next();
	  });
	});
  });

  userSchema.methods.comparePassword = function(candidatePassword, cb) {
	bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
	  if (err) return cb(err);
	  cb(null, isMatch);
	});
  };

  var User = mongoose.model('User', userSchema);
  mongoose.connect("mongodb://localhost/myapp");

var app = express();


// view engine setup
app.set('port', process.env.PORT || 1179);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));


//HOME PAGE GET ROUTE
app.get('/',function(req,res){
  res.render('home',{user: req.user});
});

//POST DATA OF SIGNUP FOR USER
app.post('/signup', function(req,res){
	var user = new User({
		username: req.body.email,
		password: req.body.password
	});

	var uname=req.body.email;
	var query = {email:uname}
	User.find(query, function(err ,result){
		if(result.length){
			console.log(result);
			res.redirect('/');
		}
		else{
			user.save(function (err){
				req.logIn(user, function(err){
				console.log(user);
			res.redirect('/login');
				});
				});
		}
	})

});

app.get('/welcome',function(req,res){
  res.render('welcome');
});

app.get('/login',function(req,res){
  res.render('login',{user: req.user})
});

app.post('/login',function(req,res,next){
	passport.authenticate('local', function(err, user, info) {
		console.log(user);
		if (err) return next(err)
		if (!user) {
		  return res.redirect('/login')
		}
		req.logIn(user, function(err) {
		  if (err) return next(err);
		  return res.redirect('/welcome');
		});
	  })(req, res, next);
});

app.get('/logout',function(req,res){
		req.logout();
		res.redirect('/logout');
});

// catch 404 and forward to error handler
app.listen(app.get('port'),function(){
  console.log('Server started on '+app.get('port')+' port');
});