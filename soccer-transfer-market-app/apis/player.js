const mysql = require('mysql');
var util = require('util')

// Create a connection pool
const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'root',
  database: 'soccer-player-transfer',
  connectionLimit: 10
});

pool.query = util.promisify(pool.query);

// Get all players
const getAllPlayers = async (req, res) => {
    try {
        const query = 'SELECT p.*, c.name as club_name, c.location as club_location FROM players p LEFT JOIN clubs c ON p.club_id = c.id';
        const rows = await pool.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get a player by ID
const getPlayerById = async (req, res) => {
    const id = req.params.id;
    try {
      const player = await pool.query('SELECT p.*, c.name as club_name, c.location as club_location FROM players p LEFT JOIN clubs c ON p.club_id = c.id WHERE p.id = ?', [id]);
    //   const clubId = player[0].club_id;
    //   const club = await pool.query('SELECT * FROM clubs WHERE id = ?', [clubId]);
    //   const playerWithClub = { ...player[0], club: club[0] };
      res.json(player[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
};

const getAllPlayersByClubId = async (req, res) => {
    const clubId = req.params.clubId
    console.log(clubId);
    try {
      const query = `
        SELECT *
        FROM players
        WHERE club_id = ?
      `;
      const rows = await pool.query(query, clubId);
      console.log(rows);
      res.status(200).json(rows);
    } catch (error) {
      console.error(error);
      throw new Error('Error fetching players');
    }
};

// Create a new player
const createPlayer = async (req, res) => {
    try {
        const { name, age, contractLength, salary, playerRating, form, baseSellingPrice, club_id, address } = req.body;
        const query = 'INSERT INTO players (name, age, contract_length, salary, player_rating, form, base_selling_price, club_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const result = await pool.query(query, [name, age, contractLength, salary, playerRating, form, baseSellingPrice, club_id]);
        const playerId = result.insertId;
        await pool.query('INSERT INTO player_addresses (player_id, address) VALUES (?, ?)', [playerId, address]);
        const player = { id: result.insertId, name, age, contractLength, salary, playerRating, form, baseSellingPrice, club_id, address};
        res.status(201).json(player);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Update a player by ID
const updatePlayer = async (req, res) => {
    try {
        const { id } = req.params;
        const updateValues = req.body;
        const updateColumns = Object.keys(updateValues).map(key => `${key}=?`).join(', ');
        const query = `UPDATE players SET ${updateColumns} WHERE id=?`;
        const values = [...Object.values(updateValues), id];
        const result = await pool.query(query, values);
        if (result.affectedRows > 0) {
            const player = { id, ...updateValues };
            res.status(200).json(player);
        } else {
            res.status(404).json({ message: 'Player Not Found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getPlayerAddressId = async (req, res) => {
    try {
        const {address} = req.params
        const result = await pool.query('SELECT player_id FROM player_addresses WHERE address = ?', [address]);
        if (result.length) {
            res.json(result[0].player_id);
        } else {
            res.status(404).json({ message: 'Player not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
  

module.exports = { getAllPlayers, getPlayerById, getAllPlayersByClubId, getPlayerAddressId, createPlayer, updatePlayer }

