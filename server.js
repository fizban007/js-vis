const express = require('express');
const app = express();
const server = require('http').createServer(app);
const port = process.env.PORT || 4000;


app.use(express.static('public'));

app.get('/', function (req, res) {
    res.render('index');
});
app.post('/', function (req, res) {
    res.render('index');
});

server.listen(port, function () {
    console.log('Example app listening on port ' + port);
});
