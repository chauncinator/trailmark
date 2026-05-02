import Anthropic from '@anthropic-ai/sdk';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
export const MODEL = 'claude-sonnet-4-20250514';

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

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
  // Separate system message from other messages (Anthropic pattern)
  const systemMessage = messages.find(m => m.role === 'system');
  const nonSystemMessages = messages.filter(m => m.role !== 'system');

  // Convert messages to Anthropic format
  const anthropicMessages = nonSystemMessages.map(msg => {
    if (msg.role === 'tool') {
      return {
        role: 'user' as const,
        content: [
          {
            type: 'tool_result' as const,
            tool_use_id: msg.tool_call_id || '',
            content: msg.content,
          },
        ],
      };
    }

    if (msg.tool_calls && msg.tool_calls.length > 0) {
      return {
        role: 'assistant' as const,
        content: [
          ...(msg.content ? [{ type: 'text' as const, text: msg.content }] : []),
          ...msg.tool_calls.map(tc => ({
            type: 'tool_use' as const,
            id: tc.id,
            name: tc.function.name,
            input: JSON.parse(tc.function.arguments),
          })),
        ],
      };
    }

    return {
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    };
  });

  // Convert tools to Anthropic format
  const anthropicTools = tools?.map(t => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: t.function.parameters,
  }));

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: systemMessage?.content,
    messages: anthropicMessages,
    tools: anthropicTools,
  });

  // Extract text content
  const textBlock = response.content.find(block => block.type === 'text');
  const content = textBlock && 'text' in textBlock ? textBlock.text : '';

  // Extract tool calls
  const toolUseBlocks = response.content.filter(block => block.type === 'tool_use');
  const toolCalls = toolUseBlocks.length > 0
    ? toolUseBlocks.map(block => {
        if ('name' in block && 'input' in block && 'id' in block) {
          return {
            id: block.id,
            name: block.name,
            arguments: JSON.stringify(block.input),
          };
        }
        return null;
      }).filter((tc): tc is { id: string; name: string; arguments: string } => tc !== null)
    : null;

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
