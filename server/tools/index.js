import { calculatorTool } from './calculator.js';
import { webSearchTool } from './webSearch.js';
import { chartDataTool } from './chartData.js';
import { weatherTool } from './weather.js';
import { stockTool } from './stocks.js';

export const tools = [
  calculatorTool,
  webSearchTool,
  chartDataTool,
  weatherTool,
  stockTool,
];

export const toolRegistry = {
  [calculatorTool.declaration.name]: calculatorTool.execute,
  [webSearchTool.declaration.name]: webSearchTool.execute,
  [chartDataTool.declaration.name]: chartDataTool.execute,
  [weatherTool.declaration.name]: weatherTool.execute,
  [stockTool.declaration.name]: stockTool.execute,
};

export const toolDeclarations = tools.map(t => t.declaration);
