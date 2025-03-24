@group(0) @binding(0) var<uniform> grid: vec2f;

@group(0) @binding(1) var<storage> pressureIn: array<f32>;
@group(0) @binding(2) var<storage> userInput: array<f32>;
@group(0) @binding(3) var<storage, read_write> pressureOut: array<f32>;

const WAVE_SPEED: f32 = 1.5;
const DAMPING: f32 = 0.995;

fn reflectBoundary(coord: i32, maxSize: i32) -> u32 {
    return u32(clamp(coord, 0, maxSize - 1)); 
}

fn cellIndex(cell: vec2i) -> u32 {
    let x = reflectBoundary(cell.x, i32(grid.x));
    let y = reflectBoundary(cell.y, i32(grid.y));
    return y * u32(grid.x) + x;
}

fn cellValue(x: i32, y: i32) -> f32 {
    return max(pressureIn[cellIndex(vec2i(x, y))], userInput[cellIndex(vec2i(x, y))]);
}

@compute
@workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
fn computeMain(@builtin(global_invocation_id) cell: vec3u) {
    let cellPos = vec2i(i32(cell.x), i32(cell.y));

    let avgNeighbors = (cellValue(cellPos.x+1, cellPos.y) +
                        cellValue(cellPos.x-1, cellPos.y) +
                        cellValue(cellPos.x, cellPos.y+1) +
                        cellValue(cellPos.x, cellPos.y-1)) * 0.25;

    let i = cellIndex(cellPos);
    let current = pressureIn[i];
    let previous = pressureOut[i];

    // Wave equation with reflection handling
    var newPressure: f32 = (2.0 * current - previous) + (WAVE_SPEED * (avgNeighbors - current));

    // Apply damping to simulate energy loss
    newPressure *= DAMPING;

    pressureOut[i] = newPressure;
}