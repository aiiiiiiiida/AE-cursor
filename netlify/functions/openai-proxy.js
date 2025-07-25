const { Configuration, OpenAIApi } = require("openai");

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

  // Set up OpenAI client
  const configuration = new Configuration({ apiKey });
  const openai = new OpenAIApi(configuration);

  try {
    // Example: Forward a chat completion request
    const response = await openai.createChatCompletion({
      model: body.model || "gpt-3.5-turbo",
      messages: body.messages,
      // ...add any other parameters you want to support
    });

    return {
      statusCode: 200,
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};