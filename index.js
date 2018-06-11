var express = require('express');
var spotify = require('./routes/spotify');

var app = express();
var router = express.Router();

var path = __dirname + '/views/';

app.use(express.static(path));
app.use('/',router);
//app.use('/spotify', spotify);

router.get('/',function(req, res){
  res.sendFile(path + 'index.html');
});

app.use('*',function(req, res){
  res.sendFile(path + 'index.html');
});
  
app.listen(process.env.PORT || 5000, function(){
  console.log('Server running at port: ' + (5000 || process.env.PORT));
});