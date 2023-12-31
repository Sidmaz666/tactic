// GLobal
// Room Variable, Player Sign Variable
let isWin = false;
let current_room;
let player_sign;
let isAudio = 0;
let level, wins, title
window.onload = async function () {
  // Check Join Room Link
  if (window.location.search.length !== 0) {
    const _searchP = new URLSearchParams(window.location.search);
    if (_searchP.get("action").length > 0 && _searchP.get("room_id")) {
      const action = _searchP.get("action");
      const room_id = _searchP.get("room_id");
      if (action == "join" && room_id.length > 4) {
        const username = localStorage.getItem("username");
        if (!username) {
          localStorage.setItem(
            "username",
            `user_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`
          );
        }
        join_room(room_id);
        common_user_function();
        remove_share_btn();
        const currentUrl = window.location.href;
        if (currentUrl.includes("?")) {
          const newUrl = currentUrl.split("?")[0];
          history.replaceState(null, null, newUrl);
        }
      }
    }
  } else {
    // Check if user already exist!
    if (
      localStorage.getItem("username") &&
      localStorage.getItem("username").length > 4
    ) {
      setup_("partials/room.html", "body");
    } else {
      setup_("partials/user.html", "body");
    }
    passive_render(
      "#audio_btn",
      function () {
        isAudio = parseInt(localStorage.getItem("is_audio")) || 0;
        if (isAudio == 0) {
          document.querySelector("#audio_btn").innerHTML = `
		<i class="fa-solid fa-volume-high"></i>
		`;
        } else {
          document.querySelector("#audio_btn").innerHTML = `
		<i class="fa-solid fa-volume-xmark"></i>
		`;
        }
      },
      null
    );
  }
  passive_render("#user-game", function(){
	level =  isNaN(parseInt(localStorage.getItem("level"))) || localStorage.getItem("level") == null ? 0 : parseInt(localStorage.getItem("level")) ;
    	wins = isNaN(parseInt(localStorage.getItem("wins"))) || localStorage.getItem("wins") == null ? 0 : parseInt(localStorage.getItem("wins")) ;
    	title = localStorage.getItem("title") || _title(0);
    	localStorage.setItem("wins", wins);
    	localStorage.setItem("level", level);
    	localStorage.setItem("title", title);
    	document.querySelectorAll(".user_level").forEach((e) => e.textContent = level )
    	document.querySelectorAll(".user_title").forEach((e) => e.textContent = title )
  },null)
  // Set Color Mode From Local Storage
  // Default Dark Mode
  localStorage.setItem("theme", localStorage.getItem("theme") || "dark");
  color_mode = localStorage.getItem("theme");
  if (document.querySelector("#toggle-color-btn")) {
    if (color_mode == "light") {
      document.querySelector(
        "#toggle-color-btn"
      ).innerHTML = `<i class="fa-solid fa-moon fs-5"></i>`;
    } else {
      document.querySelector(
        "#toggle-color-btn"
      ).innerHTML = `<i class="fa-solid fa-sun fs-5"></i>`;
    }
  }
  document.querySelector("html").setAttribute("data-bs-theme", color_mode);
  // Initialize Service Worker
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("service_worker.js").then(registration=>{
      console.log("Service Worker Registered!");
    }).catch(error=>{
      console.log("Service Worker Registration Failed!" , {error:error});
    });
   } else {
	  console.log("Service Worker not supported!");
  }
};

// Initialize Socket Connection
const socket = io();

// Setup Function
function setup_(endpoint, target, remove = undefined) {
  fetch(endpoint)
    .then((res) => res.text())
    .then((html) => {
      document.querySelector(target).insertAdjacentHTML(
        "beforeend",
        `
			${html}
		  `
      );
    });
  if (document.querySelector(`${remove}`)) {
    document.querySelector(`${remove}`).remove();
  }
}

// Event Listener Function
function set_event(target, event_type, objective) {
  const iv = setInterval(() => {
    const check_ = eval(target);
    if (check_) {
      if (check_ instanceof NodeList) {
        if (Array.from(check_).length > 0) {
          check_.forEach((e) => {
            e.addEventListener(event_type, objective);
          });
          clearInterval(iv);
        }
      } else {
        check_.addEventListener(event_type, objective);
        clearInterval(iv);
      }
    }
  }, 50);
}

