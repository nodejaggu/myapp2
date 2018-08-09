var nunjucks = require('nunjucks');
module.exports = app => {
nunjucks.configure('views', {
    autoescape: true,
    express: app
});    
var env = new nunjucks.Environment();
env.addFilter('epoch_date', function(epoch) {
	var myDate = new Date( epoch *1000);
	return myDate.toGMTString()
});
env.express(app);
};
