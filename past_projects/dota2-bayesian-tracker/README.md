# Dota 2 Bayesian Tracker

A sophisticated player performance tracking system that combines Bayesian statistics with the OpenDota API to analyze and predict Dota 2 gameplay metrics.

## Features

- **Personal Performance Dashboard**
  - Real-time performance tracking
  - Historical trend analysis
  - Hero-specific statistics
  - Win/loss analysis
  
- **Bayesian Win Probability Estimator**
  - Hero-specific win rate modeling
  - Performance-based predictions
  - Uncertainty quantification
  - Adaptive learning from new matches

## Setup

1. **Prerequisites**
   - Python 3.8 or higher
   - OpenDota API key (optional but recommended)

2. **Installation**
   ```bash
   # Clone the repository
   git clone <repository-url>
   cd dota2-bayesian-tracker

   # Create a virtual environment (recommended)
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate

   # Install dependencies
   pip install -r requirements.txt
   ```

3. **Configuration**
   - Get your OpenDota API key from [OpenDota](https://www.opendota.com/)
   - Create a `.streamlit/secrets.toml` file:
     ```toml
     OPENDOTA_API_KEY = "your-api-key-here"
     ```

## Usage

1. **Running the Dashboard**
   ```bash
   streamlit run scripts/dashboard.py
   ```
   - Enter your Steam32 ID in the sidebar
   - View your performance metrics and predictions

2. **Using the Bayesian Model**
   ```python
   from scripts.bayesian_model import DotaBayesianModel
   
   # Initialize model
   model = DotaBayesianModel(api_key="your-api-key")
   
   # Get and prepare match data
   matches = model.get_recent_matches(account_id)
   match_data = model.prepare_match_data(matches)
   
   # Train model
   model.build_model(match_data)
   model.train()
   
   # Make predictions
   win_prob = model.predict_win_probability(hero_id=1, avg_kda=3.0, avg_gpm=500)
   ```

## Technical Details

### Dashboard Components
- Real-time data fetching from OpenDota API
- Interactive visualizations using Plotly
- Streamlit-based web interface

### Bayesian Model
- Hierarchical Bayesian model using PyMC
- Features:
  - Base win rate prior (Beta distribution)
  - Hero-specific effects
  - Performance metric effects (KDA, GPM)
- Uncertainty quantification through posterior distributions

## Data Sources

- [OpenDota API](https://docs.opendota.com/)
  - Player statistics
  - Match data
  - Hero information

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenDota for providing the API
- PyMC team for the Bayesian modeling framework
- Streamlit team for the web app framework 