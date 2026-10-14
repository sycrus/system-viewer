import * as sd from 'sd.js';

export interface SimulationResult {
  time: Float64Array;
  values: Map<string, Float64Array>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SDModel = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SDSim = any;

export class SystemDynamicsSimulator {
  private model: SDModel | null = null;
  private sim: SDSim | null = null;
  private isRunning = false;
  private results: SimulationResult | null = null;

  async loadModel(xmileUrl: string): Promise<SDModel> {
    try {
      const [model, error] = await sd.load(xmileUrl);
      if (error) {
        throw new Error(`Failed to load model: ${error}`);
      }
      if (!model) {
        throw new Error('Model is null');
      }
      this.model = model;
      return model;
    } catch (error) {
      console.error('Error loading SD model:', error);
      throw error;
    }
  }

  async createSimulation(): Promise<SDSim> {
    if (!this.model) {
      throw new Error('Model not loaded');
    }
    this.sim = this.model.sim();
    return this.sim;
  }

  async runSimulation(): Promise<SimulationResult> {
    if (!this.sim) {
      await this.createSimulation();
    }
    if (!this.sim) {
      throw new Error('Simulation not initialized');
    }

    // Reset simulation to initial state
    await this.sim.reset();

    // Run simulation to end
    await this.sim.runToEnd();
    
    // Get time series for all variables
    const varNames = await this.sim.varNames();
    const seriesMap = await this.sim.series(...varNames);
    
    // Convert to our result format
    const firstSeries = seriesMap.values().next().value;
    if (!firstSeries) {
      throw new Error('No simulation results');
    }
    
    const result: SimulationResult = {
      time: firstSeries.time,
      values: new Map()
    };
    
    seriesMap.forEach((series: { values: Float64Array }, name: string) => {
      result.values.set(name, series.values);
    });
    
    this.results = result;
    return result;
  }

  async getVariableValue(name: string): Promise<number> {
    if (!this.sim) {
      throw new Error('Simulation not initialized');
    }
    const values = await this.sim.value(name);
    return values.get(name) || 0;
  }

  async setVariableValue(name: string, value: number): Promise<void> {
    if (!this.sim) {
      throw new Error('Simulation not initialized');
    }
    await this.sim.setValue(name, value);
  }

  getResults(): SimulationResult | null {
    return this.results;
  }

  isSimulationRunning(): boolean {
    return this.isRunning;
  }

  stopSimulation(): void {
    this.isRunning = false;
  }
}

// Helper function to create a simple stock-flow model from nodes and edges
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createXmileFromGraph(_nodes: unknown[], _edges: unknown[]): string {
  // TODO: Implement XMILE generation from graph
  // For now, return the hares_and_foxes example as placeholder
  return `<?xml version="1.0" encoding="utf-8" ?>
<xmile xmlns="http://www.systemdynamics.org/XMILE" version="1.0" level="3">
    <header>
        <smile version="1.0">
            <uses_submodels></uses_submodels>
        </smile>
        <name>model</name>
        <uuid>${crypto.randomUUID()}</uuid>
        <vendor>System Viewer</vendor>
        <product version="0.1">System Viewer</product>
    </header>
    <sim_specs time_units="time">
        <start>0</start>
        <stop>12</stop>
        <dt>0.5</dt>
    </sim_specs>
    <dimensions></dimensions>
    <model_units></model_units>
    <equation_prefs xmlns="isee" order_by="module"></equation_prefs>
    <model>
        <variables>
            <stock name="Population">
                <eqn>1000</eqn>
                <non_negative></non_negative>
            </stock>
            <flow name="Consumption">
                <eqn>2.5</eqn>
                <non_negative></non_negative>
            </flow>
            <aux name="Growth_Rate">
                <eqn>0.03</eqn>
            </aux>
        </variables>
    </model>
</xmile>`;
}