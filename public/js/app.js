var socket = io();
var name = getQueryVariable("name") || 'Anonymous';
var room = getQueryVariable("room") || 'No Room Selected';

$(".room-title").text(room);
socket.on("connect", function() {
  console.log("Connected to Socket I/O Server!");
  console.log(name + " wants to join  " + room);
  socket.emit('joinRoom', {
    name: name,
    room: room
  });
});

var timeout;

function timeoutFunction() {
  typing = false;
  socket.emit('typing', {
    text: "" //name + " stopped typing"
  });
}
$('#messagebox').keyup(function() {
  console.log('happening');
  typing = true;
  $("#icon-type").removeClass();
  //console.log("typing typing ....");
  //socket.emit('typing', 'typing...');
  socket.emit('typing', {
    text: name + " is typing ..."
  });
  clearTimeout(timeout);
  timeout = setTimeout(timeoutFunction, 1000);
});

// below is the checking for page visibility api
var hidden, visibilityChange;
if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
  hidden = "hidden";
  visibilityChange = "visibilitychange";
} else if (typeof document.mozHidden !== "undefined") {
  hidden = "mozHidden";
  visibilityChange = "mozvisibilitychange";
} else if (typeof document.msHidden !== "undefined") {
  hidden = "msHidden";
  visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
  hidden = "webkitHidden";
  visibilityChange = "webkitvisibilitychange";
}

//listening for typing  event
socket.on("typing", function(message) { //console.log(message.text);
  $(".typing").text(message.text);
});

socket.on("userSeen", function(msg) {

 // if (msg.user == name) {
    // read message
    // show messags only to user who has typied
    var icon = $("#icon-type");
    icon.removeClass();
    icon.addClass("fa fa-check-circle");
    if (msg.read) {
      //user read the message
      icon.addClass("msg-read");
    } else {
      // message deleiverd but not read yet
      icon.addClass("msg-delieverd");
    }
    console.log(msg);
  //}
});


//setup for custom events
socket.on("message", function(message) {
  console.log("New Message !");
  console.log(message.text);
  // insert messages in container
  var $messages = $(".messages");
  var $message = $('<li class = "list-group-item"></li>');

  var momentTimestamp = moment.utc(message.timestamp).local().format("h:mm a");
  $message.append("<strong>" + momentTimestamp + " " + message.name + "</strong>");
  $message.append("<p>" + message.text + "</p>");
  $messages.append($message);
  var obj = $("ul.messages.list-group");
  var offset = obj.offset();
  var scrollLength = obj[0].scrollHeight;
  //  offset.top += 20;
  $("ul.messages.list-group").animate({
    scrollTop: scrollLength - offset.top
  });

  if (document[hidden]) {
    notifyMe(message);
    var umsg = {
      text: name + " has not seen message",
      read: false
    };
    socket.emit("userSeen", umsg);
  } else {
    var umsg = {
      text: name + " has seen message",
      read: true,
      user: name
    };
    socket.emit("userSeen", umsg);
  }
});

var $form = $("#messageForm");
var $message1 = $form.find('input[name=message]');
$form.on("submit", function(event) {
  event.preventDefault();
  var msg = $message1.val();
  msg = msg.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
  if (msg === "") return -1; 

  socket.emit("message", {
    text: msg,
    name: name
  });
  // show user messageForm
  var $messages = $(".messages");
  var $message = $('<li class = "list-group-item"></li>');

  var momentTimestamp = moment().format("h:mm a");
  $message.append("<strong>" + momentTimestamp + " " + name + "</strong>");
  $message.append($("<p>", {
    class: "mymessages",
    text: $message1.val()
  }));
  $messages.append($message);
  $message1.val('');
  // manage autoscroll
  var obj = $("ul.messages.list-group");
  var offset = obj.offset();
  var scrollLength = obj[0].scrollHeight;
  //  offset.top += 20;
  $("ul.messages.list-group").animate({
    scrollTop: scrollLength - offset.top
  });

});

function notifyMe(msg) {
  if (!("Notification" in window)) {
    alert("This browser does not support desktop notification,try Chromium!");
  }

  else if (Notification.permission === "granted") {
    var notification = new Notification('Chat App', {
      body: msg.name + ": " + msg.text,
      icon: '/images/apple-icon.png'
    });
    notification.onclick = function(event) {
      event.preventDefault();
      this.close();
      var umsg = {
        text: name + " has seen message",
        read: true,
        user: name
      };
      socket.emit("userSeen", umsg);
    };
  }
  else if (Notification.permission !== 'denied') {
    Notification.requestPermission(function(permission) {
      if (permission === "granted") {
        var notification = new Notification('Chat App', {
          body: msg.name + ": " + msg.text,
      
        });
        notification.onclick = function(event) {
          event.preventDefault();
          this.close();
          var umsg = {
            text: name + " has seen message",
            read: true,
            user: name
          };
          socket.emit("userSeen", umsg);
           };
      }
    });
  }
}