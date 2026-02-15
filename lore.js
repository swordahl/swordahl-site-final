// Lore Book (public viewer)
// Pages are authored via /admin into content/lore/pages.json

const state = {
  pages: [],
  leftIdx: 0,
  rightIdx: 1,
  turnSfx: new Audio("assets/sfx/page-turn-8bit.mp3"),
};

const elLeft = document.querySelector(".lore-left");
const elRight = document.querySelector(".lore-right");
const elPg = document.querySelector(".lore-pg");
const btnPrev = document.querySelector(".lore-prev");
const btnNext = document.querySelector(".lore-next");

const modal = document.getElementById("loreModal");
const modalBody = document.getElementById("loreModalBody");

function safeText(t){
  return (t ?? "").toString();
}

function normalizePages(raw){
  const arr = Array.isArray(raw?.pages) ? raw.pages : [];
  arr.sort((a,b)=> (Number(a.pg||0) - Number(b.pg||0)));
  return arr.map((p,i)=> ({
    pg: Number(p.pg || (i+1)),
    blocks: Array.isArray(p.blocks) ? p.blocks : []
  }));
}

function ensurePageExists(targetIdx){
  while(state.pages.length <= targetIdx){
    const pg = state.pages.length + 1;
    state.pages.push({ pg, blocks: [] });
  }
}

function renderLeft(){
  ensurePageExists(state.leftIdx);
  const page = state.pages[state.leftIdx];

  elLeft.innerHTML = "";
  elPg.textContent = "PG " + page.pg;

  const blocks = page.blocks || [];
  for(const b of blocks){
    if((b.side || "left") === "left"){
      elLeft.appendChild(renderBlock(b));
    }
  }

  if(!elLeft.children.length) elLeft.appendChild(placeholder());
}

function renderRight(){
  ensurePageExists(state.rightIdx);
  const page = state.pages[state.rightIdx];

  elRight.innerHTML = "";

  const blocks = page.blocks || [];
  for(const b of blocks){
    if((b.side || "left") === "right"){
      elRight.appendChild(renderBlock(b));
    }
  }

  if(!elRight.children.length) elRight.appendChild(placeholder());
}

function placeholder(){
  const d = document.createElement("div");
  d.className = "lore-block lore-placeholder";
  d.textContent = "";
  return d;
}

function renderBlock(b){
  const type = (b.type || "text").toString();
  const wrap = document.createElement("div");
  wrap.className = "lore-block lore-" + type;

  if(type === "text"){
    const p = document.createElement("div");
    p.className = "lore-text";
    p.textContent = safeText(b.text);
    wrap.appendChild(p);

    if(b.caption){
      const c = document.createElement("div");
      c.className = "lore-caption";
      c.textContent = safeText(b.caption);
      wrap.appendChild(c);
    }

    return wrap;
  }

  if(type === "image"){
    const img = document.createElement("img");
    img.className = "lore-thumb";
    img.loading = "lazy";
    img.alt = safeText(b.caption || "Image");
    img.src = safeText(b.src);
    wrap.appendChild(img);

    if(b.caption){
      const c = document.createElement("div");
      c.className = "lore-caption";
      c.textContent = safeText(b.caption);
      wrap.appendChild(c);
    }

    return wrap;
  }

  if(type === "video"){
    const vid = document.createElement("video");
    vid.src = safeText(b.src);
    vid.className = "lore-video";
    vid.controls = true;
    vid.playsInline = true;
    vid.style.width = "100%";
    wrap.appendChild(vid);

    if(b.caption){
      const c = document.createElement("div");
      c.className = "lore-caption";
      c.textContent = safeText(b.caption);
      wrap.appendChild(c);
    }

    return wrap;
  }

  const p = document.createElement("div");
  p.className = "lore-text";
  p.textContent = safeText(b.text || "");
  wrap.appendChild(p);
  return wrap;
}

function playTurn(){
  try{
    state.turnSfx.currentTime = 0;
    state.turnSfx.play();
  }catch(e){}
}

function prev(){
  state.leftIdx = (state.leftIdx - 1 + state.pages.length) % state.pages.length;
  playTurn();
  renderLeft();
}

function next(){
  state.rightIdx = (state.rightIdx + 1) % state.pages.length;
  playTurn();
  renderRight();
}

btnPrev?.addEventListener("click", prev);
btnNext?.addEventListener("click", next);

document.addEventListener("keydown", (e)=>{
  if(e.key === "ArrowLeft") prev();
  if(e.key === "ArrowRight") next();
});

async function boot(){
  try{
    const res = await fetch("content/lore/pages.json", {cache:"no-store"});
    const raw = await res.json();
    state.pages = normalizePages(raw);
  }catch(err){
    state.pages = [{pg:1, blocks:[]}];
    console.warn("Lore pages.json not found or invalid", err);
  }

  state.leftIdx = 0;
  state.rightIdx = 1;

  renderLeft();
  renderRight();
}

boot();
