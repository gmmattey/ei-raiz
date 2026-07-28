import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { FAQ_ITEMS } from '../../legal/faqData'

const Faq: React.FC = () => {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="px-5 py-20 sm:px-8 sm:py-28" style={{ background: 'var(--bg-secondary)' }}>
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-12 text-center text-[1.75rem] font-bold sm:text-[2.25rem]">Perguntas frequentes</h2>

        <div className="flex flex-col gap-3">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = open === index
            return (
              <div key={item.pergunta} className="rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-[14.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {item.pergunta}
                  </span>
                  <ChevronDown
                    size={18}
                    color="var(--text-tertiary)"
                    style={{ transform: isOpen ? 'rotate(180deg)' : undefined, transition: 'transform .2s ease', flexShrink: 0 }}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <p className="px-5 pb-5 text-[13.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {item.resposta}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Faq