// Toggle Color Mode
function toggleColorMode(btn) {
  const current_value = document
    .querySelector("html")
    .getAttribute("data-bs-theme");
  if (current_value == "dark") {
    document.querySelector("html").setAttribute("data-bs-theme", "light");
    localStorage.setItem("theme", "light");
    btn.innerHTML = `<i class="fa-solid fa-moon fs-5"></i>`;
  } else {
    document.querySelector("html").setAttribute("data-bs-theme", "dark");
    localStorage.setItem("theme", "dark");
    btn.innerHTML = `<i class="fa-solid fa-sun fs-5"></i>`;
  }
}

// Generate Random Username
function random_str(prefix, elm) {
  elm.value = `${prefix}_${crypto
    .randomUUID()
    .replaceAll("-", "")
    .slice(0, 12)}`;
}

// Notification function
function notify(target, notify_id, text, timeout = 8000, level = 1) {
  if (!document.querySelector(`.${notify_id}`)) {
    if (document.querySelector(".notif")) {
      document.querySelector(".notif").remove();
    }
    const iv = setInterval(() => {
      if (document.querySelector(`${target}`)) {
        document.querySelector(`${target}`).insertAdjacentHTML(
          "afterbegin",
          `
	    <div class="toast-container position-fixed bottom-0 start-50 translate-middle-x mb-4 ${notify_id} notif">
	    <div class="toast 
	    ${level == 2 ? "border-danger" : ""}
	    ${level == 3 ? "border-success" : ""}
	    "
	    role="alert" style="display:block;"
	      aria-live="polite" aria-atomic="true">
	      <div class="toast-body d-flex justify-content-center">
		     ${text}
	      </div>
	    </div>
	  </div>
	       `
        );
        clearInterval(iv);
        setTimeout(() => {
          if (document.querySelector(`.${notify_id}`)) {
            document.querySelector(`.${notify_id}`).remove();
          }
        }, timeout);
      }
    }, 50);
  }
}

set_event(`document.forms['username_form']`, "submit", function (e) {
  e.preventDefault();
  const username = document.forms["username_form"]["username"];
  if (username.value.replace(/ /g, "").length < 4) {
    notify("#user-auth", "username_error", "Username Can't be Empty!", 8000, 2);
    return;
  } else {
    localStorage.setItem("username", username.value.replace(/ /g, ""));
    setup_("partials/room.html", "body", "#user-auth");
  }
});

// Socket Room Create/Join Function
function create_room(roomname) {
  socket.emit("create_room", {
    username: localStorage.getItem("username"),
    roomname,
  });
  current_room = roomname;
}
function join_room(roomname) {
  socket.emit("join_room", {
    username: localStorage.getItem("username"),
    roomname
  });
  current_room = roomname;
}
// Passive Render Function:Function
function passive_render(target, func, data) {
  if (document.querySelector(target)) {
    func(data);
  } else {
    setTimeout(() => {
      passive_render(target, func, data);
    }, 50);
  }
}

// Handle Socket Room Create/Join
socket.on("room_create_event", (data) => {
  if (data.status == "fail") {
    notify("#user-room", "room_creation_error", data.message, 8000, 2);
  } else if (data.status == "success") {
    setup_("./partials/game.html", "body", "#user-room");
    player_sign = data.player_sign;
    passive_render(
      "#user-game",
      function (data) {
        notify("#user-game", "room_creation_success", data.message, 8000, 3);
      },
      data
    );
    passive_render(
      `#share_link_btn`,
      function (data) {
        document.getElementById(
          "share_link_btn"
        ).dataset.link = `${window.location.href}?action=join&room_id=${data.roomname}`;
      },
      data
    );
  }
});

// Copy Link to Clipboard
function share_link(e) {
  navigator.clipboard.writeText(e.dataset.link);
  notify("#user-game", "room_link_share", "Link Copied to Clipboard!", 8000, 3);
}

function remove_share_btn() {
  passive_render(
    "#share_link_btn",
    function () {
      if (document.querySelector("#share_link_btn").dataset.link.length == 0) {
        document.querySelector("#share_link_btn").remove();
      }
    },
    null
  );
}

