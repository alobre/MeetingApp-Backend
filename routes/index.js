var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/getMeetings', function(req, res, next) {
  let meetings = [
    {
      meeting_title: "Stardust",
      meeting_id: 101
    }
  ] 
  res.send(meetings);
});

module.exports = router;
