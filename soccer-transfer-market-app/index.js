var express = require('express')
const bodyParser = require('body-parser');
const { getAllBids, getBidById, createBid, updateBid, deleteBid } = require('./apis/bids')
const  { getAllExtensions, getExtensionById, createExtension, updateExtension, deleteExtension } = require("./apis/contract_extensions")
const { getAllPlayers, getPlayerById, getAllPlayersByClubId, getPlayerAddressId, createPlayer, updatePlayer } = require('./apis/player')
const { getAllClubs, getClubById, getClubAddressId, createClub, updateClub, deleteClub } = require('./apis/club')
const { getClubAddressById } = require('./apis/club_addresses')



var app = express();

app.use(express.static('src'));
app.use(express.static('../soccer-transfer-market-contract/build/contracts/'));
app.use(bodyParser.json());

// Bids
app.get('/bids', getAllBids);
app.get('/bids/:id', getBidById);
app.post('/bid', createBid);
app.put('/bids/:id', updateBid);
app.delete('bids/:id', deleteBid);


// Extension
app.get('/extensions', getAllExtensions);
app.get('/extension/:id', getExtensionById);
app.post('/extension', createExtension);
app.put('/extension/:id', updateExtension);
app.delete('extension/:id', deleteExtension);


// Players
app.get('/players', getAllPlayers);
app.get('/players/:id', getPlayerById);
app.get('/players/club/:clubId', getAllPlayersByClubId);
app.get('/players/address/:address', getPlayerAddressId);
app.post('/players', createPlayer);
app.put('/players/:id', updatePlayer);

// Clubs
app.get('/clubs', getAllClubs);
app.get('/clubs/:id', getClubById);
app.get('/clubs/address/:address', getClubAddressId);
app.post('/clubs', createClub);
app.put('/clubs/:id', updateClub);
app.delete('clubs/:id', deleteClub);

//Club Addresses
app.get('/club_addresses/:id', getClubAddressById)

//Bids
app.get('/players', getAllPlayers);
app.get('/players/:id', getPlayerById);
app.get('/players/club/:clubId', getAllPlayersByClubId);
app.get('/players/address/:address', getPlayerAddressId);
app.post('/players', createPlayer);
app.put('/players/:id', updatePlayer);


app.listen(3000, function () {
  console.log('Soccer transfer market Dapp listening on port 3000!');
});