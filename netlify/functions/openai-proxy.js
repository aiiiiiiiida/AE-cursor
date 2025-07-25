const OpenAI = require("openai");

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  // Parse the request body
  const body = JSON.parse(event.body);

  // Get your API key from environment variables
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: "OpenAI API key not set in environment variables.",
    };
  }

  const openai = new OpenAI({ apiKey });

  try {
    // Forward a chat completion request
    const response = await openai.chat.completions.create({
      model: body.model || "gpt-3.5-turbo",
      messages: body.messages,
      // ...add any other parameters you want to support
    });

    // Extract the assistant's reply
    const fullContent = response.choices[0]?.message?.content || '';
    let reply = fullContent;
    let suggestions = undefined;

    // Try to extract a JSON block for suggestions from the reply
    const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.suggestions) {
          suggestions = parsed.suggestions;
        }
        // Remove the JSON block from the reply
        reply = fullContent.replace(jsonMatch[0], '').trim();
      } catch (e) {
        // If JSON parsing fails, ignore and just use the full content as reply
      }
    }

    const result = { reply };
    if (suggestions) result.suggestions = suggestions;

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('OpenAI error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};