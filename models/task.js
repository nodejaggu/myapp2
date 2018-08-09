var mongoose = require('mongoose');
var tsakSchema = new mongoose.Schema({
    subject:{type:String},
    company:{type:String},
    task:{type:String},
    __id:{type:String},
    epoch:{type:String}
});

module.exports=mongoose.model('task',tsakSchema);