const mobile = prompt('What is your mobile?');
const socket = io('/', { query: "mobile=" + mobile })


const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
    host: '/',
    path: "/peerjs/myapp",
    port: PORT
})
const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    addVideoStream(myVideo, stream)

    myPeer.on('call', call => {
        call.answer(stream)
        const video = document.createElement('video');
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream)
        })
    })

    socket.on('user-connected', userId => {
        console.log(userId);
        connectToNewUser(userId, stream)
    })
    socket.on("new-call", (userId, mobile) => {
        console.log("new call from: ", mobile);
        if (confirm("Call from " + mobile + ". Press ok for Accept."))
            connectToNewUser(userId, stream)
        else {
            socket.emit("call-declined", mobile);
        }

    })
})
socket.on("call-rejected", message => {
    console.log(message);
})


function call() {
    let mobile = document.getElementById("mobile").value;
    socket.emit("call-to", mobile);
}

socket.on('user-disconnected', userId => {
    console.log(userId);
    if (peers[userId]) peers[userId].close()
})

myPeer.on('open', id => {
    console.log("connected", id);
    socket.emit('join-user', id);
})

function connectToNewUser(userId, stream) {
    console.log("hello");
    const call = myPeer.call(userId, stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream)
    })
    call.on('close', () => {
        console.log("yes");
        video.remove()
    })

    peers[userId] = call
}

function addVideoStream(video, stream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })
    videoGrid.append(video)
}