@group(0) @binding(0) var<uniform> grid: vec2f;

@group(0) @binding(1) var<storage> cellStateIn: array<f32>; // Now using float instead of u32
@group(0) @binding(2) var<storage> userInput: array<f32>;
@group(0) @binding(3) var<storage, read_write> cellStateOut: array<f32>; 

const GROWTH_RATE: f32 = 0.2; // Growth factor for cells
const DECAY_RATE: f32 = 0.6; // Decay factor for cells
const BIRTH_THRESHOLD: f32 = 0.95; // Minimum neighborhood sum to birth a new cell
const SURVIVAL_MIN: f32 = 0.4; // Minimum sum to sustain life
const SURVIVAL_MAX: f32 = 1.44; // Maximum sum before overpopulation

fn cellIndex(cell: vec2u) -> u32 {
    return (cell.y % u32(grid.y)) * u32(grid.x) + (cell.x % u32(grid.x));
}

fn cellValue(x: u32, y: u32) -> f32 {
    return max(cellStateIn[cellIndex(vec2u(x, y))], userInput[cellIndex(vec2u(x, y))]);
}

@compute
@workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
fn computeMain(@builtin(global_invocation_id) cell: vec3u) {
    // Weighted sum of neighbor states
    let sumNeighbors = cellValue(cell.x+1, cell.y+1) +
                       cellValue(cell.x+1, cell.y) +
                       cellValue(cell.x+1, cell.y-1) +
                       cellValue(cell.x, cell.y-1) +
                       cellValue(cell.x-1, cell.y+1) +
                       cellValue(cell.x-1, cell.y) +
                       cellValue(cell.x-1, cell.y-1) +
                       cellValue(cell.x, cell.y+1);
    
    let i = cellIndex(cell.xy);
    let currentState = cellStateIn[i];

    var newState: f32 = currentState;

    if (sumNeighbors > BIRTH_THRESHOLD && sumNeighbors < SURVIVAL_MAX) {
        newState = clamp(currentState + GROWTH_RATE * sumNeighbors, 0.0, 1.0);
    } else if (sumNeighbors < SURVIVAL_MIN || sumNeighbors > SURVIVAL_MAX) {
        newState = max(0.0, currentState - DECAY_RATE);
    }

    cellStateOut[i] = newState;
}