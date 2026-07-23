/**
 * API KEY
 * Centraliza a leitura e a gravacao da chave do Gemini via Script Properties.
 */

const GEMINI_API_KEY_FALLBACK_ = 'AIzaSyAtiRraF1gvSlZ-_8IWdi-oMSUCHdaoYag';

function getGeminiKey_() {
  const props = PropertiesService.getScriptProperties();
  const key = (props.getProperty('GEMINI_API_KEY') || '').trim();
  if (key) return key;

  if (!GEMINI_API_KEY_FALLBACK_) return '';

  props.setProperty('GEMINI_API_KEY', GEMINI_API_KEY_FALLBACK_);
  return GEMINI_API_KEY_FALLBACK_;
}

function setGeminiKey() {
  PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', GEMINI_API_KEY_FALLBACK_);
  Logger.log('Chave Gemini salva com sucesso.');
}

function testarGeminiKey() {
  const key = getGeminiKey_();
  Logger.log(key ? 'GEMINI_API_KEY OK' : 'GEMINI_API_KEY VAZIA');
}
