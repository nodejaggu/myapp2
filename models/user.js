var mongoose = require('mongoose');
var userData = new mongoose.Schema({
    name:{type:String},
    email:{type:String},
    __id:{type:String}

});
module.exports = mongoose.model('user_data',userData);
  
