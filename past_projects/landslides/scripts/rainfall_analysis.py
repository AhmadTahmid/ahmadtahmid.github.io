import requests
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from datetime import datetime
import numpy as np

def fetch_rainfall_data(limit=None, offset=0):
    """Fetch data from Bologna's Open Data API"""
    base_url = "https://opendata.comune.bologna.it/api/explore/v2.1/catalog/datasets/precipitazioni_bologna/records"
    
    params = {
        'limit': 100 if limit is None else limit,
        'offset': offset
    }
    
    response = requests.get(base_url, params=params)
    if response.status_code == 200:
        return response.json()['results']
    else:
        raise Exception("Failed to fetch data from API")

def fetch_all_rainfall_data():
    """Fetch all available rainfall data"""
    # First fetch to get total count
    initial_data = fetch_rainfall_data(limit=1)
    total_records = initial_data['total_count']
    
    all_data = []
    offset = 0
    limit = 1000  # Fetch 1000 records at a time
    
    while offset < total_records:
        batch = fetch_rainfall_data(limit=limit, offset=offset)
        all_data.extend(batch)
        offset += limit
    
    return pd.DataFrame(all_data)

def process_data(df):
    """Process the rainfall data"""
    df['date'] = pd.to_datetime(df['date'])
    df['year'] = df['date'].dt.year
    df['month'] = df['date'].dt.month
    df['season'] = df['stagione']
    return df

def create_annual_rainfall_plot(df):
    """Create interactive plot for annual rainfall"""
    annual_data = df.groupby('year')['Precipitazioni..mm.'].sum().reset_index()
    
    fig = px.bar(annual_data, 
                 x='year', 
                 y='Precipitazioni..mm.',
                 title='Annual Rainfall in Bologna',
                 labels={'Precipitazioni..mm.': 'Total Rainfall (mm)',
                        'year': 'Year'})
    
    fig.add_trace(
        go.Scatter(x=annual_data['year'], 
                  y=annual_data['Precipitazioni..mm.'].rolling(window=3).mean(),
                  name='3-year Moving Average',
                  line=dict(color='red'))
    )
    
    return fig

def create_seasonal_plot(df):
    """Create interactive plot for seasonal patterns"""
    seasonal_data = df.groupby('season')['Precipitazioni..mm.'].sum().reset_index()
    
    fig = px.bar(seasonal_data,
                 x='season',
                 y='Precipitazioni..mm.',
                 title='Total Rainfall by Season',
                 labels={'Precipitazioni..mm.': 'Total Rainfall (mm)',
                        'season': 'Season'},
                 color='season')
    
    return fig

def create_monthly_plot(df):
    """Create interactive plot for monthly patterns"""
    monthly_data = df.groupby('month')['Precipitazioni..mm.'].sum().reset_index()
    
    fig = px.bar(monthly_data,
                 x='month',
                 y='Precipitazioni..mm.',
                 title='Total Rainfall by Month',
                 labels={'Precipitazioni..mm.': 'Total Rainfall (mm)',
                        'month': 'Month'},
                 color='Precipitazioni..mm.',
                 color_continuous_scale='Blues')
    
    return fig

def create_outlier_plot(df):
    """Create interactive plot for outlier analysis"""
    # Calculate outliers
    Q1 = df['Precipitazioni..mm.'].quantile(0.25)
    Q3 = df['Precipitazioni..mm.'].quantile(0.75)
    IQR = Q3 - Q1
    outlier_threshold = Q3 + 1.5 * IQR
    
    df['is_outlier'] = df['Precipitazioni..mm.'] > outlier_threshold
    outlier_freq = df[df['is_outlier']].groupby('year').size().reset_index(name='count')
    
    fig = px.bar(outlier_freq,
                 x='year',
                 y='count',
                 title=f'Frequency of Extreme Rainfall Events (>{outlier_threshold:.1f}mm)',
                 labels={'count': 'Number of Extreme Events',
                        'year': 'Year'})
    
    return fig

def create_trend_analysis_plot(df):
    """Create interactive plot for trend analysis"""
    annual_stats = df.groupby('year').agg({
        'Precipitazioni..mm.': ['sum', 'mean', 'max']
    }).reset_index()
    annual_stats.columns = ['year', 'total', 'mean', 'max']
    
    fig = make_subplots(rows=3, cols=1,
                        subplot_titles=('Total Annual Rainfall',
                                      'Mean Daily Rainfall',
                                      'Maximum Daily Rainfall'))
    
    # Total rainfall trend
    fig.add_trace(
        go.Scatter(x=annual_stats['year'], y=annual_stats['total'],
                  name='Total', mode='lines+markers'),
        row=1, col=1
    )
    
    # Mean rainfall trend
    fig.add_trace(
        go.Scatter(x=annual_stats['year'], y=annual_stats['mean'],
                  name='Mean', mode='lines+markers'),
        row=2, col=1
    )
    
    # Maximum rainfall trend
    fig.add_trace(
        go.Scatter(x=annual_stats['year'], y=annual_stats['max'],
                  name='Maximum', mode='lines+markers'),
        row=3, col=1
    )
    
    fig.update_layout(height=900, title_text="Rainfall Trends Analysis")
    return fig

def save_plots_to_html():
    """Fetch data and save all plots to HTML files"""
    # Fetch and process data
    print("Fetching data from API...")
    df = fetch_all_rainfall_data()
    df = process_data(df)
    print("Data processing complete.")
    
    # Create and save plots
    plots = {
        'annual': create_annual_rainfall_plot(df),
        'seasonal': create_seasonal_plot(df),
        'monthly': create_monthly_plot(df),
        'outliers': create_outlier_plot(df),
        'trends': create_trend_analysis_plot(df)
    }
    
    # Save each plot to an HTML file
    for name, plot in plots.items():
        output_path = f'../plots/{name}_plot.html'
        plot.write_html(output_path)
        print(f"Saved {name} plot to {output_path}")

if __name__ == "__main__":
    save_plots_to_html() 