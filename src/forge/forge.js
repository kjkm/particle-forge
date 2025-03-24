export * as Config from "./config/config.js";
export * as Renderer from "./renderer/renderer.js";
export * as Input from "./input/input.js";
export * as Geometry from "./renderer/geometry.js";

export function Fire(module, context) {
  let lastTime = 0;
  const tickInterval = 1000 / context.tickRate;

  function frame(currentTime) {
    const deltaTime = currentTime - lastTime;
    if (deltaTime >= tickInterval) {
      lastTime = currentTime;
      module.Tick(context, deltaTime);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
