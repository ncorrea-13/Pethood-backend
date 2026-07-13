import { app } from './app';
import { env } from './config/env';

const server = app.listen(env.PORT, () => {
  console.log(`✅ PETHOOD API escuchando en http://localhost:${env.PORT}`);
});

process.on('SIGINT', () => {
  console.log('\nCerrando servidor...');
  server.close(() => process.exit(0));
});
