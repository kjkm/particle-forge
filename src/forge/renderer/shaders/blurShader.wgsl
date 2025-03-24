@group(0) @binding(0) var myTexture: texture_2d<f32>;
@group(0) @binding(1) var mySampler: sampler;

struct VertexOutput {
    @builtin(position) pos: vec4f,
    @location(0) uv: vec2f,
};

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    let positions = array(
        vec2f(-1.0, -1.0), vec2f( 1.0, -1.0), vec2f(-1.0,  1.0),
        vec2f(-1.0,  1.0), vec2f( 1.0, -1.0), vec2f( 1.0,  1.0)
    );

    let uvs = array(
        vec2f(0.0, 1.0), vec2f(1.0, 1.0), vec2f(0.0, 0.0),
        vec2f(0.0, 0.0), vec2f(1.0, 1.0), vec2f(1.0, 0.0)
    );

    var output: VertexOutput;
    output.pos = vec4f(positions[vertexIndex], 0.0, 1.0);
    output.uv = uvs[vertexIndex];
    return output;
}

@fragment
// fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
//         let texSize = vec2f(textureDimensions(myTexture));
//     let uv = input.uv;

//     let offsets = array(
//         vec2f(-10.0,  0.0), vec2f(-9.0,  0.0), vec2f(-8.0,  0.0), vec2f(-7.0,  0.0),
//         vec2f(-6.0,  0.0), vec2f(-5.0,  0.0), vec2f(-4.0,  0.0), vec2f(-3.0,  0.0),
//         vec2f(-2.0,  0.0), vec2f(-1.0,  0.0), vec2f( 0.0,  0.0), vec2f( 1.0,  0.0),
//         vec2f( 2.0,  0.0), vec2f( 3.0,  0.0), vec2f( 4.0,  0.0), vec2f( 5.0,  0.0),
//         vec2f( 6.0,  0.0), vec2f( 7.0,  0.0), vec2f( 8.0,  0.0), vec2f( 9.0,  0.0),
//         vec2f(10.0,  0.0)
//     );

//     let weights = array<f32, 21>(
//         0.004, 0.007, 0.012, 0.017, 0.025, 0.035, 0.045, 0.055, 0.065, 0.075,
//         0.085, 0.075, 0.065, 0.055, 0.045, 0.035, 0.025, 0.017, 0.012, 0.007, 0.004
//     );

//     var color = vec4f(0.0);
//     for (var i = 0; i < 21; i++) {
//         color += textureSample(myTexture, mySampler, uv + offsets[i] / texSize) * weights[i];
//     }

//     return color;
// }

fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
    let texSize = vec2f(textureDimensions(myTexture));
    let uv = input.uv;

    let offsets = array(
        vec2f(-1.0,  0.0), vec2f(1.0,  0.0),
        vec2f( 0.0, -1.0), vec2f(0.0,  1.0),
        vec2f( 0.0,  0.0)
    );

    let weights = array<f32, 5>(
        0.2, 0.2, 
        0.2, 0.2, 
        0.2
    );

    var color = vec4f(0.0);
    for (var i = 0; i < 5; i++) {
        color += textureSample(myTexture, mySampler, uv + offsets[i] / texSize) * weights[i];
    }

    return color;
}