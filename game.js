const artSvg = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <g fill="none" stroke="#227a72" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="150" cy="150" r="16" stroke-width="3.8"/>
    <circle cx="150" cy="150" r="42" stroke-width="3"/>
    <path d="M150 24 C174 72 174 104 150 132 C126 104 126 72 150 24Z" stroke-width="4"/>
    <path d="M150 276 C126 228 126 196 150 168 C174 196 174 228 150 276Z" stroke-width="4"/>
    <path d="M24 150 C72 126 104 126 132 150 C104 174 72 174 24 150Z" stroke-width="4"/>
    <path d="M276 150 C228 174 196 174 168 150 C196 126 228 126 276 150Z" stroke-width="4"/>
    <path d="M62 62 C112 78 132 101 132 138 C95 138 72 112 62 62Z" stroke-width="3.6"/>
    <path d="M238 62 C228 112 205 138 168 138 C168 101 188 78 238 62Z" stroke-width="3.6"/>
    <path d="M62 238 C72 188 95 162 132 162 C132 199 112 222 62 238Z" stroke-width="3.6"/>
    <path d="M238 238 C188 222 168 199 168 162 C205 162 228 188 238 238Z" stroke-width="3.6"/>
    <path d="M150 62 C162 90 162 108 150 126 C138 108 138 90 150 62Z" stroke-width="2.6"/>
    <path d="M150 238 C138 210 138 192 150 174 C162 192 162 210 150 238Z" stroke-width="2.6"/>
    <path d="M62 150 C90 138 108 138 126 150 C108 162 90 162 62 150Z" stroke-width="2.6"/>
    <path d="M238 150 C210 162 192 162 174 150 C192 138 210 138 238 150Z" stroke-width="2.6"/>
    <path d="M92 92 C116 102 128 116 132 132" stroke-width="2.3"/>
    <path d="M208 92 C184 102 172 116 168 132" stroke-width="2.3"/>
    <path d="M92 208 C116 198 128 184 132 168" stroke-width="2.3"/>
    <path d="M208 208 C184 198 172 184 168 168" stroke-width="2.3"/>
    <path d="M102 48 C126 62 140 82 145 112" stroke-width="2.2"/>
    <path d="M198 48 C174 62 160 82 155 112" stroke-width="2.2"/>
    <path d="M102 252 C126 238 140 218 145 188" stroke-width="2.2"/>
    <path d="M198 252 C174 238 160 218 155 188" stroke-width="2.2"/>
    <path d="M48 102 C62 126 82 140 112 145" stroke-width="2.2"/>
    <path d="M48 198 C62 174 82 160 112 155" stroke-width="2.2"/>
    <path d="M252 102 C238 126 218 140 188 145" stroke-width="2.2"/>
    <path d="M252 198 C238 174 218 160 188 155" stroke-width="2.2"/>
    <path d="M150 92 L162 110 L150 128 L138 110Z" stroke-width="2.4"/>
    <path d="M150 208 L138 190 L150 172 L162 190Z" stroke-width="2.4"/>
    <path d="M92 150 L110 138 L128 150 L110 162Z" stroke-width="2.4"/>
    <path d="M208 150 L190 162 L172 150 L190 138Z" stroke-width="2.4"/>
    <circle cx="150" cy="98" r="4" stroke-width="2"/>
    <circle cx="150" cy="202" r="4" stroke-width="2"/>
    <circle cx="98" cy="150" r="4" stroke-width="2"/>
    <circle cx="202" cy="150" r="4" stroke-width="2"/>
  </g>
