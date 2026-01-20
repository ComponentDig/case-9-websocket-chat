
// DOM ELEMENT
const formMessage = document.querySelector("#formMessage");
const formUsername = document.querySelector("#formUsername");
const msgElement = document.querySelector("input#msg");
const chatElement = document.querySelector("div#chatbox");
const usernameElement = document.querySelector("#username");
const chatStage = document.querySelector("#chatStage");

// DEPENDENCIES
const websocket = new WebSocket("ws://localhost:8080");



// VARIABLES
let username;




// EVENTLISTENER
formUsername.addEventListener("submit", (e) => {
    e.preventDefault();
    console.log(usernameElement.value);

    username = usernameElement.value;

    usernameElement.setAttribute("disabled", true);

    chatStage.classList.remove("hidden");

});






formMessage.addEventListener("submit", (e) => {
    e.preventDefault();

    console.log("yes yes yes");

    const msg = msgElement.value;
    const obj = { msg: msg, username: username };

    // skriver man själv ett meddelande i chatten bör det renderas direkt
    renderChatMessage(obj);

    websocket.send(JSON.stringify(obj));
});

// aktivera lyssnare på input#msg: kan användas för att visa att ngn skriver "...is typing"
msgElement.addEventListener("keydown", (e) => {
    console.log("...is typing", e.key);

    // hantera att en person skriver ngt - kan kanske skickas som en händelse

});

websocket.addEventListener("message", (e) => {
    const data = e.data;


    const obj = JSON.parse(e.data);
    console.log("obj", obj);

    renderChatMessage(obj);
});

// FUNCTIONS

// funktion som kan rendera textmeddelande
function renderChatMessage(obj) {

    const p = document.createElement("p");
    p.textContent = obj.msg;

    chatElement.appendChild(p);


    // applicera klass på vem som skriver



}






