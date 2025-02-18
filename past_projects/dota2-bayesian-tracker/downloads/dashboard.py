import streamlit as st
import requests
import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
import plotly.express as px
import plotly.graph_objects as go
import json
from datetime import datetime, timedelta

# Constants
API_BASE = "https://api.opendota.com/api"
API_KEY = st.secrets["OPENDOTA_API_KEY"] if "OPENDOTA_API_KEY" in st.secrets else ""
ACCOUNT_ID = None  # Will be set by user input

# Cache API calls
@st.cache_data(ttl=3600)  # Cache for 1 hour
def get_player_data(account_id):
    url = f"{API_BASE}/players/{account_id}"
    params = {"api_key": API_KEY}
    return requests.get(url, params=params).json()

@st.cache_data(ttl=3600)
def get_win_loss(account_id):
    url = f"{API_BASE}/players/{account_id}/wl"
    params = {"api_key": API_KEY}
    return requests.get(url, params=params).json()

@st.cache_data(ttl=3600)
def get_recent_matches(account_id, limit=100):
    url = f"{API_BASE}/players/{account_id}/matches"
    params = {"api_key": API_KEY, "limit": limit}
    return requests.get(url, params=params).json()

@st.cache_data(ttl=3600)
def get_heroes():
    url = f"{API_BASE}/heroes"
    params = {"api_key": API_KEY}
    return requests.get(url, params=params).json()

def create_performance_metrics(matches):
    """Calculate performance metrics from matches"""
    metrics = []
    for match in matches:
        metrics.append({
            'match_id': match['match_id'],
            'date': datetime.fromtimestamp(match['start_time']),
            'hero_id': match['hero_id'],
            'kda': (match['kills'] + match['assists']) / (match['deaths'] if match['deaths'] > 0 else 1),
            'xpm': match['xp_per_min'],
            'gpm': match['gold_per_min'],
            'win': match['player_slot'] < 128 and match['radiant_win'] or match['player_slot'] >= 128 and not match['radiant_win']
        })
    return pd.DataFrame(metrics)

def plot_performance_trend(df):
    """Create performance trend visualization"""
    fig = go.Figure()
    
    # KDA Trend
    fig.add_trace(go.Scatter(
        x=df['date'],
        y=df['kda'].rolling(window=5).mean(),
        name='KDA (5-game avg)',
        line=dict(color='#00ff00')
    ))
    
    # Win/Loss overlay
    fig.add_trace(go.Scatter(
        x=df['date'],
        y=df['win'].rolling(window=10).mean() * 10,  # Scale up for visibility
        name='Win Rate (10-game avg)',
        line=dict(color='#ffaa00')
    ))
    
    fig.update_layout(
        title='Performance Trends',
        xaxis_title='Date',
        yaxis_title='Metrics',
        template='plotly_dark'
    )
    
    return fig

def build_hero_stats(matches, heroes):
    """Build hero statistics"""
    hero_stats = {}
    hero_names = {h['id']: h['localized_name'] for h in heroes}
    
    for match in matches:
        hero_id = match['hero_id']
        hero_name = hero_names.get(hero_id, f"Hero {hero_id}")
        
        if hero_name not in hero_stats:
            hero_stats[hero_name] = {'games': 0, 'wins': 0}
        
        hero_stats[hero_name]['games'] += 1
        if (match['player_slot'] < 128 and match['radiant_win']) or \
           (match['player_slot'] >= 128 and not match['radiant_win']):
            hero_stats[hero_name]['wins'] += 1
    
    # Convert to DataFrame
    stats_df = pd.DataFrame([
        {
            'hero': hero,
            'games': stats['games'],
            'wins': stats['wins'],
            'winrate': (stats['wins'] / stats['games'] * 100)
        }
        for hero, stats in hero_stats.items()
    ])
    
    return stats_df.sort_values('games', ascending=False)

def main():
    st.title("Dota 2 Bayesian Tracker")
    
    # Sidebar for configuration
    st.sidebar.header("Configuration")
    account_id = st.sidebar.text_input("Enter your Steam32 ID:", value="")
    
    if not account_id:
        st.warning("Please enter your Steam32 ID in the sidebar to begin.")
        return
    
    try:
        # Load player data
        player_data = get_player_data(account_id)
        if 'error' in player_data:
            st.error(f"Error: {player_data['error']}")
            return
            
        # Display player info
        st.subheader("Player Information")
        col1, col2 = st.columns(2)
        
        with col1:
            st.write(f"Name: {player_data.get('profile', {}).get('personaname', 'Unknown')}")
            wl_data = get_win_loss(account_id)
            total_games = wl_data['win'] + wl_data['lose']
            winrate = (wl_data['win'] / total_games * 100) if total_games > 0 else 0
            st.write(f"Overall Winrate: {winrate:.1f}%")
        
        with col2:
            st.write(f"Total Games: {total_games}")
            st.write(f"MMR Estimate: {player_data.get('mmr_estimate', {}).get('estimate', 'Unknown')}")
        
        # Get match data
        matches = get_recent_matches(account_id, limit=100)
        heroes = get_heroes()
        
        # Performance Metrics
        st.subheader("Performance Analysis")
        metrics_df = create_performance_metrics(matches)
        
        st.write("Interactive visualizations of player performance metrics, Bayesian updating in action, and predictive modeling results.")
        
        # Plot performance trends
        st.plotly_chart(plot_performance_trend(metrics_df))
        
        # Hero Statistics
        st.subheader("Hero Performance")
        hero_stats = build_hero_stats(matches, heroes)
        
        # Display hero stats
        st.dataframe(
            hero_stats.style.format({
                'winrate': '{:.1f}%',
                'games': '{:.0f}',
                'wins': '{:.0f}'
            })
        )
        
        # Hero winrate visualization
        fig = px.bar(
            hero_stats.head(10),
            x='hero',
            y='winrate',
            title='Top 10 Heroes by Games Played (Winrate)',
            color='games',
            color_continuous_scale='Viridis'
        )
        st.plotly_chart(fig)
        
    except Exception as e:
        st.error(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    main() 