# Load necessary libraries
library(ggplot2)

# Read the CSV file
data <- read.csv("precipitazioni_bologna.csv", sep = ";")

# Convert the 'Data' column to Date format
data$Data <- as.Date(data$Data, format = "%Y-%m-%d")

# Extract the year from the 'Data' column
data$Year <- format(data$Data, "%Y")

# Aggregate total precipitation by year
total_precipitation_by_year <- aggregate(data$Precipitazioni..mm., by=list(Year=data$Year), FUN=sum)

# Rename the columns
colnames(total_precipitation_by_year) <- c("Year", "Total_Precipitation")

# Create a bar plot using ggplot2
ggplot(total_precipitation_by_year, aes(x=Year, y=Total_Precipitation)) +
  geom_bar(stat="identity", fill="blue") +
  ggtitle("Total Precipitation by Year in Bologna") +
  xlab("Year") +
  ylab("Total Precipitation (mm)") +
  theme_minimal() +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))

ggplot(total_precipitation_by_year, aes(x=Year, y=Total_Precipitation, fill=Total_Precipitation)) +
  geom_bar(stat="identity") +
  scale_fill_gradient(low = "lightblue", high = "darkblue") +
  ggtitle("Total Precipitation by Year in Bologna") +
  xlab("Year") +
  ylab("Total Precipitation (mm)") +
  theme_minimal() +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))
# Aggregate total precipitation by season
total_precipitation_by_season <- aggregate(data$Precipitazioni..mm., by=list(Season=data$Stagione), FUN=sum)

# Rename the columns
colnames(total_precipitation_by_season) <- c("Season", "Total_Precipitation")

# Create a bar plot using ggplot2
ggplot(total_precipitation_by_season, aes(x=Season, y=Total_Precipitation, fill=Season)) +
  geom_bar(stat="identity") +
  ggtitle("Total Precipitation by Season in Bologna") +
  xlab("Season") +
  ylab("Total Precipitation (mm)") +
  theme_minimal() +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))

# Aggregate total precipitation by season
total_precipitation_by_season <- aggregate(data$Precipitazioni..mm., by=list(Season=data$Stagione), FUN=sum)

# Rename the columns
colnames(total_precipitation_by_season) <- c("Season", "Total_Precipitation")

# Display the table
print(total_precipitation_by_season)

library(dplyr)
# Aggregate total precipitation by season
total_precipitation_by_season <- aggregate(data$Precipitazioni..mm., by=list(Season=data$Stagione), FUN=sum)

# Rename the columns
colnames(total_precipitation_by_season) <- c("Season", "Total_Precipitation")

# Add a column showing the months associated with each season
total_precipitation_by_season$Months <- c("March - May", "June - August", "September - November", "December - February")

# Display the table
print(total_precipitation_by_season)

library(scales)
data$Data <- as.Date(data$Data, format = "%Y-%m-%d")

# Extract the month from the 'Data' column
data$Month <- format(data$Data, "%m")

# Aggregate total precipitation by month
total_precipitation_by_month <- aggregate(data$Precipitazioni..mm., by=list(Month=data$Month), FUN=sum)

# Rename columns
colnames(total_precipitation_by_month) <- c("Month", "Total_Precipitation")

# Create the bar plot using ggplot2 with gradient color
ggplot(total_precipitation_by_month, aes(x=Month, y=Total_Precipitation, fill=Total_Precipitation)) +
  geom_bar(stat="identity") +
  scale_fill_gradient(low = "lightblue", high = "darkblue") +
  ggtitle("Total Precipitation by Month in Bologna") +
  xlab("Month") +
  ylab("Total Precipitation (mm)") +
  theme_minimal()



# Extract the year
data$Year <- format(data$Data, "%Y")

# Calculate the median and IQR
median_rainfall <- median(data$Precipitazioni..mm.)
Q1 <- quantile(data$Precipitazioni..mm., 0.25)
Q3 <- quantile(data$Precipitazioni..mm., 0.75)
IQR <- Q3 - Q1

# Define the outlier threshold
outlier_threshold <- Q3 + 1.5 * IQR

# Mark outliers
data$Is_Outlier <- data$Precipitazioni..mm. > outlier_threshold

# Aggregate the number of outliers per year
outlier_frequency_by_year <- aggregate(Is_Outlier ~ Year, data=data, FUN=sum)

