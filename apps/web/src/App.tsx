// Les trois écrans du niveau 1. Seul l'écran affiché est local ; les réponses de l'API restent dans le
// cache de requêtes (src/api/queries.ts). La course en canvas remplacera Quiz.
import { useRef, useState } from 'react';
import type { Run } from './api/client';
import { useAnswer, useFinish } from './api/queries';
import { ErrorBox } from './screens/ErrorBox';
import { Resultats, type Miss } from './screens/Resultats';
import { Titre } from './screens/Titre';

type Screen = { name: 'titre' } | { name: 'course'; run: Run } | { name: 'fin'; run: Run; misses: Miss[] };

// En attendant la course : chaque barrière est un choix de couloir, le verdict vient de answerQuestion.
function Quiz({ run, onFinish }: { run: Run; onFinish: (misses: Miss[]) => void }) {
  const [index, setIndex] = useState(0);
  const answer = useAnswer();
  const misses = useRef<Miss[]>([]);
  const q = run.questions[index];
  const v = answer.data;
  const last = index + 1 === run.questions.length;

  function choose(lane: number) {
    answer.mutate({ runId: run.runId, questionId: q.id, lane }, {
      onSuccess: (r) => { if (!r.correct) misses.current.push({ code: r.code, situation: q.situation }); },
    });
  }

  return (
    <main className="wrap">
      <div className="screen">
        <p className="pill">{run.circuit} · BARRIERE {index + 1}/{run.questions.length}</p>
        <ul className="bars"><li>{q.situation}</li></ul>
        <div className="btns" style={{ gridTemplateColumns: 'repeat(3, 1fr)', width: 'min(100%, 640px)' }}>
          {q.lanes.map((code, i) => (
            <button key={i} className={v && i !== v.correctLane ? 'alt' : ''} onClick={() => choose(i)} disabled={!!v || answer.isPending}>{code}</button>
          ))}
        </div>
        {v && <ul className="bars"><li><b className={v.correct ? 'g' : 'r'}>{v.correct ? 'BOOST !' : 'CARAPACE !'}</b> {v.code} {v.name} : {v.explanation}</li></ul>}
        <ErrorBox error={answer.error} />
        {v && <button onClick={() => (last ? onFinish(misses.current) : (answer.reset(), setIndex(index + 1)))}>{last ? 'ARRIVEE' : 'BARRIERE SUIVANTE'}</button>}
      </div>
    </main>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'titre' });
  const finish = useFinish();

  if (screen.name === 'course') {
    const { run } = screen;
    return <Quiz run={run} onFinish={(misses) => { finish.mutate(run.runId); setScreen({ name: 'fin', run, misses }); }} />;
  }
  if (screen.name === 'fin') {
    return (
      <Resultats finish={finish} runId={screen.run.runId} circuit={screen.run.circuit} misses={screen.misses}
        onReplay={() => { finish.reset(); setScreen({ name: 'titre' }); }} />
    );
  }
  return <Titre onStart={(run) => setScreen({ name: 'course', run })} />;
}
