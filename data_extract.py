import PyPDF2
import re
import sqlite3
import os

def extract_tables_from_pdf(pdf_path):
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page_num in range(len(reader.pages)):
            page = reader.pages[page_num]
            text += page.extract_text()
    
    lines = text.split('\n')
    tables = []
    current_table = []
    for line in lines:
        if re.match(r'^\d+(\s+\d+)*$', line):
            if current_table:
                tables.append(current_table)
                current_table = []
        else:
            current_table.append(line.strip())
    
    if current_table:
        tables.append(current_table)
    
    odd_tables = []
    even_tables = []
    for i, table in enumerate(tables):
        if i % 2 == 0:
            even_tables.append(table)
        else:
            odd_tables.append(table)
    
    return odd_tables, even_tables

def filter_table(table):
    return [row for row in table if 'D' not in row and not re.match(r'.*Režim obratovanja.*', row) and not re.match(r'^\d{3,}$', row)]

def format_table_for_db(table):
    formatted_table = []
    for row in table:
        row = row.replace(",ulica,", " ulica,").replace(",K,", " K,")
        formatted_row = re.split(r'\s+', row)
        if len(formatted_row) > 1 and all(not re.match(r'^\d', entry) for entry in formatted_row[:2]):
            formatted_row[0] = formatted_row[0] + " " + formatted_row.pop(1)
        
        formatted_row = [entry for entry in formatted_row if ':' in entry or not re.match(r'^\d+$', entry)]
        formatted_row = split_time_entries(formatted_row)
        formatted_table.append(formatted_row)
    return formatted_table

def split_time_entries(row):
    new_row = []
    for entry in row:
        new_entry = re.findall(r'\d{1,2}:\d{2}', entry)
        if new_entry:
            new_row.extend(new_entry)
        else:
            new_row.append(entry)
    return new_row

def insert_data_to_db(tables, bus_number, conn):
    cursor = conn.cursor()
    for table in tables:
        for row in table:
            station_name = row[0]
            times = [time if time else '99' for time in row[1:]]
            times_str = ','.join(times)
            cursor.execute("""
                INSERT INTO schedules (bus_number, station_name, times)
                VALUES (?, ?, ?)
            """, (bus_number, station_name, times_str))
    conn.commit()

def main():
    pdf_dir = 'timetable'
    db_path = 'database/schedules.db'
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    conn = sqlite3.connect(db_path)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bus_number TEXT,
            station_name TEXT,
            times TEXT
        )
    """)
    
    for filename in os.listdir(pdf_dir):
        if filename.endswith('.pdf'):
            bus_number = re.sub(r'Linija[-_]', '', os.path.splitext(filename)[0])
            pdf_path = os.path.join(pdf_dir, filename)
            odd_tables, even_tables = extract_tables_from_pdf(pdf_path)
            
            odd_tables = [format_table_for_db(filter_table(table)) for table in odd_tables]
            even_tables = [format_table_for_db(filter_table(table)) for table in even_tables]
            
            insert_data_to_db(odd_tables + even_tables, bus_number, conn)
    
    conn.close()

if __name__ == '__main__':
    main()
