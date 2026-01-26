// DEPENDENCIES
import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs';


// VARIABLES
const app = express();
const PORT = 8080;

// STATIC FILES
app.use(express.static('../frontend/public'));

// -----

// CREATE HTTP SERVER, express skickas med som en instans
const server = http.createServer(app);


// CREATE WEBSOCKET SERVER
const wss = new WebSocketServer({ noServer: true });

// -------

// HANDSHAKE - godkänn kommunikation via websocket
server.on("upgrade", (req, socket, head) => {

    console.log("event upgrade...");



    wss.handleUpgrade(req, socket, head, (ws) => {
        console.log("Client:", req.headers['user-agent']);


        wss.emit("connection", ws, req);
    });
});


// array med 3-4 användare
let users = ["Kim FukkaYoo", "JenniDooDoo", "Josefaan"];

// eventuellt hålla koll på vilka aktiva användare
let usersOnline = [];

// läs i ord från words.txt
let words = [];
let currentWord = "";
let scores = {};

try {
    const data = fs.readFileSync('./words.txt', 'utf8');

    words = data.split(/\r?\n/).filter(word => word.trim() !== "");
    console.log(`ladda in ${words.length} ord`);
} catch (error) {
    console.error("Kunde inte läsa in från fil", error);
}

function pickNewWord() {
    if (words.length > 0) {
        currentWord = words[Math.floor(Math.random() * words.length)];
        console.log("nytt ord", currentWord);
    }
}

pickNewWord();




// middleware


// hur kan vi ta emot http POST request
app.use(express.json());



// route 
app.post('/login', (req, res) => {
    console.log("A post request...", req.body);

    let username = req.body.username;

    if (users.includes(username)) {
        console.log("Användare finns");

        users = users.filter((u) => u != username);

        console.log("Användare som finns kvar:", users);

        // bekräfta om användarnamnet är okej
        // skicka ett objekt
        res.send({ authenticated: true, username: username });

        // usersOnline.push(username);

        // för att användare som verifierats ska kopplas till en webbsocket klient
        // avvakta med att uppdatera usersOnline tills dess att webbsocket är klar...


    } else {
        res.send({ authenticated: false });
    }

});





// -------


// lyssna på events 
wss.on('connection', (ws) => {

    console.log(`Antal klienter anslutna: ${wss.clients.size}`);

    const obj = { type: "new_client", msg: "Ny klient ansluten", usersOnline: usersOnline };

    // ws.send(JSON.stringify(obj));
    broadcast(wss, obj);


    ws.on('close', () => {

        // uppdatera usersOnline, skicka till samtliga klienter, aktuell lista på aktiva användare
        console.log(`Klient lämnade, klienter kvar: ${wss.clients.size}`);

        // uppdatera listan usersOnliune så att vi vet att en specifik användare är koppla
        // till just den här klienten, dvs 'ws'
        // ta bort användare från usersOnline
        // uppdatera andra klienter om händelsen
        usersOnline = usersOnline.filter(u => u !== ws.username);
        const obj = { type: "user_left", username: ws.username, usersOnline: usersOnline };

        broadcastExclude(wss, ws, obj);

    });

    // lyssna på event av sorten message
    ws.on('message', (data) => {

        const obj = JSON.parse(data);

        switch (obj.type) {

            case "text":

                // för att visa aktuell tid för ett meddelande kan man
                // lägga till egenskapen på server sidan
                // då kommer tidszoner kunna implementeras
                const date = new Date();

                obj.date = date;

                broadcastExclude(wss, ws, obj);
                break;

            case "new_user":

                // uppdatera listan usersOnline med användaren
                usersOnline.push(obj.username);
                obj.usersOnline = usersOnline;

                // lägg till en egenskap till det obj som nu har kolla på klientkoppling
                ws.username = obj.username;

                // if (!obj.hasOwnProperty("usersOnline")) {
                // }

                // broadcastExclude(wss, ws, obj);
                broadcast(wss, obj);
                break;


        }

        console.log(obj);


    });


});

// -----



// starta server 
server.listen(PORT, () => {
    console.log(`Serven lyssnar på port: ${PORT}`);
});



// -----




// hjälpfunktioner
function broadcast(wss, obj) {
    wss.clients.forEach(client => {
        client.send(JSON.stringify(obj));
    });
}

// funktion som exkluderar en client
function broadcastExclude(wss, ws, obj) {
    wss.clients.forEach(client => {

        if (client !== ws) {
            client.send(JSON.stringify(obj));
        }
    });
}

// ----