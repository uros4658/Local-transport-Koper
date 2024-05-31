import PyPDF2
import re
import csv
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

def format_table_for_csv(table):
    formatted_table = []
    for row in table:
        # Replace incorrectly split station names
        row = row.replace(",ulica,", " ulica,").replace(",K,", " K,")
        
        # Split the row by whitespace to create columns, handling special cases
        formatted_row = re.split(r'\s+', row)
        formatted_row = split_time_entries(formatted_row)
        
        # Remove large numbers that do not fit the time format
        formatted_row = [entry for entry in formatted_row if not re.match(r'^\d{3,}$', entry)]
        
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

def write_combined_tables_to_csv(odd_tables, even_tables, file_path):
    # Combine odd and even tables
    combined_tables = odd_tables + even_tables
    
    # Write combined tables to a single CSV file
    with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
        csvwriter = csv.writer(csvfile)
        for table in combined_tables:
            formatted_table = format_table_for_csv(table)
            for row in formatted_table:
                csvwriter.writerow(row)

# Directory containing the PDF files
pdf_dir = 'timetable'

# Directory to save the CSV files
output_folder = 'timetablescraped'
if not os.path.exists(output_folder):
    os.makedirs(output_folder)

# Process each PDF file in the directory
for filename in os.listdir(pdf_dir):
    if filename.endswith('.pdf'):
        pdf_path = os.path.join(pdf_dir, filename)
        odd_tables, even_tables = extract_tables_from_pdf(pdf_path)

        # Filter out any rows containing 'D' or specific sentences
        odd_tables = [filter_table(table) for table in odd_tables]
        even_tables = [filter_table(table) for table in even_tables]

        # Generate base name without extension
        base_name = os.path.splitext(filename)[0]

        # Write the combined tables to a CSV file
        write_combined_tables_to_csv(odd_tables, even_tables, os.path.join(output_folder, f'combined_tables_{base_name}.csv'))

print("Tables have been written to the timetablescraped folder.")
