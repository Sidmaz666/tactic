window.onload = async function(){
  // Check Join Room Link
  if(window.location.search.length !== 0){
    const _searchP = new URLSearchParams(window.location.search)
    if(_searchP.get('action').length > 0 && _searchP.get('room_id')){
      	const action = _searchP.get('action')
        const room_id = _searchP.get('room_id')
        if(action == "join" && room_id.length > 4){
	  	const username = localStorage.getItem("username")
	  	if(!username){
		  localStorage.setItem("username", `user_${crypto.randomUUID().replaceAll('-','').slice(0,12)}`)
		}
	  	join_room(room_id)
	  	common_user_function()
	  	remove_share_btn()
		const currentUrl = window.location.href;
		if (currentUrl.includes('?')) {
		    const newUrl = currentUrl.split('?')[0];
		    history.replaceState(null, null, newUrl);
		}
	}
    }
  } else {
     // Check if user already exist!
      if(localStorage.getItem("username") && localStorage.getItem("username").length > 4){
	    setup_("partials/room.html","body")
      } else{
	    setup_("partials/user.html","body")
      }
  }
  // Set Color Mode From Local Storage
  // Default Dark Mode
  localStorage.setItem("theme", localStorage.getItem("theme") || "dark")
  color_mode = localStorage.getItem("theme")
  if(document.querySelector('#toggle-color-btn')){
    if(color_mode == "light"){
	document.querySelector('#toggle-color-btn').innerHTML=`<i class="fa-solid fa-moon fs-5"></i>`
    } else {
	document.querySelector('#toggle-color-btn').innerHTML=`<i class="fa-solid fa-sun fs-5"></i>`
    }
  }
  document.querySelector('html').setAttribute("data-bs-theme", color_mode)
}

// Initialize Socket Connection
const socket = io()

// Setup Function
function setup_(endpoint,target,remove=undefined){
	    fetch(endpoint)
	    .then((res) => res.text())
	    .then((html) => {
		document.querySelector(target).insertAdjacentHTML("beforeend",`
			${html}
		  `)
	  })
  if(document.querySelector(`${remove}`)){
    document.querySelector(`${remove}`).remove()
  }
}

// Event Listener Function
function set_event(target,event_type,objective){
  const iv = setInterval(() => {
    const check_ = eval(target)
	if(check_){
	  if(check_ instanceof NodeList){
	    if( Array.from(check_).length > 0){
	      check_.forEach((e) => {
		  e.addEventListener(event_type,objective)
	      })
		clearInterval(iv)
	    }
	  } else {
		check_.addEventListener(event_type,objective)
		clearInterval(iv)
	  }
	}
  },50)
}

// Toggle Color Mode
function toggleColorMode(btn){
  const current_value=document.querySelector('html').getAttribute("data-bs-theme")
  if(current_value == "dark"){
	document.querySelector('html').setAttribute("data-bs-theme", "light")
	localStorage.setItem("theme", "light")
    	btn.innerHTML = `<i class="fa-solid fa-moon fs-5"></i>`
  } else {
	document.querySelector('html').setAttribute("data-bs-theme", "dark")
	localStorage.setItem("theme", "dark")
    	btn.innerHTML = `<i class="fa-solid fa-sun fs-5"></i>`
  }
}

// Generate Random Username
function random_str(prefix,elm){
  elm.value =  `${prefix}_${crypto.randomUUID().replaceAll('-','').slice(0,12)}`
}

// Notification function 
function notify(target,notify_id,text,timeout=8000,level=1) {
	  if(!document.querySelector(`.${notify_id}`)){
	    if(document.querySelector('.notif')){
	      document.querySelector('.notif').remove()
	    }
	   const iv = setInterval(() => {
	   if(document.querySelector(`${target}`)){
	     document.querySelector(`${target}`).insertAdjacentHTML("afterbegin", `
	    <div class="toast-container position-fixed bottom-0 start-50 translate-middle-x mb-4 ${notify_id} notif">
	    <div class="toast 
	    ${level == 2 ? 'border-danger' : '' }
	    ${level == 3 ? 'border-success' : '' }
	    "
	    role="alert" style="display:block;"
	      aria-live="polite" aria-atomic="true">
	      <div class="toast-body d-flex justify-content-center">
		     ${text}
	      </div>
	    </div>
	  </div>
	       `)
	      clearInterval(iv)
	      setTimeout(() => {
		if(document.querySelector(`.${notify_id}`)){
		    document.querySelector(`.${notify_id}`).remove()
		}
	      },timeout)
	    }
	 },50)
	}
}

