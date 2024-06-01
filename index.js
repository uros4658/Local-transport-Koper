const express = require('express');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const pdf = require('pdf-parse');
const app = express();
const PORT = 3000;

const DATABASE_PATH = path.join(__dirname, 'database', 'bus_schedule.db');

const db = new sqlite3.Database(DATABASE_PATH, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to database');
  }
});

const loadBusSchedules = () => {
  const directoryPath = path.join(__dirname, 'timetable');
  const files = fs.readdirSync(directoryPath);
  const pdfFiles = files.filter(file => file.endsWith('.pdf'));
  
  pdfFiles.forEach(file => {
    const filePath = path.join(directoryPath, file);
    const busNumber = path.basename(file, path.extname(file));
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error('Error reading PDF file', err);
        return;
      }
      pdf(data).then(content => {
        // Process the PDF content to extract the bus schedule
        // Assuming PDF content is in a table format, implement your logic to extract schedule
        console.log(`Loaded schedule for bus number: ${busNumber}`);
        console.log(content.text); // Use appropriate parsing
        // You can store the extracted data into the database here
      });
    });
  });
};

loadBusSchedules();

const findTimeForStation = (schedule, station, directionCheck = false) => {
  const times = [];
  let isReversed = false;

  for (const row of schedule) {
    const stationName = row.Station || row[Object.keys(row)[0]];
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
  const { startStation, endStation } = req.query;

  if (!startStation || !endStation) {
    return res.status(400).json({ error: 'Please provide startStation and endStation parameters' });
  }

  // Assuming you have loaded schedule data from PDFs to a variable `schedules`
  const schedules = []; // Replace with actual schedule data

  let result = null;
  for (const schedule of schedules) {
    const startTimeResult = findTimeForStation(schedule, startStation, true);
    const endTimeResult = findTimeForStation(schedule, endStation);

    if (!startTimeResult.isReversed && startTimeResult.times.length > 0 && endTimeResult.times.length > 0) {
      result = {
        busNumber: schedule.busNumber, // Include the bus number from the schedule
        startTime: startTimeResult.times[0],
        endTime: endTimeResult.times[0],
      };
      break;
    }
  }

  if (!result) {
    return res.status(404).json({ error: 'No valid bus route found for the given stations' });
  }

  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
