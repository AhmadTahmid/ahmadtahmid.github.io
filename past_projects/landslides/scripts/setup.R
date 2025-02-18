# Install required packages if not already installed
required_packages <- c("shiny", "dplyr", "ggplot2", "lubridate", "gridExtra")

for (package in required_packages) {
  if (!require(package, character.only = TRUE)) {
    install.packages(package)
    library(package, character.only = TRUE)
  }
}

cat("All required packages have been installed and loaded.\n")
cat("You can now run the Shiny app by executing:\n")
cat("shiny::runApp('shiny_app')\n") 