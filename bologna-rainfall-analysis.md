# Bologna Rainfall Data Analysis

## Overview

My project consists of two main components:
1. A JavaScript frontend that fetches and visualizes data using Chart.js
2. An R Shiny application I built for interactive data exploration and advanced statistical analysis

## Data Source

I sourced my data from the Bologna Open Data API, which provides historical rainfall measurements for the city:

```javascript
// Bologna Open Data API Configuration
const API_BASE_URL = 'https://dati.comune.bologna.it/api/3/action/datastore_search';
const RESOURCE_ID = '18c27ad3-f07e-4c5c-9c55-4d9b0b2f7e5f';
```

## JavaScript Implementation

### 1. Data Fetching

I wrote this function to fetch rainfall data from Bologna's Open Data Portal using an asynchronous approach:

```javascript
async function fetchRainfallData() {
    try {
        const response = await fetch(`${API_BASE_URL}?resource_id=${RESOURCE_ID}&limit=1000`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        return data.result.records;
    } catch (error) {
        console.error('Error fetching rainfall data:', error);
        return [];
    }
}
```

### 2. Processing Monthly Medians

To understand typical rainfall distribution across the year, I created this function to calculate the median rainfall for each month:

```javascript
function processMonthlyMedians(data) {
    const monthlyData = Array(12).fill().map(() => []);
    
    data.forEach(record => {
        const date = new Date(record.data);
        const month = date.getMonth();
        const rainfall = parseFloat(record.pioggia);
        if (!isNaN(rainfall)) {
            monthlyData[month].push(rainfall);
        }
    });

    return monthlyData.map(monthRainfall => {
        const sorted = monthRainfall.sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    });
}
```

### 3. Identifying Outlier Rainfall Events

One of my key questions was whether extreme rainfall events have increased. I implemented this function to identify outliers using the IQR method:

```javascript
function processOutliers(data) {
    const yearlyOutliers = {};
    const monthlyData = Array(12).fill().map(() => []);

    // Group data by month
    data.forEach(record => {
        const date = new Date(record.data);
        const month = date.getMonth();
        const rainfall = parseFloat(record.pioggia);
        if (!isNaN(rainfall)) {
            monthlyData[month].push(rainfall);
        }
    });

    // Calculate IQR thresholds for each month
    const monthlyThresholds = monthlyData.map(values => {
        const sorted = values.sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        return q3 + (1.5 * iqr);
    });

    // Count outliers by year
    data.forEach(record => {
        const date = new Date(record.data);
        const year = date.getFullYear();
        const month = date.getMonth();
        const rainfall = parseFloat(record.pioggia);

        if (!isNaN(rainfall) && rainfall > monthlyThresholds[month]) {
            yearlyOutliers[year] = (yearlyOutliers[year] || 0) + 1;
        }
    });

    return yearlyOutliers;
}
```

### 4. Seasonal Analysis

I found it particularly important to analyze rainfall patterns by season to understand climate patterns better, so I wrote this function:

```javascript
function processSeasonalAverages(data) {
    const seasons = {
        'Winter': [11, 0, 1],    // Dec, Jan, Feb
        'Spring': [2, 3, 4],     // Mar, Apr, May
        'Summer': [5, 6, 7],     // Jun, Jul, Aug
        'Autumn': [8, 9, 10]     // Sep, Oct, Nov
    };

    const seasonalData = {
        'Winter': [],
        'Spring': [],
        'Summer': [],
        'Autumn': []
    };

    data.forEach(record => {
        const date = new Date(record.data);
        const month = date.getMonth();
        const rainfall = parseFloat(record.pioggia);

        if (!isNaN(rainfall)) {
            for (const [season, months] of Object.entries(seasons)) {
                if (months.includes(month)) {
                    seasonalData[season].push(rainfall);
                    break;
                }
            }
        }
    });

    return Object.fromEntries(
        Object.entries(seasonalData).map(([season, values]) => [
            season,
            values.length ? values.reduce((a, b) => a + b) / values.length : 0
        ])
    );
}
```

