// DEPENDENCIES
import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import { nanoid } from 'nanoid';
import cors from 'cors';

// VARIABLES
const app = express();
const PORT = 8080;

// STATIC FILES
app.use(express.static('../frontend/public'));

app.use(cors());

// CREATE HTTP SERVER, express skickas med som en instans
const server = http.createServer(app);

// CREATE WEBSOCKET SERVER
const wss = new WebSocketServer({ noServer: true });

// HANDSHAKE - godkänn kommunikation via websocket
server.on("upgrade", (req, socket, head) => {

    console.log("event upgrade...");

    wss.handleUpgrade(req, socket, head, (ws) => {
        console.log("Client:", req.headers['user-agent']);

        wss.emit("connection", ws, req);
    });
});

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

let drawer = 0;
let currentDrawer = null;

function assignDrawer() {
    if (usersOnline.length === 0) return;

    if (drawer >= usersOnline.length) {
        drawer = 0;
    }

    currentDrawer = usersOnline[drawer];
    pickNewWord();

    console.log(`Ny runda: ${currentDrawer} ritar ordet ${currentWord}`);

    wss.clients.forEach((client) => {
        if (client.username === currentDrawer) {
            client.send(JSON.stringify({
                type: "your_turn",
                word: currentWord
            }));
        } else {
            client.send(JSON.stringify({
                type: "new_round",
                drawer: currentDrawer
            }));
        }
    });

    drawer++;
}

// hur kan vi ta emot http POST request
app.use(express.json());

// route 
app.post('/login', (req, res) => {
    console.log("A post request...", req.body);

    let username = req.body.username;

    // bör kolla mer, ex endast tillåtna tecken 
    if (username.length > 2 && username.length < 10) {
        // skicka ett objekt
        res.send({ authenticated: true, username: username, id: nanoid() });
    } else {
        res.send({ authenticated: false });
    }
});

// lyssna på events 
wss.on('connection', (ws) => {

    console.log(`Antal klienter anslutna: ${wss.clients.size}`);

    const obj = { type: "new_client", msg: "Ny klient ansluten", usersOnline: usersOnline };

    broadcast(wss, obj);

    ws.on('close', () => {

        // uppdatera usersOnline, skicka till samtliga klienter, aktuell lista på aktiva användare
        console.log(`Klient lämnade, klienter kvar: ${wss.clients.size}`);

        usersOnline = usersOnline.filter(u => u !== ws.username);
        const obj = { type: "user_left", username: ws.username, usersOnline: usersOnline };

        broadcastExclude(wss, ws, obj);
    });

    // lyssna på event av sorten message
    ws.on('message', (data) => {

        const obj = JSON.parse(data);

        switch (obj.type) {

            case "text":
                const date = new Date();
                obj.date = date;

                // kontroll av gissning rätt/fel
                if (obj.msg.toLowerCase().trim() === currentWord.toLocaleLowerCase().trim()) {
                    scores[obj.username] = (scores[obj.username] || 0) + 10;

                    // kontrollerar om en spelare har uppnått 40 poäng
                    if (scores[obj.username] >= 40) {
                        const finishedObj = {
                            type: "game_over",
                            winner: obj.username,
                            scores: scores
                        }
                        // Gemini hjälpte till att hitta att jag glömt att broadcasta ut finishedObj
                        broadcast(wss, finishedObj);

                        scores = {};

                    } else {
                        const winObj = {
                            type: "correct_guess",
                            username: obj.username,
                            word: currentWord,
                            scores: scores
                        };
                        broadcast(wss, winObj);

                        setTimeout(() => {
                            assignDrawer();
                        }, 3000);

                    }

                    console.log(`Rätt gissat! ${obj.username}`);

                } else {
                    broadcastExclude(wss, ws, obj);
                }

                break;

            case "new_user":

                // uppdatera listan usersOnline med användaren
                usersOnline.push(obj.username);
                obj.usersOnline = usersOnline;

                // lägg till en egenskap till det obj som nu har kolla på klientkoppling
                ws.username = obj.username;

                broadcast(wss, obj);

                if (usersOnline.length === 1) {
                    assignDrawer();
                }
                break;

            // tog hjälp av Gemini att inse att jag glömt lägga till detta i server.js för att ritandet skulle synas för alla klienter
            case "draw":
                broadcastExclude(wss, ws, obj);
                break;

            case "stop_draw":
                broadcastExclude(wss, ws, obj);
                break;
        }
        console.log(obj);
    });
});
// starta server 
server.listen(PORT, () => {
    console.log(`Serven lyssnar på port: ${PORT}`);
});

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
