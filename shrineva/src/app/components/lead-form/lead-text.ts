import { LeadPath } from '../../core/ui-events';

/** Words of the three enquiry paths, in English and Hindi (the Hindi set is used on /hi). */
export interface LeadText {
  tablist: string;
  tabs: Record<LeadPath, string>;
  titles: Record<LeadPath, string>;
  subs: Record<LeadPath, string>;
  name: string; namePh: string; errName: string;
  phone: string; phonePh: string; errPhone: string;
  email: string; emailPh: string; errEmail: string;
  message: Record<LeadPath, string>;
  messagePh: Record<LeadPath, string>;
  errMessage: string;
  send: Record<LeadPath, string>;
  sending: string;
  forLabel: string;
  removeContext: string;
  privacyPre: string; privacy: string;
  wa: string;
  failedStrong: string; failed: (phone: string) => string;
  failedBrochure: string;
  done: Record<LeadPath, { title: string; body: string }>;
  downloadBtn: string; plansOnly: string; askChaix: string; waNow: string; another: string;
  dialog: string; close: string;
}

export const LEAD_EN: LeadText = {
  tablist: 'How would you like to get in touch?',
  tabs: { visit: 'Schedule a visit', brochure: 'Brochure', query: 'Ask a question' },
  titles: { visit: 'When can we show you around?', brochure: 'Get the SHRINEVA brochure', query: 'What would you like to know?' },
  subs: {
    visit: 'Leave your details. We will call to fix a time that suits you.',
    brochure: 'Enter your details. The PDF downloads straight away.',
    query: 'Write your question. The leasing team replies by phone or email.',
  },
  name: 'Your name', namePh: 'Full name', errName: 'Please enter your name',
  phone: 'Mobile number', phonePh: '10-digit number', errPhone: 'Enter a valid 10-digit mobile number',
  email: 'Email', emailPh: 'name@example.com', errEmail: 'Enter a valid email address',
  message: { visit: 'Your query (optional)', brochure: 'Your query (optional)', query: 'Your query' },
  messagePh: {
    visit: 'e.g. I would like to see the second floor this Saturday afternoon. It is for a diagnostic centre.',
    brochure: 'e.g. The floor or area you are considering, or a question for the team.',
    query: 'e.g. I run a coaching institute and need about 3,500 sq ft. Which floor would suit, and can I see the plans?',
  },
  errMessage: 'Please write your question',
  send: { visit: 'Request a visit', brochure: 'Download the brochure', query: 'Send my question' },
  sending: 'Sending…',
  forLabel: 'About', removeContext: 'Remove',
  privacyPre: 'We use these details only to reply.', privacy: 'Privacy policy',
  wa: 'WhatsApp instead',
  failedStrong: 'Your request was not sent.',
  failed: (p) => `Please try again, or call ${p} or use WhatsApp. What you typed is still here.`,
  failedBrochure: 'You can still download the brochure here:',
  done: {
    visit: { title: 'Visit request received', body: 'Thank you. The leasing team will call you to confirm a time.' },
    brochure: { title: 'Your brochure is downloading', body: 'Thank you. If it did not start, use the button below.' },
    query: { title: 'Question received', body: 'Thank you. The leasing team will reply on the number or email you gave.' },
  },
  downloadBtn: 'Download the brochure', plansOnly: 'Floor plans only (PDF)', askChaix: 'Ask ChaiX for an instant answer', waNow: 'WhatsApp now', another: 'Send another request',
  dialog: 'Contact the SHRINEVA leasing team', close: 'Close',
};

export const LEAD_HI: LeadText = {
  tablist: 'आप कैसे संपर्क करना चाहेंगे?',
  tabs: { visit: 'साइट विज़िट', brochure: 'ब्रोशर', query: 'सवाल पूछें' },
  titles: { visit: 'हम आपको कब साइट दिखाएँ?', brochure: 'SHRINEVA ब्रोशर पाएँ', query: 'आप क्या जानना चाहते हैं?' },
  subs: {
    visit: 'अपनी जानकारी दें। हम आपके सुविधाजनक समय के लिए कॉल करेंगे।',
    brochure: 'अपनी जानकारी दें। PDF तुरंत डाउनलोड हो जाएगा।',
    query: 'अपना सवाल लिखें। लीज़ टीम फ़ोन या ईमेल पर जवाब देगी।',
  },
  name: 'आपका नाम', namePh: 'पूरा नाम', errName: 'कृपया अपना नाम लिखें',
  phone: 'मोबाइल नंबर', phonePh: '10 अंकों का नंबर', errPhone: 'सही 10 अंकों का मोबाइल नंबर लिखें',
  email: 'ईमेल', emailPh: 'name@example.com', errEmail: 'सही ईमेल पता लिखें',
  message: { visit: 'आपका सवाल (वैकल्पिक)', brochure: 'आपका सवाल (वैकल्पिक)', query: 'आपका सवाल' },
  messagePh: {
    visit: 'जैसे: इस शनिवार दोपहर दूसरी मंज़िल देखनी है। यहाँ डायग्नोस्टिक सेंटर शुरू करना है।',
    brochure: 'जैसे: आप जिस मंज़िल या क्षेत्रफल पर विचार कर रहे हैं, या टीम के लिए कोई सवाल।',
    query: 'जैसे: कोचिंग संस्थान के लिए लगभग 3,500 वर्ग फुट चाहिए। कौन सी मंज़िल ठीक रहेगी और प्लान कब देख सकते हैं?',
  },
  errMessage: 'कृपया अपना सवाल लिखें',
  send: { visit: 'विज़िट का अनुरोध भेजें', brochure: 'ब्रोशर डाउनलोड करें', query: 'सवाल भेजें' },
  sending: 'भेज रहे हैं…',
  forLabel: 'विषय', removeContext: 'हटाएँ',
  privacyPre: 'हम इन जानकारियों का उपयोग केवल जवाब देने के लिए करते हैं।', privacy: 'गोपनीयता नीति',
  wa: 'WhatsApp पर बात करें',
  failedStrong: 'आपका अनुरोध नहीं भेजा जा सका।',
  failed: (p) => `कृपया दोबारा कोशिश करें, या ${p} पर कॉल या WhatsApp करें। आपने जो लिखा है वह यहीं है।`,
  failedBrochure: 'आप ब्रोशर यहाँ से अब भी डाउनलोड कर सकते हैं:',
  done: {
    visit: { title: 'विज़िट का अनुरोध मिल गया', body: 'धन्यवाद। लीज़ टीम समय तय करने के लिए आपको कॉल करेगी।' },
    brochure: { title: 'ब्रोशर डाउनलोड हो रहा है', body: 'धन्यवाद। शुरू न हुआ हो तो नीचे के बटन का उपयोग करें।' },
    query: { title: 'सवाल मिल गया', body: 'धन्यवाद। लीज़ टीम आपके दिए नंबर या ईमेल पर जवाब देगी।' },
  },
  downloadBtn: 'ब्रोशर डाउनलोड करें', plansOnly: 'सिर्फ़ फ़्लोर प्लान (PDF)', askChaix: 'ChaiX से तुरंत पूछें', waNow: 'अभी WhatsApp करें', another: 'एक और अनुरोध भेजें',
  dialog: 'SHRINEVA लीज़ टीम से संपर्क करें', close: 'बंद करें',
};
