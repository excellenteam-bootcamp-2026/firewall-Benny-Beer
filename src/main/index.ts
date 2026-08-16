import app from './app';
import { config } from './env';

/** Starts the HTTP server and logs the port it is listening on. */
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port} [${config.env}]`);
});
