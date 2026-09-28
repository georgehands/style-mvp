require('dotenv').config();
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const STYLIST_SYSTEM_PROMPT = `You are an expert men's stylist who specializes in decisive, confidence-focused style for men who feel invisible, insecure, or stuck, and who want a fast, visible identity shift rather than a months-long overhaul.

Given the details you're sent, return ONE complete outfit: top, bottom, shoes, one outerwear or layering piece, and one accessory. For each piece, name the item type, colour, and fit, and give a short, specific reason it works for this exact build, budget, and goal.

Rules:
- Give one definitive outfit, never a menu of alternatives.
- Every piece must realistically fit inside the stated budget as a whole set.
- Tie the reasoning back to their build (e.g. proportions, height) and their stated goal, not generic style advice.
- If they push back on a piece in a follow-up message, adjust only that piece and keep the rest of the outfit intact, still one decisive answer.
- Keep the tone direct and plain, like a stylist friend talking to them, not a catalogue description.`;

app.post('/api/style', async (req, res) => {
  const { height, build, budget, styleWords, goal } = req.body;

  if (!height || !build || !budget || !styleWords || !goal) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 800,
      system: STYLIST_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Height: ${height}\nBuild: ${build}\nBudget: ${budget}\nStyle words: ${styleWords}\nWhat they actually want to change: ${goal}`,
        },
      ],
    });

    res.json({ result: message.content[0].text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong generating the outfit.' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`style-mvp running on http://localhost:${port}`));
