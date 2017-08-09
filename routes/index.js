var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Govind Mohan'
  , github: 'https://github.com/gov218'
  , email: 'info@govindmohan.com',
    contact: '+1 (647) 261-7358'});
});

module.exports = router;
