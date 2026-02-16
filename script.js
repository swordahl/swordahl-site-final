// ===== Animated Desktop Cursor =====

const cursorFrames = [
  "assets/cursors/cursor_0.png",
  "assets/cursors/cursor_1.png",
  "assets/cursors/cursor_2.png",
  "assets/cursors/cursor_3.png",
  "assets/cursors/cursor_4.png",
  "assets/cursors/cursor_5.png",
  "assets/cursors/cursor_6.png",
  "assets/cursors/cursor_7.png",
  "assets/cursors/cursor_8.png",
  "assets/cursors/cursor_9.png"
];

let cursorIndex = 0;

// Only run on desktop (not touch devices)
if (!('ontouchstart' in window)) {
  setInterval(() => {
    cursorIndex = (cursorIndex + 1) % cursorFrames.length;
    document.documentElement.style.cursor =
      `url("${cursorFrames[cursorIndex]}") 52 1, auto`;
  }, 80);
}
