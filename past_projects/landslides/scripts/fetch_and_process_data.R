# Load necessary libraries
library(httr)
library(jsonlite)
library(dplyr)
library(ggplot2)
library(lubridate)

# Function to fetch data from the API
fetch_rainfall_data <- function(limit = NULL, offset = 0) {
  base_url <- "https://opendata.comune.bologna.it/api/explore/v2.1/catalog/datasets/precipitazioni_bologna/records"
  
  # Build query parameters
  query_params <- list(
    limit = ifelse(is.null(limit), 100, limit),
    offset = offset,
    timezone = "UTC"
  )
  
  # Make API request with error handling
  tryCatch({
    response <- GET(url = base_url, query = query_params)
    
    if (status_code(response) == 200) {
      data <- fromJSON(rawToChar(response$content))
      
      # Check if we have results
      if (length(data$results) == 0) {
        warning("No data returned from API, falling back to CSV data")
        return(NULL)
      }
      
      return(data$results)
    } else {
      warning(sprintf("API request failed with status code %d, falling back to CSV data", status_code(response)))
      return(NULL)
    }
  }, error = function(e) {
    warning(sprintf("API request failed with error: %s, falling back to CSV data", e$message))
    return(NULL)
  })
}

# Function to read local CSV data
read_local_data <- function() {
  csv_path <- "../data/precipitazioni_bologna.csv"
  
  if (file.exists(csv_path)) {
    data <- read.csv(csv_path, sep = ";", stringsAsFactors = FALSE)
    return(data)
  } else {
    stop("Neither API nor local CSV data is available")
  }
}

# Process the data
process_rainfall_data <- function(data) {
  if ("Data" %in% names(data)) {
    # CSV data format
    processed_data <- data %>%
      rename(
        date = Data,
        rainfall = Precipitazioni..mm.
      ) %>%
      mutate(
        date = as.Date(date),
        year = year(date),
        month = month(date),
        season = case_when(
          month %in% c(12, 1, 2) ~ "Winter",
          month %in% c(3, 4, 5) ~ "Spring",
          month %in% c(6, 7, 8) ~ "Summer",
          month %in% c(9, 10, 11) ~ "Fall"
        )
      )
  } else {
    # API data format (v2.1)
    processed_data <- data %>%
      mutate(
        date = as.Date(data),
        rainfall = precipitazioni_mm,
        year = year(date),
        month = month(date),
        season = stagione
      ) %>%
      select(date, rainfall, year, month, season)
  }
  
  return(processed_data)
}

# Function to fetch all data with pagination
fetch_all_rainfall_data <- function() {
  # First fetch to get total count
  initial_data <- fetch_rainfall_data(limit = 1)
  if (is.null(initial_data)) return(NULL)
  
  total_records <- as.numeric(initial_data$total_count)
  all_data <- list()
  offset <- 0
  limit <- 1000  # Fetch 1000 records at a time
  
  while(offset < total_records) {
    batch <- fetch_rainfall_data(limit = limit, offset = offset)
    if (!is.null(batch)) {
      all_data[[length(all_data) + 1]] <- batch
    }
    offset <- offset + limit
  }
  
  # Combine all batches
  if (length(all_data) > 0) {
    combined_data <- do.call(rbind, all_data)
    return(combined_data)
  } else {
    return(NULL)
  }
}

# Main execution
main <- function() {
  # Try API first
  raw_data <- fetch_all_rainfall_data()
  
  # If API fails, use local CSV
  if (is.null(raw_data)) {
    raw_data <- read_local_data()
  }
  
  # Process data
  processed_data <- process_rainfall_data(raw_data)
  
  # Save processed data
  saveRDS(processed_data, "data/processed_rainfall_data.rds")
  
  return(processed_data)
}

# Run main function if script is run directly
if (!interactive()) {
  main()
} 