socket.on("room_join_event", (data) => {
  if (data.status == "fail") {
    notify("#user-room", "room_joining_error", data.message, 8000, 2);
  } else if (data.status == "success") {
    if (localStorage.getItem("username") == data.username) {
      player_sign = data.player_sign;
      setup_("./partials/game.html", "body", "#user-room");
    }
    passive_render(
      "#user-game",
      function (data) {
        notify("#user-game", "room_joining_success", data.message, 8000, 3);
      },
      data
    );
    remove_share_btn();
    passive_render(
      `#players_container`,
      function (data) {
        document.querySelector("#players_container").insertAdjacentHTML(
          "beforeend",
          `
	<span class="ms-2 me-3 fs-5 fw-bold" id="vs-txt">
	  <i>VS</i>
	</span>
        <div class="d-flex justify-constent-center align-items-center position-relative">
		<span class="position-absolute bg-body border border-light-subtle"
		id="opponent-sign"
		style="border-radius:100%;left:-15px;text-align:center;width:28px;height:28px;bottom:-5px"
		>
			${player_sign == "x" ? "o" : "x"}
		</span>
	  	<img class="
		border border-secondary
		me-2
		"
		id="opponent-indicator"
		style="width: 50px;height: 50px;border-radius: 100%;"
		src="https://robohash.org/${
      data.opponent[0] == localStorage.getItem("username")
        ? data.username
        : data.opponent[0]
    }.png" alt="Opponent Profile!">
	</div>
	  `
        );
      },
      data
    );
    document.querySelectorAll(".cap").forEach((e) => {
      e.remove();
    });
    document.querySelectorAll(".board-cell").forEach((e) => {
      e.style.background = "";
    });
  }
});
// Handle User Disconnect
socket.on("room_disconnect_event", (data) => {
  notify("#user-game", "room_disconnect", data.message, 8000, 3);
  if (document.querySelector("#opponent-indicator")) {
    document.querySelector("#opponent-indicator").remove();
    document.querySelector("#opponent-sign").remove();
    document.querySelector("#vs-txt").remove();
  }
  // Prevent Game
  document.querySelectorAll(".board-cell").forEach((c) => {
    c.style["pointer-events"] = "none";
  });
  // Clean ups
  document.querySelectorAll(".cap").forEach((c) => {
    c.remove();
  });
  document.querySelectorAll(".emj").forEach((c) => {
    c.remove();
  });
  if (document.querySelector("#end_game")) {
    document.querySelector("#end_game").remove();
  }
});

// Receive Player Level Data
socket.on("receive_player_level_data", (data) => {
  // Render Opponent Level Data
  if(data.username !== localStorage.getItem("username")){
    passive_render("#opponent-indicator", function(data){
       if(document.querySelector("#op_lvl")){
	    document.querySelector("#op_lvl").remove()
       }
	document.querySelector("#opponent-indicator").insertAdjacentHTML("afterend",`
		<span class="position-absolute cap" 
		  id="op_lvl"
		  style="border-radius:100%;
		  left:0px;text-align:center;width:50px;
		  height:28px;bottom:-35px;font-size:small;">
		      <span class="fw-bold">Lv:</span>
		      <span >${data.level}</span>
	      </span>
	  `)
    }, data)
  }
})

// Common User Function
function common_user_function() {
  passive_render(
    ".username_display",
    function () {
      if (document.querySelectorAll(".username_display").length > 0) {
        document.querySelectorAll(".username_display").forEach((e) => {
          e.textContent = localStorage.getItem("username");
        });
      }
    },
    null
  );
  passive_render(
    ".user_profile_image",
    function () {
      if (document.querySelectorAll(".user_profile_image").length > 0) {
        document.querySelectorAll(".user_profile_image").forEach((e) => {
          e.src = `https://robohash.org/${localStorage.getItem(
            "username"
          )}.png`;
        });
      }
    },
    null
  );
  passive_render(
    "#player-indicator",
    function () {
      document
        .querySelector("#player-indicator")
        .parentElement.insertAdjacentHTML(
          "afterbegin",
          `
	      <span class="position-absolute bg-body border border-light-subtle" id="player-sign"
	      style="border-radius:100%;left:-15px;text-align:center;width:28px;height:28px;bottom:-5px"
	      >
		      ${player_sign == "x" ? "x" : "o"}
	      </span>
	 `
        );
    },
    null
  );
}

set_event(`document.forms['room_form']`, "submit", function (e) {
  e.preventDefault();
  const operation = e.submitter.id;
  const roomname = document.forms["room_form"]["room_name"];
  if (roomname.value.replace(/ /g, "").length < 4) {
    notify("#user-room", "room_error", "Room Name Can't be Empty!", 8000, 2);
    return;
  } else {
    if (operation == "create") {
      create_room(roomname.value.replace(/ /g, ""));
    } else if (operation == "join") {
      join_room(roomname.value.replace(/ /g, ""));
    }
    e.submitter.innerHTML = "<img src='./img/loader.gif' style='height:20px;' />"
    document.querySelector("#create").setAttribute("disabled","")
    document.querySelector("#join").setAttribute("disabled","")
    common_user_function();
  }
});

