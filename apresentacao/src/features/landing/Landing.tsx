import React from 'react'
import { useSeo, useJsonLd } from '../../hooks/useSeo'
import { SITE_URL } from '../../config/site'
import './savro-tokens.css'
import SavroHeader from './components/SavroHeader'
import SavroFooter from './components/SavroFooter'
import Hero from './components/Hero'
import PrivacySection from './components/PrivacySection'
import Benefits from './components/Benefits'
import HowItWorks from './components/HowItWorks'
import Security from './components/Security'
import Platforms from './components/Platforms'
import Commercial from './components/Commercial'
import Faq from './components/Faq'

const Landing: React.FC = () => {
  useSeo({
    title: 'Savro | Organização patrimonial local-first, sem nuvem',
    description:
      'O Savro é um app para organizar seu patrimônio com os dados sempre no seu aparelho — sem conta, sem nuvem, sem anúncios. Em desenvolvimento, em breve nas lojas.',
    path: '/',
    image: `${SITE_URL}/assets/savro/icon-512x512.png`,
  })

  useJsonLd('savro-org', {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Savro',
    url: SITE_URL,
    logo: `${SITE_URL}/assets/savro/savro-logo-completo.svg`,
  })

  useJsonLd('savro-app', {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Savro',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Android, iOS',
    // Honesto: o app não está publicado ainda — sem rating/reviews inventados.
    releaseNotes: 'Em desenvolvimento — ainda não publicado nas lojas.',
  })

  return (
    <div className="savro">
      <SavroHeader />
      <main>
        <Hero />
        <PrivacySection />
        <Benefits />
        <HowItWorks />
        <Security />
        <Platforms />
        <Commercial />
        <Faq />
      </main>
      <SavroFooter />
    </div>
  )
}

export default Landing
