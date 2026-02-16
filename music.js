
const slash = document.getElementById("slashSfx");
const player = document.getElementById("player");
const runeLayer = document.getElementById("rune-layer");

const popup = document.getElementById("trackPopup");
const popupTitle = document.getElementById("trackTitle");
const popupBar = document.getElementById("trackBar");

function notify(msg){
  console.warn(msg);
  const p = document.getElementById("trackPopup");
  const t = document.getElementById("trackTitle");
  if(p && t){
    t.textContent = msg;
    p.classList.add("show");
    setTimeout(()=>{ p.classList.remove("show"); }, 3200);
  }else{
    alert(msg);
  }
}

function playSlash(){
  try{ slash.currentTime = 0; slash.play().catch(()=>{}); }catch(e){}
}

// ===== TRACK SYSTEM =====
let TRACKS = [];
let featured = [];        // 7 tracks mapped to the 7 buttons
let nowPlayingSlot = null;

async function loadTracks(){
  // 1) Try playlist mode first (assets/playlist.m3u)
  try{
    const res = await fetch("assets/playlist.m3u", {cache:"no-store"});
    if(res.ok){
      const text = await res.text();
      TRACKS = parseM3U(text);

      const minutes = 30;
      const count = 7;

      if(TRACKS.length === 0){
        notify("Playlist loaded but no usable tracks. Ensure entries point to tracks/*.mp3");
        featured = new Array(count).fill(null);
        return;
      }

      pickFeatured(count);
      scheduleRotation(minutes, count);
      return;
    }
  }catch(err){
    // continue to fallback
  }

  // 2) Fallback: tracks.json (older mode)
  let data = null;
  try{
    const res = await fetch("assets/tracks.json", {cache:"no-store"});
    if(!res.ok) throw new Error("HTTP " + res.status);
    data = await res.json();
  }catch(err){
    notify("No playlist found. Save VLC playlist as assets/playlist.m3u (and run site via http://).");
    console.error("Failed to load playlist.m3u and tracks.json", err);
    TRACKS = [];
    featured = new Array(7).fill(null);
    return;
  }

  TRACKS = Array.isArray(data.tracks) ? data.tracks : [];
  const minutes = Math.max(1, parseInt(data.rotation_minutes ?? 30, 10));
  const count = Math.min(7, Math.max(1, parseInt(data.featured_count ?? 7, 10)));
  pickFeatured(count);
  scheduleRotation(minutes, count);
}

function parseM3U(text){
  const lines = String(text).split(/\r?\n/);
  const out = [];
  for(const raw of lines){
    const line = raw.trim();
    if(!line || line.startsWith("#")) continue;

    let file = line.replace(/\\/g, "/");

    // If it includes "tracks/" already, keep from there
    const idx = file.lastIndexOf("tracks/");
    if(idx !== -1){
      file = file.substring(idx);
    }else{
      // absolute path -> basename
      const base = file.split("/").pop();
      if(!base) continue;
      file = "tracks/" + base;
    }

    const title = file.split("/").pop().replace(/\.(mp3|wav|ogg|m4a)$/i, "");
    out.push({ title, file });
  }
  return out;
}


function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

/**
 * Always assigns a track object to all 7 buttons.
 * - If you have >= 7 tracks: pick 7 unique tracks each rotation.
 * - If you have < 7 tracks: repeats tracks (still assigned) so buttons always work.
 */
function pickFeatured(count=7){
  const safeCount = Math.max(1, Math.min(7, count));
  if(TRACKS.length === 0){
    featured = new Array(safeCount).fill(null);
    notify("No tracks found. Add entries to assets/tracks.json.");
    return;
  }

  if(TRACKS.length >= safeCount){
    featured = shuffle(TRACKS).slice(0, safeCount);
  }else{
    // repeat to fill all slots
    const shuffled = shuffle(TRACKS);
    featured = [];
    let i = 0;
    while(featured.length < safeCount){
      featured.push(shuffled[i % shuffled.length]);
      i++;
    }
  }

  // Update labels + set a tooltip so you can see what each button is assigned to
  document.querySelectorAll(".play-btn").forEach((btn, i)=>{
    const t = featured[i];
    const title = t?.title || `Track ${i+1}`;
    btn.setAttribute("aria-label", `Play ${title}`);
    btn.title = title;
  });
}

function scheduleRotation(minutes, count){
  const ms = Math.max(1, minutes) * 60 * 1000;
  setInterval(()=>{
    // do not interrupt current playback; just remap the 7 buttons
    pickFeatured(count);
  }, ms);
}

// ===== UI helpers =====
function clearPlayingUI(){
  document.querySelectorAll(".play-btn").forEach(b=>b.classList.remove("is-playing"));
  nowPlayingSlot = null;
}

