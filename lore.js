// Lore Book (public viewer)
// Entries are authored via /admin into content/lore/*.md

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

function safeText(t){
  return (t ?? "").toString();
}

function placeholder(){
  const d = document.createElement("div");
  d.className = "lore-block lore-placeholder";
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
    return wrap;
  }

  if(type === "image"){
    const img = document.createElement("img");
    img.className = "lore-media";
    img.src = safeText(b.src);
    img.loading = "lazy";
    wrap.appendChild(img);
    return wrap;
  }

  if(type === "video"){
    const vid = document.createElement("video");
    vid.className = "lore-media";
    vid.src = safeText(b.src);
    vid.controls = true;
    vid.playsInline = true;
    wrap.appendChild(vid);
    return wrap;
  }

  return wrap;
}

function renderLeft(){
  elLeft.innerHTML = "";

  const page = state.pages[state.leftIdx];
  if(!page){
    elLeft.appendChild(placeholder());
    return;
  }

  for(const b of page.blocks){
    if((b.side || "left") === "left"){
      elLeft.appendChild(renderBlock(b));
    }
  }

  if(!elLeft.children.length){
    elLeft.appendChild(placeholder());
  }
}

function renderRight(){
  elRight.innerHTML = "";

  const page = state.pages[state.rightIdx];
  if(!page){
    elRight.appendChild(placeholder());
    return;
  }

  for(const b of page.blocks){
    if((b.side || "left") === "right"){
      elRight.appendChild(renderBlock(b));
    }
  }

  if(!elRight.children.length){
    elRight.appendChild(placeholder());
  }
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

async function loadMarkdown(file){
  const res = await fetch("content/lore/" + file);
  const text = await res.text();

  const match = text.match(/---([\s\S]*?)---/);
  if(!match) return null;

  const yaml = match[1];

  const pgMatch = yaml.match(/pg:\s*(\d+)/);
  const textMatch = yaml.match(/text:\s*["']?([\s\S]*?)["']?$/m);

  return {
    pg: pgMatch ? Number(pgMatch[1]) : 1,
    blocks: [{
      type: "text",
      side: "left",
      text: textMatch ? textMatch[1].trim() : ""
    }]
  };
}

async function boot(){
  try{
    const res = await fetch("content/lore/");
    const html = await res.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const links = [...doc.querySelectorAll("a")]
      .map(a => a.getAttribute("href"))
      .filter(h => h && h.endsWith(".md"));

    const pages = [];

    for(const file of links){
      const page = await loadMarkdown(file);
      if(page) pages.push(page);
    }

    state.pages = pages.sort((a,b)=>a.pg-b.pg);

  }catch(err){
    console.warn("Lore load failed", err);
    state.pages = [{ pg:1, blocks:[] }];
  }

  state.leftIdx = 0;
  state.rightIdx = 1;

  renderLeft();
  renderRight();
}

boot();

