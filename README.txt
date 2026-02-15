SWORD AHL SITE — PLAYLIST MODE (NO JSON EDITING)

You only do 2 things:
1) Put MP3s in: assets/tracks/
2) Save a VLC playlist as: assets/playlist.m3u

The site will:
- Always assign 7 tracks to the 7 play buttons
- Shuffle the 7 assignments every 30 minutes
- Only one track plays at a time
- Shows track name popup while playing
- Rune particles emit while playing, stop when paused/ended

IMPORTANT: Run the site via http:// (not file://)
Python:
  python3 -m http.server 8000
  then open http://localhost:8000

Playlist notes:
- Best if playlist uses RELATIVE paths like: tracks/MySong.mp3
- If VLC saved absolute paths (e.g. /Users/.../MySong.mp3), this build maps by filename
  into assets/tracks/MySong.mp3
