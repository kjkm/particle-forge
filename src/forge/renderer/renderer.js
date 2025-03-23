import gridShaderCode from "./shaders/gridShader.wgsl?raw";
import Grid from "./grid";
import { Input } from "../forge.js";
import { AddSimulationPipeline } from "./simulation";


/* ***************************************************************************************
 * FETCH WEBGPU
 * ***************************************************************************************/
async function fetchWebGPU(renderContext) {
  const gpu = {};

  if (!navigator.gpu) {
    throw new Error("WebGPU is not supported");
  }

  gpu.adapter = await navigator.gpu.requestAdapter();
  if (!gpu.adapter) {
    throw new Error("No adapter found");
  }

  gpu.device = await gpu.adapter.requestDevice();
  
  renderContext.gpu = gpu;
  return renderContext;
}

/* ***************************************************************************************
 * FETCH AND CONFIG CANVAS
 * ***************************************************************************************/
function fetchCanvas(renderContext) {
  const canvas = {};
  renderContext.canvas = canvas;
  canvas.canvas = document.querySelector("canvas");
  canvas.context = canvas.canvas.getContext("webgpu");
  canvas.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  canvas.context.configure({
    device: renderContext.gpu.device,
    format: canvas.canvasFormat,
  });
  
  updateCanvas(renderContext);

  window.addEventListener("resize", () => {
    updateCanvas(renderContext);
  });

  return renderContext;
}

function updateCanvas(renderContext) {
  const canvas = renderContext.canvas;
  canvas.rect = canvas.canvas.getBoundingClientRect();
  canvas.width = canvas.rect.width;
  canvas.height = canvas.rect.height;
  canvas.top = canvas.rect.top;
  canvas.bottom = canvas.rect.bottom;
  canvas.left = canvas.rect.left;
  canvas.right = canvas.rect.right;
  canvas.x = canvas.rect.x;
  canvas.y = canvas.rect.y;
  canvas.gridWidth = Math.floor(canvas.width / renderContext.config.core.grid.cellSize);
  canvas.gridHeight = Math.floor(canvas.height / renderContext.config.core.grid.cellSize);

  return renderContext;
}

/* ***************************************************************************************
 * FETCH AND CONFIG RENDER LAYOUTS
 * ***************************************************************************************/
function fetchRenderLayouts(renderContext) {
  const renderLayouts = {};
  renderContext.layouts = renderLayouts;
  renderLayouts.bindGroupLayout = createBindGroupLayout(renderContext);
  renderLayouts.pipelineLayout = createPipelineLayout(renderContext);

  return renderContext;
}

function createBindGroupLayout(renderContext) {
  const bindGroupLayout = renderContext.gpu.device.createBindGroupLayout({
    label: "Bind Group Layout",
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
        buffer: {}
      },
      {
        binding: 1,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
        buffer: { type: "read-only-storage" }
      },
      {
        binding: 2,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
        buffer: { type: "read-only-storage" }
      },
      {
        binding: 3,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "storage" }
      }
    ]
  });

  return bindGroupLayout;
}

function createPipelineLayout(renderContext) {
  const pipelineLayout = renderContext.gpu.device.createPipelineLayout({
    label: "Pipeline Layout",
    bindGroupLayouts: [renderContext.layouts.bindGroupLayout],
  });

  return pipelineLayout;
}

/* ***************************************************************************************
 * SET TICK RATE
 * ***************************************************************************************/
export function SetTickRate(renderContext, tickRate) {
  renderContext.tickRate = tickRate;
  return renderContext;
}

/* ***************************************************************************************
 * CREATE PIPELINE
 * ***************************************************************************************/
export function CreatePipeline(renderContext) {
  const vertexBufferLayout = {
    arrayStride: 2 * 4,
    attributes: [
      {
        shaderLocation: 0,
        offset: 0,
        format: "float32x2",
      },
    ],
  };

  const cellShaderModule = renderContext.gpu.device.createShaderModule({
    label: "Shader Module",
    code: gridShaderCode,
  });

  const pipeline = renderContext.gpu.device.createRenderPipeline({
    label: "Pipeline",
    layout: renderContext.layouts.pipelineLayout,
    vertex: {
      module: cellShaderModule,
      entryPoint: "vertexMain",
      buffers: [vertexBufferLayout],
    },
    fragment: {
      module: cellShaderModule,
      entryPoint: "fragmentMain",
      targets: [
        {
          format: renderContext.canvas.canvasFormat,
        },
      ],
    },
  });

  return pipeline;
}

/* ***************************************************************************************
 * CREATE VERTEX BUFFER
 * ***************************************************************************************/
