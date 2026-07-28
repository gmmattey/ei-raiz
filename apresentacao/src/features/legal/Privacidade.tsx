import React from 'react'
import { useSeo } from '../../hooks/useSeo'
import LegalLayout from './LegalLayout'
import LegalSection from './LegalSection'
import { SUPPORT_EMAIL } from '../../config/platforms'

const Privacidade: React.FC = () => {
  useSeo({
    title: 'Política de Privacidade',
    description: 'Como o Savro trata dados: sem conta, sem coleta de dados patrimoniais, sem nuvem, sem anúncios. Tudo fica no seu aparelho.',
    path: '/privacidade',
  })

  return (
    <LegalLayout title="Política de Privacidade" subtitle="Vigência: a partir da publicação desta página.">
      <LegalSection title="1. O que este documento cobre">
        <p>
          Esta política descreve como o app Savro (Android/iOS) e o site institucional
          savro.app tratam dados. O Savro está em desenvolvimento — o MVP1 ainda não foi
          publicado nas lojas.
        </p>
      </LegalSection>

      <LegalSection title="2. Sem conta, sem cadastro">
        <p>
          O Savro não exige conta, login, e-mail ou senha de acesso a um serviço. Não existe
          identidade de usuário armazenada por nós — o app funciona local-first, sem
          autenticação de servidor.
        </p>
      </LegalSection>

      <LegalSection title="3. Dados patrimoniais nunca saem do seu aparelho">
        <p>
          Nome, valor, quantidade, instituição, observações e histórico dos itens que você
          cadastra ficam guardados em um banco de dados local criptografado (AES-256, via
          SQLCipher), só no seu aparelho. Não existe servidor do Savro que receba, processe ou
          armazene esses dados — a arquitetura do app não tem nenhuma dependência de rede.
        </p>
        <p>
          Exceções acontecem apenas por ação explícita sua: o backup criptografado
          (<code>.savrobackup</code>) e a exportação em CSV são arquivos que você mesmo gera e
          entrega, via seletor nativo do sistema, ao destino que você escolher. O Savro nunca
          decide esse destino por você.
        </p>
      </LegalSection>

      <LegalSection title="4. Sem tracking, sem anúncios, sem venda de dados">
        <p>
          O Savro não usa nenhum SDK de rastreamento, analytics invasivo, anúncio ou crash
          reporter que capture dado do usuário. Não vendemos, alugamos ou compartilhamos
          nenhum dado com terceiros — porque não coletamos nenhum dado patrimonial para
          começo de conversa.
        </p>
      </LegalSection>

      <LegalSection title="5. Funcionamento offline e armazenamento local">
        <p>
          O app funciona inteiramente offline. Todo o processamento acontece no seu aparelho —
          nenhuma tela do Savro depende de conexão de internet.
        </p>
      </LegalSection>

      <LegalSection title="6. Dados técnicos deste site institucional (savro.app)">
        <p>
          O código deste site (o repositório que serve esta página) não declara nenhuma
          dependência de analytics, rastreamento ou anúncio em seu arquivo de dependências.
          Se a hospedagem (Cloudflare Pages) registrar logs técnicos padrão de servidor (como IP
          e user-agent, comuns a qualquer provedor de hospedagem web), esse dado é operacional
          da infraestrutura, não é coletado ativamente pelo Savro para nenhuma finalidade de
          produto.
        </p>
      </LegalSection>

      <LegalSection title="7. Backup manual e exportação CSV">
        <p>
          O backup (<code>.savrobackup</code>) é protegido por uma senha que só você define — sem
          essa senha, o arquivo não pode ser aberto, nem por nós. A exportação em CSV, ao
          contrário, é texto claro sem criptografia — é uma decisão de produto para permitir
          abrir em qualquer planilha, e o app avisa isso antes de exportar.
        </p>
      </LegalSection>

      <LegalSection title="8. Seus direitos sobre os dados">
        <p>
          Como nenhum dado patrimonial sai do seu aparelho, você tem controle total sobre ele o
          tempo todo: pode editar, excluir ou apagar tudo desinstalando o app. Não há cópia em
          nosso poder para solicitar exclusão, porque nunca chegou até nós.
        </p>
      </LegalSection>

      <LegalSection title="9. Controlador responsável">
        <p style={{ color: 'var(--warning)' }}>
          [Dado pendente de aprovação legal — razão social/CNPJ do controlador responsável pelo
          tratamento de dados.]
        </p>
      </LegalSection>

      <LegalSection title="10. Contato">
        {SUPPORT_EMAIL ? (
          <p>
            Dúvidas sobre esta política podem ser enviadas para{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
          </p>
        ) : (
          <p style={{ color: 'var(--warning)' }}>
            [Canal de contato pendente de configuração — nenhum e-mail de suporte aprovado até
            a publicação desta página.]
          </p>
        )}
      </LegalSection>
    </LegalLayout>
  )
}

export default Privacidade
