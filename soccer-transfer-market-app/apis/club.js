const mysql = require('mysql');
var util = require('util')

// Create a connection pool
const pool = mysql.createPool({
  host: 'sql9.freemysqlhosting.net',
  user: 'sql9615119',
  password: 'wE8rIRsxh4',
  database: 'sql9615119',
  connectionLimit: 10
});

pool.query = util.promisify(pool.query);

// GET all clubs
const getAllClubs = async (req, res) => {
  try {
    const clubs = await pool.query('SELECT * FROM clubs');
    res.json(clubs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET club by id
const getClubById = async (req, res) => {
  const { id } = req.params;
  try {
    const club = await pool.query('SELECT * FROM clubs WHERE id = ?', [id]);
    if (club.length) {
      res.json(club[0]);
    } else {
      res.status(404).json({ message: 'Club not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST new club
const createClub = async (req, res) => {
  const { name, location, address} = req.body;
  try {
    const result = await pool.query('INSERT INTO clubs (name, location) VALUES (?, ?)', [name, location]);
    const clubId = result.insertId;
    await pool.query('INSERT INTO club_addresses (club_id, address) VALUES (?, ?)', [clubId, address]);
    const newClub = { id: result.insertId, name, location, address};
    res.status(201).json(newClub);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT club by id
const updateClub = async (req, res) => {
  const { id } = req.params;
  const { name, location } = req.body;
  try {
    const result = await pool.query('UPDATE clubs SET name = ?, location = ? WHERE id = ?', [name, location, id]);
    if (result.affectedRows) {
      const updatedClub = { id, name, location };
      res.json(updatedClub);
    } else {
      res.status(404).json({ message: 'Club not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE club by id
const deleteClub = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM clubs WHERE id = ?', [id]);
    if (result.affectedRows) {
      res.json({ message: 'Club deleted' });
    } else {
      res.status(404).json({ message: 'Club not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getClubAddressId = async (req, res) => {
    try {
        console.log(req.params);
        const {address} = req.params
        console.log(address);
        const result = await pool.query('SELECT * FROM club_addresses WHERE address = ?', [address]);
        if (result.length) {
            res.json(result[0].club_id);
        } else {
            res.status(404).json({ message: 'Club not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getAllClubs, getClubById, getClubAddressId, createClub, updateClub, deleteClub };
