// server.js
const express = require('express');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');

require('dotenv').config();

const app = express();
app.use(cors({
  origin: 'http://localhost:3000', // 프론트엔드 주소
}));
app.use(express.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.post('/api/generateCombinedWord', async (req, res) => {
  const { word1, word2 } = req.body;
  const prompt = `Combine the words "${word1}" and "${word2}" into a creative new word or phrase.`;

  try {
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt,
      max_tokens: 10,
    });

    const combinedWord = response.data.choices[0].text.trim();
    res.json({ combinedWord });
  } catch (error) {
    console.error('Error generating combined word:', error);
    res.status(500).json({ error: 'Failed to generate combined word' });
  }
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
