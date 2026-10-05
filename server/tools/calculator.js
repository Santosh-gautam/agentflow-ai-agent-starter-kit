/**
 * Mathematical Calculation Tool
 */
export const calculatorTool = {
  declaration: {
    name: "calculate_expression",
    description: "Evaluates a mathematical expression and returns the precise calculated numeric result.",
    parameters: {
      type: "OBJECT",
      properties: {
        expression: {
          type: "STRING",
          description: "The mathematical expression to evaluate (e.g. '1500 * 1.18 + 250' or 'sqrt(144) * 20')"
        }
      },
      required: ["expression"]
    }
  },
  async execute({ expression }) {
    try {
      // Safe math evaluator without eval()
      const sanitized = expression.replace(/[^0-9+\-*/().%^]/g, '');
      const result = Function(`'use strict'; return (${sanitized})`)();
      return { expression, result, status: "success" };
    } catch (err) {
      return { error: `Calculation failed: ${err.message}`, status: "error" };
    }
  }
};
