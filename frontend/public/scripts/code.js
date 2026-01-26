
// DOM ELEMENT
const formMessage = document.querySelector("#formMessage");
const formUsername = document.querySelector("#formUsername");
const msgElement = document.querySelector("input#msg");
const chatElement = document.querySelector("div#chatbox");
const usernameElement = document.querySelector("#username");
const chatStage = document.querySelector("#chatStage");
const onlineUsersElement = chatStage.querySelector("code");

// DEPENDENCIES
const websocket = new WebSocket("ws://localhost:8080");



// VARIABLES
let username;
let authenticated = false;



// EVENTLISTENER
formUsername.addEventListener("submit", (e) => {
    e.preventDefault();

    username = usernameElement.value;

    // asynkron fetch
    const endpoint = "http://localhost:8080/login";

    const options = {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username })
    };

    fetch(endpoint, options)
        .then(res => res.json())
        .then((data) => {
            console.log("data", data);



            if (data.authenticated === true) {
                authenticated = true;
                username = data.username;

                console.log("authenticated", authenticated, "username", username);

                usernameElement.setAttribute("disabled", true);
                chatStage.classList.remove("hidden");

                msgElement.focus();
                const obj = { type: "new_user", username: username };
                websocket.send(JSON.stringify(obj));


            }
        });
});

formMessage.addEventListener("submit", (e) => {
    e.preventDefault();

    console.log("yes yes yes");

    const msg = msgElement.value;
    const obj = { type: "text", msg: msg, username: username };

    // aktuell tid
    const date = new Date();
    obj.date = date;

    // skriver man själv ett meddelande i chatten bör det renderas direkt
    renderChatMessage(obj);

    websocket.send(JSON.stringify(obj));

    // nollställ textfältet
    msgElement.value = "";

    msgElement.focus();

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


    // ta hjöd för att meddelande via websocket kan har olika typ, ex text eller draw

    // om det är av type === text används metoden renderChatMessage

    switch (obj.type) {
        case "text":
            renderChatMessage(obj);
            break;

        case "new_client":

            break;

        case "new_user":
            onlineUsersElement.textContent = obj.usersOnline;
            break;

        case "user_left":

            onlineUsersElement.textContent = obj.usersOnline;

            break;
    }



});

// FUNCTIONS

// funktion som kan rendera textmeddelande
function renderChatMessage(obj) {

    let div = document.createElement("div");
    const p = document.createElement("p");



    // applicera klass på vem som skriver
    if (obj.username !== username) {
        div.classList = "textMessage other";
    } else {
        div.classList = "textMessage";
    }

    p.textContent = obj.msg;
    p.classList = "text";
    div.appendChild(p);

    // användarnamn
    let divUsename = document.createElement("div");
    divUsename.textContent = obj.username;
    divUsename.classList = "username";

    // aktuell tid
    const time = document.createElement("time");


    const date = new Date(obj.date);




    time.textContent = date.toLocaleTimeString();
    time.dateTime = date.toLocaleTimeString();
    div.appendChild(time);

    div.appendChild(divUsename);

    chatElement.appendChild(div);

}






