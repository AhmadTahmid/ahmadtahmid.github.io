# Bologna Rainfall Analysis Scripts

This directory contains R scripts for analyzing rainfall patterns in Bologna, using data from the Bologna Open Data portal.

## Data Source
- Dataset: [Precipitazioni Bologna](https://opendata.comune.bologna.it/explore/dataset/precipitazioni_bologna/information/?disjunctive.stagione)
- API Endpoint: `https://opendata.comune.bologna.it/api/explore/v2.1/catalog/datasets/precipitazioni_bologna/records?limit=20`

## Directory Structure
```
landslides/
├── scripts/        # R analysis scripts
├── data/          # Raw and processed data
└── shiny_app/     # R Shiny application files
```

## Scripts
Place your R scripts in this directory. Each script should be documented with:
- Purpose of the analysis
- Required packages
- Data preprocessing steps
- Key findings

## Data Usage
The data is sourced from Bologna's Open Data portal. When using the API:
1. Adjust the `limit` parameter in the API URL based on your needs
2. Consider adding parameters for date ranges or specific seasons
3. The API returns JSON data that needs to be processed in R

## Getting Started
1. Place your existing R analysis scripts in this directory
2. Update this README with descriptions of each script
3. Document any dependencies or special setup requirements 