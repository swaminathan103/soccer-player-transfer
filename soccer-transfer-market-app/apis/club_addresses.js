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

const getClubAddressById = async (req, res) => {
    try {
        const {id} = req.params
        const result = await pool.query('SELECT * FROM club_addresses WHERE club_id = ?', [id]);
        if (result.length) {
            res.json(result[0].address);
        } else {
            res.status(404).json({ message: 'Address not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getClubAddressById }
