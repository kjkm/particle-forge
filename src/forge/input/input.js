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

function draw(event) {
  if (Input.mouse.isDown) {
    const x = clamp(Input.mouse.gridX, 0, state.window.gridWidth - 1);
    const y = clamp(Input.mouse.gridY, 0, state.window.gridHeight - 1);
    // console.log("Drawing at", x, y);
    state.drawArray[y * state.window.gridWidth + x] = 1;
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
  state.drawArray = new Uint32Array(
    state.window.gridWidth * state.window.gridHeight
  );
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

  updateOnResize();
  window.addEventListener("resize", updateOnResize);

  document.addEventListener("mousedown", toggleMouseDown);
  document.addEventListener("mousedown", draw);
  document.addEventListener("mousemove", updateMousePos);
  document.addEventListener("mousemove", draw);
  document.addEventListener("mouseup", toggleMouseDown);

  return state.proxy;
}

export function Tick(context, deltaTime) {
  // console.log(state.window.gridWidth, state.window.gridHeight);
  // console.log("Input tick");
  // console.log(Input.mouse);
  // console.log(state.drawArray);
  // PrintDrawArray(state.drawArray);
  // context.drawArray = state.drawArray;
  // state.drawArray = new Uint32Array(state.window.gridWidth * state.window.gridHeight);
  // console.log("Cleared draw array");
  // console.log(state
}
