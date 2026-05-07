'use strict';
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPTS = {
  novel:      'You are a professional novel formatter. Reformat the text as standard literary prose with paragraph breaks, dialogue in quotation marks, and immersive descriptive narrative. Preserve all story content.',
  screenplay: 'You are a professional screenplay formatter. Reformat as a Hollywood screenplay: INT./EXT. scene headings in CAPS, action lines in present tense, CHARACTER NAMES centered above dialogue, (parentheticals) where needed. Preserve all story content.',
  stage_play: 'You are a professional playwright. Reformat as a stage play script: CHARACTER NAME in CAPS followed by colon and dialogue, stage directions in [brackets], ACT/SCENE headers. Preserve all story content.',
  tv_script:  'You are a professional TV writer. Reformat as a TV script with TEASER/ACT structure, scene headings, character names centered, dialogue and parentheticals. Preserve all story content.',
  magazine:   'You are a professional magazine editor. Reformat as a compelling magazine article with a strong headline, subheadings, pull quotes in italics, and journalistic prose. Preserve all story content.',
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { content = '', format = 'novel' } = req.body;
  const plainText = content.replace(/<[^>]*>/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: SYSTEM_PROMPTS[format] || SYSTEM_PROMPTS.novel,
      messages: [{ role: 'user', content: `Reformat this text:\n\n${plainText}` }],
    });
    res.status(200).json({ result: response.content[0].text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
