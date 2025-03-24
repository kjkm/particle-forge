struct VertexInput {
    @location(0) pos: vec2f,
    @builtin(instance_index) instance: u32,
};

struct VertexOutput {
    @builtin(position) pos: vec4f,
    @location(0) cell: vec2f,
    @location(1) state: f32, 
};

@group(0) @binding(0) var<uniform> grid: vec2f;
@group(0) @binding(1) var<storage> cellState: array<f32>;
@group(0) @binding(2) var<storage> inputArray: array<f32>;

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
    let i = f32(input.instance);
    let cell = vec2f(i % grid.x, floor(i / grid.x));

    var state = cellState[input.instance];
    let userInput = inputArray[input.instance];
    state = max(state, userInput); 

    let cellOffset = cell / grid * 2;
    let gridPos = (input.pos + 1) / grid - 1 + cellOffset;
    
    var output: VertexOutput;
    output.pos = vec4f(gridPos, 0, 1);
    output.cell = cell;
    output.state = state; 
    return output;
}

struct FragInput {
    @location(0) cell: vec2f,
    @location(1) state: f32, 
};

@fragment
fn fragmentMain(input: FragInput) -> @location(0) vec4f {
    let state = clamp(input.state, 0.0, 1.0); 

    if (state <= 0.01) {
        return vec4f(0.0, 0.0, 0.0, 1.0); 
    }

    let shiftedState = pow(state, 0.85);

    // let r = smoothstep(0.55, 1.05 - 0.15 * shiftedState, shiftedState) ; 
    // let g = smoothstep(0.2, 0.85 - 0.15 * shiftedState, shiftedState) ; 
    // let b = smoothstep(0.0, 0.55 - 0.2 * shiftedState, 1.0 - shiftedState); 

    let r = state;
    let g = state;
    let b = state;

    return vec4f(r, g, b, 1.0);
}