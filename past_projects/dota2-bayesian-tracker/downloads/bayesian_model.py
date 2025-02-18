import numpy as np
import pandas as pd
import pymc as pm
import arviz as az
from datetime import datetime
import requests

class DotaBayesianModel:
    def __init__(self, api_key=None):
        self.api_key = api_key
        self.api_base = "https://api.opendota.com/api"
        self.hero_data = None
        self.model = None
        self.trace = None
        
    def get_hero_data(self):
        """Fetch hero data from OpenDota API"""
        url = f"{self.api_base}/heroes"
        params = {"api_key": self.api_key} if self.api_key else {}
        response = requests.get(url, params=params)
        self.hero_data = {h['id']: h['localized_name'] for h in response.json()}
        return self.hero_data
    
    def prepare_match_data(self, matches):
        """Prepare match data for Bayesian analysis"""
        if not self.hero_data:
            self.get_hero_data()
            
        match_data = []
        for match in matches:
            # Basic match info
            match_info = {
                'match_id': match['match_id'],
                'hero_id': match['hero_id'],
                'player_slot': match['player_slot'],
                'radiant_win': match['radiant_win'],
                'duration': match['duration'],
                'start_time': datetime.fromtimestamp(match['start_time']),
                'player_won': (match['player_slot'] < 128 and match['radiant_win']) or 
                             (match['player_slot'] >= 128 and not match['radiant_win'])
            }
            
            # Performance metrics
            match_info.update({
                'kills': match['kills'],
                'deaths': match['deaths'],
                'assists': match['assists'],
                'kda': (match['kills'] + match['assists']) / (match['deaths'] if match['deaths'] > 0 else 1),
                'gpm': match['gold_per_min'],
                'xpm': match['xp_per_min']
            })
            
            match_data.append(match_info)
            
        return pd.DataFrame(match_data)
    
    def build_model(self, match_data):
        """Build Bayesian model for win probability prediction"""
        with pm.Model() as self.model:
            # Prior for base win rate
            base_winrate = pm.Beta('base_winrate', alpha=5, beta=5)
            
            # Hero-specific effects
            hero_effects = pm.Normal('hero_effects', 
                                   mu=0, 
                                   sigma=0.5, 
                                   shape=len(self.hero_data))
            
            # Performance metrics effect
            kda_effect = pm.Normal('kda_effect', mu=0, sigma=1)
            gpm_effect = pm.Normal('gpm_effect', mu=0, sigma=1)
            
            # Standardize continuous variables
            kda_std = (match_data['kda'] - match_data['kda'].mean()) / match_data['kda'].std()
            gpm_std = (match_data['gpm'] - match_data['gpm'].mean()) / match_data['gpm'].std()
            
            # Linear combination for logit probability
            logit_p = pm.math.logit(base_winrate) + \
                     hero_effects[match_data['hero_id'].astype(int)] + \
                     kda_effect * kda_std + \
                     gpm_effect * gpm_std
            
            # Convert to probability
            win_prob = pm.math.invlogit(logit_p)
            
            # Likelihood
            observed = pm.Bernoulli('observed', 
                                  p=win_prob, 
                                  observed=match_data['player_won'])
    
    def train(self, n_samples=2000):
        """Train the Bayesian model"""
        if self.model is None:
            raise ValueError("Model not built. Call build_model first.")
            
        with self.model:
            self.trace = pm.sample(n_samples, 
                                 return_inferencedata=True,
                                 tune=1000)
        
        return self.trace
    
    def predict_win_probability(self, hero_id, avg_kda=None, avg_gpm=None):
        """Predict win probability for a given hero and performance metrics"""
        if self.trace is None:
            raise ValueError("Model not trained. Call train first.")
            
        # Get posterior means
        posterior = az.summary(self.trace)
        base_winrate = posterior.loc['base_winrate', 'mean']
        hero_effect = posterior.loc[f'hero_effects[{hero_id}]', 'mean']
        kda_effect = posterior.loc['kda_effect', 'mean']
        gpm_effect = posterior.loc['gpm_effect', 'mean']
        
        # Calculate logit probability
        logit_p = np.log(base_winrate / (1 - base_winrate)) + hero_effect
        
        if avg_kda is not None:
            logit_p += kda_effect * avg_kda
        if avg_gpm is not None:
            logit_p += gpm_effect * avg_gpm
            
        # Convert to probability
        win_prob = 1 / (1 + np.exp(-logit_p))
        
        return win_prob
    
    def get_hero_effects(self):
        """Get the learned hero effects from the model"""
        if self.trace is None:
            raise ValueError("Model not trained. Call train first.")
            
        posterior = az.summary(self.trace)
        hero_effects = {}
        
        for hero_id, hero_name in self.hero_data.items():
            try:
                effect = posterior.loc[f'hero_effects[{hero_id}]', 'mean']
                hero_effects[hero_name] = effect
            except KeyError:
                continue
                
        return pd.Series(hero_effects).sort_values(ascending=False)

def main():
    """Example usage of the DotaBayesianModel"""
    # Initialize model
    model = DotaBayesianModel(api_key="YOUR_API_KEY")
    
    # Get match data (you would need to implement this)
    matches = []  # Your match data here
    
    # Prepare data
    match_data = model.prepare_match_data(matches)
    
    # Build and train model
    model.build_model(match_data)
    trace = model.train()
    
    # Get hero effects
    hero_effects = model.get_hero_effects()
    print("\nHero Effects (top 5):")
    print(hero_effects.head())
    
    # Example prediction
    hero_id = 1  # Example hero ID
    win_prob = model.predict_win_probability(hero_id, avg_kda=3.0, avg_gpm=500)
    print(f"\nPredicted win probability for hero {hero_id}: {win_prob:.2%}")

if __name__ == "__main__":
    main() 