## JavaScript Visualization

In my project, I created three main visualizations using Chart.js:

1. **Monthly Median Rainfall**: Shows the typical rainfall amount for each month
2. **Extreme Rainfall Events by Year**: Helps me visualize whether unusual rainfall events have increased over time
3. **Average Seasonal Rainfall**: Allows me to compare rainfall patterns across different seasons

Here's how I initialized the charts:

```javascript
async function initializeCharts() {
    const data = await fetchRainfallData();
    if (!data.length) {
        console.error('No data available');
        return;
    }

    // Monthly Median Chart
    const monthlyMedians = processMonthlyMedians(data);
    const monthlyCtx = document.getElementById('monthlyMedianChart').getContext('2d');
    new Chart(monthlyCtx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Median Rainfall (mm)',
                data: monthlyMedians,
                backgroundColor: RAINBOW_COLORS,
                borderWidth: 1
            }]
        },
        // Chart options omitted for brevity
    });

    // Additional charts for outliers and seasonal data...
}
```

## R Shiny Implementation

To complement my JavaScript analysis, I developed an interactive R Shiny application that allows for more advanced analysis and exploration of the rainfall data. I chose R Shiny because it's a web application framework that makes it easy to build interactive web applications directly from R.

### Data Processing in R

```r
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
```

### Shiny App Implementation

