var express = require('express');
var path = require('path');
var app = express();

app.use('/', express.static(__dirname + '/'));
app.use('/static', express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname+'/index.html'));
});


app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});