// Handle player Turn
socket.on("player_turn", (data) => {
  setTimeout(() => {
    //Emit Player  Level Data
    socket.emit("player_level_data", {
      username: localStorage.getItem("username"),
      current_room,
      level:localStorage.getItem("level") || level || 0
    })
    // Update Board
    passive_render(
      ".board-cell",
      function (data) {
        data.board.forEach((e, i) => {
          const v = e == null ? "" : e;
          document.querySelectorAll(".board-cell")[i].dataset.value = v;
          document.querySelectorAll(".board-cell")[i].textContent = v;
        });
      },
      data
    );
    //Player Turn
    if (data.username == localStorage.getItem("username")) {
      document.querySelectorAll(".board-cell").forEach((c) => {
        if (c.dataset.value.length <= 0 && !data.game_end) {
          c.style["pointer-events"] = "all";
        }
      });
      passive_render(
        "#player-indicator",
        function () {
          document
            .querySelector("#player-indicator")
            .classList.remove("border-secondary");
          document
            .querySelector("#player-indicator")
            .classList.add("border-primary");
        },
        null
      );
      passive_render(
        "#opponent-indicator",
        function () {
          document
            .querySelector("#opponent-indicator")
            .classList.remove("border-primary");
          document
            .querySelector("#opponent-indicator")
            .classList.add("border-secondary");
        },
        null
      );
    } else {
      //Opponent Turn
      document.querySelectorAll(".board-cell").forEach((c) => {
        c.style["pointer-events"] = "none";
      });
      passive_render(
        "#player-indicator",
        function () {
          document
            .querySelector("#player-indicator")
            .classList.remove("border-primary");
          document
            .querySelector("#player-indicator")
            .classList.add("border-secondary");
        },
        null
      );
      passive_render(
        "#opponent-indicator",
        function () {
          document
            .querySelector("#opponent-indicator")
            .classList.remove("border-secondary");
          document
            .querySelector("#opponent-indicator")
            .classList.add("border-primary");
        },
        null
      );
    }
    const boadEmpty = Array.from(
      document.querySelectorAll(".board-cell")
    ).filter((e) => {
      return e.textContent.length > 0;
    }).length;
    if (isAudio == 0 && boadEmpty > 0) {
      document.querySelector("#player_audio").play();
    }
  }, 500);
});

// Handle Player Move
set_event(`document.querySelectorAll('.board-cell')`, "click", function (e) {
  e.target.dataset.value = player_sign;
  e.target.textContent = player_sign;
  const board = [];
  document.querySelectorAll(".board-cell").forEach((c) => {
    board.push(c.dataset.value);
  });
  socket.emit("player_move", {
    current_room,
    username: localStorage.getItem("username"),
    player_sign,
    board,
  });
});

// Change Player Sign when Game Restarts
socket.on("change_sign", (data) => {
  if (document.querySelector("#end_game")) {
    document.querySelector("#end_game").remove();
  }
  document.querySelectorAll(".cap").forEach((e) => {
    e.remove();
  });
  document.querySelectorAll(".board-cell").forEach((e) => {
    e.style.background = "";
  });
  setTimeout(() => {
    if (data.username == localStorage.getItem("username")) {
      player_sign = data.player_sign;
    } else {
      player_sign = data.opponent_sign;
    }
    if (document.querySelector("#player-indicator").parentElement) {
      document.querySelector("#player-sign").remove();
      document
        .querySelector("#player-indicator")
        .parentElement.insertAdjacentHTML(
          "afterbegin",
          `
		<span class="position-absolute bg-body border border-light-subtle" id="player-sign"
		style="border-radius:100%;left:-15px;text-align:center;width:28px;height:28px;bottom:-5px"
		>
			${player_sign}
		</span>
	     `
        );
    }
    if (document.querySelector("#opponent-indicator").parentElement) {
      document.querySelector("#opponent-sign").remove();
      document
        .querySelector("#opponent-indicator")
        .parentElement.insertAdjacentHTML(
          "afterbegin",
          `
		<span class="position-absolute bg-body border border-light-subtle" id="opponent-sign"
		style="border-radius:100%;left:-15px;text-align:center;width:28px;height:28px;bottom:-5px"
		>
		      ${player_sign == "x" ? "o" : "x"}
		</span>
	     `
        );
    }
  }, 800);
});

