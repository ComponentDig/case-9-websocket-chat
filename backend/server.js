// DEPENDENCIES
import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';


// VARIABLES
const app = express();

const PORT = 8080;

// STATIC FILES
app.use(express.static('../frontend/public'));

// -----

// CREATE HTTP SERVER, express skickas med som en instans
const server = http.createServer(app);



// -----

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

        usersOnline.push(username);

    } else {
        res.send({ authenticated: false });
    }

});





// -------


// lyssna på events 
wss.on('connection', (ws) => {

    console.log(`Antal klienter anslutna: ${wss.clients.size}`);

    const obj = { msg: "Ny klient ansluten", usersOnline: usersOnline };

    ws.send(JSON.stringify(obj));


    ws.on('close', () => {
        // uppdatera usersOnline, skicka till samtliga klienter, aktuell lista på aktiva användare
        console.log(`Klient lämnade, klienter kvar: ${wss.clients.size}`);
    });

    // lyssna på event av sorten message
    ws.on('message', (data) => {

        const obj = JSON.parse(data);

        console.log(obj);

        // broadcast(wss, obj); 
        broadcastExclude(wss, ws, obj);
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