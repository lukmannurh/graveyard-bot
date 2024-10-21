# Graveyard Bot

Graveyard Bot is a multifunctional WhatsApp bot that combines artificial intelligence, entertainment features, and group management tools into one powerful package.

## 🌟 Key Features

- **AI Integration**: Utilizes Google Generative AI (Gemini) for answering questions and analyzing images.
- **Score Prediction Game**: Interactive feature for predicting soccer match scores.
- **Text Adventures**: Immersive text-based role-playing experiences.
- **Anime Explorer**: Anime recommendations and information.
- **Downloader**: Easy download of videos and audio from various social media platforms.
- **Group Management**: Admin commands for efficient group management.
- **Sticker Creator**: Convert images to WhatsApp stickers.
- **And much more!**

## 📋 Command List

### 📱 General Commands
- `.menu` - Display list of commands
- `.start [team1] [team2] [prize]` - Start a score prediction session
- `.tebak [score]` - Predict match score (e.g., .tebak 1-0)
- `.list` - View list of participants' predictions
- `.random [num_teams] [name1] [name2] ...` - Create random teams
- `.ai [question/command]` - Interact with AI
- `.waifu [count]` - Get random waifu images (1-20 images)
- `.getpp @user` - Retrieve profile picture of tagged user
- `.stats` - Display group activity statistics
- `.jadwalsholat` - Show prayer times for WIB, WITA, and WIT
- `.s` - Convert image to sticker
- `.klasemenliga` - Display league standings (Premier League, La Liga, etc.)

### 👑 Admin Commands
- `.end` - End score prediction session
- `.tagall` - Tag all group members
- `.ban @user` - Ban user from group
- `.unban @user` - Remove user ban

### 🎮 Games
- `.cekjomok` - Check your "jomok" level
- `.adventure` - Start interactive text adventure
- `.ttc @user` - Start a Tic Tac Toe game with tagged user
- `.dadu` - Play dice game with other players

### 🌸 Anime Commands
- `.animek genres [genre_name]` - Anime recommendations by genre
- `.animek season [year] [season]` - Information on seasonal anime (spring/summer/fall/winter)
- `.animek top` - List top 10 anime
- `.animek upcoming` - List upcoming anime
- `.animek [keyword]` - Anime search

### 📥 Downloader
- `.tt [URL]` - Download TikTok video
- `.ytdl [URL]` - Download video or audio from YouTube
- `.ytmp4 [URL]` - Download video from YouTube
- `.ytmp3 [URL]` - Download audio from YouTube
- `.spotify [URL]` - Download from Spotify
- `.fbdl [URL]` - Download video from Facebook
- `.igdl [URL]` - Download video from Instagram

## 🛠 Installation

### Prerequisites
- Node.js (v16.0.0 or newer)
- npm (usually installed with Node.js)
- WhatsApp connected to a device

### Installation Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/lukmannurh/graveyard-bot.git
   cd graveyard-bot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment:
   - Copy `.env.example` to `.env`
   - Fill in the required environment variables in the `.env` file

4. Run the bot:
   ```bash
   npm start
   ```

5. Scan the QR code that appears with your WhatsApp application on your phone.

## ⚙️ Configuration

Main configuration is done through the `.env` file. Here are some important variables:

- `API_KEY`: API key for Google Generative AI
- `PREFIX`: Bot command prefix (default: '.')
- `OWNER_NUMBER`: WhatsApp number of the bot owner

## 🧩 Project Structure

```
graveyard-bot/
│
├── src/
│   ├── commands/           # Implementation of bot commands
│   ├── handlers/           # Handlers for various types of messages
│   ├── utils/              # Utility functions
│   └── config/             # Configuration files
│
├── temp/                   # Folder for temporary files
├── logs/                   # Application logs
├── .env                    # Environment variables
└── package.json            # Dependencies and npm scripts
```

## 🤝 Contributing

Contributions are greatly appreciated! If you want to contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Contact

Email: luqmannur33@gmail.com

Project Link: [https://github.com/lukmannurh/graveyard-bot](https://github.com/lukmannurh/graveyard-bot)

## 🙏 Acknowledgments

- [WhatsApp Web.js](https://github.com/pedroslopez/whatsapp-web.js/)
- [Google Generative AI](https://ai.google.dev/)
- [Anime API](https://jikan.moe/)
- And all the contributors who have helped this project!