import { calculatorTool } from './calculator.js';
import { webSearchTool } from './webSearch.js';
import { chartDataTool } from './chartData.js';

export const tools = [calculatorTool, webSearchTool, chartDataTool];

export const toolRegistry = {
  [calculatorTool.declaration.name]: calculatorTool.execute,
  [webSearchTool.declaration.name]: webSearchTool.execute,
  [chartDataTool.declaration.name]: chartDataTool.execute,
};

export const toolDeclarations = tools.map(t => t.declaration);
