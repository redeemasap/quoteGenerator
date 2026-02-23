import express from 'express';
import { createServer as createViteServer } from 'vite';
import db, { initializeDB, isDbSeeded } from './src/db/database';
import { seedDatabase } from './src/db/seed';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize and seed the database
  async function setupDatabase() {
    initializeDB();
    if (!isDbSeeded()) {
      console.log('Database is not seeded. Seeding now...');
      await seedDatabase();
    } else {
      console.log('Database is already seeded.');
    }
  }

  setupDatabase();

// API routes
app.get('/api/categories', (req, res) => {
  const stmt = db.prepare('SELECT name FROM categories');
  const categories = stmt.all();
  res.json(categories.map((c: any) => c.name));
});

app.get('/api/quote/random', (req, res) => {
  const noRepeat = req.query.noRepeat === 'true';
  let query = 'SELECT id, quote FROM quotes';
  if (noRepeat) {
    query += ' WHERE id NOT IN (SELECT quote_id FROM seen_quotes)';
  }
  query += ' ORDER BY RANDOM() LIMIT 1';

  const stmt = db.prepare(query);
  const quote = stmt.get();

  if (quote) {
    res.json(quote);
  } else {
    res.json({ quote: 'No new quotes found. Resetting seen quotes might help.' });
  }
});

app.get('/api/quote/category/:categoryName', (req, res) => {
  const { categoryName } = req.params;
  const noRepeat = req.query.noRepeat === 'true';
  
  let query = `
    SELECT q.id, q.quote 
    FROM quotes q
    JOIN categories c ON q.category_id = c.id
    WHERE c.name = ?
  `;
  if (noRepeat) {
    query += ' AND q.id NOT IN (SELECT quote_id FROM seen_quotes)';
  }
  query += ' ORDER BY RANDOM() LIMIT 1';

  const stmt = db.prepare(query);
  const quote = stmt.get(categoryName);

  if (quote) {
    res.json(quote);
  } else {
    res.json({ quote: `No new quotes found for category: ${categoryName}` });
  }
});

app.post('/api/quote/seen', (req, res) => {
  const { quote_id } = req.body;
  if (!quote_id) return res.status(400).json({ error: 'quote_id is required' });

  const stmt = db.prepare('INSERT OR IGNORE INTO seen_quotes (quote_id) VALUES (?)');
  stmt.run(quote_id);
  res.status(200).send();
});

app.post('/api/seen/reset', (req, res) => {
  db.exec('DELETE FROM seen_quotes');
  res.status(200).send();
});

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, you'll need to serve static files.
    // This part will be handled by the deployment environment.
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
