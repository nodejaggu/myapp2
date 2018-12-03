var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
//var ejs = require('ejs');
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
var nunjucks = require('nunjucks');
var nunjucks_filters = require('./public/javascripts/nunjucks_filters.js');
//var dbData = require('./database/userdata.js');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require("body-parser");
//var cors = require('cors');
const webshot = require('webshot');
var fs = require('fs');
var csvdata = require('csvdata');
const fileExists = require('file-exists');



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
  mongoose.connect("mongodb://myapp:jaga143jaga@ds161503.mlab.com:61503/myapp");

var app = express();
nunjucks_filters(app);

// view engine setup
app.set('port', process.env.PORT || 1151);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'nunjucks');



app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({secret: 'session secret key'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
//app.use(express.static(path.join(__dirname, 'public')));
app.use("/public",express.static(__dirname + "/public"));
app.use("/database",express.static(__dirname + "/database"));
app.use('/',express.static(__dirname + '/'));
//app.use(cors());
// async filters must be known at compile-time


//CHECKING FOR LOGIN USERS

function islogin(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	
	res.redirect('/')
}

//Taking user data from database
var mydata = function (req,res,next){
	login_data.find({},function(err,data){
		if(err){
			console.log(err);
		}
		else{
			req.mydata = data;
			next();
		}
	});
}


//HOME PAGE GET ROUTE
app.get('/',function(req,res){
  res.render('home.html',{user: req.user,DataError:req.flash('error')});
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
		User.find({"username":username}, function(err ,result){
		console.log(result.length);		
		if(result.length){
			console.log(result);
			req.flash('error', 'Email Already exist !');
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
  res.render('login.html',{user: req.user,expressFlash: req.flash('success'),DataError:req.flash('error')});
});

app.post('/login',function(req,res,next){
	passport.authenticate('local', function(err, user, info) {
		if (err) return next(err)
		if (!user) {
		  req.flash('error','Invalid UserName or Password');	
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
		res.render('welcome.html',{res_data:logData,TaskData:TaskDetails,expressFlash: req.flash('success')});
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

app.get('/TaskDashboard',function(req,res){
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
   res.render('dashboard.html',{TaskData:TaskDetails,UserData:UserDetails});
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
		
});

app.get('/reset',function(req,res){
	
	res.render('reset.html',{expressFlash: req.flash('success'),ErrorMsg:req.flash('error')});
});

app.post('/resetpass',function(req,res){
	var c_id = req.cookies;
	var __id = c_id['__id'];
	var old_pass = req.body.old_pass;
	var new_pass = req.body.new_pass;
	var re_new_pass = req.body.re_new_pass;
	console.log(old_pass,new_pass);
	if(new_pass == re_new_pass && new_pass!="" && old_pass!=""){
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
		res.redirect('reset.html');
	}
	
	
});

app.use(mydata);

app.get('/admin',function(req,res,mydata){
	var userData = req.mydata;
	res.render('admin.html',{adminData:userData});
	
});


app.get('/view/:id/:date/:mine',function(req,res,mydata){
	var id = req.params.id;
	var to = req.path.split('/')[3];
	var from = req.path.split('/')[4];
	var name;
	var UserDATA = req.mydata;
	UserDATA.forEach(function(each){
		if(each.__id == id){
			name = each.name;
		}
	})
	var query_details = [{'to':to,'from':from,'name':name}];
	console.log('Sending user details and timings to front end'+query_details);
	var query = {'__id':id,'epoch':{$gte:to,$lt:from}}
	task.find(query,function(err,query_result){
		res.render('adminDashboard.html',{TaskData:query_result,UserDetails:query_details});
	});



});


app.get('/testing',(req,res,test)=>{
	var url = "mongodb://myapp:jaga143jaga@ds161503.mlab.com:61503/myapp";
    MongoClient.connect(url,{ useNewUrlParser: true },function(err,db){
        if(err) throw err;
        console.log('DataBase opened');
        var dbo = db.db('myapp');
        dbo.collection("tasks").find({}).toArray(function(err, result) {
            if (err) throw err;
           res.json({"responce":result});
            db.close();
          });
    
    });
	
});

app.get('/push',(req,res) =>{
	res.render("myapi.html");
});

app.post('/webshot',(req,res) => {
	var url = req.body.url;
	console.log(url);
	var options = {
		streamType:"png",
		windowSize:{
			width:1024,
			height:786
		},
		shotSize:{
			width:"all",
			height:"all"
		}
	};

	webshot(url,"myimage.png",options,(err)=>{
		if(err) throw err;
		host = "http://mydevappnode.herokuapp.com/";
		var images_url = host+"myimage.png";
		res.json({"url":url,"img":images_url});
	});
});
app.post('/pushdata',(req,res)=>{
	//var data = []
	var data = req.body;
	//data.push(req_data);
	console.log(data);
	if(true){
	data.forEach((each)=>{
		var mydate = new Date().toLocaleDateString();
		var date = mydate.split('/').join('-');
		var mytime = new Date().toLocaleTimeString();
		var current_date = date+" "+mytime;
		each["date"] = current_date;
	})
	var obj_keys  = Object.keys(data[0]);
	header_keys = "";
	var append_value = false;
	var dirname = "public_csv"
	obj_keys.forEach((each,index)=>{
		if(index != (obj_keys.length-1)){
		header_keys = header_keys+each+","
		}
		else{header_keys = header_keys+each}
	});
	
	fileExists('./cron.csv').then(exists => {

		if(exists == true){
			csvdata.write('./cron.csv', data, {header: header_keys,encoding: 'utf8',append:true});
		}
		else{
			csvdata.write('./cron.csv', data, {header: header_keys,encoding: 'utf8'});
		}
	  });
	  res.json({"status":"succesfully created csv file"});
	}
	else{
		res.json({"status":"Please pass the correct json data"});
	}
});

app.post('/webhook',(req,res)=>{
console.log(req.body);
	console.log(req.headers);
	res.json({"status":"Please pass the correct json data"});
});
// catch 404 and forward to error handler
app.listen(app.get('port'),function(){
  console.log('Server started on '+app.get('port')+' port');
});
