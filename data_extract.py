import tabula

tables = tabula.read_pdf("timetable/Linija-1.pdf", pages='all')
df = tables[0] + tables[1] + tables[2]

# Initialize an empty dictionary to store the start times for each station
start_times = {}

# Iterate over the rows of the DataFrame
for index, row in df.iterrows():
    # Assuming the station name is in the index
    station_name = index

    # Drop any NaN values which might represent empty cells and convert all remaining values to a list
    station_start_times = row.dropna().tolist()

    # Add the start times to the dictionary
    start_times[station_name] = station_start_times
