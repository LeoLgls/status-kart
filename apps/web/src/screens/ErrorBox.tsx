// Erreur du contrat (401, 409, 422, 502...) affichée telle que le back l'explique.
import { isApiError } from '../api/queries';

export function ErrorBox({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  if (!error) return null;
  const message = isApiError(error) ? `${error.error.message} (${error.error.code})` : 'Le serveur ne répond pas.';
  return (
    <div role="alert" className="alert">
      <span>{message}</span>
      {onRetry && <button className="alt" onClick={onRetry}>RÉESSAYER</button>}
    </div>
  );
}
