const slash = document.getElementById("slashSfx");
const player = document.getElementById("player");
const runeLayer = document.getElementById("rune-layer");

const popup = document.getElementById("trackPopup");
const popupTitle = document.getElementById("trackTitle");
const popupBar = document.getElementById("trackBar");

function notify(msg){
  console.warn(msg);
  if(popup && popupTitle){
    popupTitle.textContent = msg;
    popup.classList.add("show");
    setTimeout(()=>popup.classList.remove("show"), 3200);
  }
}

function playSlash(){
  try{
    slash.currentTime = 0;
    slash.play().catch(()=>{});
  }catch(e){}
}

/* ===========================
   TRACK SYSTEM
=========================== */

let TRACKS = [];
let featured = [];
let nowPlayingSlot = null;

async function loadTracks(){

  // Try playlist.m3u first
  try{
    const res = await fetch("assets/playlist.m3u", {cache:"no-store"});
    if(res.ok){
      const text = await res.text();
      TRACKS = parseM3U(text);
      if(TRACKS.length === 0){
        notify("Playlist loaded but empty.");
      }
      pickFeatured(7);
      return;
    }
  }catch(e){}

  // Fallback to tracks.json
  try{
    const res = await fetch("assets/tracks.json", {cache:"no-store"});
    if(!res.ok) throw new Error();
    const data = await res.json();
    TRACKS = Array.isArray(data.tracks) ? data.tracks : [];
    pickFeatured(7);
  }catch(e){
    notify("No tracks found. Add playlist.m3u or tracks.json.");
  }
}

function parseM3U(text){
  const lines = text.split(/\r?\n/);
  const out = [];
  for(const raw of lines){
    const line = raw.trim();
    if(!line || line.startsWith("#")) continue;
    let file = line.replace(/\\/g,"/");
    const idx = file.lastIndexOf("tracks/");
    if(idx !== -1){
      file = file.substring(idx);
    }else{
      const base = file.split("/").pop();
      if(!base) continue;
      file = "tracks/" + base;
    }
    const title = file.split("/").pop().replace(/\.(mp3|wav|ogg|m4a)$/i,"");
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

function pickFeatured(count=7){
  if(TRACKS.length === 0){
    featured = new Array(count).fill(null);
    return;
  }

  if(TRACKS.length >= count){
    featured = shuffle(TRACKS).slice(0,count);
  }else{
    featured = [];
    let i=0;
    while(featured.length < count){
      featured.push(TRACKS[i % TRACKS.length]);
      i++;
    }
  }

  document.querySelectorAll(".play-btn").forEach((btn,i)=>{
    const t = featured[i];
    btn.title = t?.title || `Track ${i+1}`;
  });
}

/* ===========================
   UI POPUP
=========================== */

let barTimer=null;

function showPopup(title){
  if(!popup) return;
  popupTitle.textContent = title || "Unknown";
  popup.classList.add("show");
  if(popupBar) popupBar.style.width="0%";

  if(barTimer) clearInterval(barTimer);
  barTimer = setInterval(()=>{
    if(!player.duration || player.paused) return;
    const pct = (player.currentTime / player.duration) * 100;
    popupBar.style.width = pct.toFixed(1)+"%";
  },120);
}

function hidePopup(){
  if(popup) popup.classList.remove("show");
  if(barTimer) clearInterval(barTimer);
  if(popupBar) popupBar.style.width="0%";
}

/* ===========================
   PLAYBACK
=========================== */

function clearPlayingUI(){
  document.querySelectorAll(".play-btn")
    .forEach(b=>b.classList.remove("is-playing"));
  nowPlayingSlot=null;
}

function playSlot(slot){
  const t = featured[slot];
  if(!t || !t.file){
    notify("Track not assigned.");
    return;
  }

  if(nowPlayingSlot === slot){
    if(player.paused) player.play();
    else player.pause();
    return;
  }

  player.pause();
  player.currentTime=0;

  nowPlayingSlot=slot;
  clearPlayingUI();

  const active = document.querySelector(`.play-btn[data-slot="${slot}"]`);
  if(active) active.classList.add("is-playing");

  player.src="assets/"+t.file;
  player.play().then(()=>{
    showPopup(t.title);
  }).catch(()=>{
    notify("Playback failed.");
  });
}

document.querySelectorAll(".play-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    playSlash();
    const slot=parseInt(btn.dataset.slot,10);
    playSlot(slot);
  });
});

/* ===========================
   RUNE EMITTERS
=========================== */

const emitters = [
  {x:8,y:36,color:"#7fffd4"},
  {x:52,y:42,color:"#8be9ff"},
  {x:88,y:40,color:"#a78bfa"}
];

const runeChars="ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛋᛏᛒᛖᛗᛚᛜᛞᛟᛝ";
let runeTimer=null;

function spawnRune(){
  if(!runeLayer) return;
  const e=emitters[Math.floor(Math.random()*emitters.length)];
  const span=document.createElement("span");
  span.className="rune";
  span.textContent=runeChars[Math.floor(Math.random()*runeChars.length)];

  const dx=(Math.random()*80-40);
  const dy=-(Math.random()*120+60);
  const dur=(Math.random()*900+900);

  span.style.left=e.x+"%";
  span.style.top=e.y+"%";
  span.style.setProperty("--dx",dx+"px");
  span.style.setProperty("--dy",dy+"px");
  span.style.setProperty("--dur",dur+"ms");
  span.style.color=e.color;

  runeLayer.appendChild(span);
  setTimeout(()=>span.remove(),dur+100);
}

function startRunes(){
  if(runeTimer) return;
  runeTimer=setInterval(()=>{
    spawnRune();
    if(Math.random()>0.6) spawnRune();
  },420);
}

function stopRunes(){
  if(!runeTimer) return;
  clearInterval(runeTimer);
  runeTimer=null;
}

/* ===========================
   AUDIO EVENTS
=========================== */

player.addEventListener("play",()=>{
  startRunes();
  if(nowPlayingSlot!==null){
    const t=featured[nowPlayingSlot];
    showPopup(t?.title);
  }
});

player.addEventListener("pause",()=>{
  stopRunes();
  hidePopup();
  document.querySelectorAll(".play-btn")
    .forEach(b=>b.classList.remove("is-playing"));
});

player.addEventListener("ended",()=>{
  stopRunes();
  hidePopup();
  clearPlayingUI();
});

/* ===========================
   INIT
=========================== */

loadTracks().catch(()=>{});
