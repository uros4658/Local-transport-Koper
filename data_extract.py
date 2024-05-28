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
    # Filter out any rows containing 'D'
    return [row for row in table if 'D' not in row]

def write_combined_tables_to_csv(odd_tables, even_tables, file_path):
    # Combine odd and even tables
    combined_tables = odd_tables + even_tables
    
    # Write combined tables to a single CSV file
    with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
        csvwriter = csv.writer(csvfile)
        for table in combined_tables:
            for row in table:
                csvwriter.writerow([row])

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

        # Filter out any rows containing 'D'
        odd_tables = [filter_table(table) for table in odd_tables]
        even_tables = [filter_table(table) for table in even_tables]

        # Generate base name without extension
        base_name = os.path.splitext(filename)[0]

        # Write the combined tables to a CSV file
        write_combined_tables_to_csv(odd_tables, even_tables, os.path.join(output_folder, f'combined_tables_{base_name}.csv'))

print("Tables have been written to the timetablescraped folder.")
