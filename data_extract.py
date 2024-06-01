import PyPDF2
import re
import sqlite3
import os

def extract_tables_from_pdf(pdf_path):
    # Open the PDF file
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page_num in range(len(reader.pages)):
            page = reader.pages[page_num]
            text += page.extract_text()
    
    # Split the text into lines
    lines = text.split('\n')
    
    # Extract tables and store them in lists
    tables = []
    current_table = []
    for line in lines:
        if re.match(r'^\d+(\s+\d+)*$', line):
            # This is a header line with numbers
            if current_table:
                tables.append(current_table)
                current_table = []
        else:
            # Append the line to the current table
            current_table.append(line.strip())
    
    if current_table:
        tables.append(current_table)
    
    # Split tables into odd and even indexed lists of tuples
    odd_tables = []
    even_tables = []
    
    for i, table in enumerate(tables):
        if i % 2 == 0:
            even_tables.append(table)
        else:
            odd_tables.append(table)
    
    return odd_tables, even_tables

def filter_table(table):
    # Filter out any rows containing 'D' or specific sentences
    return [row for row in table if 'D' not in row and not re.match(r'.*Režim obratovanja.*', row) and not re.match(r'^\d{3,}$', row)]

def format_table_for_db(table):
    formatted_table = []
    for row in table:
        # Replace incorrectly split station names
        row = row.replace(",ulica,", " ulica,").replace(",K,", " K,")
        
        # Split the row by whitespace to create columns, handling special cases
        formatted_row = re.split(r'\s+', row)
        
        # Combine the first two strings if both are strings
        if len(formatted_row) > 1 and all(not re.match(r'^\d', entry) for entry in formatted_row[:2]):
            formatted_row[0] = formatted_row[0] + " " + formatted_row.pop(1)
        
        # Filter out entries that are purely numeric and do not contain colons
        formatted_row = [entry for entry in formatted_row if ':' in entry or not re.match(r'^\d+$', entry)]
        
        # Further split concatenated time entries
        formatted_row = split_time_entries(formatted_row)
        
        formatted_table.append(formatted_row)
    return formatted_table

def split_time_entries(row):
    # Helper function to split concatenated time entries
    new_row = []
    for entry in row:
        # Split concatenated times like 6:306:507:10 into individual entries
        new_entry = re.findall(r'\d{1,2}:\d{2}', entry)
        if new_entry:
            new_row.extend(new_entry)
        else:
            new_row.append(entry)
    return new_row

def insert_data_to_db(odd_tables, even_tables, conn):
    cursor = conn.cursor()
    
    for table in odd_tables + even_tables:
        for row in table:
            station_name = row[0]
            times = ','.join(row[1:])
            cursor.execute("""
                INSERT INTO schedules (station_name, times)
                VALUES (?, ?)
            """, (station_name, times))
    
    conn.commit()

def main():
    pdf_dir = 'timetable'  # Directory containing the PDF files
    db_path = 'database/schedules.db'  # Ensure this path exists
    
    # Create the database directory if it doesn't exist
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    # Connect to SQLite database
    conn = sqlite3.connect(db_path)
    
    # Create the schedules table if it doesn't exist
    conn.execute("""
        CREATE TABLE IF NOT EXISTS schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            station_name TEXT,
            times TEXT
        )
    """)
    
    # Iterate through all PDF files in the directory
    for filename in os.listdir(pdf_dir):
        if filename.endswith('.pdf'):
            pdf_path = os.path.join(pdf_dir, filename)
            odd_tables, even_tables = extract_tables_from_pdf(pdf_path)
            
            # Filter and format the tables for the database
            odd_tables = [format_table_for_db(filter_table(table)) for table in odd_tables]
            even_tables = [format_table_for_db(filter_table(table)) for table in even_tables]
            
            # Insert data into the database
            insert_data_to_db(odd_tables, even_tables, conn)
    
    # Close the database connection
    conn.close()

if __name__ == '__main__':
    main()
