import { calculatorTool } from './calculator.js';
import { webSearchTool } from './webSearch.js';

export const tools = [calculatorTool, webSearchTool];

export const toolRegistry = {
  [calculatorTool.declaration.name]: calculatorTool.execute,
  [webSearchTool.declaration.name]: webSearchTool.execute
};

export const toolDeclarations = tools.map(t => t.declaration);
