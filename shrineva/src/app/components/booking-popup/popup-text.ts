/** Strings of the "Schedule a visit" pop-up in English and Hindi (the Hindi set is used on /hi). */
export interface PopupText {
  dialog: string; close: string; eyebrow: string; title: string; sub: string;
  name: string; errName: string; phone: string; phonePh: string; errPhone: string;
  need: string; needPh: string; send: string; sending: string; wa: string;
  privacyPre: string; privacy: string; failedStrong: string; failed: (phone: string) => string;
  sentTitle: string; sentBody: string; waNow: string;
}

export const POPUP_EN: PopupText = {
  dialog: 'Schedule a visit at SHRINEVA', close: 'Close', eyebrow: 'Schedule a visit', title: 'When can we show you around?',
  sub: 'Leave your name and number. We will call to fix a time.',
  name: 'Name *', errName: 'Please enter your name', phone: 'Mobile *', phonePh: '10-digit number', errPhone: 'Enter a valid 10-digit mobile number',
  need: 'I am looking for', needPh: 'Select (optional)', send: 'Send enquiry', sending: 'Sending…', wa: 'WhatsApp',
  privacyPre: 'We use these details only to reply.', privacy: 'Privacy policy',
  failedStrong: 'Your enquiry was not sent.', failed: (p) => `Please try again, or call ${p} or use WhatsApp. What you typed is still here.`,
  sentTitle: 'Enquiry sent', sentBody: 'Thank you. The leasing team will call you to confirm a time. For a faster reply, message us on WhatsApp.', waNow: 'WhatsApp now',
};

export const POPUP_HI: PopupText = {
  dialog: 'SHRINEVA में साइट विज़िट बुक करें', close: 'बंद करें', eyebrow: 'साइट विज़िट बुक करें', title: 'हम आपको कब साइट दिखाएँ?',
  sub: 'अपना नाम और नंबर दें। हम समय तय करने के लिए कॉल करेंगे।',
  name: 'नाम *', errName: 'कृपया अपना नाम लिखें', phone: 'मोबाइल *', phonePh: '10 अंकों का नंबर', errPhone: 'सही 10 अंकों का मोबाइल नंबर लिखें',
  need: 'मुझे चाहिए', needPh: 'चुनें (वैकल्पिक)', send: 'पूछताछ भेजें', sending: 'भेज रहे हैं…', wa: 'WhatsApp',
  privacyPre: 'हम इन जानकारियों का उपयोग केवल जवाब देने के लिए करते हैं।', privacy: 'गोपनीयता नीति',
  failedStrong: 'आपकी पूछताछ नहीं भेजी जा सकी।', failed: (p) => `कृपया दोबारा कोशिश करें, या ${p} पर कॉल या WhatsApp करें। आपने जो लिखा है वह यहीं है।`,
  sentTitle: 'पूछताछ भेज दी गई', sentBody: 'धन्यवाद। लीज़ टीम समय तय करने के लिए आपको कॉल करेगी। जल्दी जवाब के लिए WhatsApp पर संदेश भेजें।', waNow: 'अभी WhatsApp करें',
};

/** Hindi labels for the "I am looking for" choices (the English value is what is sent to the leasing team). */
export const NEED_LABEL_HI: Record<string, string> = {
  'Office': 'ऑफिस', 'Restaurant / fine dining': 'रेस्तरां', 'Clinic / diagnostics': 'क्लिनिक / डायग्नोस्टिक', 'Retail / showroom': 'रिटेल / शोरूम',
  'Bank / NBFC': 'बैंक / NBFC', 'Coaching / education': 'कोचिंग / शिक्षा', 'Other': 'अन्य',
};
