import app from './app';

const PORT = 3000;

/** Starts the HTTP server and logs the port it is listening on. */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
