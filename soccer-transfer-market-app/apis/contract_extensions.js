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

// GET all contract extensions
const getAllExtensions = async (req, res) => {
  try {
    const extensions = await pool.query('SELECT * FROM contract_extensions');
    res.json(extensions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET extension by id
const getExtensionById = async (req, res) => {
  const { id } = req.params;
  try {
    const extension = await pool.query('SELECT ce.*, c.name as club_name FROM contract_extensions ce JOIN clubs c ON ce.club_id = c.id WHERE ce.player_id = ? AND ce.active = 1', [id]);
    if (extension.length) {
      res.json(extension);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST new extension
const createExtension = async (req, res) => {
  const { player_id, club_id, length, salary_increase } = req.body;
  try {
    const result = await pool.query('INSERT INTO contract_extensions (player_id, club_id, length, salary_increase) VALUES (?, ?, ?, ?)', [player_id, club_id, length, salary_increase]);
    const newExtension = { id: result.insertId, player_id, club_id, length, salary_increase };
    res.status(201).json(newExtension);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT extension by id
const updateExtension = async (req, res) => {
    try {
        const { id } = req.params;
        const updateValues = req.body;
        const updateColumns = Object.keys(updateValues).map(key => `${key}=?`).join(', ');
        const query = `UPDATE contract_extensions SET ${updateColumns} WHERE id=?`;
        const values = [...Object.values(updateValues), id];
        const result = await pool.query(query, values);
        if (result.affectedRows > 0) {
            const extension = { id, ...updateValues };
            res.status(200).json(extension);
        } else {
            res.status(404).json({ message: 'Extension Not Found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// DELETE extension by id
const deleteExtension = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM contract_extensions WHERE id = ?', [id]);
    if (result.affectedRows) {
      res.json({ message: 'Extension deleted' });
    } else {
      res.status(404).json({ message: 'Extension not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAllExtensions, getExtensionById, createExtension, updateExtension, deleteExtension };
