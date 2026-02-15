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

function placeholder(){
  const d = document.createElement("div");
  d.className = "lore-block";
  return d;
}

function renderBlock(b){
  const wrap = document.createElement("div");
  wrap.className = "lore-block";

  if(b.type === "text"){
    const div = document.createElement("div");
    div.className = "lore-text";
    div.innerHTML = b.text; // allow markdown bold etc
    wrap.appendChild(div);
  }

  if(b.type === "image"){
    const img = document.createElement("img");
    img.className = "lore-media";
    img.src = b.src;
    wrap.appendChild(img);
  }

  if(b.type === "video"){
    const vid = document.createElement("video");
    vid.className = "lore-media";
    vid.src = b.src;
    vid.controls = true;
    wrap.appendChild(vid);
  }

  return wrap;
}

function renderLeft(){
  elLeft.innerHTML = "";
  const page = state.pages[state.leftIdx];
  if(!page){ elLeft.appendChild(placeholder()); return; }

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
  if(!page){ elRight.appendChild(placeholder()); return; }

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

async function boot(){
  try{
    const res = await fetch("content/lore/pages.json", {cache:"no-store"});
    const raw = await res.json();
    state.pages = raw.pages || [];
  }catch(err){
    console.warn("Failed to load pages.json", err);
    state.pages = [];
  }

  state.leftIdx = 0;
  state.rightIdx = 1;

  renderLeft();
  renderRight();
}

boot();