// Restart Game
function start_over() {
  socket.emit("restart", {
    username: localStorage.getItem("username"),
    current_room,
  });
  document.querySelector("#end_game").remove();
  document.querySelectorAll(".cap").forEach((e) => {
    e.remove();
  });
  document.querySelectorAll(".board-cell").forEach((e) => {
    e.style.background = "";
  });
  isWin = false;
}
// Handle Player Win/Lose
socket.on("player_win", (data) => {
  // Update Game Boards
  data.board.forEach((e, i) => {
    const v = e == null ? "" : e;
    document.querySelectorAll(".board-cell")[i].dataset.value = v;
    document.querySelectorAll(".board-cell")[i].textContent = v;
  });
  // Prevent Game
  document.querySelectorAll(".board-cell").forEach((c) => {
    c.style["pointer-events"] = "none";
  });
  let isWin = false;
  if (
    data.username == localStorage.getItem("username") &&
    data.status == "win"
  ) {
    isWin = true;
    wins = parseInt(wins) + 1;
    level = _level(wins, parseInt(level));
    title = _title(parseInt(level))
    localStorage.setItem("wins", wins)
    localStorage.setItem("level", level)
    localStorage.setItem("title", title)
    document.querySelectorAll(".user_level").forEach((e) => e.textContent = level )
    document.querySelectorAll(".user_title").forEach((e) => e.textContent = title )
    document.querySelector("#player-indicator").insertAdjacentHTML(
      "afterend",
      `
			<span class="position-absolute cap"
			style="left:10px;text-align:center;width:28px;height:28px;top: -20px;">👑</span>
		  `
    );
    if (isAudio == 0) {
      document.querySelector("#player_audio_win").play();
    }
  } else if (data.status == "tie") {
    document.querySelector("#player-indicator").insertAdjacentHTML(
      "afterend",
      `
			<span class="position-absolute cap"
			style="left:10px;text-align:center;width:28px;height:28px;top: -20px;">👑</span>
		  `
    );
    if (document.querySelector("#opponent-indicator")) {
      document.querySelector("#opponent-indicator").insertAdjacentHTML(
        "afterend",
        `
			<span class="position-absolute cap"
			style="left:10px;text-align:center;width:28px;height:28px;top: -20px;">👑</span>
		  `
      );
      if (isAudio == 0) {
        document.querySelector("#player_audio_win").play();
      }
    }
  } else {
    if (document.querySelector("#opponent-indicator")) {
      document.querySelector("#opponent-indicator").insertAdjacentHTML(
        "afterend",
        `
			<span class="position-absolute cap"
			style="left:10px;text-align:center;width:28px;height:28px;top: -20px;">👑</span>
		  `
      );
      if (isAudio == 0) {
        document.querySelector("#player_audio_lose").play();
      }
    }
  }
  if (data.pattern) {
    const color = isWin ? "var(--bs-gray-800)" : "var(--bs-danger)";
    data.pattern.forEach((e) => {
      document.querySelectorAll(".board-cell")[e].style.background = color;
    });
  }
  document.getElementById("players_container").insertAdjacentHTML(
    "afterend",
    `
	<div id="end_game" class="d-flex column justify-content-center align-items-center mt-3">
	    <button onclick="start_over()" class="btn btn-primary">Restart</button>
	    <button onclick="window.location.href = window.location.origin"
	    class="btn btn-secondary ms-2">Exit</button>
	</div>`
  );
});

