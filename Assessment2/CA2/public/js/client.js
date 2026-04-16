//required for front end communication between client and server

const socket = io();

const inboxPeople = document.querySelector(".inbox__people");


let userName = "";
let id;
const newUserConnected = function (data) {
    

    //give the user a random unique id
    id = Math.floor(Math.random() * 1000000);
    userName = 'user-' +id;
    //console.log(typeof(userName));   
    

    //emit an event with the user id
    socket.emit("new user", userName);
    //call
    addToUsersBox(userName);
};

const addToUsersBox = function (userName) {
    //This if statement checks whether an element of the user-userlist
    //exists and then inverts the result of the expression in the condition
    //to true, while also casting from an object to boolean
    if (!!document.querySelector(`.${userName}-userlist`)) {
        return;
    
    }
    
    //setup the divs for displaying the connected users
    //id is set to a string including the username
    const userBox = `
    <div class="chat_id ${userName}-userlist">
      <h5>${userName}</h5>
    </div>
  `;
    //set the inboxPeople div with the value of userbox
    inboxPeople.innerHTML += userBox;
};

//call 
newUserConnected();

//when a new user event is detected
socket.on("new user", function (data) {
  if (Array.isArray(data)) {
    data.forEach(user => addToUsersBox(user));
  } else {
    addToUsersBox(data);
  }
});

//when a user leaves
socket.on("user disconnected", function (userName) {
  document.querySelector(`.${userName}-userlist`).remove();
});


const inputField = document.querySelector(".message_form__input");
const messageForm = document.querySelector(".message_form");
const messageBox = document.querySelector(".messages__history");

const typingIndicator = document.getElementById('typing-indicator');

let typingTimeout;

   // Handle typing events
   messageInput.addEventListener('input', () => {
     // User is typing
     if (!typingTimeout) {
         socket.emit('typing', true);
     }
    
     // Clear previous timeout
     clearTimeout(typingTimeout);
    
     // Set a timeout to indicate user stopped typing
     typingTimeout = setTimeout(() => {
         socket.emit('typing', false);
         typingTimeout = null;
     }, 1000);
   });

const addNewMessage = ({ user, message }) => {
  const time = new Date();
  const formattedTime = time.toLocaleString("en-US", { hour: "numeric", minute: "numeric" });

  const receivedMsg = `
  <div class="incoming__message">
    <div class="received__message">
      <div class="message__info">
        <span class="time_date">${formattedTime}</span>
        <p>${message} - <span class="message__author">${user}</span></p>
      </div>
    </div>
  </div>`;

  const myMsg = `
  <div class="outgoing__message">
    <div class="sent__message">
      <div class="message__info">
        <span class="message__author">${user}</span> - <span class="time_date">${formattedTime}</span>
        <p>${message}</p>
      </div>
    </div>
  </div>`;


  //is the message sent or received
  messageBox.innerHTML += user === userName ? myMsg : receivedMsg;
};

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!inputField.value) {
    return;
  }
  
  if (typingTimeout) {
      clearTimeout(typingTimeout);
      typingTimeout = null;
      socket.emit('typing', false);
    }

  socket.emit("chat message", {
    message: inputField.value,
    nick: userName,
  });

  socket.on('typing users', (usernames) => {
     const typingUsers = usernames.filter(u => u !== currentUsername);
     if (typingUsers.length > 0) {
         typingIndicator.textContent = `${typingUsers.join(', ')} ${typingUsers.length > 1 ? 'are' : 'is'} typing...`;
         typingIndicator.style.display = 'block';
     } else {
         typingIndicator.style.display = 'none';
     }
   });

  inputField.value = "";
});

socket.on("chat message", function (data) {
  addNewMessage({ user: data.nick, message: data.message });
});

socket.on("user disconnected", function (userName) {
  addNewMessage({ user: "System", message: `${userName} has left the chat` });
});

socket.on("new user", function (userName) {
  addNewMessage({ user: "System", message: `${userName} has joined the chat` });
});

