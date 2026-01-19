import { json } from "express";

// DOM element
const form = document.querySelector("form");
const msgElement = document.querySelector("input#msg");
const chatElement = document.querySelector("div#chatbox");


// dependencies
const websocket = new WebSocket("ws://localhost:8080");



// variabler





// händelselyssnare
form.addEventListener("submit", (e) => {
    e.preventDefault();

    console.log("yes yes yes");

    const msg = msgElement.value;
    const obj = { msg: msg };

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
});


