struct VertexInput {
    @location(0) pos: vec2f,
    @builtin(instance_index) instance: u32,
};

struct VertexOutput {
    @builtin(position) pos: vec4f,
    @location(0) cell: vec2f,
};

@group(0) @binding(0) var<uniform> grid: vec2f;
@group(0) @binding(1) var<storage> cellState: array<u32>;
@group(0) @binding(2) var<storage> inputArray: array<u32>;

@vertex
fn vertexMain(input: VertexInput) ->
    VertexOutput {
    let i = f32(input.instance);
    let cell = vec2f(i % grid.x, floor(i / grid.x));
    var state = f32(cellState[input.instance]);
    let userInput = f32(inputArray[input.instance]);

    // let combined = max(state, userInput);
    // state = combined;

    let cellOffset = cell / grid * 2;
    let gridPos = (input.pos * state + 1) / grid - 1 + cellOffset;
    
    var output: VertexOutput;
    output.pos = vec4f(gridPos, 0, 1);
    output.cell = cell;
    return output;
}

struct FragInput {
    @location(0) cell: vec2f,
};

@fragment
fn fragmentMain(input: FragInput) -> @location(0) vec4f {
    let c = input.cell / grid;
    return vec4f(c, 1-c.x, 1);
}