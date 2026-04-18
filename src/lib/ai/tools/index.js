import * as getTimerData from "./get-timer-data";

const tools = [getTimerData];

export const toolDefinitions = tools.map((t) => t.definition);

const toolMap = Object.fromEntries(tools.map((t) => [t.definition.name, t]));

export async function executeTool(name, context) {
  const tool = toolMap[name];
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  return tool.execute(context);
}