let barTimer=null;
function showPopup(title){
  if(!popup) return;
  popupTitle.textContent = title || "Unknown Track";
  popup.classList.add("show");
  if(popupBar) popupBar.style.width = "0%";
  if(barTimer) clearInterval(barTimer);
  barTimer = setInterval(()=>{
    if(!player || player.paused || !player.duration || !isFinite(player.duration)) return;
    const pct = Math.max(0, Math.min(100, (player.currentTime / player.duration) * 100));
    if(popupBar) popupBar.style.width = pct.toFixed(1) + "%";
  }, 120);
}
function hidePopup(){
  if(!popup) return;
  popup.classList.remove("show");
  if(barTimer) clearInterval(barTimer);
  barTimer = null;
  if(popupBar) popupBar.style.width = "0%";
}

// ===== PLAYBACK (one track at a time) =====
function playSlot(slot){
  let t = featured[slot];
  if(!t || !t.file){
    // If rotation didn't assign for some reason, auto-assign now
    if(TRACKS.length > 0){
      pickFeatured(7);
    }
    const t2 = featured[slot];
    if(!t2 || !t2.file){
      flashButton(slot);
      notify("No track assigned. Check assets/tracks.json (title + file path).");
      return;
    }
  }

  // If clicking the same slot: toggle pause/play
  if(nowPlayingSlot === slot){
    if(player.paused) player.play().catch(()=>{});
    else player.pause();
    return;
  }

  // New slot: stop any existing, then start new
  player.pause();
  player.currentTime = 0;

  nowPlayingSlot = slot;
  document.querySelectorAll(".play-btn").forEach(b=>b.classList.remove("is-playing"));
  const activeBtn = document.querySelector(`.play-btn[data-slot="${slot}"]`);
  if(activeBtn) activeBtn.classList.add("is-playing");

  player.src = "assets/" + t.file;
  player.play().then(()=>{
    showPopup(t.title || `Track ${slot+1}`);
  }).catch(()=>{
    flashButton(slot);
  });
}

function flashButton(slot){
  const btn = document.querySelector(`.play-btn[data-slot="${slot}"]`);
  if(!btn) return;
  btn.animate([
    {transform:"translate(-50%,-50%) scale(1.0)"},
    {transform:"translate(-50%,-50%) scale(1.06)"},
    {transform:"translate(-50%,-50%) scale(1.0)"},
  ], {duration:220, easing:"ease-out"});
}

document.querySelectorAll(".play-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    playSlash();
    const slot = parseInt(btn.dataset.slot, 10);
    playSlot(slot);
  });
});

// ===== RUNE SPILL (from side characters) — only while playing =====
const emitters = [
  // LEFT GUITAR CHARACTER (circled zone)
  {x: 8, y: 36, color:"#7fffd4"},
  {x: 11, y: 48, color:"#7fffd4"},

  // CENTER CHARACTER
  {x: 52, y: 42, color:"#8be9ff"},

  // RIGHT CHARACTER
  {x: 88, y: 40, color:"#a78bfa"},
  {x: 92, y: 55, color:"#a78bfa"},
];
const runeChars = "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛋᛏᛒᛖᛗᛚᛜᛞᛟᛝ";
let runeTimer = null;

function spawnRune(){
  if(!runeLayer) return;
  const e = emitters[(Math.random()*emitters.length)|0];
  const span = document.createElement("span");
  span.className = "rune";
  span.textContent = runeChars[(Math.random()*runeChars.length)|0];

  const dx = (Math.random()*80 - 40);
  const dy = -(Math.random()*120 + 60);
  const dur = (Math.random()*900 + 900);

  span.style.left = e.x + "%";
  span.style.top  = e.y + "%";
  span.style.setProperty("--dx", dx.toFixed(1) + "px");
  span.style.setProperty("--dy", dy.toFixed(1) + "px");
  span.style.setProperty("--dur", dur.toFixed(0) + "ms");

  span.style.color = (e && e.color) ? e.color : "#8be9ff";
  span.style.textShadow = `0 0 8px ${span.style.color}, 0 0 22px ${span.style.color}`;
  runeLayer.appendChild(span);
  setTimeout(()=>span.remove(), dur + 80);
}

function startRunes(){
  if(runeTimer) return;
  runeTimer = setInterval(()=>{
  spawnRune();
  spawnRune();
  if(Math.random() > 0.6) spawnRune();
}, 420);
}

function stopRunes(){
  if(!runeTimer) return;
  clearInterval(runeTimer);
  runeTimer = null;
}

// Start/stop runes + popup strictly from audio state
player.addEventListener("play", startRunes);
player.addEventListener("pause", ()=>{ stopRunes(); hidePopup(); });
player.addEventListener("ended", ()=>{ stopRunes(); hidePopup(); clearPlayingUI(); });

// Keep active glow synced if user pauses/plays
player.addEventListener("play", ()=>{
  if(nowPlayingSlot !== null){
    const t = featured[nowPlayingSlot];
    showPopup(t?.title || `Track ${nowPlayingSlot+1}`);
  }
});
player.addEventListener("pause", ()=>{
  // remove active class but keep slot memory? We'll keep glow off when paused.
  document.querySelectorAll(".play-btn").forEach(b=>b.classList.remove("is-playing"));
});

// Kick it off
loadTracks().catch(()=>{});
