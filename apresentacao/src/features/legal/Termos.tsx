import React from 'react'
import { useSeo } from '../../hooks/useSeo'
import LegalLayout from './LegalLayout'
import LegalSection from './LegalSection'
import { SUPPORT_EMAIL } from '../../config/platforms'

const Termos: React.FC = () => {
  useSeo({
    title: 'Termos de Uso',
    description: 'Condições de uso do Savro: finalidade do app, responsabilidade sobre os dados, limitações e contato.',
    path: '/termos',
  })

  return (
    <LegalLayout title="Termos de Uso" subtitle="Vigência: a partir da publicação desta página.">
      <LegalSection title="1. Finalidade do app">
        <p>
          O Savro é uma ferramenta para organizar e acompanhar patrimônio pessoal — contas,
          bens e investimentos cadastrados manualmente. O Savro não é uma corretora, não presta
          serviço de custódia e não executa nenhuma operação financeira em seu nome.
        </p>
      </LegalSection>

      <LegalSection title="2. Sem consultoria financeira">
        <p>
          Nada no Savro constitui recomendação de investimento, consultoria financeira ou
          orientação profissional. As informações organizadas no app refletem apenas o que
          você mesmo cadastrou.
        </p>
      </LegalSection>

      <LegalSection title="3. Responsabilidade sobre os dados inseridos">
        <p>
          Você é responsável pela exatidão dos dados que cadastra no app. O Savro não valida
          nem confirma valores, saldos ou posições junto a bancos, corretoras ou qualquer
          instituição — o app reflete exatamente o que você digitou.
        </p>
      </LegalSection>

      <LegalSection title="4. Sem garantia de valorização ou exatidão patrimonial">
        <p>
          O Savro não garante a exatidão de cálculos derivados (como totais consolidados) além
          da correção dos dados de entrada, e não garante nem projeta valorização de nenhum
          ativo.
        </p>
      </LegalSection>

      <LegalSection title="5. Backup é sua responsabilidade">
        <p>
          Como os dados ficam só no seu aparelho, é sua responsabilidade manter um backup
          criptografado atualizado (<code>.savrobackup</code>) se quiser proteção contra perda,
          troca ou dano do aparelho. O Savro não guarda nenhuma cópia dos seus dados.
        </p>
      </LegalSection>

      <LegalSection title="6. Perda de senha do backup">
        <p>
          Se você perder a senha de um backup, não existe forma de recuperar o conteúdo desse
          arquivo — nem por nós, nem por qualquer suporte. Não há servidor patrimonial capaz de
          reverter essa perda.
        </p>
      </LegalSection>

      <LegalSection title="7. Limitações em aparelho comprometido">
        <p>
          O Savro não promete proteção contra aparelho com root/jailbreak comprometido por
          malware ativo. As proteções do app (criptografia em repouso, chave gerenciada pelo
          sistema) dependem da integridade do sistema operacional do aparelho.
        </p>
      </LegalSection>

      <LegalSection title="8. Exportação CSV não é cifrada">
        <p>
          A exportação em CSV é texto claro, sem proteção de senha. Compartilhar esse arquivo
          expõe o conteúdo a quem tiver acesso a ele — o app avisa isso antes de exportar.
        </p>
      </LegalSection>

      <LegalSection title="9. Propriedade intelectual">
        <p>
          O nome Savro, a marca, o ícone e o código do app e deste site pertencem aos seus
          titulares e não podem ser copiados, redistribuídos ou usados sem autorização.
        </p>
      </LegalSection>

      <LegalSection title="10. Disponibilidade">
        <p>
          O Savro está em desenvolvimento. Funcionalidades descritas neste site podem mudar
          antes do lançamento oficial nas lojas, e o app ainda não está disponível para
          download.
        </p>
      </LegalSection>

      <LegalSection title="11. Legislação aplicável">
        <p>Estes termos são regidos pelas leis da República Federativa do Brasil.</p>
      </LegalSection>

      {SUPPORT_EMAIL && (
        <LegalSection title="12. Contato">
          <p>
            Dúvidas sobre estes termos podem ser enviadas para{' '}
            <a href={`mailto:${SUPPORT_EMAIL}?subject=D%C3%BAvida%20sobre%20termos%20de%20uso`}>{SUPPORT_EMAIL}</a>.
          </p>
        </LegalSection>
      )}
    </LegalLayout>
  )
}

export default Termos