set_event(`document.forms['username_form']`,"submit", function(e){
	e.preventDefault()
  	const username = document.forms['username_form']['username']
	if(username.value.replace(/ /g,'').length < 4 ){
	  notify("#user-auth","username_error","Username Can't be Empty!", 8000,2)
	  return
	} else {
	    localStorage.setItem("username", username.value.replace(/ /g,''))
	    setup_("partials/room.html","body",'#user-auth')
	}
})

// Room Variable, Player Sign Variable
let current_room
let player_sign
// Socket Room Create/Join Function
function create_room(roomname){
  socket.emit("create_room", { username: localStorage.getItem("username"), roomname })
  current_room = roomname
}
function join_room(roomname){
  socket.emit("join_room", { username: localStorage.getItem("username"), roomname })
  current_room = roomname
}
// Handle Socket Room Create/Join 
socket.on("room_create_event",(data) => {
  if(data.status == "fail"){
    notify("#user-room","room_creation_error", data.message,8000,2)
  } else if(data.status == "success") {
	setup_("./partials/game.html", "body","#user-room")
	player_sign = data.player_sign
	setTimeout(() => {
	    notify("#user-game","room_creation_success", data.message,8000,3)
	    document.getElementById('share_link_btn').dataset.link = `${window.location.href}?action=join&room_id=${data.roomname}`  
	},500)
  }
})

// Copy Link to Clipboard
function share_link(e){
    navigator.clipboard.writeText(e.dataset.link);
    notify("#user-game","room_link_share","Link Copied to Clipboard!",8000,3)
}

function remove_share_btn(){
  setTimeout(() => {
      if(document.querySelector("#share_link_btn") &&
	  document.querySelector("#share_link_btn").dataset.link.length == 0){
	    document.querySelector("#share_link_btn").remove()
	}
    },500)
}

socket.on("room_join_event",(data) => {
  if(data.status == "fail"){
    notify("#user-room","room_joining_error", data.message,8000,2)
  } else if(data.status == "success") {
	if(localStorage.getItem("username") == data.username){
	  player_sign = data.player_sign
	  setup_("./partials/game.html", "body","#user-room")
	} 
	setTimeout(() => {
	notify("#user-game","room_joining_success", data.message,8000,3)
	remove_share_btn()
	document.querySelector("#players_container").insertAdjacentHTML("beforeend",`
	<span class="ms-2 me-3 fs-5 fw-bold" id="vs-txt">
	  <i>VS</i>
	</span>
        <div class="d-flex justify-constent-center align-items-center position-relative">
		<span class="position-absolute bg-dark border border-light-subtle"
		id="opponent-sign"
		style="border-radius:100%;left:-15px;text-align:center;width:28px;height:28px;bottom:-5px"
		>
			${player_sign == 'x' ? 'o' : 'x'}
		</span>
	  	<img class="
		border border-secondary
		me-2
		"
		id="opponent-indicator"
		style="width: 50px;height: 50px;border-radius: 100%;"
		src="https://robohash.org/${data.opponent[0] == localStorage.getItem("username") ? data.username : data.opponent[0] }.png" alt="Opponent Profile!">
	</div>
	  `)
	},500)
  }
})
// Handle User Disconnect
socket.on("room_disconnect_event",(data) => {
	notify("#user-game","room_disconnect", data.message,8000,3)
  	if(document.querySelector('#opponent-indicator')){
	  document.querySelector('#opponent-indicator').remove()
	  document.querySelector('#opponent-sign').remove()
	  document.querySelector('#vs-txt').remove()
	}
  	// Prevent Game
	  document.querySelectorAll('.board-cell').forEach((c) => {
		  c.style['pointer-events'] = "none"
	  })
  	// Clean ups
	  document.querySelectorAll('.cap').forEach((c) => {
		  c.remove()
	  })
	  document.querySelectorAll('.emj').forEach((c) => {
		  c.remove()
	  })
  	
})

// Common User Function
function common_user_function(){
  if(document.querySelector(".username_display") &&
	document.querySelector(".user_profile_image") &&
    	document.querySelector("#player-indicator")
  	) {
	setTimeout(() => {
	      if(document.querySelectorAll('.username_display').length > 0){
		document.querySelectorAll('.username_display').forEach((e) => {
		  e.textContent = localStorage.getItem("username")
		})
	      }

	      if(document.querySelectorAll('.user_profile_image').length > 0){
		document.querySelectorAll('.user_profile_image').forEach((e) => {
		  e.src = `https://robohash.org/${localStorage.getItem("username")}.png`
		})
	      }
	    if(document.querySelector("#player-indicator").parentElement){
	     document.querySelector("#player-indicator").parentElement.insertAdjacentHTML("afterbegin",`
		  <span class="position-absolute bg-dark border border-light-subtle" id="player-sign"
		  style="border-radius:100%;left:-15px;text-align:center;width:28px;height:28px;bottom:-5px"
		  >
			  ${player_sign == 'x' ? 'x' : 'o'}
		  </span>
	     `)
	    }
	},300)
      } else {
		setTimeout(() => {
		  common_user_function()
		},300)
      }
}

