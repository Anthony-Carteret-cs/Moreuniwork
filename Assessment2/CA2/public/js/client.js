const socket = io();

const inboxPeople = document.querySelector(".inbox__people");
const inputField = document.querySelector(".message_form__input");
const messageForm = document.querySelector(".message_form");
const messageBox = document.querySelector(".messages__history");
const typingIndicator = document.getElementById('typing-indicator');

let userName = "";
let typingTimeout;

const newUserConnected = function () {
  const id = Math.floor(Math.random() * 1000000);
  userName = 'user-' + id;
  socket.emit("new user", userName);
  addToUsersBox(userName);
};

const addToUsersBox = function (userName) {
  if (!!document.querySelector(`.${userName}-userlist`)) {
    return;
  }
  const userBox = `
    <div class="chat_id ${userName}-userlist">
      <h5>${userName}</h5>
    </div>
  `;
  inboxPeople.innerHTML += userBox;
};

newUserConnected();

socket.on("new user", function (data) {
  if (Array.isArray(data)) {
    data.forEach(user => addToUsersBox(user));
  } else {
    addToUsersBox(data);
  }
});

socket.on("user disconnected", function (userName) {
  const el = document.querySelector(`.${userName}-userlist`);
  if (el) el.remove();
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

  messageBox.innerHTML += user === userName ? myMsg : receivedMsg;
  messageBox.scrollTop = messageBox.scrollHeight;
};

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!inputField.value.trim()) return;

  socket.emit("chat message", {
    message: inputField.value,
    nick: userName,
  });

  inputField.value = "";

  if (typingTimeout) {
    clearTimeout(typingTimeout);
    typingTimeout = null;
    socket.emit("typing", false);
  }
});

socket.on("chat message", function (data) {
  addNewMessage({ user: data.nick, message: data.message });
});

inputField.addEventListener("input", () => {
  console.log("Input detected, typing timeout:", typingTimeout);

  if (!typingTimeout) {
    console.log("Emitting typing: true");
    socket.emit("typing", true);
  }

  clearTimeout(typingTimeout);

  typingTimeout = setTimeout(() => {
    console.log("Emitting typing: false");
    socket.emit("typing", false);
    typingTimeout = null;
  }, 1000);
});

socket.on("typing users", (userlist) => {
  console.log("Received typing users:", userlist);
  console.log("Current userName:", userName);

  const typingUsers = userlist.filter(u => u !== userName);
  console.log("Filtered typing users:", typingUsers);

  if (typingUsers.length > 0) {
    typingIndicator.textContent = `${typingUsers.join(', ')} ${typingUsers.length > 1 ? 'are' : 'is'} typing...`;
    typingIndicator.style.display = 'block';
  } else {
    typingIndicator.style.display = 'none';
  }
});