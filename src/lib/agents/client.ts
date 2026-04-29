const ZAI_API_KEY = process.env.ZAI_API_KEY || '';
const ZAI_BASE_URL = process.env.ZAI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4';
export const MODEL = process.env.ZAI_MODEL || 'glm-4-flash';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: { id: string; function: { name: string; arguments: string }; type?: string }[];
}

interface ToolDef {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export async function chatCompletion(
  messages: ChatMessage[],
  tools?: ToolDef[],
): Promise<{
  content: string;
  toolCalls: { id: string; name: string; arguments: string }[] | null;
}> {
  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    max_tokens: 1024,
  };

  if (tools && tools.length > 0) {
    body.tools = tools;
  }

  const res = await fetch(`${ZAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ZAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GLM API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0]?.message;

  const content = choice?.content || '';
  const toolCalls = choice?.tool_calls?.map(
    (tc: { id: string; function: { name: string; arguments: string } }) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: tc.function.arguments,
    }),
  ) || null;

  return { content, toolCalls };
}

export function toGLMTool(name: string, description: string, inputSchema: Record<string, unknown>): ToolDef {
  return {
    type: 'function',
    function: {
      name,
      description,
      parameters: inputSchema,
    },
  };
}
