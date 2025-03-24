import { max } from "three/examples/jsm/nodes/Nodes.js";

const Input = {
  mouse: {
    clientX: -1,
    clientY: -1,
    gridX: -1,
    gridY: -1,
    isDown: false,
  },
  tickRate: 60,
};

const state = {
  config: {},
  proxy: {},
  drawArray: [],
  window: {
    gridWidth: 0,
    gridHeight: 0,
  },
  cellSize: 0,
  initialized: false,
  drawBuffer: [],
  decayCounter: 0,
  alertIssued: false,
};

function deepProxy(target) {
  if (target === null || typeof target !== "object") {
    return target;
  }

  return new Proxy(target, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === "object") {
        return deepProxy(value);
      }
      return value;
    },
    set(target, key, value) {
      throw new Error("Cannot modify read-only object.");
    },
    deleteProperty(target, key) {
      throw new Error("Cannot delete property of read-only object.");
    },
  });
}

function toggleMouseDown(event) {
  Input.mouse.isDown = !Input.mouse.isDown;
}

function clamp(value, min, max) {
  const result = Math.min(Math.max(value, min), max);
  return result;
}

function getPositionsWithinRadius(center, radius) {
  const positions = [];
  const { gridWidth, gridHeight } = state.window;
  const startX = Math.max(center.x - radius, 0);
  const endX = Math.min(center.x + radius, gridWidth - 1);
  const startY = Math.max(center.y - radius, 0);
  const endY = Math.min(center.y + radius, gridHeight - 1);

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      const dx = x - center.x;
      const dy = y - center.y;
      if (Math.sqrt(dx * dx + dy * dy) <= radius) {
        positions.push({ x, y });
      }
    }
  }

  return positions;
}

function draw(event) {
  if (Input.mouse.isDown) {
    const x = clamp(Input.mouse.gridX, 0, state.window.gridWidth - 1);
    const y = clamp(Input.mouse.gridY, 0, state.window.gridHeight - 1);
    // console.log("Drawing at", x, y);
    // state.drawArray[y * state.window.gridWidth + x] = 1;
    const radius = state.config.input.brushSize;
    const positions = getPositionsWithinRadius({ x, y }, radius);
    for (const { x, y } of positions) {
      state.drawBuffer.push({ x, y });
    }
    // state.drawBuffer.push({ x, y });
  }
}

function updateMousePos(event) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const gridWidth = width / state.config.core.grid.cellSize;
  const gridHeight = height / state.config.core.grid.cellSize;
  const x = Math.floor((event.clientX / width) * gridWidth);
  const y = Math.floor(gridHeight - (event.clientY / height) * gridHeight);

  Input.mouse.clientX = event.clientX;
  Input.mouse.clientY = event.clientY;
  Input.mouse.gridX = x;
  Input.mouse.gridY = y;
}

function updateOnResize() {
  state.window.gridWidth = Math.floor(window.innerWidth / state.cellSize);
  state.window.gridHeight = Math.floor(window.innerHeight / state.cellSize);
  state.drawArray = new Float32Array(
    state.window.gridWidth * state.window.gridHeight
  ); // This breaks input on resize.
}

export function GetDrawArray() {
  return state.drawArray;
}

export function PrintDrawArray(drawArray) {
  const gridWidth = state.window.gridWidth;
  let output = "";
  for (let i = 0; i < drawArray.length; i += gridWidth) {
    const row = Array.from(drawArray.slice(i, i + gridWidth));
    output += row.join(" ") + "\n";
  }
  console.log(output);
}

export function Init(config) {
  if (state.initialized) {
    throw new Error("Input already initialized.");
  }

  state.config = config;
  state.proxy = deepProxy(Input);
  state.initialized = true;
  state.cellSize = config.core.grid.cellSize;
  Input.tickRate = config.input.tickRate;

  updateOnResize();
  window.addEventListener("resize", () => {
    updateOnResize();
    if (!state.alertIssued) {
      alert(
        "Window resizing not yet supported by input module. Please refresh the page."
      );
      state.alertIssued = true;
    }
  });

  document.addEventListener("mousedown", toggleMouseDown);
  document.addEventListener("mousedown", draw);
  document.addEventListener("mousemove", updateMousePos);
  document.addEventListener("mousemove", draw);
  document.addEventListener("mouseup", toggleMouseDown);

  return state.proxy;
}

export function Tick(context, deltaTime) {
  const decayRate =
    (state.config.input.decay * Math.PI * state.config.input.brushSize) ^ 2;
  state.drawArray.fill(0);

  for (const { x, y } of state.drawBuffer) {
    const index = y * state.window.gridWidth + x;
    state.drawArray[index] = 1;
  }

  while (state.drawBuffer.length > 0 && state.decayCounter < decayRate) {
    state.drawBuffer.shift();
    state.decayCounter++;
  }
  state.decayCounter = 0;
}
