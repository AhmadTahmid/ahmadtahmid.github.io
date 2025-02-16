import pandas as pd
import json

# Read the files
vacancy_df = pd.read_csv('Job vacancy rate by NACE .tsv', sep='\t')
unemployment_df = pd.read_csv('Long-term unemployment rate.tsv', sep='\t')

# Extract Italy's vacancy rate (from 2016 onwards)
italy_vacancy = vacancy_df[vacancy_df.iloc[:, 0].str.contains(',IT')].iloc[0]
vacancy_data = {}
for col in vacancy_df.columns[1:]:  # Skip the first column
    try:
        year = col.strip()
        if int(year) >= 2016:  # Only consider years from 2016 onwards
            rate = italy_vacancy[col]
            rate = rate.strip() if isinstance(rate, str) else rate
            if rate != ':' and pd.notna(rate):
                try:
                    vacancy_data[year] = float(rate)
                except (ValueError, TypeError):
                    # Handle cases where there might be annotations like 'b' or 'p'
                    vacancy_data[year] = float(rate.split()[0])
    except (ValueError, AttributeError):
        continue

print("\nVacancy Rates:")
for year in sorted(vacancy_data.keys()):
    print(f"{year}: {vacancy_data[year]:.1f}%")

# Extract Italy's unemployment rate (total, both genders)
italy_unemployment = unemployment_df[
    unemployment_df.iloc[:, 0].str.contains('A,LTU,Y15-74,PC_ACT,T,IT')
].iloc[0]

unemployment_data = {}
for col in unemployment_df.columns[1:]:  # Skip the first column
    try:
        year = col.strip()
        if int(year) >= 2016:  # Only consider years from 2016 onwards
            rate = italy_unemployment[col]
            rate = rate.strip() if isinstance(rate, str) else rate
            if rate != ':' and pd.notna(rate):
                try:
                    unemployment_data[year] = float(rate)
                except (ValueError, TypeError):
                    # Handle cases where there might be annotations like 'b' or 'p'
                    unemployment_data[year] = float(rate.split()[0])
    except (ValueError, AttributeError):
        continue

print("\nLong-term Unemployment Rates:")
for year in sorted(unemployment_data.keys()):
    print(f"{year}: {unemployment_data[year]:.1f}%")

# Create paired data points for the Beveridge curve
beveridge_data = {
    'points': [
        {
            'year': year,
            'unemployment': unemp_rate,
            'vacancy': vacancy_data[year]
        }
        for year, unemp_rate in unemployment_data.items()
        if year in vacancy_data
    ]
}

# Sort points by year
beveridge_data['points'].sort(key=lambda x: x['year'])

# Save the processed data
with open('beveridge_curve.json', 'w') as f:
    json.dump(beveridge_data, f, indent=2)

print("\nProcessed Beveridge Curve Points:")
for point in beveridge_data['points']:
    print(f"Year: {point['year']}")
    print(f"  Long-term Unemployment Rate: {point['unemployment']:.1f}%")
    print(f"  Vacancy Rate: {point['vacancy']:.1f}%") 