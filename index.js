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

let boards = []

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
		if (!boards[code]) {
			boards[code] = { board: null, status: false, players: [] }
		}
	})
	socket.on('join-room', (code, name) => {
		if (socket.code) {
			socket.leave(socket.code)
			delete socket.code
			delete socket.isHost
		}
		if (io.sockets.adapter.rooms.get(code)) {
			let player = playerIsInRoom(code, name)
			if (player) {
				socket.emit('name-taken')
			}else {
				socket.join(code)
				socket.code = code
				socket.isHost = false
				socket.name = name
				boards[code].players.push({ name: name, points: 0 })
				socket.emit('room-joined', code, boards[code])
				io.to(socket.code).emit('player-joined', boards[socket.code].players)
				io.to(socket.code).emit('update-board', boards[socket.code])
			}
		} else {
			socket.emit('room-not-found')
		}
	})
	socket.on('update-board', (board, boardStatus) => {
		socket.board = board
		boards[socket.code].board = board
		boards[socket.code].status = boardStatus
		console.log(boards[socket.code])
		io.to(socket.code).emit('update-board', boards[socket.code])
	})
	socket.on('disconnect', () => {
		if (boards[socket.code]) {
			if (socket.isHost) {
				delete boards[socket.code]
				io.to(socket.code).emit('host-left', socket.name)
			}else {
				console.log(boards[socket.code].players)
				let player = playerIsInRoom(socket.code, socket.name)
				if (player) {
					removePlayerFromRoom(socket.code, socket.name)
				}
				console.log(boards[socket.code].players)
				io.to(socket.code).emit('player-left', boards[socket.code].players)
				io.to(socket.code).emit('update-board', boards[socket.code])
			}
		}
	})
})

server.listen(3001, () => {
	console.log('listening on *:3001')
})

function playerIsInRoom(code, name) {
	let player = boards[code].players.find((player) => {
		return player.name === name
	})
	return player
}

function removePlayerFromRoom(code, name) {
	boards[code].players = boards[code].players.filter((player) => {
		return player.name !== name
	})
}