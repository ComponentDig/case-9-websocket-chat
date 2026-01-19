// dependencies
import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';


// miljövariabler
const app = express();

const PORT = 8080;

// statiska filer
app.use(express.static('../frontend/public'));

// -----

// skapa en http server, express skickas med som en instans
const server = http.createServer(app);



// -----

// skapa en websocket server
const wss = new WebSocketServer({ noServer: true });

// -------

// handshake - godkänn kommunikation via websocket
server.on("upgrade", (req, socket, head) => {

    console.log("event upgrade...");

    wss.handleUpgrade(req, socket, head, (ws) => {
        console.log("Client:", req.headers['user-agent']);


        wss.emit("connection", ws, req);
    });
});

// -----

// middleware

// ta emot http POST request


// -------


// lyssna på events 
wss.on('connection', (ws) => {

    console.log(`Antal klienter anslutna: ${wss.clients.size}`);

    const obj = { msg: "Ny klient ansluten" };

    ws.send(JSON.stringify(obj));


    ws.on('close', () => {
        console.log(`Klient lämnade, klienter kvar: ${wss.clients.size}`);
    });



});

// -----


// starta server 
server.listen(PORT, () => {
    console.log(`Serven lyssnar på port: ${PORT}`);
});



// -----




// hjälpfunktioner




// ----