// Emoji Settings
const pickerOptions = {
  onEmojiSelect: select_emoji,
  previewPosition: "none",
  skinTonePosition: "none",
  perLine: 8,
  onClickOutside: close_emoji,
  emojiButtonSize: 30,
  emojiSize: 25,
};
const picker = new EmojiMart.Picker(pickerOptions);
// Emoji Functions
function select_emoji(data) {
  document.querySelector("#emoji-picker-container").style.display = "none";
  socket.emit("send_emoji", {
    username: localStorage.getItem("username"),
    current_room,
    emoji: data.native,
  });
}
function show_emoji() {
  if (document.querySelector("#emoji-picker-container").children.length == 0) {
    document.querySelector("#emoji-picker-container").appendChild(picker);
  }
  document.querySelector("#emoji-picker-container").style.display = "block";
}
function close_emoji(data) {
  if (data.target.tagName.toLowerCase() !== "path") {
    document.querySelector("#emoji-picker-container").style.display = "none";
  }
}
// Receive Emoji
socket.on("receive_emoji", (data) => {
  if (data.username == localStorage.getItem("username")) {
    if (!document.querySelector("#opponent-indicator")) {
      document.querySelectorAll(".sent_to_player_emoji").forEach((e) => {
        e.remove();
      });
      document.querySelector("#player-indicator").insertAdjacentHTML(
        "afterend",
        `
		<span class="position-absolute sent_to_player_emoji emj"
		style="left: 34px;text-align:center;width:28px;height:28px;bottom:-5px">
		${data.emoji}
		</span>
	`
      );
    } else {
      document.querySelectorAll(".sent_to_opponent_emoji").forEach((e) => {
        e.remove();
      });
      document.querySelector("#opponent-indicator").insertAdjacentHTML(
        "afterend",
        `
		<span class="position-absolute sent_to_opponent_emoji emj"
		style="left: 34px;text-align:center;width:28px;height:28px;bottom:-5px">
		${data.emoji}
		</span>
	`
      );
    }
  } else {
    document.querySelectorAll(".sent_to_player_emoji").forEach((e) => {
      e.remove();
    });
    document.querySelector("#player-indicator").insertAdjacentHTML(
      "afterend",
      `
		<span class="position-absolute sent_to_player_emoji emj"
		style="left: 34px;text-align:center;width:28px;height:28px;bottom:-5px">
		${data.emoji}
		</span>
	`
    );
    if(isAudio == 0){
      document.querySelector("#emoji_audio").play()
    }
  }
});

// Handle Audio
function toggle_audio(btn) {
  isAudio = isAudio == 0 ? 1 : 0;
  localStorage.setItem("is_audio", isAudio);
  if (isAudio == 0) {
    btn.innerHTML = `
    	<i class="fa-solid fa-volume-high"></i>
    	`;
  } else {
    btn.innerHTML = `
	<i class="fa-solid fa-volume-xmark"></i>
    	`;
  }
}

// Handle Level
function _level(wins,level){
  if(parseInt(level) !== 0){
    	const required_ = ParseInt((level + 1 ) * 10)
    	if(required_ == ParseInt(wins - (level * 10))){
	  return level + 1
	}
  } else if(wins == 10){
	  return 1
  } else {
    return level
  }
}

// Title User by Level Function
function _title(level) {
  const titles = [
    "Bacteria",
    "E. coli",
    "Streptococcus",
    "Amoeba",
    "Paramecia",
    "Euglenoid",
    "Yeast",
    "Mold",
    "Lichen",
    "Red Moss",
    "Brown Moss",
    "Yellow Moss",
    "Red Algae",
    "Brown Algae",
    "Green Algae",
    "Fern",
    "Gymnosperm",
    "Pine",
    "Spruce",
    "Cycads",
    "Ginkgo biloba",
    "Conifers",
    "Junipers",
    "Yews",
    "Douglas firs",
    "Hemlocks",
    "Angiosperm",
    "Rose",
    "Sunflower",
    "Apple",
    "Tulip",
    "Orchid",
    "Daisy",
    "Lily",
    "Tomato",
    "Peonies",
    "Blueberry",
    "Fish",
    "Insect",
    "Ant",
    "Bee",
    "Butterfly",
    "Mosquito",
    "Grasshopper",
    "Beetle",
    "Wasp",
    "Dragonfly",
    "Ladybug",
    "Moth",
    "Amphibian",
    "Frog",
    "Salamander",
    "Newt",
    "Toad",
    "Reptile",
    "Snake",
    "Lizard",
    "Turtle",
    "Crocodile",
    "Alligator",
    "Komodo dragon",
    "Bird",
    "Eagle",
    "Sparrow",
    "Penguin",
    "Robin",
    "Ostrich",
    "Hummingbird",
    "Woodpecker",
    "Swan",
    "Albatross",
    "Pelican",
    "Mammal",
    "Tiger",
    "Giraffe",
    "Lion",
    "Cheetah",
    "Whale",
    "Elephant",
    "Dog",
    "Gorilla",
    "Dolphin",
    "Human"
  ];
  const index = level >= titles.length ? titles[titles.length - 1] : level ;
  return String(titles[index]).toLowerCase();
}

