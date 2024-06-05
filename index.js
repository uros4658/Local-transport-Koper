const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = 3000;

const DATABASE_PATH = path.join(__dirname, 'database', 'schedules.db');

const db = new sqlite3.Database(DATABASE_PATH, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to database');
  }
});

const getCurrentTime = () => {
  const now = new Date();
  return `${now.getHours()}:${now.getMinutes()}`;
};

app.get('/bus-times', (req, res) => {
  const { startStation, endStation } = req.query;

  if (!startStation || !endStation) {
    return res.status(400).json({ error: 'Please provide startStation and endStation parameters' });
  }

  const currentTime = getCurrentTime();

  db.all(`
    SELECT * FROM schedules 
    WHERE station_name = ? 
      AND times LIKE ? 
    ORDER BY id`, [startStation, `%${currentTime}%`], (err, rows) => {
    if (err) {
      console.error('Error fetching data', err);
      return res.status(500).json({ error: 'Failed to fetch bus times' });
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No buses available at this time' });
    }

    for (const row of rows) {
      const times = row.times.split(',');
      for (const time of times) {
        if (time >= currentTime) {
          db.all(`
            SELECT * FROM schedules 
            WHERE bus_number = ? 
              AND station_name = ? 
              AND id > ? 
            ORDER BY id`, [row.bus_number, endStation, row.id], (err, endRows) => {
            if (err) {
              console.error('Error fetching data', err);
              return res.status(500).json({ error: 'Failed to fetch bus times' });
            }

            if (endRows.length === 0) {
              return res.status(404).json({ error: 'No valid bus route found for the given stations' });
            }

            return res.json({
              busNumber: row.bus_number,
              startTime: time,
              endTime: endRows[0].times.split(',')[0],
            });
          });
          return;
        }
      }
    }

    return res.status(404).json({ error: 'No buses available at this time' });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
