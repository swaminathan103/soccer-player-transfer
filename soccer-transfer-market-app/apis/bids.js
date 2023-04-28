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

// POST new bid
const createBid = async (req, res) => {
  const { bid_amount, player_id, from_club_id, to_club_id } = req.body;
  try {
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

module.exports = { getAllBids, getBidById, createBid, updateBid, deleteBid, updateBidActiveStatus};

