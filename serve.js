import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const app = express();
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');

app.use(
  express.static(distPath, {
    dotfiles: 'ignore',
    index: false,
    maxAge: '1y',
    immutable: true,
  })
);

app.get('*', (req, res, next) => {
  if (path.extname(req.path)) {
    return res.status(404).send('Not Found');
  }

  return res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