</svg>`);

const defaultArtUrl = `url("data:image/svg+xml,${artSvg}")`;
let currentArtUrl = defaultArtUrl;
let customObjectUrl = null;
const tileTemplate = document.querySelector("#tileTemplate");
const gameBoard = document.querySelector("#gameBoard");
const targetBoard = document.querySelector("#targetBoard");
const targetPanel = document.querySelector("#targetPanel");
const cardsEl = document.querySelector("#cards");
const progressText = document.querySelector("#progressText");
const progressMeter = document.querySelector("#progressMeter");
const roundText = document.querySelector("#roundText");
const feedbackGlow = document.querySelector("#feedbackGlow");
const transformEffect = document.querySelector("#transformEffect");
const newGameButton = document.querySelector("#newGameButton");
const randomSeedButton = document.querySelector("#randomSeedButton");
const nameModeInput = document.querySelector("#nameMode");
const infoModeInput = document.querySelector("#infoMode");
const targetToggle = document.querySelector("#targetToggle");
const powerCardToggle = document.querySelector("#powerCardToggle");
const difficultyInput = document.querySelector("#difficulty");
const difficultyValue = document.querySelector("#difficultyValue");
const seedInput = document.querySelector("#seedInput");
const imageUrlInput = document.querySelector("#imageUrlInput");
const applyImageUrlButton = document.querySelector("#applyImageUrlButton");
const imageFileInput = document.querySelector("#imageFileInput");
const defaultImageButton = document.querySelector("#defaultImageButton");

const baseTiles = Array.from({ length: 9 }, (_, index) => ({
  source: index,
  rot: 0,
  flipX: false,
  flipY: false,
  offsetX: 0,
  offsetY: 0,
  hue: 0,
  contrast: 1,
  invert: 0,
}));

const game = {
  state: null,
  initialBadness: 1,
  round: 1,
  rng: Math.random,
  solutionHints: [],
  mistakeFixes: [],
  cards: [],
};

let audioContext = null;

function getAudioContext() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioContext) audioContext = new AudioCtor();
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function playTone({ freq, endFreq = freq, start = 0, duration = 0.24, type = "sine", gain = 0.055 }) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
  amp.gain.setValueAtTime(0.0001, now);
  amp.gain.exponentialRampToValueAtTime(gain, now + 0.025);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(amp).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.03);
}

function playTransformSound(effect, isPower = false) {
  getAudioContext();
  const scale = isPower ? 1.25 : 1;
  const sounds = {
    rotate: () => {
      playTone({ freq: 220, endFreq: 440, duration: 0.34 * scale, type: "triangle", gain: 0.045 });
      playTone({ freq: 330, endFreq: 660, start: 0.08, duration: 0.28 * scale, type: "sine", gain: 0.035 });
    },
    flip: () => {
      playTone({ freq: 520, endFreq: 210, duration: 0.18, type: "triangle", gain: 0.05 });
      playTone({ freq: 210, endFreq: 520, start: 0.16, duration: 0.18, type: "triangle", gain: 0.04 });
    },
    color: () => {
      playTone({ freq: 392, endFreq: 523, duration: 0.48 * scale, type: "sine", gain: 0.038 });
      playTone({ freq: 659, endFreq: 784, start: 0.1, duration: 0.42 * scale, type: "sine", gain: 0.028 });
    },
    tile: () => {
      [0, 0.08, 0.16].forEach((start, index) => {
        playTone({ freq: 300 + index * 70, endFreq: 300 + index * 70, start, duration: 0.09, type: "square", gain: 0.025 });
      });
    },
    shift: () => {
      playTone({ freq: 180, endFreq: 280, duration: 0.2 * scale, type: "sawtooth", gain: 0.028 });
      playTone({ freq: 260, endFreq: 190, start: 0.16, duration: 0.2 * scale, type: "triangle", gain: 0.03 });
    },
    combo: () => {
      [261.63, 329.63, 392, 523.25].forEach((freq, index) => {
        playTone({ freq, endFreq: freq * 1.5, start: index * 0.07, duration: 0.36, type: "sine", gain: 0.032 });
      });
    },
  };
  (sounds[isPower ? "combo" : effect] || sounds.tile)();
}

function playWinSound() {
  getAudioContext();
  [261.63, 329.63, 392, 523.25, 659.25].forEach((freq, index) => {
    playTone({ freq, endFreq: freq * 1.01, start: index * 0.32, duration: 2.2, type: "sine", gain: 0.036 });
  });
  [196, 246.94].forEach((freq, index) => {
    playTone({ freq, endFreq: freq * 0.5, start: 0.18 + index * 0.24, duration: 3.2, type: "triangle", gain: 0.026 });
  });
}

function cloneState(state) {
  return {
    global: { ...state.global },
    tiles: state.tiles.map((tile) => ({ ...tile })),
  };
}

function identityState() {
  return {
    global: { rot: 0, flipX: false, flipY: false, hue: 0 },
    tiles: baseTiles.map((tile) => ({ ...tile })),
  };
}

function normalizeRot(value) {
  return ((value % 360) + 360) % 360;
}

function normalizeHue(value) {
  return ((value % 360) + 360) % 360;
}

function shortestHueDistance(value) {
  const hue = normalizeHue(value);
  return Math.min(hue, 360 - hue);
}

function seededRandom(seed) {
  let h = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    h ^= seed.charCodeAt(index);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += h << 13;
    h ^= h >>> 7;
    h += h << 3;
    h ^= h >>> 17;
    h += h << 5;
    return ((h >>> 0) % 1000000) / 1000000;
  };
}

function toCssImageUrl(url) {
  return `url("${url.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}")`;
}

function revokeCustomObjectUrl() {
  if (customObjectUrl) {
    URL.revokeObjectURL(customObjectUrl);
    customObjectUrl = null;
  }
}

function setOriginalImage(cssUrl) {
  currentArtUrl = cssUrl;
  startGame();
}

function applyImageUrl() {
  const url = imageUrlInput.value.trim();
  if (!url) return;
  revokeCustomObjectUrl();
  setOriginalImage(toCssImageUrl(url));
}

function applyImageFile(file) {
  if (!file) return;
  revokeCustomObjectUrl();
  customObjectUrl = URL.createObjectURL(file);
  setOriginalImage(toCssImageUrl(customObjectUrl));
}

function pick(items) {
  return items[Math.floor(game.rng() * items.length)];
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(game.rng() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function tileLabel(index) {
  return ["左上", "上中", "右上", "左中", "中央", "右中", "左下", "下中", "右下"][index];
}

const operations = {
  rotateGlobal(deg) {
    return {
      clearName: `整體旋轉 ${deg > 0 ? "+" : ""}${deg} 度`,
      hiddenName: "旋轉工具",
      description: "讓整張圖以中心轉動。",
      effect: "rotate",
      effectLabel: `${Math.abs(deg)} 度`,
      apply(state) {
        state.global.rot = normalizeRot(state.global.rot + deg);
      },
      inverse: () => operations.rotateGlobal(-deg),
    };
  },
  flipGlobal(axis) {
    return {
      clearName: axis === "x" ? "整體水平鏡像" : "整體垂直鏡像",
      hiddenName: "鏡像工具",
      description: "翻轉整張透明線稿。",
      effect: "flip",
      effectLabel: axis === "x" ? "水平鏡像" : "垂直鏡像",
      apply(state) {
        state.global[axis === "x" ? "flipX" : "flipY"] = !state.global[axis === "x" ? "flipX" : "flipY"];
      },
      inverse: () => operations.flipGlobal(axis),
    };
  },
  hueGlobal(deg) {
    return {
      clearName: `整體色相 ${deg > 0 ? "+" : ""}${deg}`,
      hiddenName: "調色工具",
      description: "把線條與底色往另一個色域推移。",
      effect: "color",
      effectLabel: "色相",
      apply(state) {
        state.global.hue = normalizeHue(state.global.hue + deg);
      },
      inverse: () => operations.hueGlobal(-deg),
    };
  },
  swapTiles(a, b) {
    return {
      clearName: `交換 ${tileLabel(a)} / ${tileLabel(b)}`,
      hiddenName: "拼圖工具",
      description: "交換九宮格中的兩塊。",
      effect: "tile",
      effectLabel: "交換",
      apply(state) {
        [state.tiles[a], state.tiles[b]] = [state.tiles[b], state.tiles[a]];
      },
      inverse: () => operations.swapTiles(a, b),
    };
  },
  rotateTile(index, deg) {
    return {
      clearName: `${tileLabel(index)}旋轉 ${deg > 0 ? "+" : ""}${deg} 度`,
      hiddenName: "局部旋轉工具",
      description: "只轉動九宮格中的一塊。",
      effect: "rotate",
      effectLabel: `${tileLabel(index)}旋轉`,
      apply(state) {
        state.tiles[index].rot = normalizeRot(state.tiles[index].rot + deg);
      },
      inverse: () => operations.rotateTile(index, -deg),
    };
  },
  flipTile(index, axis) {
    return {
      clearName: `${tileLabel(index)}${axis === "x" ? "水平" : "垂直"}鏡像`,
      hiddenName: "局部鏡像工具",
      description: "只翻轉一小塊圖案。",
      effect: "flip",
      effectLabel: `${tileLabel(index)}鏡像`,
      apply(state) {
        state.tiles[index][axis === "x" ? "flipX" : "flipY"] = !state.tiles[index][axis === "x" ? "flipX" : "flipY"];
      },
      inverse: () => operations.flipTile(index, axis),
    };
  },
  offsetTile(index, dx, dy) {
    return {
      clearName: `${tileLabel(index)}位移 ${dx}, ${dy}`,
      hiddenName: "局部位移工具",
      description: "讓一小塊線條錯位。",
      effect: "shift",
      effectLabel: `${tileLabel(index)}位移`,
      apply(state) {
        state.tiles[index].offsetX += dx;
        state.tiles[index].offsetY += dy;
      },
      inverse: () => operations.offsetTile(index, -dx, -dy),
    };
  },
  tintTile(index, deg) {
    return {
      clearName: `${tileLabel(index)}局部色相 ${deg > 0 ? "+" : ""}${deg}`,
      hiddenName: "局部調色工具",
      description: "只改變一塊線條的顏色。",
      effect: "color",
      effectLabel: `${tileLabel(index)}調色`,
      apply(state) {
        state.tiles[index].hue = normalizeHue(state.tiles[index].hue + deg);
      },
      inverse: () => operations.tintTile(index, -deg),
    };
  },
  cycleTiles(indices, direction) {
    return {
      clearName: `${indices.map(tileLabel).join("→")} ${direction > 0 ? "順推" : "逆推"}`,
      hiddenName: "輪換工具",
      description: "把一組格子沿著路徑輪換。",
      effect: "tile",
      effectLabel: "輪換",
      apply(state) {
        const snapshot = indices.map((index) => state.tiles[index]);
        indices.forEach((index, position) => {
          const from = (position - direction + indices.length) % indices.length;
          state.tiles[index] = snapshot[from];
        });
      },
      inverse: () => operations.cycleTiles(indices, -direction),
    };
  },
  bandOffset(indices, dx, dy, label) {
    return {
      clearName: `${label}位移 ${dx}, ${dy}`,
      hiddenName: "區域位移工具",
      description: "讓一整排或一整欄同步錯位。",
      effect: "shift",
      effectLabel: `${label}位移`,
      apply(state) {
        indices.forEach((index) => {
          state.tiles[index].offsetX += dx;
          state.tiles[index].offsetY += dy;
        });
      },
      inverse: () => operations.bandOffset(indices, -dx, -dy, label),
    };
  },
  bandTint(indices, deg, label) {
    return {
      clearName: `${label}色相 ${deg > 0 ? "+" : ""}${deg}`,
      hiddenName: "區域調色工具",
      description: "讓一整排或一整欄同步變色。",
      effect: "color",
      effectLabel: `${label}調色`,
      apply(state) {
        indices.forEach((index) => {
          state.tiles[index].hue = normalizeHue(state.tiles[index].hue + deg);
        });
      },
      inverse: () => operations.bandTint(indices, -deg, label),
    };
  },
  power(label, ops) {
    return {
      clearName: label,
      hiddenName: label,
      description: `一次執行 ${ops.length} 個工具。`,
      effect: "combo",
      effectLabel: label,
      apply(state) {
        ops.forEach((op) => op.apply(state));
      },
      inverse: () => operations.power(label, ops.map((op) => op.inverse()).reverse()),
      isPower: true,
    };
  },
};

function buildTransformLibrary() {
  const library = [];
  const add = (factory) => library.push(factory);
  const rows = [[0, 1, 2], [3, 4, 5], [6, 7, 8]];
  const cols = [[0, 3, 6], [1, 4, 7], [2, 5, 8]];
  const paths = [
    [0, 1, 2, 5, 8, 7, 6, 3],
    [0, 4, 8, 5, 2, 1, 6, 3],
    [2, 4, 6, 7, 8, 5, 0, 1],
    [1, 5, 7, 3],
  ];

  [90, 180, 270].forEach((deg) => add(() => operations.rotateGlobal(deg)));
  ["x", "y"].forEach((axis) => add(() => operations.flipGlobal(axis)));
  [45, 60, 90, 120, 150, 180, 210, 240, 270, 300].forEach((deg) => add(() => operations.hueGlobal(deg)));

  for (let index = 0; index < 9; index += 1) {
    [90, 180, 270].forEach((deg) => add(() => operations.rotateTile(index, deg)));
    ["x", "y"].forEach((axis) => add(() => operations.flipTile(index, axis)));
    [-18, -12, 12, 18].forEach((dx) => add(() => operations.offsetTile(index, dx, 0)));
    [-18, -12, 12, 18].forEach((dy) => add(() => operations.offsetTile(index, 0, dy)));
    [[-12, -12], [12, -12], [-12, 12], [12, 12]].forEach(([dx, dy]) => add(() => operations.offsetTile(index, dx, dy)));
    [60, 90, 120, 180, 240, 270].forEach((deg) => add(() => operations.tintTile(index, deg)));
  }

  for (let a = 0; a < 9; a += 1) {
    for (let b = a + 1; b < 9; b += 1) {
      add(() => operations.swapTiles(a, b));
    }
  }

  [...rows, ...cols].forEach((indices, index) => {
    const label = index < 3 ? `第 ${index + 1} 排` : `第 ${index - 2} 欄`;
    [-16, 16].forEach((amount) => {
      add(() => operations.bandOffset(indices, amount, 0, label));
      add(() => operations.bandOffset(indices, 0, amount, label));
    });
    [90, 180, 270].forEach((deg) => add(() => operations.bandTint(indices, deg, label)));
    add(() => operations.cycleTiles(indices, 1));
    add(() => operations.cycleTiles(indices, -1));
  });

  paths.forEach((indices) => {
    add(() => operations.cycleTiles(indices, 1));
    add(() => operations.cycleTiles(indices, -1));
  });

  return library;
}

const transformLibrary = buildTransformLibrary();

function makeRandomDistortion() {
  return pick(transformLibrary)();
}

function scoreState(state) {
  let score = 0;
  score += Math.min(normalizeRot(state.global.rot), 360 - normalizeRot(state.global.rot)) / 180 * 12;
  score += state.global.flipX ? 10 : 0;
  score += state.global.flipY ? 10 : 0;
  score += shortestHueDistance(state.global.hue) / 180 * 14;

  state.tiles.forEach((tile, index) => {
    score += tile.source === index ? 0 : 14;
    score += Math.min(normalizeRot(tile.rot), 360 - normalizeRot(tile.rot)) / 180 * 8;
    score += tile.flipX ? 5 : 0;
    score += tile.flipY ? 5 : 0;
    score += (Math.abs(tile.offsetX) + Math.abs(tile.offsetY)) / 18 * 4;
    score += shortestHueDistance(tile.hue) / 180 * 4;
  });

  return score;
}

function currentProgress() {
  const currentBadness = scoreState(game.state);
  if (game.initialBadness <= 0.001) return 100;
  return Math.round((1 - currentBadness / game.initialBadness) * 100);
}

function progressAfter(card) {
  const preview = cloneState(game.state);
  card.apply(preview);
  const currentBadness = scoreState(game.state);
  const nextBadness = scoreState(preview);
  return currentBadness - nextBadness;
}

function isHelpful(card) {
  return progressAfter(card) > 0.001;
}

function triggerTransformEffect(card) {
  const effect = card.effect || "tile";
  const duration = card.isPower ? 1500 : effect === "color" ? 1450 : 1250;
  playTransformSound(effect, card.isPower);
  transformEffect.className = "transform-effect";
  gameBoard.classList.remove(
    "fx-board-rotate",
    "fx-board-flip",
    "fx-board-color",
    "fx-board-tile",
    "fx-board-shift",
    "fx-board-combo",
  );
  window.requestAnimationFrame(() => {
    transformEffect.classList.add("is-active", `fx-${effect}`);
    gameBoard.classList.add(`fx-board-${effect}`);
  });
  window.setTimeout(() => {
    transformEffect.className = "transform-effect";
    gameBoard.classList.remove(`fx-board-${effect}`);
  }, duration);
}

function triggerCompletionShowcase() {
  playWinSound();
  renderBoard(gameBoard, identityState());
  document.body.classList.add("is-complete-showcase");
  window.setTimeout(() => {
    document.body.classList.remove("is-complete-showcase");
  }, 5200);
}

function renderBoard(board, state) {
  board.innerHTML = "";
  const boardEl = board === gameBoard ? gameBoard : document.createElement("div");
  if (board !== gameBoard) {
    boardEl.className = "game-board";
    board.appendChild(boardEl);
  }

  boardEl.style.transform = `rotate(${state.global.rot}deg) scale(${state.global.flipX ? -1 : 1}, ${state.global.flipY ? -1 : 1})`;
  const hueDistance = shortestHueDistance(state.global.hue);
  const saturation = state.global.hue === 0 ? 1 : 1.75;
  const contrast = state.global.hue === 0 ? 1 : 1.12;
  boardEl.style.filter = `hue-rotate(${state.global.hue}deg) saturate(${saturation}) contrast(${contrast})`;
  boardEl.style.backgroundColor = state.global.hue === 0
    ? "transparent"
    : `hsla(${normalizeHue(172 + state.global.hue)}, 72%, ${94 - hueDistance / 18}%, 0.72)`;
  boardEl.innerHTML = "";

  state.tiles.forEach((tile, position) => {
    const node = tileTemplate.content.firstElementChild.cloneNode(true);
    const art = node.querySelector(".tile-art");
    const sourceCol = tile.source % 3;
    const sourceRow = Math.floor(tile.source / 3);
    const posCol = position % 3;
    const posRow = Math.floor(position / 3);

    art.style.backgroundImage = currentArtUrl;
    art.style.left = `${sourceCol * -100}%`;
    art.style.top = `${sourceRow * -100}%`;
    node.style.transform = [
      `translate(${tile.offsetX}%, ${tile.offsetY}%)`,
      `rotate(${tile.rot}deg)`,
      `scale(${tile.flipX ? -1 : 1}, ${tile.flipY ? -1 : 1})`,
    ].join(" ");
    node.style.filter = `hue-rotate(${tile.hue}deg) contrast(${tile.contrast}) invert(${tile.invert})`;
    node.dataset.position = `${posRow}-${posCol}`;
    boardEl.appendChild(node);
  });
}

function updateStatus(previousProgress = null) {
  const progress = currentProgress();
  const clamped = Math.max(0, Math.min(100, progress));
  const infoMode = infoModeInput.value;

  progressText.textContent = infoMode === "number" ? `${progress}%` : "--";
  progressText.style.visibility = infoMode === "image" ? "hidden" : "visible";
  progressMeter.style.width = infoMode === "number" ? `${clamped}%` : "0%";
  roundText.textContent = `第 ${game.round} 輪`;
  document.body.classList.toggle("is-won", progress >= 100);

  if (previousProgress !== null && infoMode === "pulse") {
    feedbackGlow.className = `feedback-glow ${progress >= previousProgress ? "good" : "bad"}`;
    window.setTimeout(() => {
      feedbackGlow.className = "feedback-glow";
    }, 460);
  }
}

function cardName(card) {
  if (card.isPower) return card.hiddenName;
  return nameModeInput.value === "clear" ? card.clearName : card.hiddenName;
}

function renderCards() {
  cardsEl.innerHTML = "";
  game.cards.forEach((card, index) => {
    const button = document.createElement("button");
    button.className = "card";
    button.type = "button";
    button.innerHTML = `<strong>${cardName(card)} ${nameModeInput.value === "hidden" && !card.isPower ? index + 1 : ""}</strong><span>${card.description}</span>`;
    button.addEventListener("click", () => playCard(card));
    cardsEl.appendChild(button);
  });
}

function makeDistractor() {
  return makeRandomDistortion();
}

function takeHelpfulFrom(queue) {
  const index = queue.findIndex(isHelpful);
  if (index === -1) return null;
  return queue.splice(index, 1)[0];
}

function findHelpfulRandom(excluded) {
  for (let attempt = 0; attempt < 180; attempt += 1) {
    const candidate = makeRandomDistortion();
    if (!excluded.has(candidate.clearName) && isHelpful(candidate)) {
      excluded.add(candidate.clearName);
      return candidate;
    }
  }
  return null;
}

function findHelpfulDirect(excluded) {
  const ops = stateRepairOps();
  for (const op of ops) {
    if (!excluded.has(op.clearName) && isHelpful(op)) {
      excluded.add(op.clearName);
      return op;
    }
  }
  return null;
}

function stateRepairOps() {
  const ops = [];
  const sim = cloneState(game.state);

  if (sim.global.rot !== 0) ops.push(operations.rotateGlobal(-sim.global.rot));
  if (sim.global.flipX) ops.push(operations.flipGlobal("x"));
  if (sim.global.flipY) ops.push(operations.flipGlobal("y"));
  if (sim.global.hue !== 0) ops.push(operations.hueGlobal(-sim.global.hue));

  for (let index = 0; index < sim.tiles.length; index += 1) {
    if (sim.tiles[index].source !== index) {
      const swapIndex = sim.tiles.findIndex((tile) => tile.source === index);
      if (swapIndex !== -1) {
        ops.push(operations.swapTiles(index, swapIndex));
        [sim.tiles[index], sim.tiles[swapIndex]] = [sim.tiles[swapIndex], sim.tiles[index]];
      }
    }
  }

  sim.tiles.forEach((tile, index) => {
    if (tile.rot !== 0) ops.push(operations.rotateTile(index, -tile.rot));
    if (tile.flipX) ops.push(operations.flipTile(index, "x"));
    if (tile.flipY) ops.push(operations.flipTile(index, "y"));
    if (tile.offsetX !== 0 || tile.offsetY !== 0) {
      ops.push(operations.offsetTile(index, -tile.offsetX, -tile.offsetY));
    }
    if (tile.hue !== 0) ops.push(operations.tintTile(index, -tile.hue));
  });

  return ops;
}

function lateGameStarted() {
  const threshold = Math.max(7, Math.floor(Number(difficultyInput.value) * 0.55));
  return game.round >= threshold || currentProgress() >= 48;
}

function powerChance() {
  const threshold = Math.max(6, Math.floor(Number(difficultyInput.value) * 0.45));
  const over = Math.max(0, game.round - threshold);
  return Math.min(0.9, 0.18 + over * 0.075);
}

function makeRecoveryPower(take = Math.min(game.mistakeFixes.length, pick([2, 3, 4]))) {
  const ops = game.mistakeFixes.splice(0, take);
  const suffix = ["一", "二", "三", "四", "五"][Math.floor(game.rng() * 5)];
  return operations.power(`強力補救工具${suffix}`, ops);
}

function makeBoardPower() {
  const repairOps = stateRepairOps();
  if (repairOps.length < 2) return null;

  const count = Math.min(repairOps.length, pick([2, 3, 4, 5]));
  const ranked = repairOps.slice(0, count);
  const suffix = ["一", "二", "三", "四", "五"][Math.floor(game.rng() * 5)];
  const power = operations.power(`強力混合工具${suffix}`, ranked);

  return isHelpful(power) ? power : null;
}

function dealCards() {
  const selected = [];
  const selectedNames = new Set();
  const targetHelpful = currentProgress() < 88 ? 2 : 1;

  if (powerCardToggle.checked && lateGameStarted() && game.rng() < powerChance()) {
    const power = makeBoardPower();
    if (power) {
      selected.push(power);
      selectedNames.add(power.clearName);
    }
  }

  if (powerCardToggle.checked && selected.length === 0 && lateGameStarted() && game.mistakeFixes.length >= 2 && game.rng() < powerChance()) {
    const take = Math.min(4, game.mistakeFixes.length);
    const previewPower = operations.power("強力補救工具", game.mistakeFixes.slice(0, take));
    if (isHelpful(previewPower)) {
      const power = makeRecoveryPower(take);
      selected.push(power);
      selectedNames.add(power.clearName);
    }
  }

  while (selected.length < targetHelpful) {
    const nextMistakeFix = takeHelpfulFrom(game.mistakeFixes);
    if (!nextMistakeFix) break;
    selected.push(nextMistakeFix);
    selectedNames.add(nextMistakeFix.clearName);
  }

  while (selected.length < targetHelpful) {
    const nextSolution = takeHelpfulFrom(game.solutionHints);
    if (!nextSolution) break;
    selected.push(nextSolution);
    selectedNames.add(nextSolution.clearName);
  }

  while (selected.length < targetHelpful) {
    const helpfulRandom = findHelpfulRandom(selectedNames) || findHelpfulDirect(selectedNames);
    if (!helpfulRandom) break;
    selected.push(helpfulRandom);
    selectedNames.add(helpfulRandom.clearName);
  }

  if (!selected.some(isHelpful)) {
    const fallback = findHelpfulRandom(selectedNames) || findHelpfulDirect(selectedNames) || takeHelpfulFrom(game.solutionHints) || takeHelpfulFrom(game.mistakeFixes);
    if (fallback) {
      selected.push(fallback);
      selectedNames.add(fallback.clearName);
    }
  }

  while (selected.length < 3) {
    const filler = makeDistractor();
    if (!selectedNames.has(filler.clearName)) {
      selected.push(filler);
      selectedNames.add(filler.clearName);
    }
  }

  game.cards = shuffle(selected).slice(0, 3);
  renderCards();
}

function playCard(card) {
  if (currentProgress() >= 100) return;
  getAudioContext();
  const previousProgress = currentProgress();
  card.apply(game.state);
  const nextProgress = currentProgress();

  if (nextProgress < previousProgress) {
    game.mistakeFixes.push(card.inverse());
  }

  game.round += 1;
  triggerTransformEffect(card);
  renderBoard(gameBoard, game.state);
  updateStatus(previousProgress);

  if (nextProgress >= 100) {
    triggerCompletionShowcase();
    cardsEl.innerHTML = "";
    const done = document.createElement("button");
    done.className = "card";
    done.type = "button";
    done.innerHTML = "<strong>完成</strong><span>線條已回到原本的秩序。再開一局可以生成新的扭曲流程。</span>";
    done.addEventListener("click", startGame);
    cardsEl.appendChild(done);
    return;
  }

  dealCards();
}

function buildLevel() {
  const transforms = Number(difficultyInput.value);
  game.rng = seededRandom(seedInput.value.trim() || "calm-001");
  game.state = identityState();
  game.solutionHints = [];
  game.mistakeFixes = [];
  game.round = 1;

  for (let index = 0; index < transforms; index += 1) {
    const op = makeRandomDistortion();
    op.apply(game.state);
    game.solutionHints.unshift(op.inverse());
  }

  game.initialBadness = Math.max(1, scoreState(game.state));
}

function startGame() {
  document.body.classList.remove("is-complete-showcase");
  buildLevel();
  renderBoard(targetBoard, identityState());
  renderBoard(gameBoard, game.state);
  updateStatus();
  dealCards();
}

difficultyInput.addEventListener("input", () => {
  difficultyValue.textContent = difficultyInput.value;
});

newGameButton.addEventListener("click", startGame);

randomSeedButton.addEventListener("click", () => {
  seedInput.value = `calm-${Math.floor(Math.random() * 99999).toString().padStart(5, "0")}`;
  startGame();
});

applyImageUrlButton.addEventListener("click", applyImageUrl);
imageUrlInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") applyImageUrl();
});
imageFileInput.addEventListener("change", () => {
  applyImageFile(imageFileInput.files[0]);
});
defaultImageButton.addEventListener("click", () => {
  revokeCustomObjectUrl();
  currentArtUrl = defaultArtUrl;
  imageUrlInput.value = "";
  imageFileInput.value = "";
  startGame();
});
nameModeInput.addEventListener("change", renderCards);
infoModeInput.addEventListener("change", () => updateStatus());
targetToggle.addEventListener("change", () => {
  targetPanel.classList.toggle("is-hidden", !targetToggle.checked);
});
difficultyInput.addEventListener("change", startGame);
seedInput.addEventListener("change", startGame);

startGame();