# Plot the frequency of outlier rainfall by year
ggplot(outlier_frequency_by_year, aes(x=Year, y=Is_Outlier)) +
  geom_bar(stat="identity", fill="mediumblue") +
  ggtitle("Frequency of Outlier Rainfall by Year in Bologna") +
  xlab("Year") +
  ylab("Number of Outlier Rainfall Events") +
  theme_minimal() +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))
# # no no okay so i want to do for only days we had rainfall. Whats the median and quartiles then. 
# # I have to select for the days we had rainfall 


# Convert 'Data' column to Date format
data$Data <- as.Date(data$Data, format = "%Y-%m-%d")

# Filter data for days with rainfall
rainfall_data <- data[data$Precipitazioni..mm. > 0, ]

# Calculate the median and IQR for days with rainfall
median_rainfall <- median(rainfall_data$Precipitazioni..mm.)
Q1 <- quantile(rainfall_data$Precipitazioni..mm., 0.25)
Q3 <- quantile(rainfall_data$Precipitazioni..mm., 0.75)
IQR <- Q3 - Q1

# Define the outlier threshold for days with rainfall
outlier_threshold <- Q3 + 1.5 * IQR

# Mark outliers
rainfall_data$Is_Outlier <- rainfall_data$Precipitazioni..mm. > outlier_threshold

# Aggregate the number of outliers per year
outlier_frequency_by_year <- aggregate(Is_Outlier ~ Year, data=rainfall_data, FUN=sum)

# Plot the frequency of outlier rainfall by year
ggplot(outlier_frequency_by_year, aes(x=Year, y=Is_Outlier)) +
  geom_bar(stat="identity", fill="skyblue") +
  ggtitle("Frequency of Outlier Rainfall by Year (Days with Rainfall)") +
  xlab("Year") +
  ylab("Number of Outlier Rainfall Events") +
  theme_minimal() +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))

##i mean here is the thing is there any validity to the conjecture that these days 
##there are more and more rainfall. Just 16 months ago there was another flood and storm in 
##the emilia romagna region. But does the data exhibit any anomaly in the rainfall patterns or these storms and floods just cyclical year by year?
# Extract year and filter for days with rainfall
# Load necessary libraries



# Extract the year and filter for days with rainfall
data$Year <- format(data$Data, "%Y")
rainfall_data <- data[data$Precipitazioni..mm. > 0, ]

# Ensure 'Year' is treated as a numeric variable
rainfall_data$Year <- as.numeric(as.character(rainfall_data$Year))

# 1. Total Annual Rainfall
total_annual_rainfall <- rainfall_data %>%
  group_by(Year) %>%
  summarise(Total_Precipitation = sum(Precipitazioni..mm.))

# Linear regression for total annual rainfall
lm_rainfall <- lm(Total_Precipitation ~ Year, data = total_annual_rainfall)
summary(lm_rainfall)

# 2. Outlier Frequency
median_rainfall <- median(rainfall_data$Precipitazioni..mm.)
Q1 <- quantile(rainfall_data$Precipitazioni..mm., 0.25)
Q3 <- quantile(rainfall_data$Precipitazioni..mm., 0.75)
IQR <- Q3 - Q1
outlier_threshold <- Q3 + 1.5 * IQR
rainfall_data$Is_Outlier <- rainfall_data$Precipitazioni..mm. > outlier_threshold

outlier_frequency <- rainfall_data %>%
  group_by(Year) %>%
  summarise(Outlier_Count = sum(Is_Outlier))

# Linear regression for outlier frequency
lm_outliers <- lm(Outlier_Count ~ Year, data = outlier_frequency)
summary(lm_outliers)

# 3. Rainfall Variability (Standard Deviation)
rainfall_variability <- rainfall_data %>%
  group_by(Year) %>%
  summarise(Rainfall_Variability = sd(Precipitazioni..mm.))

# Linear regression for rainfall variability
lm_variability <- lm(Rainfall_Variability ~ Year, data = rainfall_variability)
summary(lm_variability)


#The trend analysis results show the following key points:

#Total Annual Rainfall: The slope is negative, indicating a slight decreasing trend in annual rainfall, but the p-value (0.143) suggests this trend is not statistically significant.

#Outlier Frequency: There's a small negative trend in the number of outlier rainfall events per year, but the p-value (0.066) is close to significance, suggesting this could warrant further investigation.

#Rainfall Variability: The slope is slightly positive, meaning there is a very small increase in year-to-year variability, but the p-value (0.572) indicates this trend is not significant.

