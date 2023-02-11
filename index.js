const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server, {
	cors: {
		origin: process.env.ORIGIN_URL || 'http://localhost:3000',
	}
})
let port = process.env.PORT || 3001

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
			boards[code] = { board: null, status: false, activeQuestion: null, players: [] }
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
			} else if (boards[code].status) {
				socket.emit('already-running')
			} else {
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
	socket.on('update-board', (board, boardStatus, activeQuestion, players) => {
		socket.board = board
		boards[socket.code].board = board
		boards[socket.code].status = boardStatus
		boards[socket.code].activeQuestion = activeQuestion
		boards[socket.code].players = players
		io.to(socket.code).emit('update-board', boards[socket.code])
	})
	socket.on('buzz', () => {
		if (!boards[socket.code].activeQuestion.question.buzzed) {
			io.to(socket.code).emit('player-buzzed', socket.name)
		}
	})
	socket.on('answer', (answer) => {
		if (boards[socket.code].activeQuestion.question.buzzed && boards[socket.code].activeQuestion.question.buzzed.player === socket.name) {
			io.to(socket.code).emit('answered', answer)
		}
	})
	socket.on('disconnect', () => {
		if (boards[socket.code]) {
			if (socket.isHost) {
				delete boards[socket.code]
				io.to(socket.code).emit('host-left', socket.name)
			}else {
				let player = playerIsInRoom(socket.code, socket.name)
				if (player) {
					removePlayerFromRoom(socket.code, socket.name)
				}
				io.to(socket.code).emit('player-left', boards[socket.code].players)
				io.to(socket.code).emit('update-board', boards[socket.code])
			}
		}
	})
})

server.listen(port, () => {
	console.log('listening on *:' + port)
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