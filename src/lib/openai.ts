import OpenAI from 'openai';
import { ActivityTemplate } from '../types';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function sendMessageToOpenAI(
    messages: {role: 'user' | 'assistant' | 'system', content: string}[],
    activities: Pick<ActivityTemplate, 'id' | 'name' | 'description'>[]
) {
  const activityList = activities.map(a => `- ${a.name}: ${a.description} (id: ${a.id})`).join('\n');

  const systemPrompt = `
You are an expert workflow building assistant. Your goal is to help users build a workflow by suggesting only the most relevant activities from the list below.
- Only suggest activities that are directly and specifically relevant to the user's request.
- Do NOT suggest generic or unrelated activities.
- If only one activity is relevant, only suggest that one.
- If the user asks for a specific activity, only suggest that activity.
- IMPORTANT: When the user requests multiple activities in a specific order, maintain that exact order in your suggestions array.

Here are the available activities:
${activityList}

Example user message: "I want to show a message at the end."
Example JSON response:
{
  "reply": "You can add a Message activity at the end of your workflow.",
  "suggestions": ["message-activity-id"]
}

Example user message: "I want delay, ai agent, media, message"
Example JSON response:
{
  "reply": "Here are the activities you can add to your workflow:",
  "suggestions": ["delay-activity-id", "ai-agent-activity-id", "media-activity-id", "message-activity-id"]
}
`;

  const newMessages = [...messages];
  // Check if first message is system prompt, if so, replace it. Otherwise add it.
  if (newMessages[0]?.role === 'system') {
      newMessages[0].content = systemPrompt;
  } else {
      newMessages.unshift({ role: 'system', content: systemPrompt });
  }

  try {
    const completion = await openai.chat.completions.create({
      messages: newMessages,
      model: 'gpt-4o',
      response_format: { type: "json_object" }, // Ask for JSON response
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }
    return response;
  } catch (error) {
    console.error('Error sending message to OpenAI:', error);
    throw error;
  }
} 