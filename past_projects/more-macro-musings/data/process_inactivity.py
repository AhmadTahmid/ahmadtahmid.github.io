import pandas as pd
import json

# Read the TSV file
df = pd.read_csv('eurostat_inactivity_rates.tsv', sep='\t')

# Get the first column name (which contains the codes)
code_column = df.columns[0]

# Get the time periods (quarters) from column names, excluding the first column
quarters = [col for col in df.columns[1:] if 'Q' in col]

# Create a clean dataset
processed_data = {
    'timePoints': quarters,
    'series': {
        'total': {},
        'male': {},
        'female': {}
    }
}

# Helper function to parse the code
def parse_code(code):
    parts = code.split(',')
    if len(parts) >= 5:
        freq, unit, gender, age, country = parts
        # Remove 'Y' prefix from age group
        age = age.replace('Y', '') if age.startswith('Y') else age
        return {
            'gender': gender,
            'age': age,
            'country': country
        }
    return None

# First pass: collect female and total values
temp_data = {
    'total': {},
    'female': {}
}

# Process each row to collect female and total values
for _, row in df.iterrows():
    code = str(row[code_column]).strip()
    code_info = parse_code(code)
    
    if code_info and code_info['country'] == 'IT':
        gender = code_info['gender']
        age_group = code_info['age']
        
        if gender in ['T', 'F']:  # Only process Total and Female data
            gender_key = 'total' if gender == 'T' else 'female'
            if age_group not in temp_data[gender_key]:
                temp_data[gender_key][age_group] = []
            
            # Convert inactivity rates to participation rates (100 - inactivity)
            values = []
            for q in quarters:
                try:
                    val = row[q]
                    if pd.notna(val) and str(val).strip() != ':':
                        values.append(100 - float(val))
                    else:
                        values.append(None)
                except (ValueError, TypeError):
                    values.append(None)
            
            temp_data[gender_key][age_group] = values

# Second pass: calculate male values and store all data
for age_group in temp_data['total'].keys():
    if age_group in temp_data['female']:
        total_values = temp_data['total'][age_group]
        female_values = temp_data['female'][age_group]
        
        # Calculate male values only if we have both total and female
        male_values = []
        for t, f in zip(total_values, female_values):
            if t is not None and f is not None:
                # Calculate male value using the weighted formula
                # If total is 100% and female is 60%, then male must be 140% to average to 100%
                male_value = 2 * t - f  # This gives us the male value that averages with female to total
                male_values.append(male_value)
            else:
                male_values.append(None)
        
        # Store all values
        processed_data['series']['total'][age_group] = total_values
        processed_data['series']['female'][age_group] = female_values
        processed_data['series']['male'][age_group] = male_values

# Save the processed data
with open('processed_inactivity.json', 'w') as f:
    json.dump(processed_data, f, indent=2)

print(f"Time range: {quarters[0]} to {quarters[-1]}")
print("\nProcessed series:")
for gender, age_groups in processed_data['series'].items():
    if age_groups:
        print(f"\n{gender.title()}:")
        for age_group, values in age_groups.items():
            valid_values = [v for v in values if v is not None]
            print(f"  - {age_group}: {len(valid_values)} valid data points")
print("\nData processing complete. Check processed_inactivity.json for results.") 