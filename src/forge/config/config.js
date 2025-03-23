import core from "./core.config.json" assert { type: "json" };
import renderer from "./renderer.config.json" assert { type: "json" };
import simulation from "./simulation.config.json" assert { type: "json" };

function deepFreeze(obj) {
  if (obj && typeof obj === "object") {
    Object.keys(obj).forEach(key => {
      deepFreeze(obj[key]);
    });
  }
  Object.freeze(obj);
}

function Init() {
  core.grid.cellRatio = 1 - core.grid.borderSize / core.grid.cellSize;
  deepFreeze(core);
  deepFreeze(renderer);
  deepFreeze(simulation);
  return { core, renderer, simulation };
}

export { Init };
