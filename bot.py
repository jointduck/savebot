import os
from dotenv import load_dotenv
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters
import json

load_dotenv()

BOT_TOKEN = os.getenv('BOT_TOKEN')
WEBAPP_URL = os.getenv('WEBAPP_URL', 'https://your-webapp-url.com')

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("🎥 Open Video Downloader", web_app=WebAppInfo(url=WEBAPP_URL))]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "👋 Welcome to SaveBot!\n\n"
        "📥 Click the button below to start downloading videos from:\n"
        "▫️ YouTube\n"
        "▫️ Instagram\n"
        "▫️ TikTok\n"
        "▫️ VK\n\n"
        "🚀 Fast and easy downloads in high quality!",
        reply_markup=reply_markup
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "💡 How to use SaveBot:\n\n"
        "1. Click the 'Open Video Downloader' button\n"
        "2. Paste your video URL\n"
        "3. Select quality if available\n"
        "4. Download your video!\n\n"
        "⚠️ If you encounter any issues, make sure your link is correct and the video is public."
    )

def main():
    application = Application.builder().token(BOT_TOKEN).build()
    
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()
