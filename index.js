const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server, {
	cors: {
		origin: 'http://localhost:3000',
	}
})

io.on('connection', (socket) => {
	socket.on('create-room', (code) => {
		if (socket.code) {
			socket.leave(socket.code)
			delete socket.code
			delete socket.isHost
		}
		socket.join(code)
		socket.code = code
		socket.isHost = true
	})
	socket.on('join-room', (code) => {
		if (socket.code) {
			socket.leave(socket.code)
			delete socket.code
			delete socket.isHost
		}
		if (io.sockets.adapter.rooms.get(code)) {
			socket.join(code)
			socket.code = code
			socket.isHost = false
			socket.emit('room-joined', code)
		} else {
			socket.emit('room-not-found')
		}
	})
})

server.listen(3001, () => {
	console.log('listening on *:3001')
})