// Play With AI
function setup_ai(){
  setup_("./partials/game.html", "body", "#user-room");
  player_sign = Math.random() < 0.5 ? 'x' : 'o'
  passive_render(".game_board", function(){
    document.querySelectorAll(".username_display").forEach((e) => {
      e.textContent = localStorage.getItem("username");
    });
    document.querySelectorAll(".user_profile_image").forEach((e) => {
      e.src=`https://robohash.org/${localStorage.getItem("username")}.png`;
    });
    document.querySelector("#audio_btn")
      .parentElement.style.cssText =  document.querySelector("#emoji_icon")
      .parentElement.style.cssText
      document.querySelector("#emoji_icon").remove()
      document.querySelector("#share_link_btn").remove()
      document
        .querySelector("#player-indicator")
        .parentElement.insertAdjacentHTML(
          "afterbegin",
          `
	      <span class="position-absolute bg-body border border-light-subtle" id="player-sign"
	      style="border-radius:100%;left:-15px;text-align:center;width:28px;height:28px;bottom:-5px"
	      >
		      ${player_sign}
	      </span>
	 `
        );
        document.querySelector("#players_container").insertAdjacentHTML(
          "beforeend",
          `
	<span class="ms-2 me-3 fs-5 fw-bold" id="vs-txt">
	  <i>VS</i>
	</span>
        <div class="d-flex justify-constent-center align-items-center position-relative">
		<span class="position-absolute bg-body border border-light-subtle"
		id="opponent-sign"
		style="border-radius:100%;left:-15px;text-align:center;width:28px;height:28px;bottom:-5px"
		>
			${player_sign == "x" ? "o" : "x"}
		</span>
	  	<img class="
		border border-secondary
		me-2
		"
		id="opponent-indicator"
		style="width: 50px;height: 50px;border-radius: 100%;"
		src="./img/ai.png" alt="Opponent Profile!">
		<span class="position-absolute" style="border-radius:100%;
		  left:0px;text-align:center;width:50px;
		  height:28px;bottom:-35px;font-size:small;">
		      <span class="fw-bold">Lv:</span>
		      <span class="">AI</span>
	      </span>
	</div>
	  `
        );
    setTimeout(() => {
      document.querySelectorAll('.board-cell').forEach(e => {
	      e.remove()
      })
    for (let index = 0; index <= 8; index++) {
      document.querySelector('.game_board').insertAdjacentHTML("beforeend",`
	  <div class="col-4 board-cell" data-value="" style="pointer-events: none;"></div>
	`)
    }
      document.querySelectorAll('.board-cell').forEach(e => {
	      e.addEventListener("click", function(e) {
	      		e.target.textContent = player_sign
			e.target.dataset.value = player_sign
			turn_counter = player_sign == 'x' ? 'o' : 'x'
			ai_turn()
			if (isAudio == 0) {
			  document.querySelector("#player_audio").play();
			}
	      })
      })
      		if(player_sign == 'x'){
		  player_turn()
		} else {
		  ai_turn()
		}
    },500)
  },null)
}

function ai_turn(){
    const ai_sign = player_sign == 'x' ? 'o' : 'x'
    const board = []
    document.querySelectorAll('.board-cell').forEach(e => {
      	board.push(e.textContent)
    })
   if(checkWinner(board) == null) {
     if(findBestMove(board, ai_sign) !== null && 
      !Array.from(document.querySelectorAll('.board-cell')).every((c) => { return c.textContent }) 
     ){
	document.querySelectorAll('.board-cell')[findBestMove(board,ai_sign)].textContent = ai_sign
	player_turn()
     } else {
      declareWinner(checkWinner(board),true)
     }
    } else {
      declareWinner(checkWinner(board))
    }
}

function player_turn(){
  const board = []
  document.querySelectorAll('.board-cell').forEach(e => {
      	board.push(e.textContent)
  })
   if(checkWinner(board) == null) {
     if(!Array.from(document.querySelectorAll('.board-cell')).every((c) => { return c.textContent })){
	document.querySelectorAll('.board-cell').forEach(e => {
	  if(e.textContent.length == 0){
	    e.style['pointer-events'] = "all"
	  } else {
	    e.style['pointer-events'] = "none"
	  }
	})
     } else {
      declareWinner(checkWinner(board),true)
     }
    } else {
      declareWinner(checkWinner(board))
    }
}

