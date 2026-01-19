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
});

// aktivera lyssnare på input#msg: kan användas för att visa att ngn skriver "...is typing"
msgElement.addEventListener("keydown", (e) => {
    console.log("...is typing", e.key);

    // hantera att en person skriver ngt - kan kanske skickas som en händelse
    
});




