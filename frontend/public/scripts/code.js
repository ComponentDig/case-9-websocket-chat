// canvas
const canvas = document.querySelector("#paintCanvas");
const ctx = canvas.getContext("2d");

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
});

websocket.addEventListener("message", (e) => {
    const data = e.data;

    const obj = JSON.parse(e.data);
    console.log("obj", obj);

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

        case "draw":
            drawOnCanvas(obj.x, obj.y);
            break;
        case "stop_draw":

            ctx.beginPath();
            break;

        case "correct_guess":
            renderChatMessage({
                // username: 
                msg: `Rätt gissat ${obj.username}. Ordet var: ${obj.word.toUpperCase()}`,
                date: new Date()
            });

            // uppdatera poäng visuellt för alla användare
            let scoreDisplay = "Poäng: ";
            for (let user in obj.scores) {
                scoreDisplay += `${user}: ${obj.scores[user]}`
            }

            onlineUsersElement.textContent = JSON.stringify(obj.scores);

            // rensar canvas för nästa spelare att rita
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
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

    chatElement.scrollTop = chatElement.scrollHeight;
}

let painting = false;

// canvas 
function startDrawing(e) {
    painting = true;
    draw(e);
}

function stopDrawing() {
    painting = false;
    ctx.beginPath();
    websocket.send(JSON.stringify({ type: "stop_draw" }));
}

let lastX = 0;
let lastY = 0;

function draw(e) {
    if (!painting || !authenticated) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    drawOnCanvas(x, y);

    websocket.send(JSON.stringify({ type: "draw", x, y }));
}

function drawOnCanvas(x, y) {
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mousemove", draw);







