/**
 * Server entry, used only at build time: scripts/prerender.js renders every route to static HTML with it.
 * (Nothing runs on the Hostinger server; the output is plain files.)
 */
import 'zone.js/node';

export { AppServerModule } from './app/app.server.module';
