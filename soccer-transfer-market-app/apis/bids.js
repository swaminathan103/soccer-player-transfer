const mysql = require('mysql');
var util = require('util')

// Create a connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'soccer-player-transfer',
  connectionLimit: 10
});

pool.query = util.promisify(pool.query);

// GET all bids
const getAllBids = async (req, res) => {
  try {
    const bids = await pool.query('SELECT * FROM bids');
    res.json(bids);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET bid by id
const getBidById = async (req, res) => {
  const { id } = req.params;
  try {
    const bid = await pool.query('SELECT * FROM bids WHERE id = ?', [id]);
    if (bid.length) {
      res.json(bid[0]);
    } else {
      res.status(404).json({ message: 'Bid not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllBidsByClubId = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT bids.id, players.id as player_id, players.name, players.club_id, bids.from_club_id, clubs.name as from_club_name, players.age, players.form, players.base_selling_price, bids.bid_amount
      FROM bids
      INNER JOIN players ON bids.player_id = players.id
      LEFT JOIN clubs ON bids.from_club_id = clubs.id
      WHERE bids.to_club_id = ? AND bids.active = true
    `;
    const bids = await pool.query(query, id);
    res.json(bids);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllBidsByPlayerId = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT bids.*, clubs1.name as from_club_name, clubs2.name as to_club_name
      FROM bids
      INNER JOIN clubs as clubs1 ON bids.from_club_id = clubs1.id
      LEFT JOIN clubs as clubs2 ON bids.to_club_id = clubs2.id
      WHERE bids.player_id = ? AND bids.active = true
    `;
    const bids = await pool.query(query, id);
    res.json(bids);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST new bid
const createBid = async (req, res) => {
  const { bid_amount, player_id, from_club_id } = req.body;
  try {
    const playerQuery = `
      SELECT club_id
      FROM players
      WHERE id = ?
    `;
    const playerResult = await pool.query(playerQuery, [player_id]);
    const to_club_id = playerResult[0].club_id || null;
    const result = await pool.query('INSERT INTO bids (bid_amount, player_id, from_club_id, to_club_id) VALUES (?, ?, ?, ?)', [bid_amount, player_id, from_club_id, to_club_id]);
    const newBid = { id: result.insertId, bid_amount, player_id, from_club_id, to_club_id };
    res.status(201).json(newBid);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT bid by id
// Update a player by ID
const updateBid = async (req, res) => {
    try {
        const { id } = req.params;
        const updateValues = req.body;
        const updateColumns = Object.keys(updateValues).map(key => `${key}=?`).join(', ');
        const query = `UPDATE bids SET ${updateColumns} WHERE id=?`;
        const values = [...Object.values(updateValues), id];
        const result = await pool.query(query, values);
        if (result.affectedRows > 0) {
            const player = { id, ...updateValues };
            res.status(200).json(player);
        } else {
            res.status(404).json({ message: 'Bid Not Found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const makeBidInactive = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      UPDATE bids
      SET active = false
      WHERE id = ?;
    `;
    await pool.query(query, [id]);
    res.json({ message: `Bid has been made inactive.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const makeBidsInactiveByPlayerId = async (req, res) => {
  const { playerId } = req.params;

  try {
    const query = `
      UPDATE bids
      SET active = false
      WHERE player_id = ? AND active = true;
    `;
    await pool.query(query, [playerId]);
    res.json({ message: `All active bids for player with ID ${playerId} have been made inactive.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


const updateBidActiveStatus = async (bidId, active) => {
    try {
      const result = await pool.query('UPDATE bids SET active = ? WHERE id = ?', [active, bidId]);
      if (result.affectedRows) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error(error);
      return false;
    }
  }

// DELETE bid by id
const deleteBid = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM bids WHERE id = ?', [id]);
    if (result.affectedRows) {
      res.json({ message: 'Bid deleted' });
    } else {
      res.status(404).json({ message: 'Bid not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAllBids, getBidById, getAllBidsByClubId, getAllBidsByPlayerId, createBid, updateBid, makeBidsInactiveByPlayerId, makeBidInactive, deleteBid, updateBidActiveStatus};

