// /api/combineWords.js
export default async function handler(req, res) {
    const { word1, word2 } = req.body;
  
    // OpenAI API Key
    const apiKey = process.env.OPENAI_API_KEY;
  
    const prompt = `You are a 20-something American. I'll give you two words, "${word1}" and "${word2}", and you have to come up with one word that connects them. It should be humorous and Gen-Z style, and it must be a real, commonly used word. Respond with only the word, no extra symbols or explanations.`;
  
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
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
      res.status(200).json({ result: data.choices[0].message.content.trim() });
    } catch (error) {
      console.error('Error:', error.message);
      res.status(500).json({ error: 'Failed to fetch combined word' });
    }
  }
  