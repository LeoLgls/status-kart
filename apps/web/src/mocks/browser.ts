// Mocks du navigateur. VITE_MOCK choisit les opérations simulées, pour les remplacer une par une
// dès que le back répond :
//   (absent)                     toutes les opérations sont simulées
//   VITE_MOCK=startRun,finishRun  seules celles-ci ; les autres partent vers le vrai back
//   VITE_MOCK=0                   aucune (main.tsx ne démarre même pas MSW)
import { setupWorker } from 'msw/browser';
import { handlersByOperation, type Operation } from './handlers';

export function mockedOperations(setting: string | undefined): Operation[] {
  const all = Object.keys(handlersByOperation) as Operation[];
  if (!setting) return all;
  const wanted = setting.split(',').map((s) => s.trim());
  return all.filter((op) => wanted.includes(op));
}

export const worker = setupWorker(...mockedOperations(import.meta.env.VITE_MOCK).map((op) => handlersByOperation[op]));
