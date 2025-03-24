import gameOfLife from "./shaders/gameOfLife.wgsl?raw";
import fluidPressure from "./shaders/fluidPressure.wgsl?raw";

export function AddSimulationPipeline(renderContext, config) {
  const processedShaderCode = fluidPressure.replace(
    /\$\{WORKGROUP_SIZE\}/g,
    config.simulation.workgroupSize
  );

  const simulationShaderModule = renderContext.gpu.device.createShaderModule({
    label: "Simulation Shader Module",
    code: processedShaderCode,
  });

  const simulationPipeline = renderContext.gpu.device.createComputePipeline({
    label: "Simulation Pipeline",
    layout: renderContext.layouts.pipelineLayout,
    compute: {
        module: simulationShaderModule,
        entryPoint: "computeMain",
    }
  })
  renderContext.simulationPipeline = simulationPipeline;

  return renderContext;
}
