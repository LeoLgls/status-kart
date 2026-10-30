// Manifeste lu par le hub, validé contre le schéma Manifest de integration-v1.yaml.
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

export const manifest = {
  id: 'status-kart',
  name: 'Status Kart',
  team: 'equipe-status-kart',
  theme: 'codes de statut HTTP',
  url: process.env.PUBLIC_URL ?? 'http://localhost:4000',
  levels: 1,
  contractVersion: '1.0',
};

export function validateManifest(value = manifest) {
  const contract = parse(readFileSync(new URL('../../../contracts/integration-v1.yaml', import.meta.url), 'utf8'));
  const { example, ...schema } = contract.components.schemas.Manifest;
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  return validate(value) ? [] : validate.errors.map((e) => `${e.instancePath || '(racine)'} ${e.message}`);
}
