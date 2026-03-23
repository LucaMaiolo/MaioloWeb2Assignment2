
import * as model from './jobModelMongoDB.js';
import app from './app.js';

const port: number = 1339;
const url = `${process.env.URL_PRE}${process.env.MONGODB_PWD}${process.env.URL_POST}`;

model.initialize('jobboard_db', false, url)
  .then(() => {
    app.listen(port, () => {
      console.log(`[server] Running at http://localhost:${port}`);
    });
  })
  .catch((error: Error) => {
    console.error('[server] Failed to initialize DB:', error.message);
  });
