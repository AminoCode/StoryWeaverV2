'use strict';
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text = '', existingCharacters = [], existingLocations = [] } = req.body;
  const plainText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000);
  const existing  = `Existing characters: ${existingCharacters.join(', ') || 'none'}. Existing locations: ${existingLocations.join(', ') || 'none'}.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 700,
      system: 'You are a story element extractor. Return ONLY valid JSON with no commentary or markdown. Extract ONLY elements explicitly present in the text. Max 4 items per category. Be concise in descriptions (under 20 words each).',
      messages: [{
        role: 'user',
        content: `${existing}\n\nText:\n${plainText}\n\nReturn JSON:\n{"characters":[{"name":"","role":"protagonist|antagonist|supporting|ally|minor","description":""}],"locations":[{"name":"","type":"city|building|dungeon|district|alley|other","description":"","atmosphere":""}],"events":[{"title":"","description":"","importance":"major|minor|background"}],"items":[{"name":"","type":"weapon|reward|object|artifact|other","description":""}]}`,
      }],
    });
    res.status(200).json({ result: response.content[0].text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
