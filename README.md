# Particle Forge
Particle forge is intended to be a fun little toy simulator, where users can configure a simple set of rules to implement their own cellular automata. 

Currently, it can just does some waves. A continuous version of Conway's Game of Life is also implemented but not currently used.

## Requirements
Your browser needs to support WebGPU. I haven't set up any kind of WebGL fallback.

This has only been tested in Blink/Chromium-based browsers. No idea how well it plays with other browser engines.

## Future Plans
I want to:
- build an accessible/declarative scripting language 
- transpile that scripting language to WGSL compute shader code
- add some sort of UX flow to let users set their script as the compute for the simulator
- probably have to build out some support for encoding more data in the compute shader
- probably need to build out the rendering to be more flexible and better represent a broader array of possible simulations 

Will any of this ever happen? Eh, probably not.

