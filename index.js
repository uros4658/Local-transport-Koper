const express = require('express');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const app = express();
const PORT = 3000;

// Function to read and parse CSV files
const readCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const data = [];
    const parser = fs.createReadStream(filePath).pipe(parse({
      columns: true,
      delimiter: ',',
      skip_records_with_error: true,  // Skip rows with errors
    }));

    parser.on('readable', function () {
      let record;
      while (record = parser.read()) {
        data.push(record);
      }
    });

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
  console.log('Bus schedules loaded:', Object.keys(busSchedules));
});

// Helper function to find the time for a given station
const findTimeForStation = (schedule, station, directionCheck = false) => {
  const times = [];
  let isReversed = false;

  for (const row of schedule) {
    const stationName = row.Station || row[Object.keys(row)[0]]; // Adjust based on CSV structure
    const timeEntries = Object.values(row).filter(entry => /\d{1,2}:\d{2}/.test(entry));

    if (stationName === station) {
      if (directionCheck && times.length > 0) {
        isReversed = true;
        break;
      }
      times.push(...timeEntries);
    }
  }
  return { times, isReversed };
};

app.get('/bus-times', (req, res) => {
  const { line, startStation, endStation } = req.query;

  console.log('Received query:', req.query);

  if (!line || !startStation || !endStation) {
    return res.status(400).json({ error: 'Please provide line, startStation, and endStation parameters' });
  }

  const schedule = busSchedules[line];
  if (!schedule) {
    return res.status(404).json({ error: 'Bus line not found' });
  }

  const startTimeResult = findTimeForStation(schedule, startStation, true);
  const endTimeResult = findTimeForStation(schedule, endStation);

  if (startTimeResult.isReversed) {
    return res.status(400).json({ error: 'Route is going in the wrong direction' });
  }

  if (startTimeResult.times.length === 0 || endTimeResult.times.length === 0) {
    return res.status(404).json({ error: 'Start or end station not found on the provided bus line' });
  }

  const currentTime = new Date();
  const currentHours = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const currentFormattedTime = `${currentHours}:${currentMinutes < 10 ? '0' + currentMinutes : currentMinutes}`;

  const validStartTime = startTimeResult.times.find(time => time >= currentFormattedTime);
  const validEndTime = endTimeResult.times.find(time => time > validStartTime);

  if (!validStartTime || !validEndTime) {
    return res.status(404).json({ error: 'No valid start or end times found' });
  }

  return res.json({ startTime: validStartTime, endTime: validEndTime });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