```r
# Load required libraries
library(shiny)
library(dplyr)
library(ggplot2)
library(plotly)
library(lubridate)
library(shinydashboard)
library(leaflet)
library(DT)
library(scales)

# Source data processing script
source("../scripts/fetch_and_process_data.R")

# UI Definition
ui <- dashboardPage(
    dashboardHeader(title = "Bologna Rainfall Analysis"),
    
    dashboardSidebar(
        sidebarMenu(
            menuItem("Overview", tabName = "overview", icon = icon("dashboard")),
            menuItem("Seasonal Patterns", tabName = "seasonal", icon = icon("calendar")),
            menuItem("Outlier Analysis", tabName = "outliers", icon = icon("exclamation-triangle")),
            menuItem("Trend Analysis", tabName = "trends", icon = icon("chart-line")),
            menuItem("About", tabName = "about", icon = icon("info-circle"))
        ),
        
        # Common controls
        dateRangeInput("dateRange",
                      "Select Date Range:",
                      start = "2001-01-01",
                      end = Sys.Date()),
        
        checkboxGroupInput("seasons",
                          "Select Seasons:",
                          choices = c("Winter", "Spring", "Summer", "Fall"),
                          selected = c("Winter", "Spring", "Summer", "Fall")),
        
        sliderInput("threshold",
                    "Rainfall Threshold (mm):",
                    min = 0,
                    max = 100,
                    value = 50)
    ),
    
    dashboardBody(
        tabItems(
            # Overview Tab
            tabItem(tabName = "overview",
                   fluidRow(
                       box(plotlyOutput("annualPlot"), width = 12),
                       box(plotlyOutput("monthlyPlot"), width = 12)
                   ),
                   fluidRow(
                       box(title = "Summary Statistics",
                           tableOutput("summaryStats"),
                           width = 12)
                   )
            ),
            
            # Seasonal Patterns Tab
            tabItem(tabName = "seasonal",
                   fluidRow(
                       box(plotlyOutput("seasonalPlot"), width = 8),
                       box(title = "Seasonal Statistics",
                           tableOutput("seasonalStats"),
                           width = 4)
                   ),
                   fluidRow(
                       box(plotlyOutput("seasonalTrends"), width = 12)
                   )
            ),
            
            # Outliers Tab
            tabItem(tabName = "outliers",
                   fluidRow(
                       box(plotlyOutput("outliersPlot"), width = 12)
                   ),
                   fluidRow(
                       box(title = "Outlier Events",
                           DTOutput("outlierTable"),
                           width = 12)
                   )
            ),
            
            # Trends Tab
            tabItem(tabName = "trends",
                   fluidRow(
                       box(plotlyOutput("trendPlot"), width = 12),
                       box(title = "Trend Analysis",
                           verbatimTextOutput("trendStats"),
                           width = 12)
                   )
            ),
            
            # About Tab
            tabItem(tabName = "about",
                   fluidRow(
                       box(
                           title = "About this Dashboard",
                           width = 12,
                           h3("Bologna Rainfall Analysis"),
                           p("This dashboard provides an interactive visualization of rainfall patterns in Bologna, Italy.
                             The data is sourced from the Bologna Open Data Portal and includes daily precipitation measurements."),
                           h4("Features:"),
                           tags$ul(
                               tags$li("Interactive time series analysis"),
                               tags$li("Seasonal pattern exploration"),
                               tags$li("Outlier detection"),
                               tags$li("Trend analysis with statistical testing")
                           ),
                           h4("Data Source:"),
                           p("Data is provided by the Municipality of Bologna through their open data portal."),
                           tags$a(href="https://opendata.comune.bologna.it",
                                 "Bologna Open Data Portal",
                                 target="_blank")
                       )
                   )
            )
        )
    )
)

# Server logic
server <- function(input, output, session) {
    # Reactive data
    rainfall_data <- reactive({
        # Fetch and process data
        tryCatch({
            data <- main()  # Your existing data fetching function
            
            # Filter by date range
            data %>%
                filter(date >= input$dateRange[1],
                       date <= input$dateRange[2],
                       season %in% input$seasons)
        }, error = function(e) {
            showNotification(
                "Error loading data. Using sample data instead.",
                type = "warning"
            )
            return(NULL)
        })
    })
    
    # Annual Plot
    output$annualPlot <- renderPlotly({
        req(rainfall_data())
        
        annual_data <- rainfall_data() %>%
            group_by(year) %>%
            summarise(total_rainfall = sum(rainfall, na.rm = TRUE))
        
        plot_ly(annual_data,
                x = ~year,
                y = ~total_rainfall,
                type = "bar",
                marker = list(color = "#3498db")) %>%
            layout(title = "Annual Rainfall",
                   xaxis = list(title = "Year"),
                   yaxis = list(title = "Total Rainfall (mm)"))
    })
    
    # Monthly Plot
    output$monthlyPlot <- renderPlotly({
        req(rainfall_data())
        
        monthly_data <- rainfall_data() %>%
            group_by(month) %>%
            summarise(total_rainfall = sum(rainfall, na.rm = TRUE))
        
        plot_ly(monthly_data,
                x = ~month,
                y = ~total_rainfall,
                type = "bar",
                marker = list(color = ~total_rainfall,
                            colorscale = "Blues")) %>%
            layout(title = "Monthly Rainfall Distribution",
                   xaxis = list(title = "Month"),
                   yaxis = list(title = "Total Rainfall (mm)"))
    })
    
    # Seasonal Plot
    output$seasonalPlot <- renderPlotly({
        req(rainfall_data())
        
        seasonal_data <- rainfall_data() %>%
            group_by(season) %>%
            summarise(total_rainfall = sum(rainfall, na.rm = TRUE))
        
        plot_ly(seasonal_data,
                x = ~season,
                y = ~total_rainfall,
                type = "bar",
                marker = list(color = c("#3498db", "#2ecc71", "#e74c3c", "#f1c40f"))) %>%
            layout(title = "Seasonal Rainfall Distribution",
                   xaxis = list(title = "Season"),
                   yaxis = list(title = "Total Rainfall (mm)"))
    })
    
    # Outliers Plot
    output$outliersPlot <- renderPlotly({
        req(rainfall_data())
        
        # Calculate outliers
        rainfall_values <- rainfall_data()$rainfall[rainfall_data()$rainfall > 0]
        q1 <- quantile(rainfall_values, 0.25)
        q3 <- quantile(rainfall_values, 0.75)
        iqr <- q3 - q1
        outlier_threshold <- q3 + 1.5 * iqr
        
        outliers <- rainfall_data() %>%
            filter(rainfall > outlier_threshold)
        
        plot_ly(outliers,
                x = ~date,
                y = ~rainfall,
                type = "scatter",
                mode = "markers",
                marker = list(color = "#e74c3c",
                            size = 8)) %>%
            layout(title = "Rainfall Outliers",
                   xaxis = list(title = "Date"),
                   yaxis = list(title = "Rainfall (mm)"))
    })
    
    # Trend Plot
    output$trendPlot <- renderPlotly({
        req(rainfall_data())
        
        # Fit linear model
        model_data <- rainfall_data() %>%
            group_by(date) %>%
            summarise(total_rainfall = sum(rainfall, na.rm = TRUE))
        
        fit <- lm(total_rainfall ~ as.numeric(date), data = model_data)
        
        plot_ly() %>%
            add_trace(data = model_data,
                     x = ~date,
                     y = ~total_rainfall,
                     type = "scatter",
                     mode = "markers",
                     name = "Daily Rainfall",
                     marker = list(color = "#3498db",
                                 size = 4)) %>%
            add_trace(x = ~date,
                     y = ~fitted(fit),
                     type = "scatter",
                     mode = "lines",
                     name = "Trend Line",
                     line = list(color = "#e74c3c",
                               width = 2)) %>%
            layout(title = "Rainfall Trend Analysis",
                   xaxis = list(title = "Date"),
                   yaxis = list(title = "Rainfall (mm)"))
    })
    
    # Summary Statistics
    output$summaryStats <- renderTable({
        req(rainfall_data())
        
        data.frame(
            Statistic = c("Total Days", "Rainy Days", "Total Rainfall (mm)", "Mean Rainfall (mm)", "Max Rainfall (mm)"),
            Value = c(
                nrow(rainfall_data()),
                sum(rainfall_data()$rainfall > 0, na.rm = TRUE),
                sum(rainfall_data()$rainfall, na.rm = TRUE),
                mean(rainfall_data()$rainfall, na.rm = TRUE),
                max(rainfall_data()$rainfall, na.rm = TRUE)
            )
        )
    })
    
    # Seasonal Statistics
    output$seasonalStats <- renderTable({
        req(rainfall_data())
        
        rainfall_data() %>%
            group_by(season) %>%
            summarise(
                `Total Rainfall (mm)` = sum(rainfall, na.rm = TRUE),
                `Mean Rainfall (mm)` = mean(rainfall, na.rm = TRUE),
                `Max Rainfall (mm)` = max(rainfall, na.rm = TRUE)
            )
    })
    
    # Outlier Table
    output$outlierTable <- renderDT({
        req(rainfall_data())
        
        rainfall_values <- rainfall_data()$rainfall[rainfall_data()$rainfall > 0]
        q1 <- quantile(rainfall_values, 0.25)
        q3 <- quantile(rainfall_values, 0.75)
        iqr <- q3 - q1
        outlier_threshold <- q3 + 1.5 * iqr
        
        outliers <- rainfall_data() %>%
            filter(rainfall > outlier_threshold) %>%
            select(date, rainfall, season) %>%
            arrange(desc(rainfall))
        
        datatable(outliers,
                 options = list(pageLength = 10),
                 rownames = FALSE)
    })
    
    # Trend Statistics
    output$trendStats <- renderPrint({
        req(rainfall_data())
        
        model_data <- rainfall_data() %>%
            group_by(date) %>%
            summarise(total_rainfall = sum(rainfall, na.rm = TRUE))
        
        fit <- lm(total_rainfall ~ as.numeric(date), data = model_data)
        summary(fit)
    })
}

# Run the app
shinyApp(ui = ui, server = server) 
```

## Key Findings

Through my analysis, I discovered several interesting patterns:

1. Autumn is the wettest season in Bologna
2. Contrary to my initial hypothesis, extreme rainfall events don't show a clear increasing trend over time
3. I found significant monthly variation, with fall months typically receiving the most rainfall
4. My R Shiny analysis revealed potential cyclical patterns that weren't immediately apparent in the simpler visualizations 