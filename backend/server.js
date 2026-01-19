// dependencies
import express from 'express';
import 'dotenv/config';

// miljövariabler
const app = express();

const PORT = 8080;
// statiska filer
app.use(express.static('../frontend/public'));

// -----

// skapa en http server, express skickas med som en instans


// -----

// skapa en websocket server


// -------

// handshake - godkänn kommunikation via websocket


// -----

// middleware

// ta emot http POST request


// -------


// lyssna på events 


// -----



// starta server 
app.listen(PORT, () => {
    console.log(`Serven lyssnar på port: ${PORT}`);
});



// -----




// hjälpfunktioner




// ----