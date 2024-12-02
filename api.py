from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yt_dlp
from fastapi.responses import JSONResponse
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class VideoURL(BaseModel):
    url: str

def get_platform(url: str) -> str:
    if "youtube.com" in url or "youtu.be" in url:
        return "youtube"
    elif "instagram.com" in url:
        return "instagram"
    elif "tiktok.com" in url:
        return "tiktok"
    elif "vk.com" in url:
        return "vk"
    else:
        return "unknown"

@app.post("/api/get-video-info")
async def get_video_info(video: VideoURL):
    try:
        platform = get_platform(video.url)
        if platform == "unknown":
            raise HTTPException(status_code=400, detail="Unsupported platform")

        ydl_opts = {
            'format': 'best',
            'quiet': True,
            'no_warnings': True,
            'extract_flat': True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video.url, download=False)
            
            formats = []
            if 'formats' in info:
                for f in info['formats']:
                    if f.get('filesize'):
                        size_mb = round(f['filesize'] / (1024 * 1024), 2)
                    else:
                        size_mb = None
                        
                    formats.append({
                        'format_id': f.get('format_id'),
                        'ext': f.get('ext'),
                        'quality': f.get('quality', 0),
                        'filesize_mb': size_mb,
                        'resolution': f.get('resolution', 'N/A'),
                    })

            return {
                'title': info.get('title', 'Unknown Title'),
                'thumbnail': info.get('thumbnail'),
                'duration': info.get('duration'),
                'platform': platform,
                'formats': formats
            }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/download")
async def download_video(video: VideoURL):
    try:
        ydl_opts = {
            'format': 'best',
            'quiet': True,
            'no_warnings': True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video.url, download=False)
            video_url = info['url']
            return JSONResponse({
                'download_url': video_url,
                'title': info.get('title', 'video'),
                'ext': info.get('ext', 'mp4')
            })

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
