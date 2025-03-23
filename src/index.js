import * as Forge from "./forge/forge.js";



const config = Forge.Config.Init();

const renderContext = await Forge.Renderer.Init(config);
const input = Forge.Input.Init(config);

renderContext.drawArray = Forge.Input.GetDrawArray();

const square = Forge.Geometry.Square(config.core.grid.cellRatio);
Forge.Renderer.AddVertices(renderContext, square);

Forge.Renderer.SetTickRate(renderContext, config.renderer.fps);
Forge.Renderer.PreRender(renderContext);

Forge.Fire(Forge.Renderer, renderContext);
Forge.Fire(Forge.Input, input);