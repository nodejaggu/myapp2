const MongoClient = require('mongodb').MongoClient;
var test = (req,res,next)=>{
    var url = "mongodb://myapp:jaga143jaga@ds161503.mlab.com:61503/myapp";
    MongoClient.connect(url,{ useNewUrlParser: true },function(err,db){
        if(err) throw err;
        console.log('DataBase opened');
        var dbo = db.db('myapp');
        dbo.collection("tasks").find({}).toArray(function(err, result) {
            if (err) throw err;
           req.test = result;
           next();
            db.close();
          });
    
    });
    
}