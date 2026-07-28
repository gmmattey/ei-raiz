import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import PhoneMockup from './PhoneMockup'

const Hero: React.FC = () => {
  const reduce = useReducedMotion()

  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-14 sm:px-8 sm:pb-28 sm:pt-20">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 16 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
        >
          <span
            className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--secondary)', background: 'rgba(95,168,255,.12)', border: '1px solid rgba(95,168,255,.25)' }}
          >
            Em desenvolvimento
          </span>

          <h1 className="mb-5 max-w-xl text-[2.25rem] font-bold leading-[1.08] sm:text-[3rem]">
            Seu patrimônio, organizado só no seu aparelho.
          </h1>

          <p className="mb-9 max-w-md text-[1.0625rem] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            O Savro está sendo construído para quem quer organizar contas, bens e investimentos sem
            entregar esses dados a um servidor. Sem conta, sem nuvem — o app ainda não está
            disponível nas lojas.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="#como-funciona"
              className="rounded-full px-6 py-3.5 text-sm font-bold transition hover:opacity-90"
              style={{ background: 'var(--gradient-primary)', color: '#fff', boxShadow: 'var(--shadow-cta)' }}
            >
              Conhecer o produto
            </a>
            <a
              href="#plataformas"
              className="rounded-full px-6 py-3.5 text-sm font-bold transition"
              style={{ border: '1.5px solid var(--border)', color: 'var(--text-primary)' }}
            >
              Acompanhar lançamento
            </a>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-7 gap-y-3">
            {['Local-first, sem nuvem', 'Sem login, sem cadastro', 'Sem anúncios'].map((item) => (
              <li key={item} className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M4 10.5l4 4L16 6" stroke="var(--secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={reduce ? undefined : { opacity: 0, scale: 0.96 }}
          animate={reduce ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.2, 0, 0, 1], delay: 0.1 }}
        >
          <PhoneMockup />
        </motion.div>
      </div>
    </section>
  )
}

export default Hero
