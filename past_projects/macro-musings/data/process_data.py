import pandas as pd
import json

# Read the Excel file
excel_file = 'Tavole_misure_di_produttivita_Rel24b-Diffusione.xlsx'
df = pd.read_excel(excel_file, sheet_name='TAVOLA 2')

# Clean and process the data
# Skip the header rows and reset index
df = df.iloc[4:].reset_index(drop=True)

# Get Italian productivity data (last column)
italy_data = df[df.columns[-1]].dropna()

# Create year ranges from the data
year_ranges = df[df.columns[1]].dropna()

# Create a dictionary for the chart data
chart_data = {
    "labels": year_ranges.tolist(),
    "datasets": [{
        "label": "Labor Productivity Growth Rate (%)",
        "data": italy_data.tolist(),
        "borderColor": 'rgba(255, 255, 255, 0.8)',
        "backgroundColor": 'rgba(255, 255, 255, 0.1)',
        "borderWidth": 2,
        "fill": True,
        "tension": 0.4
    }]
}

# Save the processed data as JSON
with open('productivity_data.json', 'w') as f:
    json.dump(chart_data, f, indent=2)

print("Processed data:")
print(json.dumps(chart_data, indent=2)) 