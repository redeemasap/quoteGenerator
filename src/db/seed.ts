import db from './database';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const categories = [
  'Motivation',
  'Gratitude',
  'Affirmations',
  'Gym Motivation',
  'Positive Thoughts',
];

const fallbackQuotes: { [key: string]: string[] } = {
  'Motivation': [
    "The only way to do great work is to love what you do.",
    "Believe you can and you're halfway there.",
    "The future belongs to those who believe in the beauty of their dreams."
  ],
  'Gratitude': [
    "Gratitude turns what we have into enough.",
    "The more grateful I am, the more beauty I see.",
    "Start each day with a grateful heart."
  ],
  'Affirmations': [
    "I am worthy of my dreams.",
    "I am in charge of my own happiness.",
    "I am confident in my ability to succeed."
  ],
  'Gym Motivation': [
    "The only bad workout is the one that didn't happen.",
    "Sweat is just fat crying.",
    "Your body can stand almost anything. It’s your mind that you have to convince."
  ],
  'Positive Thoughts': [
    "A positive mindset brings positive things.",
    "Once you replace negative thoughts with positive ones, you'll start having positive results.",
    "The happiness of your life depends upon the quality of your thoughts."
  ]
};

async function generateQuotesForCategory(category: string, count: number) {
  console.log(`Generating ${count} quotes for category: ${category}...`);
  const model = 'gemini-3-flash-preview';
  const prompt = `Generate ${count} unique, single or two-line quotes for the category "${category}". The quotes should be inspirational and concise. Return the quotes as a JSON array of strings. For example: ["quote 1", "quote 2"]`;

  try {
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
        }
    });
    const jsonText = response.text.trim();
    const quotes = JSON.parse(jsonText);
    return quotes as string[];
  } catch (error) {
    console.error(`Error generating quotes for ${category}, using fallback.`, error);
    return fallbackQuotes[category] || [];
  }
}

export async function seedDatabase() {
  console.log('Starting to seed the database...');

  const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
  const getCategory = db.prepare('SELECT id FROM categories WHERE name = ?');
  const getQuoteCountForCategory = db.prepare('SELECT COUNT(*) as count FROM quotes WHERE category_id = ?');
  const insertQuote = db.prepare('INSERT INTO quotes (quote, category_id) VALUES (?, ?)');

  for (const categoryName of categories) {
    // Ensure category exists
    insertCategory.run(categoryName);
    
    // Get category ID
    const category = getCategory.get(categoryName) as { id: number };
    if (!category) {
        console.error(`Could not find or create category: ${categoryName}`);
        continue;
    }
    const categoryId = category.id;

    // Check if quotes already exist for this category
    const { count } = getQuoteCountForCategory.get(categoryId) as { count: number };

    if (count === 0) {
        console.log(`No quotes found for ${categoryName}. Seeding...`);
        const quotes = await generateQuotesForCategory(categoryName, 10); // This will use fallback if API fails
        
        for (const quoteText of quotes) {
            insertQuote.run(quoteText, categoryId);
        }
        console.log(`Inserted ${quotes.length} quotes for ${categoryName}.`);
    } else {
        console.log(`Category "${categoryName}" already has quotes. Skipping.`);
    }
  }

  console.log('Database seeding complete.');
}
