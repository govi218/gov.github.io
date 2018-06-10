var express = require('express');
var app = express();
var router = express.Router();
  
var path = __dirname + '/views/';

app.use(express.static(path));
app.use('/',router);
  
router.get('/',function(req, res){
  res.sendFile(path + 'index.html');
});
  
app.use('*',function(req, res){
  res.sendFile(path + 'index.html');
});
  
app.listen(process.env.PORT || 5000, function(){
  console.log('Server running at Port' + process.env.PORT);
});