import React from 'react';

export interface SplashScreenProps {
  onStart(): void;
  onSeeHowItWorks(): void;
}

export function SplashScreen(props: SplashScreenProps): JSX.Element {
  return (
    <div className="app">
      <div className="container" style={{ paddingTop: 28, paddingBottom: 42 }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src="/brand/esquilo-icon.png"
              alt="Esquilo"
              width={40}
              height={40}
              style={{ borderRadius: 12, background: 'rgba(255,255,255,0.85)', boxShadow: 'var(--shadow-1)' }}
            />
            <div>
              <div style={{ fontWeight: 800, letterSpacing: 0.2 }}>Esquilo</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>Consolidar. Traduzir. Orientar.</div>
            </div>
          </div>

          <button className="btn btnGhost" onClick={props.onSeeHowItWorks}>
            Como funciona
          </button>
        </header>

        <main className="splashMain">
          <section className="card splashHero">
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                right: -120,
                top: -120,
                width: 320,
                height: 320,
                borderRadius: 999,
                background:
                  'radial-gradient(circle at 30% 30%, rgba(245,106,42,0.55), rgba(245,106,42,0.0) 62%)'
              }}
            />

            <div className="pill">
              <span className="pillDot" />
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.2 }}>Primeiro acesso</span>
            </div>

            <h1
              style={{
                margin: '14px 0 0 0',
                fontFamily: 'var(--font-serif)',
                fontSize: 38,
                lineHeight: 1.05,
                letterSpacing: -0.4
              }}
            >
              Clareza em minutos.
              <br />
              Sem virar analista.
            </h1>

            <p style={{ margin: '12px 0 0 0', fontSize: 15, lineHeight: 1.45, color: 'var(--c-slate)' }}>
              O Esquilo organiza sua carteira, traduz o que importa e orienta o próximo passo. Ele não executa ordens
              por você, só te ajuda a decidir melhor.
            </p>

            <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btnPrimary" onClick={props.onStart}>
                Começar
              </button>
              <span style={{ alignSelf: 'center', fontSize: 12, opacity: 0.75 }}>
                Primeiro: 5 passos rápidos para entender seu contexto.
              </span>
            </div>
          </section>

          <aside className="splashAside">
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 900 }}>O que você ganha</div>
              <ul style={{ margin: '10px 0 0 18px', padding: 0, color: 'var(--c-slate)', lineHeight: 1.55 }}>
                <li>Patrimônio e distribuição sem ruído.</li>
                <li>Um problema principal por vez.</li>
                <li>Uma ação recomendada plausível.</li>
              </ul>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 900 }}>Sem burocracia</div>
              <p style={{ margin: '10px 0 0 0', color: 'var(--c-slate)', lineHeight: 1.5 }}>
                Você vê valor antes de preencher qualquer coisa pesada. Quando faltar dado, o produto te orienta o
                próximo passo.
              </p>
            </div>
          </aside>
        </main>

        <footer style={{ marginTop: 16, fontSize: 12, color: 'var(--c-slate)' }}>
          <span style={{ opacity: 0.9 }}>
            Nota: recomendações são orientação, não imposição. Nada é executado automaticamente.
          </span>
        </footer>
      </div>
    </div>
  );
}
