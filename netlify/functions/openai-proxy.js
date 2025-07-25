const OpenAI = require("openai");

exports.handler = async function(event, context) {
  try {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Parse the request body
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (parseError) {
      console.error('Request body parse error:', parseError, event.body);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON in request body', details: parseError.message }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Get your API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OpenAI API key not set in environment variables.');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "OpenAI API key not set in environment variables." }),
        headers: { 'Content-Type': 'application/json' }
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
          console.error('Suggestion JSON parse error:', e, jsonMatch[0]);
        }
      }

      const result = { reply };
      if (suggestions) result.suggestions = suggestions;

      return {
        statusCode: 200,
        body: JSON.stringify(result),
        headers: { 'Content-Type': 'application/json' }
      };
    } catch (error) {
      console.error('OpenAI error:', error, error?.response?.data);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: error.message || 'Unknown error',
          details: error?.response?.data || null,
          stack: error.stack || null
        }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
  } catch (outerError) {
    console.error('Unexpected serverless function error:', outerError);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: outerError.message || 'Unknown serverless function error',
        stack: outerError.stack || null
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};