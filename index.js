const express = require("express")
const http = require("http")
const {hostname} = require("os")
const _SOCKET = require("socket.io")
const path = require('path');
const isWin = require('./functions/checkWinner')

const app = express()
const server = http.createServer(app)
const socket = new _SOCKET.Server(server)

const port = process.env.PORT || 8080
const backlog = () => {
    console.log(
    `Server => http://localhost:${port}`
    )
}


app.use(express.static(path.join(__dirname,"client")))

app.get("/",(req,res) => {
  res.status(200).sendFile(path.join(__dirname,"client","index.html"))
})

app.get("/*",(req,res) => {
  res.status(404).sendFile(path.join(__dirname,"client","404.html"))
})

const rooms = {}

socket.on("connection", (con) => {
  // Create Room
  con.on("create_room", (data) => {
    if(!rooms[data.roomname]){
      rooms[data.roomname] = { 
	users:[data.username],  
	count: 1,
	sid:[con.id],
	turn:data.username,
	board: Array(9).fill(null),
	assigned_sign: [Math.random() < 0.5 ? 'x' : 'o'],
	is_end: false
      }
      con.join(data.roomname)
      socket.to(data.roomname).emit('room_create_event',{
	status:"success", message: `Room created : ${data.roomname}`, roomname: data.roomname,
	player_sign: rooms[data.roomname].assigned_sign[0]
      })
    } else {
      con.emit("room_create_event",{ status:"fail", message: `Room ${data.roomname}, Already Exists!` })
    }
  })
  // Join Room
  con.on("join_room", (data) => {
    if(rooms[data.roomname]){
      let doAdd = true
      rooms[data.roomname].users.forEach((u) => {
	  if(data.username == u){
	    doAdd = false
	    con.emit('room_join_event',{
	      status:"fail", message: `User ${data.username}, Already in Room!`
	    })
	  }
      });
      if(doAdd){
	if(rooms[data.roomname].count < 2 ){
	  rooms[data.roomname].count += 1
	  rooms[data.roomname].users.push(data.username)
	  rooms[data.roomname].sid.push(con.id)
	  rooms[data.roomname].assigned_sign.push(
	    rooms[data.roomname].assigned_sign[0] == 'x' ? 'o' : 'x'
	  )
	  const opponent = rooms[data.roomname].users.filter(e => {return e !== data.username })
	  con.join(data.roomname)
	  socket.to(data.roomname).emit('room_join_event',{
	    status:"success" , 
	    message: `${data.username} Joined!`,
	    username: data.username,
	    opponent,
	    player_sign: rooms[data.roomname].assigned_sign[1],
	  })
	  socket.to(data.roomname).emit('player_turn',{ 
	    username: Math.random() < 0.5 ? data.username : opponent,
	    board: rooms[data.roomname].is_end ? Array(9).fill(null) : rooms[data.roomname].board,
	  })
	} else {
	  con.emit('room_join_event',{
	    status:"fail", message: "Room Full!"
	  })
	}
      }
    } else {
      con.emit('room_join_event',{
	status:"fail", message: "Room Doesn't Exist!"
      })
    }
  })
  // When Player Make a Mode
  con.on("player_move", (data) => {
    	rooms[data.current_room].board = data.board
	if(isWin(rooms[data.current_room].board)){
	  rooms[data.current_room].is_end = true
	  socket.to(data.current_room).emit('player_win',{ 
	    username: rooms[data.current_room].turn,  
	    board:rooms[data.current_room].board,
	    status: "win",
	    pattern: isWin(rooms[data.current_room].board).pattern
	  })
	} else if(rooms[data.current_room].board.every((c) => c) &&
	  	!isWin(rooms[data.current_room].board)) {
		rooms[data.current_room].is_end = true
		socket.to(data.current_room).emit('player_win',{ 
		  username: rooms[data.current_room].turn,  
		  board:rooms[data.current_room].board,
		  status: "tie"
		})
	} else {
	    rooms[data.current_room].is_end = false
	    rooms[data.current_room].turn = rooms[data.current_room].users.filter(e => {
		return e !== data.username
	      })[0]
	      socket.to(data.current_room).emit('player_turn',{ 
		username: rooms[data.current_room].turn,  
		board:rooms[data.current_room].board
	      })
	}
  })
  // Get Player Level Data
  con.on("player_level_data", (data) => {
    socket.to(data.current_room).emit("receive_player_level_data",data)
  })
  // Restart Game
  con.on("restart", (data) => {
    rooms[data.current_room].is_end = false
    rooms[data.current_room].board = Array(9).fill(null)
    rooms[data.current_room].turn = Math.random() < 0.5 ? data.username : rooms[data.current_room].users.filter(e => { return e !== data.username })[0]
    rooms[data.current_room].assigned_sign = [Math.random() < 0.5 ? 'x' : 'o']
    rooms[data.current_room].assigned_sign.push(
	     rooms[data.current_room].assigned_sign[0] == 'x' ? 'o' : 'x'
    )
    const username = rooms[data.current_room].users[Math.random() < 0.5 ? 0 : 1 ]
    const player_sign = rooms[data.current_room].assigned_sign[rooms[data.current_room].users.indexOf(username)]
    socket.to(data.current_room).emit("player_turn", {
      username,
      board: rooms[data.current_room].board
    })
    socket.to(data.current_room).emit("change_sign", {
      username,
      player_sign,
      opponent_sign : player_sign == 'x' ? 'o' : 'x'
    })
  })
  // Handle Emoji
  con.on("send_emoji", (data) => {
    socket.to(data.current_room).emit("receive_emoji", {
      	emoji: data.emoji,
      	username: data.username
    })
  })
  // Handle Disconnect!
  con.on('disconnect', () => {
    	const id = con.id
    	let username,room,sid
    	for (const key in rooms) {
	  	const check_ = rooms[key].sid.indexOf(id)
	  	if(check_ !== -1){
			username = rooms[key].users[check_]
		  	room = key
		  	sid = rooms[key].sid[check_]
		}
    	}
    	if(rooms[room] && room && username && sid){
	  rooms[room].count -=1
	  if(rooms[room].count == 0){
	    delete rooms[room]
	  }
	  if(rooms[room] && rooms[room].count == 1){
	    rooms[room].users = rooms[room].users.filter((e) => {return e !== username})
	    rooms[room].sid = rooms[room].sid.filter((e) => {return e !== sid})
	    socket.to(room).emit('room_disconnect_event',{
	      status:"fail", message: `${username} disconnected!`
	    })
	  }
	}
  })
})

server.listen(port,hostname,backlog)
