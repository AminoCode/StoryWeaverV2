'use strict';
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages = [], projectContext = {} } = req.body;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: `You are a smart, creative writing partner for a story called "${projectContext.name || 'Untitled'}". You know the story deeply.\n\nCharacters: ${projectContext.characters || 'none'}\nLocations: ${projectContext.locations || 'none'}\nRecent events: ${projectContext.events || 'none'}\n\nBe concise, insightful, and creatively helpful. Answer questions, suggest ideas, flag inconsistencies.`,
      messages,
    });
    res.status(200).json({ result: response.content[0].text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
