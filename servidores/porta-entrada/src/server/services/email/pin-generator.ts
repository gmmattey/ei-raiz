/**
 * Deriva um PIN de 6 dígitos do token para ser exibido no email
 * Usa primeiros 6 caracteres do token e converte para dígitos
 * Formato: 000000 a 999999
 */
export function gerarPinSeisDígitos(token: string): string {
  let pin = '';
  // Pegar primeiros 6 caracteres do token
  const primeiros6 = (token || '').substring(0, 6);

  // Converter cada caractere para um dígito (0-9)
  for (let i = 0; i < 6; i++) {
    const char = primeiros6[i] || '0';
    // Se é dígito, usar direto; se é letra, converter usando charCode % 10
    if (/\d/.test(char)) {
      pin += char;
    } else {
      const charCode = char.charCodeAt(0);
      pin += (charCode % 10);
    }
  }

  return pin;
}
