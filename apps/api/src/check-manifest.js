// npm run check:manifest : vérifie le manifeste contre le schéma du contrat d'intégration.
import { manifest, validateManifest } from './manifest.js';

const errors = validateManifest();
if (errors.length) {
  console.error('Manifeste invalide :\n- ' + errors.join('\n- '));
  process.exit(1);
}
console.log('Manifeste conforme au schéma Manifest :', manifest);
