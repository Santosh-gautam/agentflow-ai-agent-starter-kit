/**
 * Visual Data Chart Generator Tool
 */
export const chartDataTool = {
  declaration: {
    name: "generate_chart_visualization",
    description: "Generates structured chart points and comparison metrics for visual display.",
    parameters: {
      type: "OBJECT",
      properties: {
        title: {
          type: "STRING",
          description: "Title of the chart (e.g. 'Monthly Revenue 2026' or 'Tech Stack Performance')"
        },
        chartType: {
          type: "STRING",
          enum: ["bar", "line", "pie"],
          description: "Type of visualization requested"
        },
        labels: {
          type: "ARRAY",
          items: { type: "STRING" },
          description: "List of categorical labels (e.g. ['Jan', 'Feb', 'Mar', 'Apr'])"
        },
        values: {
          type: "ARRAY",
          items: { type: "NUMBER" },
          description: "Corresponding numerical metric values (e.g. [4500, 6200, 8900, 11400])"
        }
      },
      required: ["title", "chartType", "labels", "values"]
    }
  },
  async execute({ title, chartType, labels, values }) {
    return {
      status: "success",
      title,
      chartType: chartType || "bar",
      data: labels.map((label, i) => ({
        label,
        value: values[i] !== undefined ? values[i] : 0
      })),
      total: values.reduce((a, b) => a + (Number(b) || 0), 0),
      timestamp: new Date().toISOString()
    };
  }
};
