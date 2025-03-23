// /api/route.js
export default async function handler(req, res) {
  const { userWords } = req.body; 

  // OpenAI API Key
  const apiKey = process.env.OPENAI_API_KEY;

  const joinedWords = userWords.join(', ');

  const prompt = `
    You are a helpful assistant for someone who doesn't know what to do today.
    The user has given these words: "${joinedWords}"
    Based on these words, suggest a single activity they can do today.
    Respond with only the activity itself and keep it brief (one sentence maximum).
  `;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4', // 'gpt-3.5-turbo' 
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from OpenAI API');
    }

    const data = await response.json();
    const recommendation = data.choices[0].message.content.trim();
    res.status(200).json({ result: recommendation });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch recommendation' });
  }
}
