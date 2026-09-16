# Safe Patient Journey Game

🏥 **World Patient Safety Day 2026** - Interactive Educational Game

## Overview
An interactive web-based game designed to educate healthcare professionals about patient safety protocols across different hospital departments. Players guide a patient through various hospital stations, making safety-conscious decisions at each step.

## Features
- 🌍 **Bilingual Support**: Arabic and English language options
- 🎮 **Interactive Gameplay**: 11 hospital stations with safety scenarios
- 📊 **Real-time Scoring**: Track safety score and patient trust metrics
- 👥 **Player Profile**: Register with your role
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices
- ✨ **Smooth Animations**: Engaging visual feedback and transitions

## Project Structure
```
Patient-Safety-Day-Game/
├── index.html          # Main game HTML file
├── host.html           # Live scoreboard (host/big-screen) view
├── css/
│   ├── style.css       # Main stylesheet
│   └── host.css         # Host/scoreboard-specific styles
├── js/
│   ├── game.js          # Game logic and functionality
│   ├── firebase-config.js  # Firebase project config + init
│   └── host.js           # Live scoreboard rendering logic
└── README.md           # This file
```

## Hospital Stations
1. **Reception** 🏁 - Patient check-in procedures
2. **Outpatient Clinic** ⚕️ - Medical history assessment
3. **Laboratory** 🧪 - Sample handling protocols
4. **Radiology** 🩻 - Imaging safety procedures
5. **Pharmacy** 💊 - Drug interaction checks
6. **Admission** 📝 - Documentation and consent
7. **Ward** 🛏️ - Patient monitoring and care
8. **Nutrition** 🍽️ - Dietary restrictions management
9. **Housekeeping** 🧹 - Infection prevention
10. **Maintenance** 🔧 - Equipment safety
11. **Discharge** 🏠 - Follow-up care planning

## How to Play
1. **Welcome Screen**: Choose your language (Arabic/English)
2. **Registration**: Select your role
3. **Game**: Answer safety questions at each station
4. **Scoring**: 
   - Correct answers: +1 point, safety maintained
   - Incorrect answers: -10 safety/trust points
5. **Results**: View your final score and performance summary

## Installation
1. Clone the repository
   ```bash
   git clone https://github.com/liaAshraf-Alameda/Patient-Safety-Day-Game.git
   ```
2. Open `index.html` in a web browser
3. No server or dependencies required!

## Technologies Used
- **HTML5**: Semantic markup
- **CSS3**: Responsive design with animations
- **Vanilla JavaScript**: Pure JS, no frameworks
- **LocalStorage**: Player data persistence
- **Firebase Realtime Database**: Live score sync for the host scoreboard

## Browser Compatibility
- Chrome/Edge 88+
- Firefox 87+
- Safari 14+
- Mobile browsers

## Game Mechanics
- **Safety Score**: Decreases (-10) with wrong answers
- **Trust Score**: Decreases (-10) with wrong answers
- **Progress**: Visual station map showing completed/current/upcoming stations
- **Feedback**: Immediate response indicating correct/incorrect answers

## Development Notes
- Fully responsive CSS grid layout
- RTL support for Arabic language
- Clean, modular JavaScript with JSDoc comments
- Easy to extend with new stations or questions

## Live Host Scoreboard
Open `host.html` on a projector or shared screen during the event to show a live, auto-updating leaderboard of everyone currently playing (role, current station, safety/trust scores, and status). Each player's browser session pushes its progress to a Firebase Realtime Database as they play (see `js/firebase-config.js`), and `host.html`/`js/host.js` subscribe to it live — no manual refresh needed. A "📺 Open live host screen" link is available on the welcome screen.

### Securing the database
`database.rules.json` (deployed via `firebase.json`) restricts reads/writes to only the `players` path (used by the live scoreboard) and validates the shape of each write; every other path is locked down. Apply these rules with either method:
- **Firebase Console**: open your project → Build → Realtime Database → Rules tab → paste the contents of `database.rules.json` → Publish.
- **Firebase CLI**: `npm install -g firebase-tools`, then `firebase login`, then from this folder run `firebase deploy --only database` (using project `patient-safety-day-game`).

Note: since the game has no user accounts, any visitor with the site's Firebase config can still write to the `players` path (this is required for the no-login live scoreboard to work). The rules only prevent access to unrelated database paths and malformed payloads — they don't add per-player authentication.

## Future Enhancements
- Multiple difficulty levels
- Timed challenges
- More hospital departments
- Audio/video content
- Certificate generation

## Contributing
Feel free to submit issues and enhancement requests!

## License
This project is open source and available for educational use.

---
**Made for World Patient Safety Day 2026** 🏥💙
