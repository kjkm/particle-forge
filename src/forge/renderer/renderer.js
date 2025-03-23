import gridShaderCode from "./shaders/gridShader.wgsl?raw";
import { AddSimulationPipeline } from "./simulation";

export async function Init(config) {
  if (!navigator.gpu) {
    throw new Error("WebGPU is not supported");
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error("No adapter found");
  }

  const device = await adapter.requestDevice();

  // Configure the canvas
  const canvas = document.querySelector("canvas");
  const context = canvas.getContext("webgpu");
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device: device,
    format: canvasFormat,
  });

  // Get window size
  const rect = canvas.getBoundingClientRect();

  const renderContext = {
    adapter: adapter,
    device: device,
    canvas: canvas,
    context: context,
    canvasFormat: canvasFormat,
    top: rect.top,
    bottom: rect.bottom,
    left: rect.left,
    right: rect.right,
    width: rect.width,
    height: rect.height,
    x: rect.x,
    y: rect,
    gridWidth: Math.floor(rect.width / config.core.grid.cellSize),
    gridHeight: Math.floor(rect.height / config.core.grid.cellSize),
    tickRate: 60,
    config: config,
    renderStep: 0,
  };

  window.addEventListener("resize", () => {
    const rect = canvas.getBoundingClientRect();
    renderContext.top = rect.top;
    renderContext.bottom = rect.bottom;
    renderContext.left = rect.left;
    renderContext.right = rect.right;
    renderContext.width = rect.width;
    renderContext.height = rect.height;
    renderContext.gridWidth = Math.floor(rect.width / config.core.grid.cellSize);
    renderContext.gridHeight = Math.floor(rect.height / config.core.grid.cellSize);
    renderContext.x = rect.x;
    renderContext.y = rect.y;
  });

  renderContext.bindGroupLayout = CreateBindGroupLayout(renderContext);
  renderContext.pipelineLayout = renderContext.device.createPipelineLayout({
    label: "Cell Pipeline Layout",
    bindGroupLayouts: [renderContext.bindGroupLayout],
  });

  renderContext.pipeline = CreatePipeline(renderContext);
  AddSimulationPipeline(renderContext, config);

  return renderContext;
}

export function SetTickRate(renderContext, tickRate) {
  renderContext.tickRate = tickRate;
  return renderContext;
}

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

  const cellShaderModule = renderContext.device.createShaderModule({
    label: "Shader Module",
    code: gridShaderCode,
  });

  console.log(renderContext.bindGroupLayout);

  const pipeline = renderContext.device.createRenderPipeline({
    label: "Pipeline",
    layout: renderContext.pipelineLayout,
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
          format: renderContext.canvasFormat,
        },
      ],
    },
  });

  return pipeline;
}

export function CreateVertexBuffer(renderContext, vertices) {
  const vertexBuffer = renderContext.device.createBuffer({
    label: "Cell Vertices",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  renderContext.device.queue.writeBuffer(vertexBuffer, 0, vertices);

  const vertex = {
    buffer: vertexBuffer,
    tris: vertices,
  };

  return vertex;
}

export function AddVertices(renderContext, vertices) {
  const vertexBuffer = CreateVertexBuffer(renderContext, vertices);
  renderContext.vertices = vertexBuffer;
  return renderContext;
}

export function CreateGridBuffer(renderContext, width, height) {
  const uniformArray = new Float32Array([width, height]);
  const uniformBuffer = renderContext.device.createBuffer({
    label: "Grid Uniforms",
    size: uniformArray.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  renderContext.device.queue.writeBuffer(uniformBuffer, 0, uniformArray);

  const grid = {
    buffer: uniformBuffer,
  };
  return grid;
}

export function CreateStorageBuffer(renderContext, stateArray) {
  const stateStorage = renderContext.device.createBuffer({
    label: "Cell State Storage",
    size: stateArray.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  renderContext.device.queue.writeBuffer(stateStorage, 0, stateArray);
  
  const state = {
    buffer: stateStorage,
  };
  
  return state;
}

export function CreateBindGroupLayout(renderContext) {
  const bindGroupLayout = renderContext.device.createBindGroupLayout({
    label: "Grid Bind Group Layout",
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

export function CreateBindGroup(renderContext, grid, cellInput, drawArray, cellOutput) {
  const bindGroup = renderContext.device.createBindGroup({
    label: "Grid Bind Group",
    layout: renderContext.bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: grid.buffer,
        },
      },
      {
        binding: 1,
        resource: {
          buffer: cellInput.buffer,
        },
      },
      {
        binding: 2,
        resource: {
          buffer: drawArray.buffer,
        },
      },
      {
        binding: 3,
        resource: {
          buffer: cellOutput.buffer,
        },
      }
    ],
  });

  return bindGroup;
}

export function Render(renderContext, numInstances, bindGroup) {
  const encoder = renderContext.device.createCommandEncoder();
  // Compute pass
  const computePass = encoder.beginComputePass();

  computePass.setPipeline(renderContext.simulationPipeline);
  computePass.setBindGroup(0, renderContext.bindGroups[renderContext.renderStep % 2]);
  const workgroupSize = renderContext.config.simulation.workgroupSize;
  const workgroupCount = Math.ceil((renderContext.gridWidth * renderContext.gridHeight) / (workgroupSize * workgroupSize));
  computePass.dispatchWorkgroups(workgroupCount, workgroupCount);

  computePass.end();

  // Render pass
  const pass = encoder.beginRenderPass({
    colorAttachments: [
      {
        view: renderContext.context.getCurrentTexture().createView(),
        loadOp: "clear",
        clearValue: { r: 0.0, g: 0.0, b: 0.4, a: 1.0 },
        storeOp: "store",
      },
    ],
  });

  pass.setPipeline(renderContext.pipeline);
  pass.setVertexBuffer(0, renderContext.vertices.buffer);

  pass.setBindGroup(0, bindGroup);

  pass.draw(renderContext.vertices.tris.length / 2, numInstances);
  pass.end();

  // Submit
  renderContext.device.queue.submit([encoder.finish()]);
}

export function Tick(renderContext, deltaTime) {
  renderContext.renderStep++;
  
  const cellStates = [];

  const cellStateArray = new Uint32Array(renderContext.gridWidth * renderContext.gridHeight);

  for (let i = 0; i < cellStateArray.length; i += 3) {
    cellStateArray[i] = 1;
  }

  cellStates.push(CreateStorageBuffer(renderContext, cellStateArray));

  for (let i = 0; i < cellStateArray.length; i += 3) {
    cellStateArray[i] = i % 2;
  }

  cellStates.push(CreateStorageBuffer(renderContext, cellStateArray));

  const inputStateArray = new Uint32Array(renderContext.gridWidth * renderContext.gridHeight);
  if (renderContext.drawArray) {
    inputStateArray.set(renderContext.drawArray);
  }
  const inputState = CreateStorageBuffer(renderContext, inputStateArray);

  // console.log("R: ", renderContext.gridWidth, renderContext.gridHeight);
  
  const grid = CreateGridBuffer(renderContext, renderContext.gridWidth, renderContext.gridHeight);
  // const cellState = CreateStorageBuffer(renderContext);

  const bindGroups = [
    CreateBindGroup(renderContext, grid, cellStates[0], inputState, cellStates[1]),
    CreateBindGroup(renderContext, grid, cellStates[1], inputState, cellStates[0]),
  ];

  renderContext.bindGroups = bindGroups;

  Render(renderContext, renderContext.gridWidth * renderContext.gridHeight, bindGroups[renderContext.renderStep % 2]);
}