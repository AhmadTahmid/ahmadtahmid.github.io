import pandas as pd
import json

# Read the Excel file, skipping the metadata rows
df = pd.read_excel('eurostat_real_income_2013_2015.xlsx', skiprows=8)

# Extract Italy's data
italy_data = df[df['GEO (Labels)'] == 'Italy'].iloc[0]

# Create time series data for Italy
years = [str(year) for year in range(2015, 2025)]
values = [italy_data[str(year)] for year in range(2015, 2025)]

# Create JSON data for the visualization
income_data = {
    "labels": years,
    "datasets": [{
        "label": "Italian Real Income Index (2010=100)",
        "data": values,
        "borderColor": 'rgba(255, 99, 132, 0.8)',
        "backgroundColor": 'rgba(255, 99, 132, 0.1)',
        "borderWidth": 2,
        "fill": True,
        "tension": 0.4
    }]
}

# Save the processed data
with open('real_income_data.json', 'w') as f:
    json.dump(income_data, f, indent=2)

print("\nProcessed data:")
print(json.dumps(income_data, indent=2))

# Create a data preview
with open('income_data_preview.txt', 'w', encoding='utf-8') as f:
    f.write("Data Information:\n")
    f.write("\nBase year: 2010 (Index=100)")
    f.write("\nTime frequency: Annual")
    f.write("\nUnit of measure: Index")
    f.write("\n\nItaly's Real Income Values:\n")
    for year, value in zip(years, values):
        f.write(f"{year}: {value}\n") 