#These results suggest that there is no strong evidence of a significant increase in total rainfall or outlier events over the years. The observed storms may be part of normal cyclical patterns rather than a sharp upward anomaly.


# Extract the year and filter for days with rainfall
data$Year <- format(data$Data, "%Y")
rainfall_data <- data[data$Precipitazioni..mm. > 0, ]

# Ensure 'Year' is treated as a numeric variable
rainfall_data$Year <- as.numeric(as.character(rainfall_data$Year))

# 1. Total Annual Rainfall
total_annual_rainfall <- rainfall_data %>%
  group_by(Year) %>%
  summarise(Total_Precipitation = sum(Precipitazioni..mm.))

# 2. Outlier Frequency
median_rainfall <- median(rainfall_data$Precipitazioni..mm.)
Q1 <- quantile(rainfall_data$Precipitazioni..mm., 0.25)
Q3 <- quantile(rainfall_data$Precipitazioni..mm., 0.75)
IQR <- Q3 - Q1
outlier_threshold <- Q3 + 1.5 * IQR
rainfall_data$Is_Outlier <- rainfall_data$Precipitazioni..mm. > outlier_threshold

outlier_frequency <- rainfall_data %>%
  group_by(Year) %>%
  summarise(Outlier_Count = sum(Is_Outlier))

# 3. Rainfall Variability (Standard Deviation)
rainfall_variability <- rainfall_data %>%
  group_by(Year) %>%
  summarise(Rainfall_Variability = sd(Precipitazioni..mm.))

# Plot 1: Total Annual Rainfall
plot1 <- ggplot(total_annual_rainfall, aes(x=Year, y=Total_Precipitation)) +
  geom_line() +
  geom_point() +
  ggtitle("Total Annual Rainfall in Bologna") +
  xlab("Year") +
  ylab("Total Precipitation (mm)") +
  theme_minimal()

# Plot 2: Outlier Frequency
plot2 <- ggplot(outlier_frequency, aes(x=Year, y=Outlier_Count)) +
  geom_line(color="red") +
  geom_point(color="red") +
  ggtitle("Frequency of Outlier Rainfall by Year") +
  xlab("Year") +
  ylab("Number of Outliers") +
  theme_minimal()

# Plot 3: Rainfall Variability (Standard Deviation)
plot3 <- ggplot(rainfall_variability, aes(x=Year, y=Rainfall_Variability)) +
  geom_line(color="green") +
  geom_point(color="green") +
  ggtitle("Year-to-Year Variability in Rainfall (Std Dev)") +
  xlab("Year") +
  ylab("Rainfall Variability (mm)") +
  theme_minimal()

# Combine the three plots into one
library(gridExtra)
grid.arrange(plot1, plot2, plot3, ncol=1)






# Extract the year and filter for days with rainfall
data$Year <- format(data$Data, "%Y")
rainfall_data <- data[data$Precipitazioni..mm. > 0, ]

# Ensure 'Year' is treated as a numeric variable
rainfall_data$Year <- as.numeric(as.character(rainfall_data$Year))

# 1. Total Annual Rainfall
total_annual_rainfall <- rainfall_data %>%
  group_by(Year) %>%
  summarise(Total_Precipitation = sum(Precipitazioni..mm.))

# Linear regression for total annual rainfall
lm_rainfall <- lm(Total_Precipitation ~ Year, data = total_annual_rainfall)

# 2. Outlier Frequency
median_rainfall <- median(rainfall_data$Precipitazioni..mm.)
Q1 <- quantile(rainfall_data$Precipitazioni..mm., 0.25)
Q3 <- quantile(rainfall_data$Precipitazioni..mm., 0.75)
IQR <- Q3 - Q1
outlier_threshold <- Q3 + 1.5 * IQR
rainfall_data$Is_Outlier <- rainfall_data$Precipitazioni..mm. > outlier_threshold

outlier_frequency <- rainfall_data %>%
  group_by(Year) %>%
  summarise(Outlier_Count = sum(Is_Outlier))

# Linear regression for outlier frequency
lm_outliers <- lm(Outlier_Count ~ Year, data = outlier_frequency)

# 3. Rainfall Variability (Standard Deviation)
rainfall_variability <- rainfall_data %>%
  group_by(Year) %>%
  summarise(Rainfall_Variability = sd(Precipitazioni..mm.))

