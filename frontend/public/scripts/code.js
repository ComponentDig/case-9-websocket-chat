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
const onlineUsersElement = chatStage.querySelector("div#scoreboard");
const emojiBtn = document.querySelector("#emojiBtn");
const picker = document.querySelector("#emojiPicker");
const logoutBtn = document.querySelector("#logoutBtn");

// loggar ut från spelet, kommer tillbaka till startsidan
const logoutButton = () => {
    location.reload();
}

logoutBtn.addEventListener("click", logoutButton);

// DEPENDENCIES
// const websocket = new WebSocket("ws://localhost:8080");

// adress till backend på render.com hosting
// för deployment på netlify
const backendHost = "case-9-websocket-chat.onrender.com";
const websocket = new WebSocket(`wss://${backendHost}`);
const endpoint = `https://${backendHost}/login`;

import Player from "./Player.js";
import { showConfetti } from "./confetti.js";

// VARIABLES
let username;
let authenticated = false;
let usersOnline = [];
let player;


// EVENTLISTENER
formUsername.addEventListener("submit", (e) => {
    e.preventDefault();

    username = usernameElement.value;

    // asynkron fetch - utkommenterad för att få deployment att fungera
    // const endpoint = "http://localhost:8080/login";

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

            if (data.authenticated === true) {
                authenticated = true;
                username = data.username;

                player = new Player(data.id, data.username);

                // dölj inputfältet för användarnamn efter att en spelar skrivit in 
                // username och påbörjat spelet
                formUsername.classList.add("hidden");
                document.querySelector("p").classList.add("hidden");

                usernameElement.setAttribute("disabled", true);
                chatStage.classList.remove("hidden");

                msgElement.focus();
                const obj = { type: "new_user", username: username, player: player };
                websocket.send(JSON.stringify(obj));
            }
        });
});

formMessage.addEventListener("submit", (e) => {
    e.preventDefault();

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


let isMyTurn = false;

websocket.addEventListener("message", (e) => {

    const obj = JSON.parse(e.data);

    // switch-sats som kollar olika händelser från servern
    switch (obj.type) {
        case "text":
            renderChatMessage(obj);
            break;

        case "new_client":

            break;

        case "new_user":
            usersOnline = obj.usersOnline;
            renderScoreboard(obj.usersOnline, obj.scores);
            break;

        case "user_left":

            renderScoreboard(obj.usersOnline, obj.scores);
            break;

        case "your_turn":
            isMyTurn = true;
            renderChatMessage({
                msg: `Din tur! Rita: ${obj.word.toUpperCase()}`,
                date: new Date()
            });
            break;

        case "draw":
            drawOnCanvas(obj.x, obj.y);
            break;
        case "stop_draw":

            ctx.beginPath();
            break;

        case "correct_guess":
            renderChatMessage({
                msg: `Rätt gissat ${obj.username}. Ordet var: ${obj.word.toUpperCase()}`,
                date: new Date()
            });

            renderScoreboard(obj.usersOnline || usersOnline, obj.scores);

            // rensar canvas för nästa spelare att rita
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            break;

        case "new_round":
            isMyTurn = false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            renderChatMessage({
                msg: `Gör dig redo! ${obj.drawer} ritar nu`,
                date: new Date()
            });
            break;

        case "game_over":
            isMyTurn = false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            renderChatMessage({
                username: "WINNER",
                msg: `GRATTIS ${obj.winner.toUpperCase()}! Du vann spelet`,
                date: new Date()
            });

            renderScoreboard(usersOnline, obj.scores);
            showConfetti();
            break;
    }
});

// FUNCTIONS

// rita upp scoreboarden
function renderScoreboard(onlineArray, scoresObj = {}) {
    if (!onlineArray) return;

    onlineUsersElement.innerHTML = "";

    onlineArray.forEach(user => {
        const points = scoresObj[user] ?? 0;

        const row = createScoreRow(user, points);

        onlineUsersElement.appendChild(row);
    });
}

function createScoreRow(username, points = 0) {
    const row = document.createElement("div");
    row.className = "score-row";

    const name = document.createElement("span");
    name.className = "player-name";
    name.textContent = `${username}`;

    const score = document.createElement("span");
    score.className = "player-score";
    score.textContent = `${points}p`;

    row.append(name, score);
    return row;
}

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

    // visning av vem som vunnit
    if (obj.username === "WINNER") {
        div.style.background = "#ffd700";
        div.style.border = "4px solid orange";
        div.style.borderImage = "linear-gradient(135deg, #fff, #f2cb34, #ec6c03, #f2cb34, #ec6c03) 1";
        div.style.fontWeight = "bold";
        div.style.textAlign = "center";
    }

    chatElement.appendChild(div);
    chatElement.scrollTop = chatElement.scrollHeight
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
    if (!painting || !authenticated || !isMyTurn) return;

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


// emoji picker eventlistener
emojiBtn.addEventListener("click", () => {
    picker.style.display = picker.style.display === "none" ? "block" : "none";
});

picker.addEventListener("emoji-click", event => {
    msgElement.value += event.detail.unicode;
    msgElement.focus();
});