export function CreateVertexBuffer(renderContext, vertices) {
  const vertexBuffer = renderContext.gpu.device.createBuffer({
    label: "Cell Vertices",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  renderContext.gpu.device.queue.writeBuffer(vertexBuffer, 0, vertices);

  const vertex = {
    buffer: vertexBuffer,
    tris: vertices,
  };

  return vertex;
}

/* ***************************************************************************************
 * ADD VERTICES
 * ***************************************************************************************/
export function AddVertices(renderContext, vertices) {
  const vertexBuffer = CreateVertexBuffer(renderContext, vertices);
  renderContext.vertices = vertexBuffer;
  return renderContext;
}

export function CreateUniformBuffer(renderContext, width, height) {
  const uniformArray = new Float32Array([width, height]);
  const uniformBuffer = renderContext.gpu.device.createBuffer({
    label: "Uniforms",
    size: uniformArray.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  renderContext.gpu.device.queue.writeBuffer(uniformBuffer, 0, uniformArray);

  return uniformBuffer;
}

export function createStorageBuffer(renderContext, stateArray, bufferLabel) {
  console.log("stateArray type:", stateArray.constructor.name);
  const stateStorage = renderContext.gpu.device.createBuffer({
    label: bufferLabel || "State Storage",
    size: stateArray.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  renderContext.gpu.device.queue.writeBuffer(stateStorage, 0, stateArray);
  
  return stateStorage;
}

export function CreateBindGroup(renderContext, resources) {
  const entries = resources.map((buffer, i) => ({
    binding: i,
    resource: { buffer },
  }));

  const bindGroup = renderContext.gpu.device.createBindGroup({
    label: "Grid Bind Group",
    layout: renderContext.layouts.bindGroupLayout,
    entries: entries,
  });

  return bindGroup;
}

/* ***************************************************************************************
 * INIT RENDERER
 * ***************************************************************************************/
export async function Init(config) {
  const rend = {
    renderStep: 0
  };
  rend.config = config;
  
  await fetchWebGPU(rend);
  fetchCanvas(rend);

  fetchRenderLayouts(rend);

  rend.pipeline = CreatePipeline(rend);
  AddSimulationPipeline(rend, config);

  // FULL SETUP
  rend.uniformBuffer = CreateUniformBuffer(rend, rend.canvas.gridWidth, rend.canvas.gridHeight);

  rend.stateGrid = new Grid(rend.canvas.gridWidth, rend.canvas.gridHeight);
  // rend.stateGrid.Randomize();
  rend.cellStateArray = rend.stateGrid.GetArray();

  rend.cellStateBuffers = [
    createStorageBuffer(rend, rend.cellStateArray, "Cell State A"),
    createStorageBuffer(rend, rend.cellStateArray, "Cell State B")
  ];

  rend.inputGrid = new Grid(rend.canvas.gridWidth, rend.canvas.gridHeight);
  if (rend.drawArray) {
    rend.inputGrid.SetArray(rend.drawArray);
  }

  rend.inputStateArray = rend.inputGrid.GetArray();
  rend.inputStateBuffer = createStorageBuffer(rend, rend.inputStateArray, "Input State");

  return rend;
}

export function PreRender(rend) {
  const bindGroups = [
    CreateBindGroup(rend, [rend.uniformBuffer, rend.cellStateBuffers[0], rend.inputStateBuffer, rend.cellStateBuffers[1]]),
    CreateBindGroup(rend, [rend.uniformBuffer, rend.cellStateBuffers[1], rend.inputStateBuffer, rend.cellStateBuffers[0]])
  ];

  rend.bindGroups = bindGroups;
}

/* ***************************************************************************************
 * RENDERING
 * ***************************************************************************************/
export function Render(renderContext, numInstances, bindGroup) {
  const encoder = renderContext.gpu.device.createCommandEncoder();

  // Compute pass
  const computePass = encoder.beginComputePass();

  computePass.setPipeline(renderContext.simulationPipeline);
  computePass.setBindGroup(0, renderContext.bindGroups[renderContext.renderStep % 2]);
  const workgroupSize = renderContext.config.simulation.workgroupSize;
  const workgroupWidth = Math.ceil(renderContext.canvas.gridWidth / workgroupSize);
  const workgroupHeight = Math.ceil(renderContext.canvas.gridHeight / workgroupSize);
  computePass.dispatchWorkgroups(workgroupWidth, workgroupHeight);
  computePass.end();

  // Render pass
  const renderPass = encoder.beginRenderPass({
    colorAttachments: [
      {
        view: renderContext.canvas.context.getCurrentTexture().createView(),
        loadOp: "clear",
        clearValue: renderContext.config.renderer.clearColor,
        storeOp: "store",
      },
    ],
  });

  renderPass.setPipeline(renderContext.pipeline);
  renderPass.setVertexBuffer(0, renderContext.vertices.buffer);

  renderPass.setBindGroup(0, bindGroup);


  renderPass.draw(renderContext.vertices.tris.length / 2, numInstances);


  renderPass.end();

  renderContext.gpu.device.queue.submit([encoder.finish()]);
}

function updateState(renderContext) {
  const buffer = renderContext.inputStateBuffer;

  renderContext.gpu.device.queue.writeBuffer(buffer, 0, renderContext.drawArray);
}

/* ***************************************************************************************
 * TICK - REQUIRED FOR FORGE MODULE
 * ***************************************************************************************/
export function Tick(renderContext, deltaTime) {
  renderContext.renderStep++;
  updateState(renderContext);
  Render(renderContext, renderContext.canvas.gridWidth * renderContext.canvas.gridHeight, renderContext.bindGroups[renderContext.renderStep % 2]);
}