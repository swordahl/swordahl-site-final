// CURSOR CYCLE START
(function(){
  const frames = 10;
  const hotspotX = 52; // tip X (pixel) inside cursor image
  const hotspotY = 1;  // tip Y (pixel)
  const paths = Array.from({length: frames}, (_,i)=>`assets/cursors/cursor_${i}.png`);
  let idx = 0;

  const style = document.createElement("style");
  style.id = "cursor-dynamic";
  document.head.appendChild(style);

  function applyCursor(){
    const url = paths[idx];
    style.textContent = `
      *{ cursor: url("${url}") ${hotspotX} ${hotspotY}, auto !important; }
      a,button,.play-btn,.back-btn{ cursor: url("${url}") ${hotspotX} ${hotspotY}, pointer !important; }
    `;
    idx = (idx + 1) % frames;
  }

  applyCursor();
  setInterval(applyCursor, 140); // iridescent shimmer speed
})();
// CURSOR CYCLE END



// Rune spill from cursor when hovering interactables
const RUNES = ["ᚠ","ᚢ","ᚦ","ᚨ","ᚱ","ᚲ","ᚷ","ᚹ","ᚺ","ᚾ","ᛁ","ᛃ","ᛇ","ᛈ","ᛉ","ᛋ","ᛏ","ᛒ","ᛖ","ᛗ"];
let hoverHot = false;
let lastX = 0, lastY = 0;

const spill = document.createElement("div");
spill.className = "rune-spill";
document.body.appendChild(spill);

function rand(min,max){ return Math.random()*(max-min)+min; }

function spawnRuneBurst(x,y){
  const count = 3; // faint spill
  for(let i=0;i<count;i++){
    const el = document.createElement("div");
    el.className = "rune-particle";
    el.textContent = RUNES[(Math.random()*RUNES.length)|0];
    const dx = rand(-18, 18) + "px";
    const dy = rand(-26, 8) + "px";
    const rot = rand(-25,25) + "deg";
    el.style.left = (x + rand(-2,2)) + "px";
    el.style.top  = (y + rand(-2,2)) + "px";
    el.style.setProperty("--dx", dx);
    el.style.setProperty("--dy", dy);
    el.style.setProperty("--rot", rot);
    spill.appendChild(el);
    el.addEventListener("animationend", ()=> el.remove());
  }
}

document.addEventListener("mousemove",(e)=>{
  lastX = e.clientX;
  lastY = e.clientY;
});

// Mark interactables (labels + zones)
const interactables = Array.from(document.querySelectorAll("a.label, a.zone"));

interactables.forEach(el=>{
  el.addEventListener("mouseenter", ()=> { hoverHot = true; });
  el.addEventListener("mouseleave", ()=> { hoverHot = false; });
});

// Emit faint runes while hovering
setInterval(()=>{
  if(!hoverHot) return;
  spawnRuneBurst(lastX, lastY);
}, 110);
