import React, { useState } from 'react';
import './Search.css';

function Search() {
  const [searchType, setSearchType] = useState('station');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [busNumber, setBusNumber] = useState('');
  const [results, setResults] = useState(null);

  const handleSearch = async () => {
    let query = '';
    if (searchType === 'station') {
      query = `line=${busNumber}.csv&station=${from}`; // Assuming busNumber is the line name
    } else {
      query = `line=${busNumber}.csv&station=${from}`; // Update this to match the correct query for bus number search
    }

    try {
      const response = await fetch(`http://localhost:3000/bus-times?${query}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error fetching bus times:', error);
      setResults({ error: 'Failed to fetch bus times' });
    }
  };

  return (
    <div className="Search">
      <h1>City Search</h1>
      <label htmlFor="city">Select City:</label>
      <select id="city">
        <option value="kopar">Kopar</option>
        <option value="anotherCity">Another City</option>
      </select>

      <label htmlFor="searchType">Way of Search:</label>
      <select
        id="searchType"
        value={searchType}
        onChange={(e) => setSearchType(e.target.value)}
      >
        <option value="station">Station</option>
        <option value="busNumber">Bus Number</option>
      </select>

      {searchType === 'station' && (
        <div>
          <label htmlFor="from">From:</label>
          <input
            type="text"
            id="from"
            name="from"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <label htmlFor="to">To:</label>
          <input
            type="text"
            id="to"
            name="to"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      )}

      {searchType === 'busNumber' && (
        <div>
          <label htmlFor="busNumber">Bus Number:</label>
          <input
            type="text"
            id="busNumber"
            name="busNumber"
            value={busNumber}
            onChange={(e) => setBusNumber(e.target.value)}
          />
        </div>
      )}

      <button onClick={handleSearch}>Search</button>
      
      {results && (
        <div className="results">
          {results.error ? (
            <p>{results.error}</p>
          ) : (
            <pre>{JSON.stringify(results, null, 2)}</pre>
          )}
        </div>
      )}

      <br />
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d89423.35140489723!2d13.642754705041511!3d45.54067421531898!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x477b5d2b02db9545%3A0x400f81c823ff350!2zNjAwMCDQmtC-0L_QsNGA!5e0!3m2!1ssr!2ssi!4v1716826955357!5m2!1ssr!2ssi"
        width="600"
        height="450"
        style={{ border: 0 }}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      ></iframe>
    </div>
  );
}

export default Search;
