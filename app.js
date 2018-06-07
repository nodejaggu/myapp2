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
var login_data = require('./models/user.js');
var task = require('./models/task.js');
var flash = require('express-flash');


passport.use(new LocalStrategy(function(username, password, done){
	User.findOne({username: username}, function(err, user){
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
  mongoose.connect("mongodb://myappnode:jaga@143jaga@ds151530.mlab.com:51530/myapp");

var app = express();


// view engine setup
app.set('port', process.env.PORT || 1179);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({secret: 'session secret key'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));


//CHECKING FOR LOGIN USERS

function islogin(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	
	res.redirect('/')
}
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
	
		var u_name=req.body.name;
		var username= req.body.email;
		var uid;

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
				var login_user = user;
				var id = login_user['_id'];
				uid = id;
				console.log(uid);
				res.cookie('__id',id);
			res.redirect('/login');
				});
				});
				
		}
	});

	var x = setTimeout(function(){
	var u_data = new login_data({name:u_name,email:username,__id:uid});

	u_data.save(function(err,result){
		if(err){
			console.log(err);
		}
		else{
			console.log(result);
		}
	});
},2000);

});



app.get('/login',function(req,res){
  res.render('login',{user: req.user,expressFlash: req.flash('success')});
});

app.post('/login',function(req,res,next){
	passport.authenticate('local', function(err, user, info) {
		if (err) return next(err)
		if (!user) {
		  return res.redirect('/login')
		}
		req.logIn(user, function(err) {
			if (err) return next(err);
			var login_user = user;
			var id = login_user['_id'];
			res.cookie('__id',id);
		  return res.redirect('/welcome');
		});
	  })(req, res, next);
});

app.get('/welcome',islogin,function(req,res){
	var co = req.cookies;
	var cid = co['__id'];
	var TaskDetails = [];
	var logData;
	console.log(cid);
	login_data.find({__id:cid},function(err,data){
		if(err){
			console.log(err);
		}
		else{
			logData = data;
			
			
		}
	});
	task.find({__id:cid},function(err,TaskData){
		if(err){
		   console.log(err);
		}
		else{
			
		   var dummy = TaskData;
		   var len = dummy.length;
		   TaskDetails.push(dummy[len-1]);
		   

		}
		
	 });
	 
	 var x = setTimeout(function(){
		console.log(logData);
		res.render('welcome',{res_data:logData,TaskData:TaskDetails,expressFlash: req.flash('success')});
	 },1000);
  
});

app.post('/task',function(req,res){
   var cid = req.cookies;
   var c_id = cid['__id'];
   var myDate = new Date();
   var myEpoch = myDate.getTime()/1000.0;
   var MyTask = new task({
      subject:req.body.Subject,
      company:req.body.CompanyName,
      task:req.body.Task,
      __id:c_id,
      epoch:myEpoch
   });
   MyTask.save(function(err,TaskSaved){
      if(err){
         console.log(err);
      }
      else{
		 console.log(TaskSaved);
		 req.flash('success', 'Saved in database');
         res.redirect('/welcome');
      }
   })
});

app.get('/TaskDashboard',islogin,function(req,res){
   var cid = req.cookies;
   var u_id = cid['__id'];
   var TaskDetails;
   var UserDetails;
   task.find({__id:u_id},function(err,TaskData){
      if(err){
         console.log(err);
      }
      else{
         
         TaskDetails = TaskData;
      }
      
   });
   login_data.find({__id:u_id},function(err,UserData){
      if(err){
         console.log(err);
      }
      else{
         UserDetails = UserData;
      }
   });

   var x = setTimeout(function(){
   res.render('dashboard',{TaskData:TaskDetails,UserData:UserDetails});
},1000);
});

app.post('/DeleteTask',function(req,res){
	var logs = req.body;
	var j = JSON.stringify(logs);
	var d_id = j.split('"')[1];
	task.remove({_id:d_id},function(err,RemainingData){
		if(err){
			console.log(err);
		}
		else{
			res.redirect('/TaskDashboard');
		}
	});
	
});

app.post('/updatetask',function(req,res){
	var u_id = req.body.u_id;
	var u_subject = req.body.u_subject;
	var u_company = req.body.u_company;
	var u_yourtask = req.body.u_yourtask;

	var x = {_id:u_id};
	var q = {$set:{subject:u_subject,company:u_company,task:u_yourtask}};
	task.update(x,q,function(err, result){
		if(err){
			console.log(err);
		}
		else{
			console.log(result);
			res.redirect("/TaskDashboard");
		}

})
});

app.get('/logout',function(req,res){
		req.logout();
		req.flash('success','LoggedOut');
		res.redirect('/login');
		res.clearCookie("__id");
});

app.get('/reset',function(req,res){
	
	res.render('reset',{expressFlash: req.flash('success'),ErrorMsg:req.flash('error')});
});

app.post('/resetpass',function(req,res){
	var c_id = req.cookies;
	var __id = c_id['__id'];
	var old_pass = req.body.old_pass;
	var new_pass = req.body.new_pass;
	var re_new_pass = req.body.re_new_pass;
	if(new_pass == re_new_pass){
		User.findOne({_id:__id},function(err,user){
			console.log(user);
			if(!user){
				console.log('user not find');
			}
			//validpass = user.comparePassword(old_pass);
			else{
			var hash = user.password;
			bcrypt.compare(old_pass, hash, function(err, data) {
				if(data == true){
					user.password = new_pass;
						user.save(function(err) {
							req.logIn(user, function(err) {
								console.log(user);
								
							});
						});
						req.flash('success','password has been changed successfully');
				}
				else{
					console.log('I am in else');
				}
				res.redirect('/login');
			});
		}
			
		});
	}
	else{
		req.flash('error','Re- entered password are not same');
		res.redirect('reset');
	}
	
	
});

// catch 404 and forward to error handler
app.listen(app.get('port'),function(){
  console.log('Server started on '+app.get('port')+' port');
});