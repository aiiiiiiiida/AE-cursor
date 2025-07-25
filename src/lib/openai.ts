import { ActivityTemplate } from '../types';

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

Here are the available activities:
${activityList}

Example user message: "I want to show a message at the end."
Example JSON response:
{
  "reply": "You can add a Message activity at the end of your workflow.",
  "suggestions": ["message-activity-id"]
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
    // Call the Netlify serverless function
    const response = await fetch('/.netlify/functions/openai-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: newMessages,
        // You can add more parameters if your function supports them
      })
    });

    if (!response.ok) {
      throw new Error(`Serverless function error: ${response.statusText}`);
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }
    return content;
  } catch (error) {
    console.error('Error sending message to OpenAI:', error);
    throw error;
  }
} 