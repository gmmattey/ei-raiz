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
    pergunta: 'O Savro acessa meu banco?',
    resposta:
      'Não. O Savro não se conecta a nenhuma conta bancária, corretora ou instituição financeira. Você registra seu patrimônio manualmente, e os dados ficam só no seu aparelho.',
  },
  {
    pergunta: 'Usa Open Finance?',
    resposta:
      'Não. O Savro não integra com Open Finance nem com nenhuma API bancária. Não existe nenhuma conexão automática com instituições financeiras.',
  },
  {
    pergunta: 'Meus dados ficam na nuvem?',
    resposta:
      'Não. Não existe servidor que receba dados patrimoniais do Savro — o app funciona 100% local. A única exceção é o backup manual, que você mesmo gera e decide para onde enviar.',
  },
  {
    pergunta: 'Funciona sem internet?',
    resposta:
      'Sim, o tempo todo. O Savro não tem nenhuma dependência de rede — não precisa de internet para nenhuma funcionalidade do app.',
  },
  {
    pergunta: 'Consigo usar no computador?',
    resposta:
      'Ainda não. O MVP1 do Savro é um app nativo para Android e iOS. Não há versão web ou desktop no momento.',
  },
  {
    pergunta: 'O que acontece se eu trocar de celular?',
    resposta:
      'Como os dados ficam só no aparelho, a forma de levar seu patrimônio para o novo celular é gerar um backup manual protegido por senha no aparelho antigo e restaurá-lo no novo.',
  },
  {
    pergunta: 'O Savro recupera minha senha?',
    resposta:
      'Não. Não existe servidor para recuperar nada — se você perder a senha do backup, não há como recuperar o conteúdo desse arquivo. Guarde a senha em um lugar seguro.',
  },
  {
    pergunta: 'O backup funciona entre Android e iOS?',
    resposta:
      'Sim. O formato de backup (`.savrobackup`) é o mesmo nas duas plataformas — você pode gerar um backup no Android e restaurar no iOS, ou o caminho inverso.',
  },
  {
    pergunta: 'O CSV é protegido?',
    resposta:
      'Não. A exportação em CSV é texto claro, sem criptografia — é uma decisão de produto para permitir abrir em qualquer planilha. Use com cuidado: quem tiver acesso ao arquivo lê o conteúdo.',
  },
  {
    pergunta: 'Tem anúncios?',
    resposta:
      'Não. O Savro não tem anúncios, não vende dados e não usa nenhum SDK de rastreamento ou publicidade.',
  },
]
