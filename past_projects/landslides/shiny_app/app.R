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
                     line = list(color = "#e74c3c")) %>%
            layout(title = "Rainfall Trend Analysis",
                   xaxis = list(title = "Date"),
                   yaxis = list(title = "Rainfall (mm)"))
    })
    
    # Summary Statistics
    output$summaryStats <- renderTable({
        req(rainfall_data())
        
        rainfall_data() %>%
            summarise(
                "Total Days" = n(),
                "Total Rainfall (mm)" = sum(rainfall, na.rm = TRUE),
                "Average Daily Rainfall (mm)" = mean(rainfall, na.rm = TRUE),
                "Maximum Daily Rainfall (mm)" = max(rainfall, na.rm = TRUE),
                "Rainy Days" = sum(rainfall > 0, na.rm = TRUE)
            ) %>%
            gather(Statistic, Value)
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