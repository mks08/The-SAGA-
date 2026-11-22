import type { Lang } from '../../config/chaix.knowledge';

/** The words of the ChaiX window itself (not its answers: those are in config/chaix.knowledge.ts), in English and Hindi. */
export interface ChaixText {
  launcher: string;
  launcherAria: string;
  /** The speech bubble beside the launcher: first "How can I help you?", a few seconds later "My name is ChaiX" with "Online". */
  promptHelp: string;
  promptName: string;
  online: string;
  promptAria: string;
  promptDismiss: string;
  dialog: string;
  title: string;
  subtitle: string;
  placeholder: string;
  inputLabel: string;
  send: string;
  close: string;
  /** The label of the language switch is the OTHER language, written in that language. */
  switchLabel: string;
  switchAria: string;
  switchLang: Lang;
  typing: string;
  you: string;
  bot: string;
  formTitle: string;
  formIntro: string;
  question: string;
  questionPh: string;
  errQuestion: string;
  submit: string;
  notNow: string;
  /** The standing link under the message box: the visitor can always send a question to the team. */
  toTeam: string;
  thanks: (firstName: string, phone: string, email: string) => string;
  chatSentWith: string;
  /** The line under the question box: what makes the team's reply useful. */
  formHint: string;
  /** The "Most asked" strip pinned above the message box. */
  pinnedLabel: string;
  pinnedAria: string;
  loadError: string;
  chatLog: string;
  suggestions: string;
  waMessage: string;
}

export const CHAIX_EN: ChaixText = {
  launcher: 'Ask ChaiX',
  launcherAria: 'Ask ChaiX, the SHRINEVA leasing assistant',
  promptHelp: 'How can I help you?',
  promptName: 'My name is ChaiX',
  online: 'Online',
  promptAria: 'ChaiX, the SHRINEVA leasing assistant. How can I help you?',
  promptDismiss: 'Hide this message',
  dialog: 'ChaiX, the SHRINEVA leasing assistant',
  title: 'ChaiX',
  subtitle: 'SHRINEVA leasing assistant',
  placeholder: 'Ask about floors, location, plans…',
  inputLabel: 'Your question',
  send: 'Send',
  close: 'Close',
  switchLabel: 'हिन्दी',
  switchAria: 'Switch to Hindi',
  switchLang: 'hi',
  typing: 'ChaiX is typing',
  you: 'You',
  bot: 'ChaiX',
  formTitle: 'Send your question to the team',
  formIntro: 'Add your name, mobile number and email. The leasing team replies on either.',
  question: 'Your question',
  questionPh: 'e.g. I run a coaching institute and need about 3,500 sq ft. Which floor would suit, and can I see the plans?',
  errQuestion: 'Please write your question',
  submit: 'Send to the leasing team',
  notNow: 'Not now',
  toTeam: 'Send my question to the team',
  thanks: (n, p, e) => `Thank you, ${n}. Your question has gone to the leasing team.\n• They will reply on ${e} or call ${p}\n• Your chat so far went with it, so you need not repeat it\n• You can keep asking me anything in the meantime`,
  chatSentWith: 'The chat so far is sent with it, so you do not have to repeat it.',
  formHint: 'It helps to mention your business, the space you need and your parking need.',
  pinnedLabel: 'Most asked',
  pinnedAria: 'Most asked questions. Tap one to get the answer.',
  loadError: 'I could not start just now. Please call or WhatsApp the leasing team, or try again in a moment.',
  chatLog: 'Conversation with ChaiX',
  suggestions: 'Suggested questions',
  waMessage: 'Hi, I am interested in commercial space at SHRINEVA, Bada Lalpur, Varanasi.',
};

export const CHAIX_HI: ChaixText = {
  launcher: 'ChaiX से पूछें',
  launcherAria: 'ChaiX से पूछें, SHRINEVA की लीज़िंग असिस्टेंट',
  promptHelp: 'मैं आपकी कैसे मदद करूँ?',
  promptName: 'मेरा नाम ChaiX है',
  online: 'ऑनलाइन',
  promptAria: 'ChaiX, SHRINEVA की लीज़िंग असिस्टेंट। मैं आपकी कैसे मदद करूँ?',
  promptDismiss: 'यह संदेश छिपाएँ',
  dialog: 'ChaiX, SHRINEVA की लीज़िंग असिस्टेंट',
  title: 'ChaiX',
  subtitle: 'SHRINEVA लीज़िंग असिस्टेंट',
  placeholder: 'मंज़िल, लोकेशन, प्लान के बारे में पूछें…',
  inputLabel: 'आपका सवाल',
  send: 'भेजें',
  close: 'बंद करें',
  switchLabel: 'English',
  switchAria: 'Switch to English',
  switchLang: 'en',
  typing: 'ChaiX का जवाब आ रहा है',
  you: 'आप',
  bot: 'ChaiX',
  formTitle: 'अपना सवाल टीम को भेजें',
  formIntro: 'अपना नाम, मोबाइल नंबर और ईमेल लिखिए। लीज़िंग टीम इनमें से किसी पर जवाब देगी।',
  question: 'आपका सवाल',
  questionPh: 'जैसे: कोचिंग संस्थान के लिए लगभग 3,500 वर्ग फुट चाहिए। कौन सी मंज़िल ठीक रहेगी और प्लान कब देख सकते हैं?',
  errQuestion: 'कृपया अपना सवाल लिखें',
  submit: 'लीज़िंग टीम को भेजें',
  notNow: 'अभी नहीं',
  toTeam: 'मेरा सवाल टीम को भेजें',
  thanks: (n, p, e) => `धन्यवाद, ${n}। आपका सवाल लीज़िंग टीम तक पहुँच गया है।\n• वे ${e} पर जवाब देंगे या ${p} पर कॉल करेंगे\n• अब तक की बातचीत साथ गई है, इसलिए दोबारा बताने की ज़रूरत नहीं\n• तब तक आप मुझसे कुछ भी पूछ सकते हैं`,
  chatSentWith: 'अब तक की बातचीत साथ में जाती है, इसलिए दोबारा बताने की ज़रूरत नहीं।',
  formHint: 'अपना व्यवसाय, ज़रूरी जगह और पार्किंग की ज़रूरत लिखें तो जवाब ज़्यादा काम का होगा।',
  pinnedLabel: 'अक्सर पूछे जाने वाले सवाल',
  pinnedAria: 'अक्सर पूछे जाने वाले सवाल। जवाब के लिए किसी एक पर टैप करें।',
  loadError: 'अभी शुरू नहीं हो पाया। कृपया लीज़िंग टीम को कॉल या WhatsApp करें, या थोड़ी देर बाद कोशिश करें।',
  chatLog: 'ChaiX के साथ बातचीत',
  suggestions: 'सुझाए गए सवाल',
  waMessage: 'नमस्ते, मुझे बड़ा लालपुर, वाराणसी में SHRINEVA के किराये या लीज़ की जानकारी चाहिए।',
};