set_event(`document.forms['room_form']`,"submit", function(e){
	e.preventDefault()
  	const operation = e.submitter.id
  	const roomname = document.forms['room_form']['room_name']
  	if(roomname.value.replace(/ /g,'').length < 4){
	  notify("#user-room","room_error","Room Name Can't be Empty!", 8000,2)
	  return
	} else {
	  if(operation == "create"){
		create_room(roomname.value.replace(/ /g,''))
	  } else if(operation == "join"){
		join_room(roomname.value.replace(/ /g,''))
	  }
	    common_user_function()
	}
})

// Handle player Turn
socket.on("player_turn",(data) => {
  setTimeout(() => {
    	// Update Board
    	data.board.forEach((e,i)=> {
	    const v = e == null ? '' : e
	    document.querySelectorAll('.board-cell')[i].dataset.value = v
	    document.querySelectorAll('.board-cell')[i].textContent = v
	})
  	//Player Turn
  	if(data.username == localStorage.getItem("username")){
	  document.querySelectorAll('.board-cell').forEach((c) => {
	    	 if(c.dataset.value.length <= 0 && !data.game_end){
		    c.style['pointer-events'] = "all"
		 }
	  })
	  document.querySelector("#player-indicator").classList.remove("border-secondary")
	  document.querySelector("#player-indicator").classList.add("border-primary")
	  document.querySelector("#opponent-indicator").classList.remove("border-primary")
	  document.querySelector("#opponent-indicator").classList.add("border-secondary")
	} else {
  	//Opponent Turn
	  document.querySelectorAll('.board-cell').forEach((c) => {
		  c.style['pointer-events'] = "none"
	  })
	  document.querySelector("#player-indicator").classList.remove("border-primary")
	  document.querySelector("#player-indicator").classList.add("border-secondary")
	  document.querySelector("#opponent-indicator").classList.remove("border-secondary")
	  document.querySelector("#opponent-indicator").classList.add("border-primary")
	}
  },500)
})

// Handle Player Move
set_event(`document.querySelectorAll('.board-cell')`, 
	"click", function(e){
  	e.target.dataset.value = player_sign
  	e.target.textContent = player_sign
	const board = []
	document.querySelectorAll('.board-cell').forEach((c) => {
		 board.push(c.dataset.value)
	})
	socket.emit("player_move", { current_room , username: localStorage.getItem("username"), player_sign, board  })
})

// GLobal
let isWin = false;

// Change Player Sign when Game Restarts
socket.on("change_sign", (data) => {
  if(document.querySelector("#end_game")){
    document.querySelector("#end_game").remove()
  }
  document.querySelectorAll(".cap").forEach((e) => { e.remove() })
  document.querySelectorAll('.board-cell').forEach((e) => { e.style.background = "" }) 
  setTimeout(() => {
    	 if(data.username == localStorage.getItem("username")){
	    player_sign = data.player_sign	
	 } else {
	    player_sign = data.opponent_sign
	 }
	  if(document.querySelector("#player-indicator").parentElement){
	   document.querySelector("#player-sign").remove()
	   document.querySelector("#player-indicator").parentElement.insertAdjacentHTML("afterbegin",`
		<span class="position-absolute bg-dark border border-light-subtle" id="player-sign"
		style="border-radius:100%;left:-15px;text-align:center;width:28px;height:28px;bottom:-5px"
		>
			${player_sign}
		</span>
	     `)
	  }
	  if(document.querySelector("#opponent-indicator").parentElement){
	   document.querySelector("#opponent-sign").remove()
	   document.querySelector("#opponent-indicator").parentElement.insertAdjacentHTML("afterbegin",`
		<span class="position-absolute bg-dark border border-light-subtle" id="opponent-sign"
		style="border-radius:100%;left:-15px;text-align:center;width:28px;height:28px;bottom:-5px"
		>
		      ${player_sign == 'x' ? 'o' : 'x'}
		</span>
	     `)
	  }
  },800)	
})

