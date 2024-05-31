const express = require('express');
const fs = require('fs');
const path = require('path');
const parse = require('csv-parse');

const app = express();
const PORT = 3000;

// Function to read and parse CSV files
const readCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const parser = fs.createReadStream(filePath).pipe(parse({ columns: true, delimiter: ',' }));
    const data = [];
    parser.on('data', (row) => data.push(row));
    parser.on('end', () => resolve(data));
    parser.on('error', (err) => reject(err));
  });
};

// Load all bus schedules into memory
const loadBusSchedules = async () => {
  const directoryPath = path.join(__dirname, 'timetablescraped');
  const files = fs.readdirSync(directoryPath);
  const csvFiles = files.filter(file => file.endsWith('.csv'));
  const schedules = {};

  for (const file of csvFiles) {
    const filePath = path.join(directoryPath, file);
    schedules[file] = await readCSV(filePath);
  }

  return schedules;
};

// Initialize bus schedules
let busSchedules = {};
loadBusSchedules().then((schedules) => {
  busSchedules = schedules;
});

// Endpoint to get bus times
app.get('/bus-times', (req, res) => {
  const { line, station } = req.query;

  if (!line || !station) {
    return res.status(400).json({ error: 'Please provide both line and station parameters' });
  }

  const schedule = busSchedules[line];
  if (!schedule) {
    return res.status(404).json({ error: 'Bus line not found' });
  }

  const stationSchedule = schedule.find((s) => s.Station === station);
  if (!stationSchedule) {
    return res.status(404).json({ error: 'Station not found on the provided bus line' });
  }

  return res.json(stationSchedule);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
