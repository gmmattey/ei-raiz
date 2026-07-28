export interface FaqItem {
  pergunta: string
  resposta: string
}

// Fonte factual: documentacao/arquitetura/seguranca/{matriz-dados,auditoria-rede,
// inventario-dependencias,modelo-ameacas}-savro.md (issue #130). Nenhuma resposta aqui
// afirma algo que esses documentos não confirmem.
export const FAQ_ITEMS: FaqItem[] = [
  {
    pergunta: 'Preciso criar conta?',
    resposta:
      'Não. O Savro não tem login, cadastro nem conta de usuário. Você abre o app e já começa a organizar seu patrimônio no seu próprio aparelho.',
  },
  {
    pergunta: 'O Savro acessa minha conta bancária?',
    resposta:
      'Não. O Savro não se conecta a nenhuma conta bancária, corretora ou instituição financeira. Você registra seu patrimônio manualmente, e os dados ficam só no seu aparelho.',
  },
  {
    pergunta: 'Usa Open Finance?',
    resposta:
      'Não. O Savro não integra com Open Finance nem com nenhuma API bancária. Não existe conexão automática com instituições financeiras.',
  },
  {
    pergunta: 'Meus dados ficam na nuvem?',
    resposta:
      'Não. Não existe servidor que receba dados patrimoniais do Savro — o app funciona 100% local. A única exceção é o backup manual, que você mesmo gera e decide para onde enviar.',
  },
  {
    pergunta: 'Funciona sem internet?',
    resposta: 'Sim, o tempo todo. O Savro não depende de rede para nenhuma funcionalidade do app.',
  },
  {
    pergunta: 'Consigo usar no computador?',
    resposta: 'Ainda não. O Savro é um app nativo para Android e iPhone — não há versão web ou desktop.',
  },
  {
    pergunta: 'Como levo meus dados para outro celular?',
    resposta:
      'Como os dados ficam só no aparelho, você gera um backup manual protegido por senha no aparelho antigo e restaura no novo.',
  },
  {
    pergunta: 'O Savro recupera a senha do backup?',
    resposta:
      'Não. Não existe servidor para recuperar nada — se você perder a senha, não há como recuperar o conteúdo desse backup. Guarde a senha em um lugar seguro.',
  },
  {
    pergunta: 'O backup funciona entre Android e iPhone?',
    resposta: 'Sim. Você pode gerar um backup no Android e restaurar no iPhone, ou o caminho inverso.',
  },
  {
    pergunta: 'O arquivo CSV é protegido?',
    resposta:
      'Não. A exportação em CSV é texto claro, sem criptografia — assim você consegue abrir em qualquer planilha. Use com cuidado: quem tiver acesso ao arquivo lê o conteúdo.',
  },
  {
    pergunta: 'O Savro tem anúncios?',
    resposta: 'Não. O Savro não tem anúncios, não vende dados e não usa SDK de rastreamento ou publicidade.',
  },
  {
    pergunta: 'O aplicativo já está disponível?',
    resposta:
      'Ainda não. O Savro está em desenvolvimento para Android e iPhone. Assim que for publicado, o link oficial aparece na página inicial.',
  },
]
