// Lore Book (public viewer)
// Pages are authored via /admin into content/lore/pages.json

const state = {
  pages: [],
  idx: 0,
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
  // sort by pg numeric if provided, else keep order
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

function render(){
  ensurePageExists(state.idx);
  const page = state.pages[state.idx];
  elPg.textContent = "PG " + page.pg;

  elLeft.innerHTML = "";
  elRight.innerHTML = "";

  const blocks = page.blocks || [];
  for(const b of blocks){
    const side = (b.side === "right") ? "right" : "left";
    const host = (side === "right") ? elRight : elLeft;
    host.appendChild(renderBlock(b));
  }

  // If completely empty, show faint placeholder so user sees area
  if(!elLeft.children.length) elLeft.appendChild(placeholder());
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
    // preserve line breaks
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
    img.addEventListener("click", ()=> openMedia({kind:"image", src: img.src, caption: b.caption}));
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
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lore-video-tile pixel-btn";
    btn.textContent = "PLAY";
    btn.addEventListener("click", ()=> openMedia({kind:"video", src: safeText(b.src), caption: b.caption}));
    wrap.appendChild(btn);
    if(b.caption){
      const c = document.createElement("div");
      c.className = "lore-caption";
      c.textContent = safeText(b.caption);
      wrap.appendChild(c);
    }
    return wrap;
  }

  // fallback
  const p = document.createElement("div");
  p.className = "lore-text";
  p.textContent = safeText(b.text || "");
  wrap.appendChild(p);
  return wrap;
}

function openMedia(m){
  // clear
  modalBody.innerHTML = "";
  modal.setAttribute("aria-hidden","false");
  modal.classList.add("open");

  if(m.kind === "image"){
    const img = document.createElement("img");
    img.src = m.src;
    img.className = "lore-modal-media";
    img.alt = safeText(m.caption || "Image");
    modalBody.appendChild(img);
  }else{
    const vid = document.createElement("video");
    vid.src = m.src;
    vid.className = "lore-modal-media";
    vid.controls = true;
    vid.autoplay = true;
    vid.playsInline = true;
    vid.addEventListener("ended", ()=> closeModal());
    modalBody.appendChild(vid);
  }

  if(m.caption){
    const cap = document.createElement("div");
    cap.className = "lore-modal-caption";
    cap.textContent = safeText(m.caption);
    modalBody.appendChild(cap);
  }
}

function closeModal(){
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden","true");
  // stop video if any
  const v = modalBody.querySelector("video");
  if(v){ try{ v.pause(); }catch(e){} }
  modalBody.innerHTML = "";
}

modal.addEventListener("click", (e)=>{
  const t = e.target;
  if(t && t.dataset && t.dataset.close === "1"){
    closeModal();
  }
});

document.addEventListener("keydown", (e)=>{
  if(e.key === "Escape" && modal.classList.contains("open")) closeModal();
  if(e.key === "ArrowLeft") prev();
  if(e.key === "ArrowRight") next();
});

function playTurn(){
  try{
    state.turnSfx.currentTime = 0;
    state.turnSfx.play();
  }catch(e){}
}

function prev(){
  if(state.idx > 0){
    state.idx -= 1;
    playTurn();
    render();
  }else{
    // stay at pg 1
    playTurn();
  }
}

function next(){
  state.idx += 1;
  ensurePageExists(state.idx);
  // auto assign pg numbers in sequence
  state.pages[state.idx].pg = state.idx + 1;
  playTurn();
  render();
}

btnPrev?.addEventListener("click", prev);
btnNext?.addEventListener("click", next);

async function boot(){
  try{
    const res = await fetch("content/lore/pages.json", {cache:"no-store"});
    const raw = await res.json();
    state.pages = normalizePages(raw);
  }catch(err){
    state.pages = [{pg:1, blocks:[]}];
    console.warn("Lore pages.json not found or invalid", err);
  }
  state.idx = 0;
  render();
}

boot();