# Linear regression for rainfall variability
lm_variability <- lm(Rainfall_Variability ~ Year, data = rainfall_variability)

# Create a summary table of the regression results for all three models
results <- data.frame(
  Metric = c("Total Annual Rainfall", "Outlier Frequency", "Rainfall Variability"),
  Slope = c(coef(lm_rainfall)[2], coef(lm_outliers)[2], coef(lm_variability)[2]),
  P_Value = c(summary(lm_rainfall)$coefficients[2, 4], 
              summary(lm_outliers)$coefficients[2, 4], 
              summary(lm_variability)$coefficients[2, 4]),
  R_Squared = c(summary(lm_rainfall)$r.squared, 
                summary(lm_outliers)$r.squared, 
                summary(lm_variability)$r.squared)
)

# Print the regression results table
print(results)

# Optional: If you want a nicely formatted table, use the 'knitr' package
# install.packages("knitr")
# library(knitr)
# kable(results, caption = "Regression Analysis Results for Rainfall Metrics")

#1. Total Annual Rainfall
#Slope: The negative slope (e.g., 
                           −
                          ## −6.89) suggests that the total annual rainfall has slightly decreased over the years.
#P-Value: The p-value of 0.14 indicates that this trend is not statistically significant at conventional levels (e.g., p < 0.05). This means we do not have strong evidence to conclude that total annual rainfall is decreasing over time.
#R-Squared: The R-squared value of 0.09 means that only about 9% of the variance in total rainfall is explained by the year, which suggests that year-to-year changes in total rainfall are largely due to factors other than time.
#Interpretation: There's a slight decrease in total annual rainfall over the years, but the change is not statistically significant, and the model explains only a small part of the variation.


#2. Outlier Frequency (Extreme Rainfall Events)
#Slope: The negative slope (e.g., 
                           #
                          # 0.21
                          # −0.21) suggests that the number of extreme rainfall events (outliers) per year is also decreasing slightly over time.
#P-Value: The p-value of 0.07 is approaching significance but is still greater than 0.05, indicating that while there may be a trend, it’s not definitively statistically significant at the 5% level.
#R-Squared: The R-squared value of 0.14 means that 14% of the variation in the frequency of outliers is explained by the year. This suggests that other factors likely play a bigger role in determining extreme rainfall events.
#Interpretation: There appears to be a slight decrease in the frequency of extreme rainfall events, but this trend is not definitively significant. The relationship between time and the number of outliers is modest.

##3. Rainfall Variability (Standard Deviation)
#Slope: The positive slope (e.g., 
                #           0.02
                 #          0.02) suggests a slight increase in the variability (or volatility) of rainfall year-to-year, meaning that rainfall patterns might be becoming a bit more erratic.
##P-Value: The p-value of 0.57 indicates that this increase in variability is not statistically significant, and we cannot conclude that year-to-year variability is increasing based on this data.
#R-Squared: The R-squared value of 0.01 indicates that only 1% of the variability in rainfall variability is explained by the year, which suggests that other factors are more important.
#Interpretation: While there's a small increase in the variability of rainfall, this trend is not statistically significant, and the model explains very little of the overall variation.



#Overall Interpretation:
  #Total Rainfall: There’s no significant upward or downward trend in total annual rainfall, which suggests that the fluctuations in rainfall amounts may be cyclical rather than showing a clear increasing or decreasing trend.
#Extreme Events (Outliers): Although there’s a slight decline in the number of extreme rainfall events, the trend is not statistically significant. This indicates that extreme weather events might still be somewhat cyclical, without a clear decreasing or increasing pattern.
#Rainfall Variability: The variability in rainfall from year to year doesn’t show a significant trend either, meaning that while some years might experience more erratic rainfall, the overall trend doesn’t show a significant increase in volatility.
#In conclusion, based on this analysis, the storms and floods in the Emilia-Romagna region may reflect cyclical weather patterns rather than a significant increase in overall rainfall, frequency of extreme events, or year-to-year variability in rainfall. However, the data doesn’t rule out the potential for climate shifts — it just doesn’t strongly indicate one in this case.


##How does it tie down with the climate crisis I know not !!!
##https://www.youtube.com/watch?v=F1GP6qapAEo&ab_channel=BBCNews use this video for writing the article 
### sourced from https://opendata.comune.bologna.it/explore/dataset/precipitazioni_bologna/information/?disjunctive.stagione