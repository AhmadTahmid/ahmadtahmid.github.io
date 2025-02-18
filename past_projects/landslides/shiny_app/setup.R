# List of required packages
packages <- c(
    "shiny",
    "shinydashboard",
    "dplyr",
    "ggplot2",
    "plotly",
    "lubridate",
    "leaflet",
    "DT",
    "scales",
    "tidyr",
    "httr",
    "jsonlite"
)

# Install missing packages
new_packages <- packages[!(packages %in% installed.packages()[,"Package"])]
if(length(new_packages)) install.packages(new_packages)

# Load all packages
lapply(packages, library, character.only = TRUE)

cat("All required packages have been installed and loaded.\n")
cat("You can now run the Shiny app by executing:\n")
cat("shiny::runApp('shiny_app')\n") 