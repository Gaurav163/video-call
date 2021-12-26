const express = require('express')
const { SocketAddress } = require('net')
const { ExpressPeerServer } = require('peer');
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
    res.render('room', { roomId: req.params.room, PORT: process.env.PORT || 3000 })
})
const users = {};
const sid = {};
const uid = {};
io.on('connection', socket => {
    const mobile = socket.handshake.query.mobile;
    sid[mobile] = socket.id;
    users[socket.id] = mobile;
    console.log(mobile);


    socket.on('join-user', (userId) => {
        uid[users[socket.id]] = userId;

    })

    socket.on("call-to", mobile => {
        const user = users[socket.id];
        console.log(user, mobile);
        socket.to(sid[mobile]).emit("new-call", uid[user], user);
    })
    socket.on("call-declined", mobile => {
        socket.to(sid[mobile]).emit("call-rejected", users[socket.id] + " declined your call");
    })

    socket.on('disconnect', () => {
        let user = users[socket.id];
        socket.broadcast.emit('user-disconnected', uid[user]);
    })

    socket.on("my-id", data => {
        console.log(socket.id);
    })
})

const peerServer = ExpressPeerServer(server, {
    path: '/myapp'
});
app.use('/peerjs', peerServer);
console.log(process.env.PORT);

server.listen(process.env.PORT || 3000); 