# The Economist's Skill Tree 🎮📊

An interactive, gamified skill tree visualization for economics students to explore career paths and required skills.

## Features

- **5 Career Paths**: Tech Economist, Central Banker, Academic, Development Economist, Quant/Finance
- **25+ Skills**: Mapped across Core, Toolbelt, and Specialization layers
- **Interactive Visualization**: D3.js force-directed graph with:
  - Click career → path highlights
  - Hover for skill descriptions
  - Drag nodes to rearrange
  - Zoom and pan

## Usage

1. Open `index.html` in a browser (requires a local server for JSON loading)
2. Click any career button to see its required skill path
3. Hover over nodes to see descriptions
4. Drag nodes to explore the graph

## Running Locally

```bash
# Option 1: npx
npx serve .

# Option 2: Python
python -m http.server 8000
```

Then open http://localhost:5000 (or 8000 for Python)

## Data Structure

Edit `skills.json` to add:
- New skills (with layer, description)
- New career paths (with prerequisites, required, bonus, useless skills)

## License

MIT
