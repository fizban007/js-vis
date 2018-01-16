const express = require('express');
const app = express();
const server = require('http').createServer(app);
const port = process.env.PORT || 4000;
const io = require('socket.io').listen(server);
const fs = require('fs');

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

// io.sockets.on('connection', function (socket) {
//     socket.on('render-frame', function (data) {
//         data.file = data.file.split(',')[1]; // Get rid of the data:image/png;base64 at the beginning of the file data
//         var buffer = new Buffer(data.file, 'base64');
//         console.log('Writing to file ' + __dirname + '/tmp/frame-' + data.frame + '.png');
//         fs.writeFile(__dirname + '/tmp/frame-' + data.frame + '.png', buffer.toString('binary'), 'binary');
//     });
// });