function start_over_ai(){
  player_sign = Math.random() < 0.5 ? 'x' : 'o'
  document.querySelector("#end_game").remove();
  document.querySelectorAll(".cap").forEach((e) => {
    e.remove();
  });
  document.querySelectorAll(".board-cell").forEach((e) => {
    e.style.background = "";
    e.textContent = "";
    e.dataset.value = "";
  });
  if(player_sign == "x"){
    player_turn()
  } else {
    ai_turn()
  }
    document.querySelector("#player-sign").textContent = ""
    document.querySelector("#opponent-sign").textContent = ""
    document.querySelector("#player-sign").textContent = player_sign
    document.querySelector("#opponent-sign").textContent = player_sign == 'x' ? 'o' : 'x'
}

function declareWinner(winner,isTie=false){
    document.querySelectorAll('.board-cell').forEach(e => {
	e.style['pointer-events'] = "none"
    })
    if(!isTie){
	if(winner.winner == player_sign){
	  wins = parseInt(wins) + 1;
	  level = _level(wins, parseInt(level));
	  title = _title(parseInt(level))
	  localStorage.setItem("wins", wins)
	  localStorage.setItem("level", level)
	  localStorage.setItem("title", title)
	  document.querySelectorAll(".user_level").forEach((e) => e.textContent = level )
	  document.querySelectorAll(".user_title").forEach((e) => e.textContent = title )
	  document.querySelector("#player-indicator").insertAdjacentHTML(
	    "afterend",
	    `
			      <span class="position-absolute cap"
			      style="left:10px;text-align:center;width:28px;height:28px;top: -20px;">👑</span>
			`
	  );
	  if (isAudio == 0) {
	    document.querySelector("#player_audio_win").play();
	  }
	} else {
	  document.querySelector("#opponent-indicator").insertAdjacentHTML(
	    "afterend",
	    `
			      <span class="position-absolute cap"
			      style="left:10px;text-align:center;width:28px;height:28px;top: -20px;">👑</span>
			`
	  );
	  if (isAudio == 0) {
	    document.querySelector("#player_audio_lose").play();
	  }
	}
    winner.pattern.forEach((e) => {
	document.querySelectorAll(".board-cell")[e].style.background = `var(${winner.winner == player_sign ? '--bs-primary' : '--bs-danger'})`;
      });
  document.getElementById("players_container").insertAdjacentHTML(
    "afterend",
    `
	<div id="end_game" class="d-flex column justify-content-center align-items-center mt-3">
	    <button onclick="start_over_ai()" class="btn btn-primary">Restart</button>
	    <button onclick="window.location.href = window.location.origin"
	    class="btn btn-secondary ms-2">Exit</button>
	</div>`
  );
    } else {
    document.getElementById("players_container").insertAdjacentHTML(
      "afterend",
      `
	  <div id="end_game" class="d-flex column justify-content-center align-items-center mt-3">
	      <button onclick="start_over_ai()" class="btn btn-primary">Restart</button>
	      <button onclick="window.location.href = window.location.origin"
	      class="btn btn-secondary ms-2">Exit</button>
	  </div>`
    );
      document.querySelector("#player-indicator").insertAdjacentHTML(
	"afterend",
	`
			  <span class="position-absolute cap"
			  style="left:10px;text-align:center;width:28px;height:28px;top: -20px;">👑</span>
		    `
      );
	document.querySelector("#opponent-indicator").insertAdjacentHTML(
	  "afterend",
	  `
			  <span class="position-absolute cap"
			  style="left:10px;text-align:center;width:28px;height:28px;top: -20px;">👑</span>
		    `
	);
	if (isAudio == 0) {
	  document.querySelector("#player_audio_win").play();
	}
    }
}

function checkWinner(board) {
  const winningPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  for (const pattern of winningPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], pattern };
    }
  }

  return null; 
}

function findBestMove(board,ai_sign) {
  if (!board.includes('')) {
    return null; 
  }

  for (let i = 0; i < board.length; i++) {
    if (board[i] === '') {
      const testBoard = [...board];
      testBoard[i] = ai_sign; 
      const winnerInfo = checkWinner(testBoard);
      if (winnerInfo && winnerInfo.winner === ai_sign) {
        return i;
      }
    }
  }


  for (let i = 0; i < board.length; i++) {
    if (board[i] === '') {
      const testBoard = [...board];
      testBoard[i] = player_sign; 
      const opponentWinningMove = checkWinner(testBoard);
      if (opponentWinningMove && opponentWinningMove.winner === player_sign) {
        return i; 
      }
    }
  }

  const emptyCells = board.reduce((acc, cell, index) => {
    if (cell === '') {
      acc.push(index);
    }
    return acc;
  }, []);

  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  return emptyCells[randomIndex];
}