// Restart Game
function start_over(){
  socket.emit("restart",{
    	username: localStorage.getItem("username"),
    	current_room
  })
  document.querySelector("#end_game").remove()
  document.querySelectorAll(".cap").forEach((e) => { e.remove() })
  document.querySelectorAll('.board-cell').forEach((e) => { e.style.background = "" }) 
  isWin = false
}
// Handle Player Win/Lose
socket.on("player_win" ,(data) => {
  	// Update Game Boards
    	data.board.forEach((e,i)=> {
	    const v = e == null ? '' : e
	    document.querySelectorAll('.board-cell')[i].dataset.value = v
	    document.querySelectorAll('.board-cell')[i].textContent = v
	})
  	// Prevent Game
	  document.querySelectorAll('.board-cell').forEach((c) => {
		  c.style['pointer-events'] = "none"
	  })
  	  let isWin = false;
  	  if(data.username == localStorage.getItem("username") && data.status == "win"){
		isWin = true
	    	document.querySelector("#player-indicator").insertAdjacentHTML('afterend',`
			<span class="position-absolute cap"
			style="left:10px;text-align:center;width:28px;height:28px;top: -20px;">👑</span>
		  `)
	  } else if(data.status == "tie"){
	    	document.querySelector("#player-indicator").insertAdjacentHTML('afterend',`
			<span class="position-absolute cap"
			style="left:10px;text-align:center;width:28px;height:28px;top: -20px;">👑</span>
		  `)
	    	if(document.querySelector("#opponent-indicator")){
	    	document.querySelector("#opponent-indicator").insertAdjacentHTML('afterend',`
			<span class="position-absolute cap"
			style="left:10px;text-align:center;width:28px;height:28px;top: -20px;">👑</span>
		  `)
		}
	  } else {
	    	if(document.querySelector("#opponent-indicator")){
	    	document.querySelector("#opponent-indicator").insertAdjacentHTML('afterend',`
			<span class="position-absolute cap"
			style="left:10px;text-align:center;width:28px;height:28px;top: -20px;">👑</span>
		  `)
		}
	  }
	  if(data.pattern){
	      const color = isWin ? 'var(--bs-gray-800)' : 'var(--bs-danger)'
	    data.pattern.forEach((e) => {
	      document.querySelectorAll('.board-cell')[e].style.background = color 
	    })
	  }
  	document.getElementById('players_container').insertAdjacentHTML('afterend',`
	<div id="end_game" class="d-flex column justify-content-center align-items-center mt-3">
	    <button onclick="start_over()" class="btn btn-primary">Restart</button>
	    <button onclick="window.location.href = window.location.origin"
	    class="btn btn-secondary ms-2">Exit</button>
	</div>`)
})

// Emoji Settings
const pickerOptions = { 
  onEmojiSelect: select_emoji,
  previewPosition: 'none', 
  skinTonePosition:'none',
  perLine:8,
  onClickOutside: close_emoji,
  emojiButtonSize: 30,
  emojiSize: 25,
}
const picker = new EmojiMart.Picker(pickerOptions)
// Emoji Functions
function select_emoji(data){
  document.querySelector("#emoji-picker-container").style.display = 'none'
  socket.emit("send_emoji",{ username:localStorage.getItem("username"), current_room, emoji: data.native })
}
function show_emoji(){
      if(document.querySelector("#emoji-picker-container").children.length == 0){
	  document.querySelector("#emoji-picker-container").appendChild(picker)
	}
	document.querySelector("#emoji-picker-container").style.display = 'block'
}
function close_emoji(data){
  if(data.target.tagName.toLowerCase() !== "path"){
      document.querySelector("#emoji-picker-container").style.display = 'none'
  }
}
// Receive Emoji
socket.on("receive_emoji", (data) => {
  if(data.username == localStorage.getItem("username")){
    if(!document.querySelector("#opponent-indicator")){
      document.querySelectorAll(".sent_to_player_emoji").forEach(e => { e.remove() })
      document.querySelector("#player-indicator").insertAdjacentHTML("afterend",`
		<span class="position-absolute sent_to_player_emoji emj"
		style="left: 34px;text-align:center;width:28px;height:28px;bottom:-5px">
		${data.emoji}
		</span>
	`)
    } else {
      document.querySelectorAll(".sent_to_opponent_emoji").forEach(e => { e.remove() })
      document.querySelector("#opponent-indicator").insertAdjacentHTML("afterend",`
		<span class="position-absolute sent_to_opponent_emoji emj"
		style="left: 34px;text-align:center;width:28px;height:28px;bottom:-5px">
		${data.emoji}
		</span>
	`)
    }
  } else {
      document.querySelectorAll(".sent_to_player_emoji").forEach(e => { e.remove() })
      document.querySelector("#player-indicator").insertAdjacentHTML("afterend",`
		<span class="position-absolute sent_to_player_emoji emj"
		style="left: 34px;text-align:center;width:28px;height:28px;bottom:-5px">
		${data.emoji}
		</span>
	`)
  }
})
