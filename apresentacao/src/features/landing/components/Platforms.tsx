import React from 'react'
import { PLAY_STORE_URL, APP_STORE_URL, SUPPORT_EMAIL } from '../../../config/platforms'
import StoreLinks from './StoreLinks'

const PLATFORM_CARDS = [
  { name: 'Android', status: PLAY_STORE_URL ? 'Disponível' : 'Em desenvolvimento' },
  { name: 'iOS', status: APP_STORE_URL ? 'Disponível' : 'Em desenvolvimento' },
]

const Platforms: React.FC = () => {
  return (
    <section id="plataformas" className="px-5 py-20 sm:px-8 sm:py-28" style={{ background: 'var(--bg-secondary)' }}>
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="mb-4 text-[1.75rem] font-bold sm:text-[2.25rem]">Feito para Android e iPhone</h2>
        <p className="mx-auto mb-12 max-w-xl text-[1.0625rem] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          O Savro está em desenvolvimento. Os links oficiais aparecerão aqui quando cada versão for publicada.
        </p>

        <div className="mb-10 grid gap-4 sm:grid-cols-2">
          {PLATFORM_CARDS.map((platform) => (
            <div key={platform.name} className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="mb-2 text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                {platform.name}
              </div>
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-[11.5px] font-semibold"
                style={{
                  color: platform.status === 'Disponível' ? 'var(--positive)' : 'var(--text-tertiary)',
                  background: platform.status === 'Disponível' ? 'rgba(41,211,178,.12)' : 'var(--disabled-bg)',
                }}
              >
                {platform.status}
              </span>
            </div>
          ))}
        </div>

        <StoreLinks />

        {SUPPORT_EMAIL && (
          <p className="mt-8 text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
            Quer ser avisado quando lançar?{' '}
            <a href={`mailto:${SUPPORT_EMAIL}?subject=Quero%20saber%20quando%20o%20Savro%20lan%C3%A7ar`} className="font-semibold">
              Manda um e-mail
            </a>{' '}
            e a gente avisa.
          </p>
        )}
      </div>
    </section>
  )
}

export default Platforms
