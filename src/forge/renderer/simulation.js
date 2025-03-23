import gameOfLife from "./shaders/gameOfLife.wgsl?raw";

export function AddSimulationPipeline(renderContext, config) {
  const processedShaderCode = gameOfLife.replace(
    /\$\{WORKGROUP_SIZE\}/g,
    config.simulation.workgroupSize
  );

  const simulationShaderModule = renderContext.device.createShaderModule({
    label: "Simulation Shader Module",
    code: processedShaderCode,
  });

  const simulationPipeline = renderContext.device.createComputePipeline({
    label: "Simulation Pipeline",
    layout: renderContext.pipelineLayout,
    compute: {
        module: simulationShaderModule,
        entryPoint: "computeMain",
    }
  })
  renderContext.simulationPipeline = simulationPipeline;

  return renderContext;
}
