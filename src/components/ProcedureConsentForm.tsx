'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileText,
  Printer,
  Copy,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Languages,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
  Layers,
  Calendar,
  User,
  MapPin,
  Clock,
  Download,
  Eye,
  FileCheck,
  RefreshCw
} from 'lucide-react';

export interface ConsentPatientInfo {
  name: string;
  gender: string;
  age: number | string;
  place: string;
  ipdNo: string;
  mrdNo: string;
  caseNo: string;
  procedureName: string;
  bodyPart: string;
  date: string;
  doctorName?: string;
  clinicName?: string;
  language?: 'Gujarati' | 'Hindi' | 'English';
}

export interface ConsentTemplateItem {
  id: string;
  templateNo: number; // 1 to 12
  key: string;
  title: string;
  procedureName: string; // Synced clinical procedure name
  gujaratiTitle: string;
  hindiTitle: string;
  keywords: string[];
  risksAndComplications: {
    english: string[];
    gujarati: string[];
    hindi: string[];
  };
  consentText: {
    english: string;
    gujarati: string;
    hindi: string;
  };
  postCareInstructions: {
    english: string[];
    gujarati: string[];
    hindi: string[];
  };
}

export const TWELVE_CONSENT_TEMPLATES: ConsentTemplateItem[] = [
  {
    id: 'ct-1',
    templateNo: 1,
    key: 'diode-laser',
    title: 'Diode Laser Hair Removal Consent',
    procedureName: 'HAIR REMOVAL - DIODE (TRIPLE WAVELENGTH)',
    gujaratiTitle: 'ડાયોડ લેસર વાળ દૂર કરવાની સંમતિ (Diode Laser Hair Removal)',
    hindiTitle: 'डायोड लेजर हेयर रिमूवल सहमति पत्र (Diode Laser Hair Removal)',
    keywords: ['DIODE', 'HAIR REMOVAL', 'DIOED', 'LASER', 'TRIPLE WAVELENGTH'],
    risksAndComplications: {
      english: [
        'Transient redness (erythema) and mild perifollicular edema for 2-24 hours',
        'Temporary hyperpigmentation or hypopigmentation (rare, aggravated by sun exposure)',
        'Mild stinging or heat sensation during pulses',
        'Multiple sessions (typically 4-8 sessions) required for optimal hair reduction'
      ],
      gujarati: [
        'પ્રક્રિયા બાદ ૨ થી ૨૪ કલાક સુધી હળવી લાલાશ અને વાળના મૂળિયાં પાસે સોજો આવી શકે છે',
        'સૂર્યપ્રકાશમાં જવાથી ચામડીનો રંગ હંગામી ધોરણે બદલાવાની શક્યતા (હાયપરપિગ્મેન્ટેશન)',
        'લેસર પલ્સ દરમિયાન હળવી ગરમી કે ઝણઝણાટીનો અહેસાસ',
        'વાળના કાયમી અને મહત્તમ ઘટાડા માટે નિર્ધારિત બહુવિધ સત્રો (૪ થી ૮ સત્રો) જરૂરી છે'
      ],
      hindi: [
        'उपचार के बाद २ से २४ घंटे तक हल्की लालिमा और बालों की जड़ों के पास सूजन संभव है',
        'धूप में जाने से त्वचा के रंग में अस्थायी बदलाव (पिगमेंटेशन) का जोखिम',
        'लेजर पल्स के दौरान हल्की गर्माहट या झुनझुनी महसूस होना',
        'बालों की प्रभावी कमी हेतु डॉक्टर द्वारा अनुशंसित ४ से ८ सत्र आवश्यक हैं'
      ]
    },
    consentText: {
      english:
        'I hereby authorize MedFlow Clinic and [Doctor Name] to perform the Diode Laser Hair Removal procedure on my [Body Part]. I have been fully informed regarding the mechanism of selective photothermolysis, potential side effects, and expected outcomes. I confirm that I will avoid sun exposure, tanning, waxing, and threading between sessions and will use SPF 50+ sunscreen as prescribed.',
      gujarati:
        'હું, આથી મેડફ્લો ક્લિનિક અને ડોક્ટર [Doctor Name] ને મારા [Body Part] પર ડાયોડ લેસર હેર રિમૂવલ પ્રક્રિયા કરવા માટે સ્વેચ્છાએ મંજૂરી આપું છું. મને પ્રક્રિયાના સિદ્ધાંતો, સંભવિત પરિણામો અને આડઅસરો વિશે સંપૂર્ણ માહિતી આપવામાં આવી છે. હું સત્રો દરમિયાન સીધો સૂર્યપ્રકાશ, વેક્સિંગ અને થ્રેડિંગ ટાળવા તથા દરરોજ SPF 50+ સનસ્ક્રીન વાપરવા સંમત છું.',
      hindi:
        'मैं, एतद्द्वारा मेडफ्लो क्लिनिक और डॉक्टर [Doctor Name] को मेरे [Body Part] पर डायोड लेजर हेयर रिमूवल प्रक्रिया करने हेतु अपनी स्वैच्छिक सहमति देता/देती हूँ। मुझे संभावित परिणामों और सावधानियों के बारे में विस्तार से समझाया गया है। मैं सत्रों के बीच वैक्सिंग/थ्रेडिंग न करने तथा धूप से बचने हेतु सहमत हूँ।'
    },
    postCareInstructions: {
      english: [
        'Apply soothing aloe vera gel / post-laser cream as directed',
        'Strictly avoid direct sunlight and apply broad-spectrum SPF 50+ sunscreen every 3 hours',
        'Avoid hot showers, steam, sauna, and strenuous exercise for 24-48 hours',
        'Do not pluck, wax, or bleach hair; only shaving is permitted if necessary'
      ],
      gujarati: [
        'સૂચના મુજબ ઠંડક આપતું એલોવેરા જેલ અથવા પોસ્ટ-લેસર ક્રીમ લગાવો',
        'સીધો સૂર્યપ્રકાશ સખત રીતે ટાળો અને દર ૩ કલાકે બ્રોડ-સ્પેક્ટ્રમ SPF 50+ સનસ્ક્રીન લગાવો',
        '૨૪-૪૮ કલાક સુધી ગરમ પાણીથી સ્નાન, સ્ટીમ બાથ અને ભારે કસરત ટાળવી',
        'વાળ ખેંચવા, વેક્સ કરવા કે બ્લીચ કરવા નહીં; જરૂર પડે તો જ હળવું શેવિંગ કરી શકાય'
      ],
      hindi: [
        'निर्देशानुसार एलोवेरा जेल या पोस्ट-लेजर क्रीम लगाएं',
        'धूप से पूरी तरह बचें और हर ३ घंटे में एसपीएफ ५०+ सनस्क्रीन लगाएं',
        '२४-४८ घंटे तक गर्म पानी से स्नान और भारी व्यायाम से बचें',
        'बालों को वैक्स या ब्लीच न करें; केवल शेविंग की अनुमति है'
      ]
    }
  },
  {
    id: 'ct-2',
    templateNo: 2,
    key: 'chemical-peel',
    title: 'Chemical Peel & Facial Resurfacing Consent',
    procedureName: 'CHEMICAL PEEL (GLYCOLIC / SALICYLIC / TCA)',
    gujaratiTitle: 'કેમિકલ પીલ અને ત્વચા રિસર્ફેસિંગ સંમતિ (Chemical Peel & Resurfacing)',
    hindiTitle: 'केमिकल पील और फेशियल रिसर्फेसिंग सहमति पत्र (Chemical Peel & Resurfacing)',
    keywords: ['PEEL', 'CHEMICAL PEEL', 'GLYCOLIC', 'SALICYLIC', 'TCA', 'LACTIC', 'RESURFACING'],
    risksAndComplications: {
      english: [
        'Transient redness, tingling, and feeling of tightness for 1-3 days',
        'Flaking and superficial epidermal peeling lasting 3-7 days',
        'Risk of post-inflammatory hyperpigmentation if exposed to sunlight',
        'Allergic reaction to peeling agents (rare)'
      ],
      gujarati: [
        'પ્રક્રિયા બાદ ૧ થી ૩ દિવસ સુધી હળવી લાલાશ, ચચરાટ અને ત્વચામાં ખેંચાણ',
        '૩ થી ૭ દિવસ સુધી ત્વચાની ઉપલી સપાટી પર બારીક છોતરાં (peeling) ઉતરવાં સામાન્ય છે',
        'સૂર્યપ્રકાશના સંપર્કમાં આવવાથી કાળા ડાઘ (હાયપરપિગ્મેન્ટેશન) થવાનું જોખમ',
        'પીલિંગ સોલ્યુશનથી એલર્જીની અત્યંત ઓછી શક્યતા'
      ],
      hindi: [
        'उपचार के बाद १ से ३ दिनों तक त्वचा में खिंचाव, हल्की जलन या लालिमा',
        '३ से ७ दिनों तक त्वचा की ऊपरी परत का हल्का उतरना (छीलना)',
        'धूप में जाने पर त्वचा पर काले दाग या पिगमेंटेशन का खतरा',
        'पीलिंग एजेंट से एलर्जी की विरल संभावना'
      ]
    },
    consentText: {
      english:
        'I consent to undergo clinical chemical peeling ([Procedure Name]) on my [Body Part]. The purpose of accelerating cell turnover and treating acne/pigmentation/fine lines has been explained to me. I agree never to pick or peel loose skin forcefully and will strictly apply prescribed moisturizers and sunscreens.',
      gujarati:
        'હું, મારા [Body Part] પર કેમિકલ પીલ ([Procedure Name]) સારવાર કરાવવા માટે સંમતિ આપું છું. ખીલ, ડાઘ અને ચામડીની તેજસ્વીતા માટેની આ પ્રક્રિયા વિશે મને સમજાવવામાં આવ્યું છે. હું છૂટી પડેલી ચામડીને ક્યારેય બળજબરીથી ખેંચીશ નહીં અને ડોક્ટર દ્વારા દર્શાવેલ મોઇશ્ચરાઇઝર અને સનસ્ક્રીન નિયમિત વાપરીશ.',
      hindi:
        'मैं, मेरे [Body Part] पर केमिकल पील ([Procedure Name]) कराने की सहमति देता/देती हूँ। मुहांसों, दाग-धब्बों और त्वचा सुधार हेतु इस प्रक्रिया को मैंने समझ लिया है। मैं पपड़ी को खुद से नहीं खींचूँगा/खींचूँगी और मॉइस्चराइजर का नियमित प्रयोग करूँगा/करूँगी।'
    },
    postCareInstructions: {
      english: [
        'Do not scratch, rub, or manually peel exfoliating skin',
        'Wash face with lukewarm water and mild, soap-free cleanser only',
        'Apply barrier repair moisturizer frequently throughout the day',
        'Avoid active ingredients (Retinol, Vitamin C, AHA/BHA) for 5-7 days'
      ],
      gujarati: [
        'છોલાતી ચામડીને ક્યારેય નખથી ખોતરવી કે ખેંચવી નહીં',
        'માત્ર સાધારણ નવશેકા પાણી અને સાબુ-રહિત જેન્ટલ ફેસવોશથી મોઢું ધોવું',
        'દિવસ દરમિયાન નિયમિત મોઇશ્ચરાઇઝર ક્રીમ લગાવી ચામડી ભીની રાખવી',
        '૫-૭ દિવસ સુધી રેટિનોલ, વિટામિન સી કે અન્ય તેજાબી પ્રોડક્ટ્સ બંધ રાખવી'
      ],
      hindi: [
        'छिलती हुई त्वचा को कभी भी हाथ से न खींचें',
        'केवल सौम्य क्लींजर और गुनगुने पानी से चेहरा धोएं',
        'दिन में कई बार अच्छी गुणवत्ता का मॉइस्चराइजर लगाएं',
        '५-७ दिनों तक रेटिनोल और विटामिन सी युक्त उत्पादों का उपयोग बंद रखें'
      ]
    }
  },
  {
    id: 'ct-3',
    templateNo: 3,
    key: 'co2-laser',
    title: 'CO2 Fractional Laser Resurfacing Consent',
    procedureName: 'CO2 FRACTIONAL LASER RESURFACING',
    gujaratiTitle: 'CO2 ફ્રેક્શનલ લેસર રિસર્ફેસિંગ સંમતિ (CO2 Fractional Laser)',
    hindiTitle: 'CO2 फ्रैक्शनल लेजर रिसर्फेसिंग सहमति पत्र (CO2 Fractional Laser)',
    keywords: ['CO2', 'FRACTIONAL', 'RESURFACING', 'ACNE SCAR', 'CO2 LASER'],
    risksAndComplications: {
      english: [
        'Erythema (redness) and grid pattern micro-crusting for 4-8 days',
        'Post-treatment swelling (edema), especially around eyes or cheeks',
        'Temporary sensitivity, bronze skin discoloration, or delayed healing',
        'Infection or prolonged erythema if aftercare is neglected'
      ],
      gujarati: [
        '૪ થી ૮ દિવસ સુધી ચામડી પર લાલાશ અને જાળીદાર બારીક પોપડીઓ (micro-crusts) થવી',
        'ખાસ કરીને ગાલ અને આંખોની આસપાસ હળવો સોજો આવી શકે છે',
        'ત્વચાની સંવેદનશીલતા અને હંગામી ધોરણે બદામી રંગની આભા દેખાવી',
        'સંભાળ ન રાખવાથી ચેપ લાગવાનું કે લાલાશ લાંબો સમય રહેવાનું જોખમ'
      ],
      hindi: [
        '४ से ८ दिनों तक चेहरे पर लालिमा और बारीक पपड़ी आना',
        'उपचारित भाग पर हल्का सूजन आना स्वाभाविक है',
        'त्वचा में अस्थायी संवेदनशीलता और हल्का सांवलापन',
        'उचित देखभाल न करने पर संक्रमण की संभावना'
      ]
    },
    consentText: {
      english:
        'I voluntarily consent to CO2 Fractional Laser skin resurfacing on my [Body Part] by [Doctor Name]. I understand microscopic laser beams vaporize tiny columns of damaged tissue to induce deep collagen remodeling. I agree to stay indoors during the initial re-epithelialization phase and observe sterile ointment application.',
      gujarati:
        'હું, મારા [Body Part] પર ડોક્ટર [Doctor Name] દ્વારા CO2 ફ્રેક્શનલ લેસર પ્રક્રિયા કરાવવા સ્વેચ્છાએ મંજૂરી આપું છું. ઊંડા ખાડા અને ડાઘ દૂર કરવા માટે આ પ્રક્રિયા કરવામાં આવે છે. નવી ચામડી બને ત્યાં સુધી હું ઘરમાં રહેવા અને સૂચવેલ એન્ટિબાયોટિક મલમ લગાવવા સંમત છું.',
      hindi:
        'मैं, [Doctor Name] द्वारा मेरे [Body Part] पर CO2 फ्रैक्शनल लेजर कराने हेतु सहमति देता/देती हूँ। गड्ढों और निशानों को ठीक करने की इस तकनीक से मैं अवगत हूँ और प्रारंभिक दिनों में धूप से बचने व मलहम लगाने का पालन करूँगा/करूँगी।'
    },
    postCareInstructions: {
      english: [
        'Keep treated area continuously moist with prescribed healing balm/ointment',
        'Apply cool compresses gently to alleviate warmth and swelling',
        'Do not apply makeup or sunscreen until skin has completely closed (usually 4-5 days)',
        'Strictly avoid direct ultraviolet exposure for at least 4 weeks'
      ],
      gujarati: [
        'ડોક્ટરે આપેલ હીલિંગ મલમ લગાવીને ચામડીને સતત ભીની રાખવી',
        'ગરમી અને સોજો ઘટાડવા માટે બરફનો ઠંડો શેક હળવેથી કરવો',
        'ચામડી સંપૂર્ણ રૂઝાઈ ન જાય ત્યાં સુધી (૪-૫ દિવસ) મેકઅપ કે સનસ્ક્રીન ન લગાવવું',
        'ઓછામાં ઓછા ૪ અઠવાડિયા સુધી તડકામાં જવાનું સખત ટાળવું'
      ],
      hindi: [
        'डॉक्टर द्वारा दिए गए मरहम से त्वचा को हमेशा नम रखें',
        'सूजन कम करने के लिए बर्फ की ठंडी सिंकाई करें',
        '४-५ दिनों तक किसी भी प्रकार का मेकअप न लगाएं',
        'कम से कम ४ सप्ताह तक धूप के सीधे संपर्क से पूरी तरह बचें'
      ]
    }
  },
  {
    id: 'ct-4',
    templateNo: 4,
    key: 'q-switch',
    title: 'Q-Switch Nd:YAG Laser (Pigment & Tattoo) Consent',
    procedureName: 'Q-SWITCH Nd:YAG LASER (PIGMENT & TATTOO)',
    gujaratiTitle: 'Q-સ્વિચ લેસર પિગમેન્ટેશન અને ટેટૂ રિમૂવલ સંમતિ (Q-Switch Nd:YAG)',
    hindiTitle: 'क्यू-स्विच लेजर पिगमेंटेशन और टैटू निष्कासन सहमति पत्र (Q-Switch Nd:YAG)',
    keywords: ['Q-SWITCH', 'ND:YAG', 'TATTOO', 'PIGMENT', 'MELASMA', 'FRECKLES', 'CARBON PEEL'],
    risksAndComplications: {
      english: [
        'Immediate white frosting and transient pinpoint purpura/blistering',
        'Crusting that sheds over 7-14 days',
        'Ghost silhouette or hypopigmentation over deep professional tattoo inks',
        'Multiple sessions spaced 4-8 weeks apart required'
      ],
      gujarati: [
        'લેસર લાગતાં જ તાત્કાલિક સફેદ છારી (frosting) અને હળવા ફોલ્લા થવા શક્ય છે',
        '૭ થી ૧૪ દિવસમાં ધીમે-ધીમે પોપડીઓ ખરી જશે',
        'ઊંડી શાહીવાળા ટેટૂમાં હળવો સફેદ ડાઘ અથવા ઝાંખો પડછાયો રહી શકે છે',
        'સંપૂર્ણ પરિણામ માટે ૪ થી ૮ અઠવાડિયાના અંતરે બહુવિધ સત્રો જરૂરી છે'
      ],
      hindi: [
        'लेजर के तुरंत बाद सफेद परत और हल्के छाले पड़ना स्वाभाविक है',
        '७ से १४ दिनों में पपड़ी सूखकर खुद गिर जाएगी',
        'गहरे टैटू के स्थान पर हल्का सफेद निशान रह सकता है',
        'टैटू या पिगमेंट हटाने के लिए कई सिटिंग्स आवश्यक हैं'
      ]
    },
    consentText: {
      english:
        'I consent to Q-Switch Nd:YAG laser treatment for pigment/tattoo removal on my [Body Part]. I understand that target ink particles are fragmented by photo-acoustic shockwaves and eliminated via lymphatic pathways over several weeks. I will not scratch or unroof blisters if they form.',
      gujarati:
        'હું, મારા [Body Part] પર પિગમેન્ટેશન/ટેટૂ રિમૂવલ માટે Q-સ્વિચ Nd:YAG લેસર સારવાર કરાવવા સંમત છું. લેસરના તરંગો શાહીના કણોને તોડે છે અને શરીર કુદરતી રીતે તેનો નિકાલ કરે છે તે મને સમજાવવામાં આવ્યું છે. જો ફોલ્લા થાય તો હું તેને ફોડીશ નહીં.',
      hindi:
        'मैं, मेरे [Body Part] पर टैटू अथवा पिगमेंटेशन हटाने हेतु क्यू-स्विच लेजर कराने की सहमति देता/देती हूँ। स्याही के कण धीरे-धीरे शरीर द्वारा बाहर निकाले जाएंगे। छाले होने पर उन्हें फोड़ने से बचूँगा/बचूँगी।'
    },
    postCareInstructions: {
      english: [
        'Clean area with sterile saline and apply antibiotic ointment twice daily',
        'Keep the area covered with a sterile non-stick bandage for 48 hours',
        'Do not swim or soak in water until crusts have naturally detached',
        'Avoid picking or scratching at scabs to prevent permanent scarring'
      ],
      gujarati: [
        'રોજ બે વાર જંતુરહિત નોર્મલ સલાઇનથી સાફ કરી એન્ટિબાયોટિક મલમ લગાવવો',
        '૪૮ કલાક સુધી ઘા પર સ્વચ્છ પાટો બાંધી રાખવો',
        'પોપડીઓ આપમેળે ન ખરી જાય ત્યાં સુધી સ્વિમિંગ પૂલ કે ગરમ પાણીમાં નહાવું નહીં',
        'ડાઘ ન પડે તે માટે પોપડીને નખથી ઉખાડવી નહીં'
      ],
      hindi: [
        'प्रतिदिन दो बार एंटीबायोटिक मरहम लगाएं और साफ रखें',
        '४८ घंटे तक साफ पट्टी से ढककर रखें',
        'पपड़ी हटने तक तैराकी और पानी में देर तक भीगने से बचें',
        'निशान से बचने हेतु पपड़ी को खुद से न खुरचें'
      ]
    }
  },
  {
    id: 'ct-5',
    templateNo: 5,
    key: 'prp-gfc',
    title: 'PRP & GFC Regenerative Therapy Consent',
    procedureName: 'PRP & GFC REGENERATIVE SCALP/SKIN THERAPY',
    gujaratiTitle: 'PRP / GFC વાળ અને ત્વચા રિજનરેટિવ થેરાપી સંમતિ (PRP & GFC Therapy)',
    hindiTitle: 'पीआरपी और जीएफसी पुनर्योजी थेरेपी सहमति पत्र (PRP & GFC Therapy)',
    keywords: ['PRP', 'GFC', 'PLATELET', 'PLASMA', 'SCALP', 'HAIR LOSS', 'ALOPECIA'],
    risksAndComplications: {
      english: [
        'Mild pain, tenderness, and tightness at injection sites for 24-48 hours',
        'Small localized bruising (hematoma) or transient headache',
        'Because autologous blood is used, risk of allergic reaction is extremely low',
        'Gradual improvements visible only after 3-4 consecutive monthly sessions'
      ],
      gujarati: [
        'ઇન્જેક્શન આપેલ જગ્યાએ ૨૪ થી ૪૮ કલાક સુધી હળવો દુખાવો, સોજો કે ખેંચાણ',
        'ઇન્જેક્શનની જગ્યાએ નાના ઉઝરડા કે માથાનો હળવો દુખાવો થઈ શકે છે',
        'પોતાનું લોહી વાપરવામાં આવતું હોવાથી એલર્જીનું જોખમ નહિવત છે',
        'વાળના ગ્રોથમાં સુધારો ૩-૪ માસિક સત્રો પછી જ ધીમે-ધીમે દેખાય છે'
      ],
      hindi: [
        'इंजेक्शन स्थल पर २४ से ४૮ घंटे तक हल्का दर्द या भारीपन',
        'हल्के नीले निशान या सिरदर्द की संभावना',
        'स्वयं का रक्त होने के कारण किसी प्रकार की एलर्जी का खतरा नगण्य है',
        'बालों के बेहतर विकास हेतु ३ से ४ महीने का समय लगता है'
      ]
    },
    consentText: {
      english:
        'I authorize the clinical extraction of my venous blood (approximately 10-20ml), centrifugation into Platelet-Rich Plasma / Growth Factor Concentrate, and intradermal reinjection into my [Body Part]. I confirm I am not taking NSAIDs, anti-coagulants, or aspirin.',
      gujarati:
        'હું, મારા પોતાના લોહીમાંથી (આશરે ૧૦-૨૦ મિલી) પ્લેટલેટ-રીચ પ્લાઝ્મા (PRP) અથવા ગ્રોથ ફેક્ટર (GFC) અલગ પાડી મારા [Body Part] પર ઇન્જેક્ટ કરવા માટે સંમતિ આપું છું. હું પુષ્ટિ કરું છું કે હું લોહી પાતળું કરવાની દવાઓ કે પેઇનકિલર્સ લેતો/લેતી નથી.',
      hindi:
        'मैं, अपने रक्त से पीआरपी/जीएफसी तैयार कर मेरे [Body Part] पर इंजेक्ट करने की अनुमति देता/देती हूँ। मैं पुष्टि करता/करती हूँ कि मैं रक्त पतला करने वाली दवाएं नहीं ले रहा/रही हूँ।'
    },
    postCareInstructions: {
      english: [
        'Do not wash hair or touch scalp for at least 12-24 hours',
        'Avoid strenuous exercise, alcohol, and smoking for 48 hours',
        'Do not take aspirin or ibuprofen; use paracetamol if experiencing mild headache',
        'Resume topical hair solutions (Minoxidil) after 48 hours only'
      ],
      gujarati: [
        'ઓછામાં ઓછા ૧૨ થી ૨૪ કલાક સુધી માથું ધોવું નહીં કે અડકવું નહીં',
        '૪૮ કલાક સુધી ભારે કસરત, દારૂ કે ધૂમ્રપાન સખત રીતે બંધ રાખવું',
        'દુખાવા માટે એસ્પિરિન કે આઇબુપ્રૂફેન લેવી નહીં; જરૂર પડ્યે પેરાસિટામોલ લેવી',
        'વાળમાં લગાવવાનું મિનોક્સિડિલ લોશન ૪૮ કલાક પછી જ ફરી શરૂ કરવું'
      ],
      hindi: [
        '१२ से २४ घंटे तक सिर न धोएं और न ही अनावश्यक छुएं',
        '४८ घंटे तक भारी व्यायाम और धूम्रपान से बचें',
        'दर्द निवारक हेतु केवल पैरासिटामोल का प्रयोग करें',
        'मिनोक्सिडिल लोशन का उपयोग ४८ घंटे बाद ही पुनः शुरू करें'
      ]
    }
  },
  {
    id: 'ct-6',
    templateNo: 6,
    key: 'microneedling',
    title: 'Microneedling & Dermapen Therapy Consent',
    procedureName: 'MICRONEEDLING DERMAPEN COLLAGEN INDUCTION',
    gujaratiTitle: 'માઇક્રોનીડલિંગ અને ડર્માપેન થેરાપી સંમતિ (Microneedling / Dermapen)',
    hindiTitle: 'माइक्रोनीडलिंग और डर्मापेन थेरेपी सहमति पत्र (Microneedling / Dermapen)',
    keywords: ['MICRONEEDLING', 'DERMAPEN', 'DERMA ROLLER', 'COLLAGEN INDUCTION', 'ROLLER'],
    risksAndComplications: {
      english: [
        'Erythema resembling mild sunburn lasting 24-48 hours',
        'Pinpoint bleeding during procedure and superficial flaking afterward',
        'Transient dryness and tight feeling for 2-3 days',
        'Needle-induced cold sore breakout in predisposed individuals'
      ],
      gujarati: [
        'સનબર્ન જેવી લાલાશ ૨૪ થી ૪૮ કલાક સુધી રહેવી સામાન્ય છે',
        'પ્રક્રિયા વખતે સોયથી ઝીણું રક્તસ્ત્રાવ (pinpoint bleeding) અને પછી હળવી પોપડી',
        '૨ થી ૩ દિવસ ત્વચામાં ખેંચાણ અને સુકાપણું રહેવું',
        'હર્પિસની તાસીર ધરાવતા દર્દીઓમાં હળવો ફોલ્લો થવાની શક્યતા'
      ],
      hindi: [
        '२४ से ४૮ घंटे तक चेहरे पर हल्की धूप जैसी लालिमा',
        'प्रक्रिया के दौरान सुई से बारीक रक्त की बूंदें आना सामान्य है',
        '२-३ दिन तक त्वचा में खिंचाव और सूखापन महसूस होना',
        'एलर्जी या संक्रमण से बचने हेतु निर्देशों का पालन आवश्यक है'
      ]
    },
    consentText: {
      english:
        'I consent to automated microneedling / Dermapen collagen induction on my [Body Part]. I understand controlled micro-punctures stimulate natural collagen and elastin synthesis. I consent to topical anesthetic application and agree to follow sterile home care rules.',
      gujarati:
        'હું, મારા [Body Part] પર ડર્માપેન માઇક્રોનીડલિંગ કોલેજન ઇન્ડક્શન સારવાર કરાવવા સંમત છું. ઝીણી સોયના નિયંત્રિત પંચરથી ચામડીમાં નવું કોલેજન બને છે તે મને સમજાવવામાં આવ્યું છે. હું લોકલ સુન્ન કરવાની ક્રીમ લગાવવા અને ઘરે કાળજી રાખવા સંમત છું.',
      hindi:
        'मैं, मेरे [Body Part] पर डर्मापेन माइक्रोनीडलिंग कराने की अनुमति देता/देती हूँ। नियंत्रित सूक्ष्म छिद्रों से त्वचा में नया कोलाजन बनता है। मैं सुन्न करने वाली क्रीम और देखभाल के नियमों से सहमत हूँ।'
    },
    postCareInstructions: {
      english: [
        'Use only clean hands and sterile hyaluronic acid serum on the first day',
        'Do not apply makeup for 24-48 hours post-procedure',
        'Avoid public swimming pools, hot tubs, and saunas for 72 hours',
        'Change pillowcase to a freshly washed clean one tonight'
      ],
      gujarati: [
        'પ્રથમ દિવસે ફક્ત સ્વચ્છ હાથે હાયલ્યુરોનિક એસિડ સીરમ જ લગાવવું',
        '૨૪ થી ૪૮ કલાક સુધી કોઈપણ પ્રકારનો મેકઅપ ન કરવો',
        '૭૨ કલાક સુધી સ્વિમિંગ પૂલ, હોટ ટબ કે સ્ટીમ બાથમાં જવું નહીં',
        'આજે રાત્રે ઓશીકાનું કવર બદલીને એકદમ સાફ-ધોયેલું કવર વાપરવું'
      ],
      hindi: [
        'पहले दिन चेहरे को केवल साफ हाथों से छुएं और हयालूरोनिक एसिड लगाएं',
        '२४ से ४८ घंटे तक मेकअप बिल्कुल न लगाएं',
        '३ दिनों तक स्विमिंग पूल और सौना से दूर रहें',
        'आज रात तकिए का कवर बदलकर बिल्कुल साफ कवर लगाएं'
      ]
    }
  },
  {
    id: 'ct-7',
    templateNo: 7,
    key: 'hydrafacial',
    title: 'HydraFacial & Medical Facial Cleansing Consent',
    procedureName: 'HYDRAFACIAL & MEDICAL FACIAL CLEANSING',
    gujaratiTitle: 'હાઇડ્રાફેસિયલ અને મેડિકલ ફેસિયલ સફાઈ સંમતિ (HydraFacial Cleansing)',
    hindiTitle: 'हाइड्राफेशियल और मेडिकल फेशियल सहमति पत्र (HydraFacial Cleansing)',
    keywords: ['HYDRAFACIAL', 'MEDIFACIAL', 'CLEANSING', 'HYDRATION', 'FACIAL'],
    risksAndComplications: {
      english: [
        'Mild transient flushing lasting 1-2 hours',
        'Slight tingling during acid infusion steps',
        'Temporary purging of deep-seated blackheads in congested skin',
        'Rare sensitivity to antioxidant serum botanicals'
      ],
      gujarati: [
        'પ્રક્રિયા બાદ ૧ થી ૨ કલાક સુધી ચહેરા પર હળવી ગુલાબી ચમક/લાલાશ',
        'એક્સફોલિએટિંગ એસિડ સીરમ લગાવતી વખતે હળવી ચચરાટી',
        'અંદર ભરાયેલા ખીલ/બ્લેકહેડ્સ હળવેથી બહાર આવવા (purging)',
        'સીરમમાં રહેલા કુદરતી તત્વોથી સંવેદનશીલતાની અત્યંત ઓછી શક્યતા'
      ],
      hindi: [
        'उपचार के बाद १-२ घंटे तक हल्का गुलाबीपन',
        'सीरम लगाते समय हल्की झुनझुनी होना सामान्य है',
        'त्वचा से गंदगी निकलने के कारण हल्के दाने दिख सकते हैं',
        'सीरम से एलर्जी की अत्यंत दुर्लभ संभावना'
      ]
    },
    consentText: {
      english:
        'I voluntarily consent to HydraFacial medical cleansing and vortex serum infusion on my [Body Part]. The stages of vortex-exfoliation, gentle acid peel, painless vacuum extraction, and peptide hydration have been explained to me.',
      gujarati:
        'હું, મારા [Body Part] પર હાઇડ્રાફેસિયલ અને સીરમ ઇન્ફ્યુઝન ફેસિયલ સારવાર કરાવવા સંમત છું. વેક્યુમથી છિદ્રો સાફ કરવા, હળવો પીલ અને વિટામિન-પેપ્ટાઇડ પોષણ આપવાની પદ્ધતિ મને સમજાવવામાં આવી છે.',
      hindi:
        'मैं, मेरे [Body Part] पर हाइड्राफेशियल डीप क्लींजिंग कराने हेतु सहमति प्रदान करता/करती हूँ। वैक्यूम द्वारा सफाई और सीरम पोषण की प्रक्रिया को मैंने समझ लिया है।'
    },
    postCareInstructions: {
      english: [
        'Keep skin hydrated with gentle moisturizer and drink plenty of water',
        'Do not wash face with soap for at least 6 hours post-treatment',
        'Apply SPF 50+ sunscreen before stepping into outdoor light',
        'Avoid waxing or threading on face for 48 hours'
      ],
      gujarati: [
        'નિયમિત મોઇશ્ચરાઇઝર લગાવો અને પુષ્કળ પાણી પીને ચામડી હાઇડ્રેટ રાખો',
        'પ્રક્રિયા પછી ઓછામાં ઓછા ૬ કલાક સુધી સાબુથી મોઢું ધોવું નહીં',
        'બહાર જતાં પહેલાં નિયમિત SPF 50+ સનસ્ક્રીન લગાવવું',
        '૪૮ કલાક સુધી મોઢા પર વેક્સિંગ કે થ્રેડિંગ કરાવવું નહીં'
      ],
      hindi: [
        'त्वचा को पर्याप्त नमी दें और खूब पानी पिएं',
        'उपचार के बाद कम से कम ६ घंटे तक चेहरे पर साबुन न लगाएं',
        'बाहर निकलने से पहले सनस्क्रीन अवश्य लगाएं',
        'दो दिनों तक चेहरे पर वैक्सिंग या थ्रेडिंग न कराएं'
      ]
    }
  },
  {
    id: 'ct-8',
    templateNo: 8,
    key: 'botox',
    title: 'Botox & Neuromodulator Infiltration Consent',
    procedureName: 'BOTOX & NEUROMODULATOR INFILTRATION',
    gujaratiTitle: 'બોટોક્સ અને ન્યુરોમોડ્યુલેટર ઇન્જેક્શન સંમતિ (Botox Infiltration)',
    hindiTitle: 'बोटॉक्स और न्यूरोमोड्यूलेटर सहमति पत्र (Botox Infiltration)',
    keywords: ['BOTOX', 'BOTULINUM', 'TOXIN', 'NEUROMODULATOR', 'WRINKLE', 'DYSPORT'],
    risksAndComplications: {
      english: [
        'Mild pinpoint bruising or localized tenderness at injection points',
        'Transient headache or feeling of heaviness across forehead for 24-48 hours',
        'Temporary eyelid/brow ptosis (droopiness) in less than 1% of cases',
        'Gradual onset over 3-10 days, with typical duration of 3-5 months'
      ],
      gujarati: [
        'ઇન્જેક્શનની જગ્યાએ નાના ઉઝરડા કે હળવો દુખાવો થઈ શકે છે',
        'પ્રથમ ૨૪ થી ૪૮ કલાક સુધી કપાળ પર ભારેપણું કે માથાનો દુખાવો લાગવો',
        'પાંપણ કે ભમર હંગામી ધોરણે સહેજ નીચે ઝૂકવી (ptosis - ૧% થી ઓછા કેસમાં)',
        'અસર ૩ થી ૧૦ દિવસમાં પૂર્ણપણે દેખાય છે અને ૩ થી ૫ મહિના સુધી રહે છે'
      ],
      hindi: [
        'इंजेक्शन स्थल पर हल्का नीला निशान या दर्द हो सकता है',
        '२४ से ४૮ घंटे तक सिरदर्द या माथे में भारीपन महसूस होना',
        'पलक या भौंह का हल्का झुकना (अत्यंत दुर्लभ और अस्थायी)',
        'पूर्ण परिणाम ३ से १० दिनों में दिखाई देता है जो ३-५ माह तक रहता है'
      ]
    },
    consentText: {
      english:
        'I consent to Botulinum Toxin injection into my [Body Part] by [Doctor Name]. I understand this temporarily relaxes dynamic muscles to soften expression lines. I agree to remain upright and avoid touching/rubbing the injected muscles for at least 4 hours.',
      gujarati:
        'હું, કરચલીઓ ઘટાડવા માટે ડોક્ટર [Doctor Name] દ્વારા મારા [Body Part] પર બોટ્યુલિનમ ટોક્સિન (Botox) ઇન્જેક્શન લેવા માટે સંમતિ આપું છું. ઇન્જેક્શન આપ્યા પછી ૪ કલાક સુધી હું સૂઈશ નહીં અને ઇન્જેક્શનની જગ્યાએ મસાજ કરીશ નહીં.',
      hindi:
        'मैं, [Doctor Name] द्वारा मेरे [Body Part] पर बोटॉक्स इंजेक्शन लगाने की सहमति देता/देती हूँ। यह झुर्रियों को अस्थायी रूप से कम करता है। मैं अगले ४ घंटे तक सीधे बैठने और चेहरे को न रगड़ने का पालन करूँगा/करूँगी।'
    },
    postCareInstructions: {
      english: [
        'Remain upright for at least 4 hours post-procedure; do not lie flat',
        'Do not massage, rub, or manipulate treated facial areas for 24 hours',
        'Avoid strenuous workouts, sauna, and direct heat exposure for 24 hours',
        'Attend follow-up touch-up check at Day 14 if advised by doctor'
      ],
      gujarati: [
        'પ્રક્રિયા પછી ઓછામાં ઓછા ૪ કલાક સુધી સીધા બેઠા રહેવું; આડા સૂવું નહીં',
        '૨૪ કલાક સુધી ચહેરા પર કોઈપણ પ્રકારની માલિશ કે ઘસારો કરવો નહીં',
        '૨૪ કલાક સુધી ભારે કસરત, સ્ટીમ બાથ કે અગ્નિ પાસે જવું નહીં',
        'ડોક્ટરની સલાહ મુજબ ૧૪મા દિવસે રિવ્યૂ વિઝિટમાં હાજર રહેવું'
      ],
      hindi: [
        'कम से कम ४ घंटे तक सीधे बैठें; लेटने से बचें',
        '२४ घंटे तक चेहरे की मालिश या रगड़ न करें',
        '२४ घंटे तक भारी व्यायाम और सौना से दूर रहें',
        '१४वें दिन डॉक्टर द्वारा बताए गए फॉलो-अप पर आएं'
      ]
    }
  },
  {
    id: 'ct-9',
    templateNo: 9,
    key: 'dermal-fillers',
    title: 'Dermal Fillers & Skin Boosters Consent',
    procedureName: 'DERMAL FILLERS & SKIN BOOSTERS (HA)',
    gujaratiTitle: 'ડર્મલ ફિલર્સ અને હાયલ્યુરોનિક એસિડ સંમતિ (Dermal Fillers & Boosters)',
    hindiTitle: 'डर्मल फिलर्स और स्किन बूस्टर्स सहमति पत्र (Dermal Fillers & Boosters)',
    keywords: ['FILLER', 'DERMAL FILLERS', 'HYALURONIC', 'SKIN BOOSTER', 'JUVEDERM', 'RESTYLANE'],
    risksAndComplications: {
      english: [
        'Local swelling, bruising, and tenderness lasting 3-7 days',
        'Asymmetry or palpable lumpiness resolving with gentle integration',
        'Extremely rare risk of vascular compromise requiring immediate Hyaluronidase dissolution',
        'Longevity varies between 6 to 18 months depending on product viscosity'
      ],
      gujarati: [
        'ઇન્જેક્શનની જગ્યાએ ૩ થી ૭ દિવસ સોજો, ઉઝરડો કે હળવો દુખાવો રહેવો',
        'શરૂઆતમાં હળવી અસમાનતા કે ગાંઠ જેવું લાગવું જે ધીમે-ધીમે સેટ થઈ જાય છે',
        'રક્તવાહિની દબાઈ જવાનું અત્યંત વિરલ જોખમ જેમાં તાત્કાલિક દવા આપવી પડે છે',
        'ફિલરની અસર ઉત્પાદનના પ્રકાર મુજબ ૬ થી ૧૮ મહિના સુધી ટકે છે'
      ],
      hindi: [
        'इंजेक्शन स्थल पर ३ से ७ दिनों तक सूजन, नीलापन या दर्द',
        'शुरुआत में हल्का उभार या असमानता जो धीरे-धीरे ठीक हो जाती है',
        'रक्तवाहिका पर दबाव का अत्यंत विरल जोखिम जिसका त्वरित उपचार संभव है',
        'इसका प्रभाव ६ से १८ महीने तक बना रहता है'
      ]
    },
    consentText: {
      english:
        'I consent to the subcutaneous/dermal implantation of Hyaluronic Acid dermal filler into my [Body Part]. The aesthetic objective of volumization, contouring, or deep hydration has been reviewed with me. In case of unexpected discoloration or severe pain, I will contact the clinic emergency line immediately.',
      gujarati:
        'હું, મારા [Body Part] પર વોલ્યુમ અને શેપિંગ માટે હાયલ્યુરોનિક એસિડ ડર્મલ ફિલર કરાવવા માટે સંમતિ આપું છું. જો પ્રક્રિયા પછી અસામાન્ય સફેદ/ભૂરો રંગ દેખાય કે તીવ્ર દુખાવો થાય તો હું તાત્કાલિક ક્લિનિકનો સંપર્ક કરીશ.',
      hindi:
        'मैं, मेरे [Body Part] पर हयालूरोनिक एसिड डर्मल फिलर उपचार कराने हेतु सहमति देता/देती हूँ। यदि असामान्य दर्द या त्वचा का रंग बदलने जैसा लक्षण दिखे तो मैं तुरंत क्लिनिक से संपर्क करूँगा/करूँगी।'
    },
    postCareInstructions: {
      english: [
        'Apply cold packs wrapped in clean cloth intermittently for 24 hours to reduce swelling',
        'Sleep with head elevated on an extra pillow for the first 2 nights',
        'Avoid intense heat (hot yoga, sauna, tanning beds) for 7 days',
        'Do not undergo facial dental procedures or extensive facial massages for 2 weeks'
      ],
      gujarati: [
        'સોજો ઓછો કરવા માટે ૨૪ કલાક સુધી કપડામાં વીંટેલા બરફનો શેક કરવો',
        'પ્રથમ ૨ રાત માથું ઊંચું રહે તે રીતે વધારાનું ઓશીકું મૂકીને સૂવું',
        '૭ દિવસ સુધી ખૂબ ગરમીવાળા સ્થળો, હોટ યોગા કે સોના બાથ ટાળવા',
        '૨ અઠવાડિયા સુધી દાંતની સારવાર કે ચહેરાની ઊંડી માલિશ ન કરાવવી'
      ],
      hindi: [
        'सूजन कम करने हेतु साफ कपड़े में बर्फ लपेटकर सिंकाई करें',
        'शुरुआती दो रातें सिर को थोड़ा ऊंचा रखकर सोएं',
        'एक सप्ताह तक अत्यधिक गर्मी और सौना से बचें',
        'दो सप्ताह तक चेहरे की गहरी मालिश या डेंटल प्रक्रिया से बचें'
      ]
    }
  },
  {
    id: 'ct-10',
    templateNo: 10,
    key: 'cautery-rf',
    title: 'Radiofrequency (RF) & Electrocautery Consent',
    procedureName: 'RADIOFREQUENCY (RF) & ELECTROCAUTERY ABLATION',
    gujaratiTitle: 'રેડિયોફ્રિક્વન્સી અને ઇલેક્ટ્રોકોટરી વાર્ટ રિમૂવલ સંમતિ (RF & Electrocautery)',
    hindiTitle: 'रेडियोफ्रीक्वेंसी और इलेक्ट्रोकॉक्टरी सहमति पत्र (RF & Electrocautery)',
    keywords: ['CAUTERY', 'ELECTROCAUTERY', 'RADIOFREQUENCY', 'RF', 'WART', 'SKIN TAG', 'MOLE'],
    risksAndComplications: {
      english: [
        'Mild stinging during local anesthesia injection',
        'Superficial burn crusting that separates over 5-10 days',
        'Temporary pink discoloration or pale mark at the ablated site',
        'Recurrence of viral warts requiring supplementary touch-up sessions'
      ],
      gujarati: [
        'સુન્ન કરવાનું લોકલ ઇન્જેક્શન આપતી વખતે હળવી ચચરાટી',
        'પ્રક્રિયા વાળી જગ્યાએ બળેલ કાળી પોપડી થવી જે ૫ થી ૧૦ દિવસમાં આપમેળે ખરી જશે',
        'પોપડી ખર્યા પછી શરૂઆતમાં ગુલાબી કે આછો નિશાન રહેવો સામાન્ય છે',
        'વાઇરલ મસા (warts) ફરીથી થવાની શક્યતા જેમાં ફરી ટચ-અપ સત્ર કરવું પડે'
      ],
      hindi: [
        'सुन्न करने वाले इंजेक्शन के समय हल्की चुभन',
        'स्थान पर काली पपड़ी बनना जो ५ से १० दिनों में खुद हट जाएगी',
        'पपड़ी हटने के बाद हल्का गुलाबी या फीका निशान रहना सामान्य है',
        'वायरल मस्से दोबारा होने पर पुनः उपचार की आवश्यकता पड़ सकती है'
      ]
    },
    consentText: {
      english:
        'I consent to radiofrequency / electrocautery ablation for removal of skin lesions (warts, skin tags, moles) on my [Body Part] under local anesthesia. I agree to keep the treated crusts clean and dry until complete healing occurs.',
      gujarati:
        'હું, લોકલ એનેસ્થેસિયા આપીને મારા [Body Part] પરથી મસા (warts), સ્કિન ટેગ કે તલ દૂર કરવા માટે રેડિયોફ્રિક્વન્સી / ઇલેક્ટ્રોકોટરી સારવાર કરાવવા સંમત છું. જ્યાં સુધી ઘા રૂઝાઈ ન જાય ત્યાં સુધી હું તેને સ્વચ્છ અને સૂકો રાખીશ.',
      hindi:
        'मैं, स्थानीय सुन्न करने के बाद मेरे [Body Part] से मस्से अथवा स्किन टैग हटाने हेतु रेडियोफ्रीक्वेंसी/कॉक्टरी प्रक्रिया कराने की अनुमति देता/देती हूँ। घाव भरने तक साफ व सूखा रखने का पालन करूँगा/करूँगी।'
    },
    postCareInstructions: {
      english: [
        'Keep the ablated area dry for the first 24 hours; dab dry gently afterward',
        'Apply prescribed antibiotic ointment twice daily until scabs fall off',
        'Do not pick, scratch, or scrub scabs away prematurely',
        'Apply sunscreen daily over fresh pink skin once scabs have fallen'
      ],
      gujarati: [
        'પ્રથમ ૨૪ કલાક સુધી ઘા પર પાણી અડવા દેવું નહીં; ત્યારબાદ હળવા હાથે સાફ કરવું',
        'પોપડી ખરી ન જાય ત્યાં સુધી રોજ બે વાર એન્ટિબાયોટિક મલમ લગાવવો',
        'પોપડીને નખથી ઉખાડવી કે ઘસવી નહીં',
        'પોપડી પડ્યા પછીની નવી ગુલાબી ચામડી પર રોજ સનસ્ક્રીન લગાવવું'
      ],
      hindi: [
        'पहले २४ घंटे घाव को पूरी तरह सूखा रखें',
        'पपड़ी गिरने तक दिन में दो बार एंटीबायोटिक मरहम लगाएं',
        'पपड़ी को कभी भी हाथ से न नोचें',
        'निशान पर रोजाना सनस्क्रीन का प्रयोग करें'
      ]
    }
  },
  {
    id: 'ct-11',
    templateNo: 11,
    key: 'biopsy-excision',
    title: 'Minor OPD Surgical Excision & Biopsy Consent',
    procedureName: 'MINOR OPD SURGICAL EXCISION & BIOPSY',
    gujaratiTitle: 'નાના સર્જિકલ પ્રક્રિયા અને બાયોપ્સી સંમતિ (Minor Excision & Biopsy)',
    hindiTitle: 'लघु शल्य क्रिया एवं बायोप्सी सहमति पत्र (Minor Excision & Biopsy)',
    keywords: ['BIOPSY', 'EXCISION', 'SURGICAL', 'CYST', 'HISTOPATHOLOGY', 'MINOR SURGERY'],
    risksAndComplications: {
      english: [
        'Mild surgical soreness managed with oral analgesics for 1-3 days',
        'Permanent linear scar maturation following suture placement',
        'Risk of hematoma, wound dehiscence, or superficial wound infection',
        'Requirement of suture removal typically between 7 to 12 days'
      ],
      gujarati: [
        'સર્જરી બાદ ૧ થી ૩ દિવસ હળવો દુખાવો જે દર્દશામક દવાથી કાબૂમાં આવી જાય છે',
        'ટાંકા લીધા પછી કાયમી પાતળી રેખા જેવો સર્જિકલ ડાઘ (scar) રહેવો સ્વાભાવિક છે',
        'ટાંકા તૂટવા કે ઘામાં ચેપ લાગવાનું જોખમ જો પાટો ભીનો થાય તો',
        '૭ થી ૧૨ દિવસ પછી ટાંકા કઢાવવા માટે ક્લિનિક આવવું ફરજિયાત છે'
      ],
      hindi: [
        'सर्जरी के बाद १-३ दिनों तक हल्का दर्द जो दवा से ठीक हो जाता है',
        'टांके लगने के कारण एक पतला स्थायी निशान रहना स्वाभाविक है',
        'घाव में संक्रमण या टांके ढीले होने का जोखिम',
        '७ से १२ दिनों के भीतर टांके कटवाने हेतु क्लिनिक आना अनिवार्य है'
      ]
    },
    consentText: {
      english:
        'I authorize [Doctor Name] to perform surgical excision / punch biopsy of the lesion situated at my [Body Part]. I consent to administration of local anesthesia and sending tissue specimens for histopathological laboratory analysis. I understand scar formation is an inevitable outcome of surgical excision.',
      gujarati:
        'હું, ડોક્ટર [Doctor Name] ને મારા [Body Part] પરથી ગાંઠ/મસાનું ઓપરેશન અને બાયોપ્સી સેમ્પલ લેવા માટે મંજૂરી આપું છું. લોકલ એનેસ્થેસિયા આપવા અને ટિશ્યુ લેબોરેટરીમાં તપાસ અર્થે મોકલવા મારી સંમતિ છે. ઓપરેશન પછી ડાઘ રહે છે તે બાબત હું સમજુ છું.',
      hindi:
        'मैं, [Doctor Name] को मेरे [Body Part] से गांठ अथवा बायोप्सी नमूना निकालने की सर्जरी करने की अनुमति देता/देती हूँ। स्थानीय सुन्न करने और जांच हेतु लैब भेजने से मैं पूर्णतः सहमत हूँ।'
    },
    postCareInstructions: {
      english: [
        'Keep sterile dressing strictly clean and dry for 48 hours',
        'Take prescribed antibiotics and pain relief tablets on time',
        'Avoid vigorous exertion or stretching around the suture line',
        'Return to clinic on designated day for sterile wound check and suture removal'
      ],
      gujarati: [
        '૪૮ કલાક સુધી પાટાને એકદમ સાફ અને સૂકો રાખવો; ભીનો થવા દેવો નહીં',
        'ડોક્ટરે લખેલ એન્ટિબાયોટિક્સ અને પેઇનકિલર્સ સમયસર લેવી',
        'ટાંકા ખેંચાય તેવી કોઈ ભારે કસરત કે હલનચલન ન કરવું',
        'ટાંકા કઢાવવા અને ઘા તપાસવા માટે નક્કી કરેલ દિવસે ક્લિનિક પર હાજર રહેવું'
      ],
      hindi: [
        '४८ घंटे तक ड्रेसिंग को बिल्कुल सूखा और साफ रखें',
        'डॉक्टर द्वारा दी गई दवाएं समय पर लें',
        'टांके वाले हिस्से पर खिंचाव या भारी वजन न उठाएं',
        'निर्धारित तिथि पर टांके कटवाने हेतु क्लिनिक अवश्य आएं'
      ]
    }
  },
  {
    id: 'ct-12',
    templateNo: 12,
    key: 'mesotherapy',
    title: 'Mesotherapy & Intralesional Infiltration Consent',
    procedureName: 'MESOTHERAPY & INTRALESIONAL INFILTRATION',
    gujaratiTitle: 'મેસોથેરાપી અને ઇન્ટ્રાલેઝનલ ઇન્જેક્શન સંમતિ (Mesotherapy & Intralesional)',
    hindiTitle: 'मेसोथेरेपी और इंट्रालिजनल सहमति पत्र (Mesotherapy & Intralesional)',
    keywords: ['MESOTHERAPY', 'INTRALESIONAL', 'KELOID', 'STEROID', 'ALOPECIA AREATA'],
    risksAndComplications: {
      english: [
        'Mild localized stinging and soreness at injection sites',
        'Transient skin blanching, small hematoma, or skin thinning (atrophy)',
        'Telangiectasia (tiny visible blood vessels) with repetitive corticosteroid injections',
        'Series of spaced sessions required for keloids or alopecia'
      ],
      gujarati: [
        'ઇન્જેક્શનની જગ્યાએ હળવી બળતરા કે કળતર રહેવું',
        'હંગામી ધોરણે ચામડી સહેજ સફેદ થવી કે ખાડો પડવો (atrophy)',
        'સ્ટીરોઈડ ઇન્જેક્શનથી ઝીણી રક્તવાહિનીઓ દેખાવાની શક્યતા',
        'કેલોઇડ કે વાળના સિક્કા પડવા માટે સમયાંતરે બહુવિધ સત્રો લેવા જરૂરી છે'
      ],
      hindi: [
        'इंजेक्शन स्थल पर हल्की जलन या दर्द होना',
        'त्वचा का अस्थायी रूप से हल्का सफेद या पतला होना',
        'केलोइड या एलोपेसिया के इलाज हेतु कई सिटिंग्स आवश्यक हैं',
        'समय पर फॉलो-अप जांच कराना अनिवार्य है'
      ]
    },
    consentText: {
      english:
        'I consent to mesotherapy / intralesional micro-injection into my [Body Part] under aseptic conditions by [Doctor Name]. I understand therapeutic agents are deposited directly into dermal tissue to treat targeted lesions. I agree to complete the recommended schedule.',
      gujarati:
        'હું, ડોક્ટર [Doctor Name] દ્વારા મારા [Body Part] પર મેસોથેરાપી / ઇન્ટ્રાલેઝનલ ઇન્જેક્શન સારવાર લેવા સંમત છું. દવા સીધી અસરગ્રસ્ત ચામડીમાં આપવાની પદ્ધતિ મને સમજાવવામાં આવી છે અને હું નિર્ધારિત સત્રો પૂરા કરવા સંમત છું.',
      hindi:
        'मैं, [Doctor Name] द्वारा मेरे [Body Part] पर मेसोथेरेपी अथवा इंट्रालिजनल इंजेक्शन लेने की सहमति देता/देती हूँ। दवा सीधे प्रभावित स्थान पर दी जाती है, जिससे मैं सहमत हूँ।'
    },
    postCareInstructions: {
      english: [
        'Avoid rubbing, scratching, or applying unprescribed creams for 24 hours',
        'Keep the area clean with mild antiseptic wash',
        'Avoid sun exposure on the treated lesion',
        'Report any persistent severe pain or skin ulceration immediately'
      ],
      gujarati: [
        '૨૪ કલાક સુધી ઇન્જેક્શનની જગ્યાએ ઘસારો કરવો નહીં કે અન્ય ક્રીમ લગાવવી નહીં',
        'જંતુમુક્ત સાબુથી જગ્યા ચોખ્ખી રાખવી',
        'સારવાર કરેલ ભાગ પર તડકો ન પડવા દેવો',
        'જો અતિશય દુખાવો કે ચાંદું પડે તો તાત્કાલિક ડોક્ટરનો સંપર્ક કરવો'
      ],
      hindi: [
        '२४ घंटे तक इंजेक्शन स्थल को न रगड़ें',
        'घाव को साफ और सूखा रखें',
        'धूप से बचाएं',
        'अत्यधिक दर्द होने पर तुरंत डॉक्टर से संपर्क करें'
      ]
    }
  }
];

// Fallback clipboard copy helper for browsers with restricted clipboard permissions
export const fallbackCopyText = (text: string) => {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '-9999px';
    ta.setAttribute('readonly', '');
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  } catch (err) {
    console.error('Clipboard copy error:', err);
  }
};

// Standalone clean A4 Print Engine for isolated printing
export const printElementA4 = (elementId: string, docTitle: string = 'MedFlow_Clinical_Document') => {
  if (typeof window === 'undefined') return;
  const sourceEl = document.getElementById(elementId);
  if (!sourceEl) {
    window.print();
    return;
  }

  // Remove existing print frame if present
  const oldFrame = document.getElementById('medflow-print-frame');
  if (oldFrame && oldFrame.parentNode) {
    oldFrame.parentNode.removeChild(oldFrame);
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'medflow-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  const frameDoc = iframe.contentWindow?.document;
  if (!frameDoc) {
    window.print();
    return;
  }

  // Extract all existing stylesheet and style rules from parent document
  const pageStyles = typeof document !== 'undefined'
    ? Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map(el => el.outerHTML)
        .join('\n')
    : '';

  frameDoc.open();
  frameDoc.write(`<!DOCTYPE html>
<html>
<head>
  <title>${docTitle}</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${pageStyles}
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #FFFFFF !important;
      color: #0F172A !important;
      margin: 0 !important;
      padding: 0 !important;
      line-height: 1.5;
    }
    .no-print {
      display: none !important;
    }
    .page-break {
      page-break-after: always !important;
      break-after: page !important;
      height: 0;
      display: block;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    th, td {
      border: 1px solid #CBD5E1;
      padding: 6px 8px;
    }
    th {
      background-color: #F1F5F9 !important;
    }
  </style>
</head>
<body>
  ${sourceEl.innerHTML}
</body>
</html>`);
  frameDoc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('Print iframe error:', err);
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2500);
    }
  }, 300);
};

interface ProcedureConsentFormProps {
  patient: ConsentPatientInfo;
  onUpdateProcedure?: (updated: {
    procedureName: string;
    bodyPart: string;
    totalSessions?: number;
    date?: string;
  }) => void;
  onPrintRequested?: () => void;
  defaultCollapsed?: boolean;
}

export default function ProcedureConsentForm({
  patient,
  onUpdateProcedure,
  onPrintRequested,
  defaultCollapsed = false
}: ProcedureConsentFormProps) {
  // Collapse / Uncollapse state with client-safe persistence
  const [isCollapsed, setIsCollapsed] = useState<boolean>(defaultCollapsed);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('medflow_consent_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {}
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('medflow_consent_collapsed', String(next));
      } catch {}
      return next;
    });
  };
  // 1. Language state: auto-detect from patient profile (default to Gujarati if specified or profile has Gujarati/English)
  const initialLang: 'Gujarati' | 'Hindi' | 'English' = useMemo(() => {
    if (patient.language === 'Gujarati') return 'Gujarati';
    if (patient.language === 'Hindi') return 'Hindi';
    return 'English';
  }, [patient.language]);

  const [selectedLanguage, setSelectedLanguage] = useState<'Gujarati' | 'Hindi' | 'English'>(initialLang);

  // Sync language if patient profile language changes
  useEffect(() => {
    if (patient.language && ['Gujarati', 'Hindi', 'English'].includes(patient.language)) {
      setSelectedLanguage(patient.language as any);
    }
  }, [patient.language]);

  // 2. Automatic matching of consent template based on procedureName
  const matchedTemplateId = useMemo(() => {
    const raw = (patient.procedureName || '').toUpperCase();
    for (const t of TWELVE_CONSENT_TEMPLATES) {
      if (t.keywords.some(kw => raw.includes(kw))) {
        return t.id;
      }
    }
    return 'ct-1'; // Default: Diode Laser Hair Removal
  }, [patient.procedureName]);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(matchedTemplateId);
  const [manualTemplatePicked, setManualTemplatePicked] = useState<boolean>(false);

  // Whenever procedureName changes from doctor selection in protocol, auto-select matching template
  useEffect(() => {
    if (!manualTemplatePicked) {
      setSelectedTemplateId(matchedTemplateId);
    }
  }, [matchedTemplateId, manualTemplatePicked]);

  const activeTemplate = useMemo(() => {
    return TWELVE_CONSENT_TEMPLATES.find(t => t.id === selectedTemplateId) || TWELVE_CONSENT_TEMPLATES[0];
  }, [selectedTemplateId]);

  // 3. Effective Procedure Name:
  // If doctor customized the procedure name via "Update Procedure Option", use that custom name.
  // Otherwise, ALWAYS strictly use activeTemplate.procedureName so that switching to Lesson 10
  // ALWAYS immediately displays "RADIOFREQUENCY (RF) & ELECTROCAUTERY ABLATION" (never a mismatched procedure)!
  const [customProcedureName, setCustomProcedureName] = useState<string | null>(null);

  const effectiveProcedureName = useMemo(() => {
    if (customProcedureName) {
      return customProcedureName;
    }
    return activeTemplate.procedureName;
  }, [customProcedureName, activeTemplate.procedureName]);

  // 4. Xerox Mode State (Doctor, Reception, Nursing Panel Duplicate)
  const [isXeroxMode, setIsXeroxMode] = useState<boolean>(false);
  const [copySuccessToast, setCopySuccessToast] = useState<string | null>(null);

  // 5. Update Procedure Dialog / Inline Drawer State
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [editProcedureName, setEditProcedureName] = useState<string>(effectiveProcedureName);
  const [editBodyPart, setEditBodyPart] = useState<string>(patient.bodyPart || 'FACE');
  const [editDate, setEditDate] = useState<string>(patient.date || '2026-03-25');
  const [editIpdNo, setEditIpdNo] = useState<string>(patient.ipdNo || 'IPD-2026-089');

  // Keep local edit states synced if patient or template changes
  useEffect(() => {
    setEditProcedureName(effectiveProcedureName);
    setEditBodyPart(patient.bodyPart || 'FACE');
    setEditDate(patient.date || '2026-03-25');
    if (patient.ipdNo) setEditIpdNo(patient.ipdNo);
  }, [effectiveProcedureName, patient.bodyPart, patient.date, patient.ipdNo]);

  // Handle template selection: syncs template AND updates procedure
  const handleSelectTemplate = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    setManualTemplatePicked(true);
    setCustomProcedureName(null); // Reset custom override so new template takes immediate effect
    const tmpl = TWELVE_CONSENT_TEMPLATES.find(t => t.id === tmplId);
    if (tmpl) {
      setEditProcedureName(tmpl.procedureName);
      if (onUpdateProcedure) {
        onUpdateProcedure({
          procedureName: tmpl.procedureName,
          bodyPart: patient.bodyPart || 'FACE',
          date: patient.date
        });
      }
      setCopySuccessToast(`✓ Loaded Lesson ${tmpl.templateNo}: "${tmpl.procedureName}" & Synced with Protocol!`);
      setTimeout(() => setCopySuccessToast(null), 3500);
    }
  };

  // Dynamic Token Replacer
  const interpolateTokens = (text: string) => {
    let result = text;
    result = result.replace(/\[Patient Name\]/g, patient.name || 'Ramesh Patel');
    result = result.replace(/\[Age\]/g, String(patient.age || 32));
    result = result.replace(/\[Gender\]/g, patient.gender === 'M' ? 'Male (પુરૂષ)' : patient.gender === 'F' ? 'Female (સ્ત્રી)' : patient.gender || 'M');
    result = result.replace(/\[Place\]/g, patient.place || 'Surat');
    result = result.replace(/\[IPD Number\]/g, editIpdNo || 'IPD-2026-089');
    result = result.replace(/\[MRD Number\]/g, patient.mrdNo || 'MRD-2026-0019');
    result = result.replace(/\[Case Number\]/g, patient.caseNo || 'C004-001-22092026');
    result = result.replace(/\[Procedure Name\]/g, effectiveProcedureName);
    result = result.replace(/\[Body Part\]/g, patient.bodyPart || 'FACE');
    result = result.replace(/\[Date\]/g, patient.date || '25/03/2026');
    result = result.replace(/\[Doctor Name\]/g, patient.doctorName || 'Dr. Raj Valaki, MBBS, MD');
    result = result.replace(/\[Clinic Name\]/g, patient.clinicName || 'MedFlow Multispeciality Clinic & Laser Centre');
    return result;
  };

  // 6. Handle Copy / Xerox to clipboard
  const handleCopyXeroxText = () => {
    const rawConsent = activeTemplate.consentText[selectedLanguage === 'Gujarati' ? 'gujarati' : selectedLanguage === 'Hindi' ? 'hindi' : 'english'];
    const interpolated = interpolateTokens(rawConsent);
    
    const clipText = `=====================================================
[OFFICIAL XEROX / CLINICAL ARCHIVE DUPLICATE - RECEPTION & NURSING COPY]
MEDFLOW MULTISPECIALITY CLINIC & LASER AESTHETICS CENTRE
INFORMED PROCEDURAL CONSENT RECORD (XEROX DUPLICATE)
=====================================================
PATIENT DEMOGRAPHICS:
- Patient Name (નામ): ${patient.name}
- Gender (M/F) & Age: ${patient.gender === 'M' ? 'M (Male / પુરૂષ)' : patient.gender === 'F' ? 'F (Female / સ્ત્રી)' : patient.gender} • ${patient.age} Yrs
- Place / City (સ્થાન): ${patient.place}
- IPD No: ${editIpdNo} | MRD No: ${patient.mrdNo}
- Case No: ${patient.caseNo}
- Procedure (પ્રોસિજરનું નામ): ${effectiveProcedureName}
- Target Area / Body Part: ${patient.bodyPart}
- Date (તારીખ): ${patient.date}
- Attending Doctor (તબીબ): ${patient.doctorName || 'Dr. Raj Valaki, MBBS, MD'}
-----------------------------------------------------
CONSENT TEMPLATE: [Lesson ${activeTemplate.templateNo}/12] ${activeTemplate.title}
LANGUAGE: ${selectedLanguage.toUpperCase()}

CONSENT DECLARATION:
${interpolated}

CLINICAL ARCHIVE RECORD STATUS:
- Verified & Archival Duplicate logged for Doctor, Reception, and Nursing Panel.
- Certified Xerox Copy Date: ${new Date().toLocaleDateString('en-IN')}
=====================================================`;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(clipText).catch(() => {
          fallbackCopyText(clipText);
        });
      } else {
        fallbackCopyText(clipText);
      }
    } catch {
      fallbackCopyText(clipText);
    }

    setCopySuccessToast('✓ Xerox / Duplicate Copy copied to clipboard! Ready to paste in Reception / Nursing Panel EMR.');
    setTimeout(() => setCopySuccessToast(null), 3500);
  };

  // 7. Handle Print (Direct & Clean A4 Isolated Print via iframe)
  const handlePrintDocument = useCallback((isXerox: boolean = isXeroxMode) => {
    setIsXeroxMode(isXerox);
    setTimeout(() => {
      printElementA4(
        'consent-printable-document',
        isXerox
          ? `MedFlow_Xerox_Duplicate_${patient.caseNo || 'Case'}`
          : `MedFlow_Consent_Form_${patient.caseNo || 'Case'}`
      );
    }, 150);
  }, [isXeroxMode, patient.caseNo]);

  // Global window event listeners to allow parent navigation bars to trigger clean print
  useEffect(() => {
    const handlePrintConsentEvt = () => {
      handlePrintDocument(false);
    };
    const handlePrintXeroxEvt = () => {
      handlePrintDocument(true);
    };

    window.addEventListener('medflow-print-consent', handlePrintConsentEvt);
    window.addEventListener('medflow-print-xerox', handlePrintXeroxEvt);

    return () => {
      window.removeEventListener('medflow-print-consent', handlePrintConsentEvt);
      window.removeEventListener('medflow-print-xerox', handlePrintXeroxEvt);
    };
  }, [handlePrintDocument]);

  // 8. Save updated procedure
  const handleSaveUpdatedProcedure = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomProcedureName(editProcedureName);
    if (onUpdateProcedure) {
      onUpdateProcedure({
        procedureName: editProcedureName,
        bodyPart: editBodyPart,
        date: editDate
      });
    }
    setManualTemplatePicked(true);
    setShowUpdateModal(false);
    setCopySuccessToast(`✓ Procedure updated to "${editProcedureName}" (${editBodyPart}) across Consent & Protocol!`);
    setTimeout(() => setCopySuccessToast(null), 3500);
  };

  return (
    <div
      id="procedure-consent-module"
      style={{
        marginTop: 24,
        marginBottom: 24,
        background: '#FFFFFF',
        borderRadius: 12,
        border: '2px solid #036d92',
        boxShadow: '0 4px 20px rgba(3, 109, 146, 0.1)',
        overflow: 'hidden'
      }}
    >
      {/* 1. Header Bar: Title, Procedure Binding Indicator, Language Toggles & Xerox Badge (NO-PRINT) */}
      <div
        className="no-print"
        style={{
          background: isXeroxMode
            ? 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)'
            : 'linear-gradient(135deg, #036d92 0%, #0284c7 100%)',
          padding: '14px 20px',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          transition: 'background 0.3s ease'
        }}
      >
        <div
          onClick={toggleCollapse}
          style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', cursor: 'pointer' }}
          title={isCollapsed ? 'Click to expand Consent Form' : 'Click to collapse Consent Form'}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 8,
              padding: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FileText size={22} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: '-0.01em' }}>
                {isXeroxMode
                  ? '📑 Official Xerox / Duplicate Consent Record (ઝેરોક્ષ નકલ)'
                  : '📄 Medico-Legal Informed Consent Form (સંમતિ પત્રક)'}
              </span>
              <span
                style={{
                  background: isXeroxMode ? '#F59E0B' : '#10B981',
                  color: '#FFFFFF',
                  fontSize: 10.5,
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <CheckCircle2 size={12} />
                {isXeroxMode ? 'RECEPTION & NURSING XEROX COPY' : 'AUTO-LINKED TO PROCEDURE'}
              </span>
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.22)',
                  color: '#FFFFFF',
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 10,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3
                }}
              >
                {isCollapsed ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
                {isCollapsed ? 'Collapsed' : 'Expanded'}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: '#E0F2FE', marginTop: 2 }}>
              Active Procedure: <strong>{effectiveProcedureName}</strong> • Target:{' '}
              <strong>{patient.bodyPart || 'FACE'}</strong> • 12 Standard Clinical Lessons Available
            </div>
          </div>
        </div>

        {/* Right Action Ribbon: Language Switcher, Xerox Toggle, Update Procedure, Collapse Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Language Switcher */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: 8,
              padding: 3,
              border: '1px solid rgba(255, 255, 255, 0.25)'
            }}
          >
            {(['Gujarati', 'Hindi', 'English'] as const).map(lang => {
              const isSelected = selectedLanguage === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setSelectedLanguage(lang)}
                  style={{
                    background: isSelected ? '#FFFFFF' : 'transparent',
                    color: isSelected ? '#036d92' : '#FFFFFF',
                    border: 'none',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: 11.5,
                    fontWeight: isSelected ? 900 : 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title={`Switch to ${lang}`}
                >
                  {lang === 'Gujarati' && '🇬🇺 ગુજરાતી'}
                  {lang === 'Hindi' && '🇮🇳 हिंदी'}
                  {lang === 'English' && '🇬🇧 English'}
                </button>
              );
            })}
          </div>

          {/* Xerox / Duplicate Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsXeroxMode(!isXeroxMode)}
            style={{
              background: isXeroxMode ? '#F59E0B' : 'rgba(255, 255, 255, 0.2)',
              border: isXeroxMode ? '1px solid #D97706' : '1px solid rgba(255, 255, 255, 0.35)',
              color: '#FFFFFF',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5
            }}
            title="Toggle between Original Patient Form and Xerox / Duplicate Copy for Reception & Nursing Desk"
          >
            <Copy size={13} />
            {isXeroxMode ? '✓ Xerox Mode Active' : 'Xerox Option (ઝેરોક્ષ)'}
          </button>

          {/* Update Procedure Button */}
          <button
            type="button"
            onClick={() => setShowUpdateModal(true)}
            style={{
              background: '#FFFFFF',
              border: 'none',
              color: '#036d92',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 11.5,
              fontWeight: 900,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
            }}
            title="Update Procedure Name, Target Area, Sessions or IPD No directly in Consent"
          >
            <Edit3 size={13} />
            Update Procedure Option
          </button>

          {/* Collapse / Uncollapse Toggle Button */}
          <button
            type="button"
            onClick={toggleCollapse}
            style={{
              background: isCollapsed ? '#FFFFFF' : 'rgba(255, 255, 255, 0.22)',
              border: isCollapsed ? '1px solid #BAE6FD' : '1px solid rgba(255, 255, 255, 0.35)',
              color: isCollapsed ? '#036d92' : '#FFFFFF',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 11.5,
              fontWeight: 900,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: isCollapsed ? '0 2px 8px rgba(0, 0, 0, 0.15)' : 'none',
              transition: 'all 0.2s ease'
            }}
            title={isCollapsed ? 'Expand Consent Form (ખોલો)' : 'Collapse Consent Form (સંકેલો)'}
          >
            {isCollapsed ? (
              <>
                <ChevronDown size={15} />
                <span>Expand (ખોલો)</span>
              </>
            ) : (
              <>
                <ChevronUp size={15} />
                <span>Collapse (સંકેલો)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sleek Collapsed Quick Banner Bar (NO-PRINT) */}
      {isCollapsed && (
        <div
          className="no-print"
          onClick={toggleCollapse}
          style={{
            padding: '12px 20px',
            background: 'linear-gradient(90deg, #F0F9FF 0%, #E0F2FE 100%)',
            borderBottom: '1.5px solid #BAE6FD',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            flexWrap: 'wrap',
            gap: 10,
            transition: 'background 0.2s ease'
          }}
          title="Click to expand the full informed consent document"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{
              background: '#0369A1',
              color: '#FFFFFF',
              fontSize: 10.5,
              fontWeight: 900,
              padding: '2px 8px',
              borderRadius: 12
            }}>
              Lesson {activeTemplate.templateNo}/12
            </span>
            <span style={{ fontWeight: 800, fontSize: 13, color: '#0C4A6E' }}>
              {activeTemplate.title}
            </span>
            <span style={{ color: '#94A3B8' }}>•</span>
            <span style={{ fontSize: 11.5, color: '#475569' }}>
              Patient: <strong>{patient.name}</strong> ({patient.gender}, {patient.age}y)
            </span>
            <span style={{ color: '#94A3B8' }}>•</span>
            <span style={{ fontSize: 11.5, color: '#475569' }}>
              Target: <strong>{patient.bodyPart || 'FACE'}</strong>
            </span>
            <span style={{ color: '#94A3B8' }}>•</span>
            <span style={{ fontSize: 11.5, color: '#475569' }}>
              Language: <strong>{selectedLanguage}</strong>
            </span>
            <span style={{ color: '#94A3B8' }}>•</span>
            <span style={{ fontSize: 11.5, color: '#059669', fontWeight: 700 }}>
              ✓ Legal consent auto-bound to procedure protocol
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#036d92', fontWeight: 800, fontSize: 12 }}>
            <span>Click to Expand Form</span>
            <ChevronDown size={15} />
          </div>
        </div>
      )}

      {/* Collapsible Consent Body */}
      <div
        className={isCollapsed ? 'consent-collapsed-hide' : ''}
        style={isCollapsed ? { display: 'none' } : undefined}
      >

      {/* Toast Notification (NO-PRINT) */}
      {copySuccessToast && (
        <div
          className="no-print"
          style={{
            background: '#ECFDF5',
            borderBottom: '1px solid #A7F3D0',
            color: '#065F46',
            padding: '8px 20px',
            fontSize: 12,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <CheckCircle2 size={16} color="#059669" />
          <span>{copySuccessToast}</span>
        </div>
      )}

      {/* 2. 12-Template Selector Strip (NO-PRINT) */}
      <div
        className="no-print"
        style={{
          background: '#F8FAFC',
          padding: '12px 18px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Layers size={15} color="#036d92" />
            <span style={{ fontSize: 12, fontWeight: 900, color: '#1E293B' }}>
              Standard Consent Catalog (12 Lessons / Templates):
            </span>
          </div>

          {/* Quick Dropdown */}
          <select
            value={selectedTemplateId}
            onChange={e => handleSelectTemplate(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1.5px solid #036d92',
              fontSize: 12,
              fontWeight: 800,
              color: '#036d92',
              background: '#FFFFFF',
              cursor: 'pointer',
              minWidth: 320
            }}
          >
            {TWELVE_CONSENT_TEMPLATES.map(t => (
              <option key={t.id} value={t.id}>
                Lesson {t.templateNo}: {t.title}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Template Badge & Sync Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Active Lesson:</span>
          <span
            style={{
              background: '#E0F2FE',
              color: '#0369A1',
              padding: '4px 10px',
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 800,
              border: '1px solid #BAE6FD'
            }}
          >
            Lesson {activeTemplate.templateNo} of 12 • {activeTemplate.title}
          </span>
        </div>
      </div>

      {/* 3. Quick Chips Strip for all 12 templates (NO-PRINT) */}
      <div
        className="no-print"
        style={{
          padding: '8px 18px',
          background: '#F1F5F9',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          alignItems: 'center'
        }}
      >
        <span style={{ fontSize: 10.5, fontWeight: 800, color: '#64748B', flexShrink: 0 }}>
          Quick Lessons Switcher:
        </span>
        {TWELVE_CONSENT_TEMPLATES.map(tmpl => {
          const isCurrent = tmpl.id === selectedTemplateId;
          return (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => handleSelectTemplate(tmpl.id)}
              style={{
                flexShrink: 0,
                background: isCurrent ? '#036d92' : '#FFFFFF',
                color: isCurrent ? '#FFFFFF' : '#334155',
                border: isCurrent ? '1px solid #036d92' : '1px solid #CBD5E1',
                borderRadius: 14,
                padding: '3px 10px',
                fontSize: 10.5,
                fontWeight: isCurrent ? 900 : 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title={tmpl.title}
            >
              {tmpl.templateNo}. {tmpl.title.split(' ')[0]} {tmpl.title.split(' ')[1] || ''}
            </button>
          );
        })}
      </div>

      {/* 4. MAIN CONSENT DOCUMENT SHEET (Paper Layout — PRINT TARGET #consent-printable-document) */}
      <div
        id="consent-printable-document"
        className="printable-document"
        style={{ padding: '24px 28px', background: '#FFFFFF', position: 'relative' }}
      >
        {/* Xerox / Duplicate Watermark Stamp */}
        {isXeroxMode && (
          <div
            style={{
              position: 'absolute',
              top: 24,
              right: 28,
              border: '3px dashed #DC2626',
              padding: '8px 14px',
              borderRadius: 8,
              color: '#DC2626',
              transform: 'rotate(-4deg)',
              background: 'rgba(254, 242, 242, 0.95)',
              zIndex: 10,
              boxShadow: '0 2px 10px rgba(220, 38, 38, 0.15)'
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ★ OFFICIAL XEROX COPY (ઝેરોક્ષ નકલ) ★
            </div>
            <div style={{ fontSize: 9.5, fontWeight: 800, textAlign: 'center', marginTop: 2 }}>
              RECEPTION &amp; NURSING ARCHIVE DUPLICATE
            </div>
            <div style={{ fontSize: 8.5, textAlign: 'center', color: '#991B1B' }}>
              Stamp ID: XR-{patient.caseNo}-{Date.now().toString().slice(-4)}
            </div>
          </div>
        )}

        {/* Hospital Branding Header */}
        <div
          style={{
            borderBottom: '2px solid #0F172A',
            paddingBottom: 14,
            marginBottom: 16,
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.12em', color: '#036d92' }}>
            MEDFLOW MULTISPECIALITY CLINIC &amp; LASER AESTHETICS CENTRE
          </div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: isXeroxMode ? '#0F172A' : '#036d92',
              marginTop: 4,
              marginBottom: 4,
              letterSpacing: '-0.01em'
            }}
          >
            {selectedLanguage === 'Gujarati' && (
              <>
                દર્દી પ્રક્રિયા સંમતિ પત્રક – {activeTemplate.gujaratiTitle.toUpperCase()}
                {isXeroxMode && ' [ઝેરોક્ષ / ડુપ્લીકેટ નકલ]'}
              </>
            )}
            {selectedLanguage === 'Hindi' && (
              <>
                मरीज प्रक्रिया सहमति पत्र – {activeTemplate.hindiTitle.toUpperCase()}
                {isXeroxMode && ' [फोटोकॉपी / डुप्लीकेट प्रति]'}
              </>
            )}
            {selectedLanguage === 'English' && (
              <>
                PATIENT INFORMED CONSENT FORM – {activeTemplate.title.toUpperCase()}
                {isXeroxMode && ' [OFFICIAL XEROX DUPLICATE]'}
              </>
            )}
          </h2>
          <div style={{ fontSize: 11, color: '#64748B' }}>
            Plot 42, Ellis Bridge Medical Enclave, Ahmedabad, Gujarat • Helpline: +91 79 4900 1200 • NABH Accredited OPD
          </div>
        </div>

        {/* 5. PATIENT DEMOGRAPHICS MATRIX (Auto-Populated) */}
        <div
          style={{
            background: isXeroxMode ? '#F1F5F9' : '#F8FAFC',
            border: isXeroxMode ? '1.5px solid #94A3B8' : '1.5px solid #BAE6FD',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 18
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '10px 16px',
              fontSize: 12
            }}
          >
            <div>
              <span style={{ color: '#64748B', fontWeight: 700, fontSize: 11 }}>Patient Name (નામ):</span>
              <div style={{ fontWeight: 900, color: '#0F172A', fontSize: 13 }}>
                {patient.name || 'harsh prajapati'}
              </div>
            </div>

            <div>
              <span style={{ color: '#64748B', fontWeight: 700, fontSize: 11 }}>M/F (લિંગ) &amp; Age (ઉમર):</span>
              <div style={{ fontWeight: 900, color: '#0F172A' }}>
                {patient.gender === 'M' ? 'M (Male / પુરૂષ)' : patient.gender === 'F' ? 'F (Female / સ્ત્રી)' : patient.gender} • {patient.age} Yrs
              </div>
            </div>

            <div>
              <span style={{ color: '#64748B', fontWeight: 700, fontSize: 11 }}>Place (સ્થાન):</span>
              <div style={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={12} color="#036d92" />
                {patient.place || 'Surat'}
              </div>
            </div>

            <div>
              <span style={{ color: '#64748B', fontWeight: 700, fontSize: 11 }}>IPD No:</span>
              <div style={{ fontWeight: 900, color: '#036d92', fontFamily: 'monospace' }}>
                {editIpdNo || 'IPD-2026-089'}
              </div>
            </div>

            <div>
              <span style={{ color: '#64748B', fontWeight: 700, fontSize: 11 }}>MRD No:</span>
              <div style={{ fontWeight: 900, color: '#0F172A', fontFamily: 'monospace' }}>
                {patient.mrdNo || 'MRD-2026-0001'}
              </div>
            </div>

            <div>
              <span style={{ color: '#64748B', fontWeight: 700, fontSize: 11 }}>Case No:</span>
              <div style={{ fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                {patient.caseNo || 'C005-001-23092026'}
              </div>
            </div>

            <div>
              <span style={{ color: '#64748B', fontWeight: 700, fontSize: 11 }}>Procedure (પ્રોસિજરનું નામ):</span>
              <div style={{ fontWeight: 900, color: '#036d92' }}>
                {effectiveProcedureName}
              </div>
            </div>

            <div>
              <span style={{ color: '#64748B', fontWeight: 700, fontSize: 11 }}>Target Area / Body Part:</span>
              <div style={{ fontWeight: 900, color: '#059669' }}>
                {patient.bodyPart || 'FACE'}
              </div>
            </div>

            <div>
              <span style={{ color: '#64748B', fontWeight: 700, fontSize: 11 }}>Date (તારીખ):</span>
              <div style={{ fontWeight: 900, color: '#0F172A', fontFamily: 'monospace' }}>
                {patient.date || '2026-03-25'}
              </div>
            </div>

            <div>
              <span style={{ color: '#64748B', fontWeight: 700, fontSize: 11 }}>Attending Doctor (તબીબ):</span>
              <div style={{ fontWeight: 900, color: '#0F172A' }}>
                {patient.doctorName || 'Dr. Raj Valaki, MBBS, MD (Dermatology)'}
              </div>
            </div>
          </div>
        </div>

        {/* 6. Legal & Clinical Consent Declaration Body */}
        <div
          style={{
            fontSize: 13.5,
            lineHeight: 1.8,
            color: '#1E293B',
            background: isXeroxMode ? '#F8FAFC' : '#F0F9FF',
            border: isXeroxMode ? '1px solid #CBD5E1' : '1px solid #BAE6FD',
            borderRadius: 8,
            padding: '18px 22px',
            marginBottom: 18
          }}
        >
          <div style={{ fontWeight: 800, color: '#036d92', fontSize: 12.5, marginBottom: 8, textTransform: 'uppercase' }}>
            {selectedLanguage === 'Gujarati' && 'સંમતિ અને અધિકૃતતાનું ઘોષણાપત્ર (Declaration of Informed Consent)'}
            {selectedLanguage === 'Hindi' && 'सहमति एवं अधिकृतता घोषणा (Declaration of Informed Consent)'}
            {selectedLanguage === 'English' && 'Voluntary Patient Declaration & Procedure Authorization'}
          </div>

          <p style={{ margin: 0, fontWeight: 600 }}>
            {interpolateTokens(
              activeTemplate.consentText[
                selectedLanguage === 'Gujarati' ? 'gujarati' : selectedLanguage === 'Hindi' ? 'hindi' : 'english'
              ]
            )}
          </p>

          <p style={{ marginTop: 10, marginBottom: 0, fontSize: 11.5, color: '#64748B' }}>
            * This informed consent remains legally binding for all sessions prescribed under Case #{patient.caseNo} unless revoked in writing.
          </p>
        </div>

        {/* 7. Clinical Disclosures: Risks & Post-Care Instructions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {/* Left: Anticipated Side Effects & Risks */}
          <div
            style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: 8,
              padding: '12px 16px'
            }}
          >
            <div
              style={{
                fontWeight: 800,
                fontSize: 12,
                color: '#92400E',
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <AlertCircle size={14} color="#D97706" />
              <span>
                {selectedLanguage === 'Gujarati' && 'સંભવિત આડઅસર અને જોખમો (Risks & Disclosures)'}
                {selectedLanguage === 'Hindi' && 'संभावित जोखिम और दुष्प्रभाव (Risks & Disclosures)'}
                {selectedLanguage === 'English' && 'Anticipated Side Effects & Clinical Risks'}
              </span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: '#78350F', lineHeight: 1.6 }}>
              {activeTemplate.risksAndComplications[
                selectedLanguage === 'Gujarati' ? 'gujarati' : selectedLanguage === 'Hindi' ? 'hindi' : 'english'
              ].map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          {/* Right: Post-Procedure Precautions & Care */}
          <div
            style={{
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: 8,
              padding: '12px 16px'
            }}
          >
            <div
              style={{
                fontWeight: 800,
                fontSize: 12,
                color: '#065F46',
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <ShieldCheck size={14} color="#059669" />
              <span>
                {selectedLanguage === 'Gujarati' && 'પ્રક્રિયા પછીની કાળજી (Post-Care Instructions)'}
                {selectedLanguage === 'Hindi' && 'उपचार उपरांत सावधानियां (Post-Care Instructions)'}
                {selectedLanguage === 'English' && 'Mandatory Home Care & Precautions'}
              </span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: '#064E3B', lineHeight: 1.6 }}>
              {activeTemplate.postCareInstructions[
                selectedLanguage === 'Gujarati' ? 'gujarati' : selectedLanguage === 'Hindi' ? 'hindi' : 'english'
              ].map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* 8. Signature Blocks */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
            paddingTop: 16,
            borderTop: '2px solid #E2E8F0'
          }}
        >
          {/* Patient Signature */}
          <div>
            <div style={{ borderBottom: '1.5px solid #0F172A', height: 38, marginBottom: 6 }} />
            <div style={{ fontWeight: 800, fontSize: 12, color: '#0F172A' }}>
              Patient / Legal Guardian
            </div>
            <div style={{ fontSize: 10.5, color: '#64748B' }}>
              Name: {patient.name || 'harsh prajapati'} (Sign / અંગૂઠો)
            </div>
          </div>

          {/* Attending Physician Signature */}
          <div>
            <div style={{ borderBottom: '1.5px solid #0F172A', height: 38, marginBottom: 6 }} />
            <div style={{ fontWeight: 800, fontSize: 12, color: '#0F172A' }}>
              Attending Physician
            </div>
            <div style={{ fontSize: 10.5, color: '#64748B' }}>
              {patient.doctorName || 'Dr. Raj Valaki, MBBS, MD (Dermatology)'} (Reg: G-34891)
            </div>
          </div>

          {/* Nursing / Reception Witness Signature */}
          <div>
            <div style={{ borderBottom: '1.5px solid #0F172A', height: 38, marginBottom: 6 }} />
            <div style={{ fontWeight: 800, fontSize: 12, color: '#0F172A' }}>
              Clinical Witness / Nurse
            </div>
            <div style={{ fontSize: 10.5, color: '#64748B' }}>
              Sister Rekha / Front Desk Officer (MedFlow)
            </div>
          </div>
        </div>
      </div>

      {/* 9. BOTTOM ACTION TOOLBAR: Print, Xerox, Clipboard Copy, Show All Print (NO-PRINT) */}
      <div
        className="no-print"
        style={{
          background: '#F8FAFC',
          borderTop: '1px solid #E2E8F0',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              background: '#DCFCE7',
              color: '#15803D',
              border: '1px solid #86EFAC',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 11.5,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            <CheckCircle2 size={14} />
            Consent Form Logged in EMR ✓
          </span>
          <span style={{ fontSize: 11, color: '#64748B' }}>
            Language: <strong>{selectedLanguage}</strong> • Template #{activeTemplate.templateNo}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Copy Xerox Text */}
          <button
            type="button"
            onClick={handleCopyXeroxText}
            style={{
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#334155',
              padding: '7px 14px',
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
            title="Copy Xerox / Duplicate text to clipboard for Reception / Nursing records"
          >
            <Copy size={14} />
            Copy Xerox to Clipboard
          </button>

          {/* Print Xerox Button */}
          <button
            type="button"
            onClick={() => handlePrintDocument(true)}
            style={{
              background: '#F59E0B',
              border: 'none',
              color: '#FFFFFF',
              padding: '7px 14px',
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 900,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)'
            }}
            title="Print Xerox / Duplicate Copy with official hospital duplicate stamp"
          >
            <Printer size={14} />
            Print Xerox Copy (ઝેરોક્ષ પ્રિન્ટ)
          </button>

          {/* Print Original Consent Button */}
          <button
            type="button"
            onClick={() => handlePrintDocument(false)}
            style={{
              background: '#036d92',
              border: 'none',
              color: '#FFFFFF',
              padding: '7px 16px',
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 900,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(3, 109, 146, 0.3)'
            }}
            title="Print original official Patient Consent Form"
          >
            <Printer size={14} />
            Print Consent Form (ઓરિજિનલ પ્રિન્ટ)
          </button>

          {/* Show All Print Options */}
          {onPrintRequested && (
            <button
              type="button"
              onClick={onPrintRequested}
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                border: 'none',
                color: '#FFFFFF',
                padding: '7px 16px',
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 900,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)'
              }}
              title="Open Print Center: Consent Forms, Xerox Duplicate, 22-Col Protocol Sheet, and Patient Instructions"
            >
              <Printer size={14} />
              🖨️ Show All Print
            </button>
          )}
        </div>
      </div>
    </div>

      {/* 10. UPDATE PROCEDURE MODAL (Doctor can update procedure details directly) */}
      {showUpdateModal && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
            backdropFilter: 'blur(3px)'
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              maxWidth: 560,
              width: '100%',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #036d92 0%, #0284c7 100%)',
                color: '#FFFFFF',
                padding: '14px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit3 size={18} />
                <span style={{ fontWeight: 900, fontSize: 15 }}>
                  Update Procedure Details (પ્રોસિજર સુધારો)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowUpdateModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: 18,
                  cursor: 'pointer',
                  fontWeight: 900
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUpdatedProcedure} style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Procedure Name */}
                <div>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: 12, color: '#334155', marginBottom: 5 }}>
                    Procedure Name (પ્રોસિજરનું નામ) *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editProcedureName}
                    onChange={e => setEditProcedureName(e.target.value)}
                    list="consent-procedure-options"
                    placeholder="e.g. HAIR REMOVAL - DIODE"
                    style={{ height: 38, fontSize: 13, fontWeight: 700 }}
                    required
                  />
                  <datalist id="consent-procedure-options">
                    <option value="HAIR REMOVAL - DIODE" />
                    <option value="CHEMICAL PEEL (GLYCOLIC)" />
                    <option value="CO2 FRACTIONAL LASER" />
                    <option value="Q-SWITCH Nd:YAG LASER" />
                    <option value="PRP SCALP REJUVENATION" />
                    <option value="MICRONEEDLING DERMA ROLLER" />
                    <option value="HYDRAFACIAL & MEDICAL FACIAL" />
                    <option value="BOTOX & NEUROMODULATOR" />
                    <option value="DERMAL FILLERS (HA)" />
                    <option value="RADIOFREQUENCY (RF) & ELECTROCAUTERY" />
                    <option value="MINOR OPD SURGICAL EXCISION & BIOPSY" />
                    <option value="MESOTHERAPY & INTRALESIONAL" />
                  </datalist>
                </div>

                {/* Target Body Part & Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: 12, color: '#334155', marginBottom: 5 }}>
                      Target Body Part (શરીરનો ભાગ) *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={editBodyPart}
                      onChange={e => setEditBodyPart(e.target.value)}
                      placeholder="e.g. FACE, FULL FACE, UNDERARMS"
                      style={{ height: 38, fontSize: 12.5, fontWeight: 700 }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: 12, color: '#334155', marginBottom: 5 }}>
                      Procedure Date (તારીખ) *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={editDate}
                      onChange={e => setEditDate(e.target.value)}
                      placeholder="YYYY-MM-DD or DD/MM/YYYY"
                      style={{ height: 38, fontSize: 12.5, fontWeight: 700, fontFamily: 'monospace' }}
                      required
                    />
                  </div>
                </div>

                {/* IPD No */}
                <div>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: 12, color: '#334155', marginBottom: 5 }}>
                    IPD No / Admission Identifier
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editIpdNo}
                    onChange={e => setEditIpdNo(e.target.value)}
                    placeholder="e.g. IPD-2026-089"
                    style={{ height: 38, fontSize: 12.5, fontWeight: 700, fontFamily: 'monospace' }}
                  />
                </div>

                <div
                  style={{
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 11.5,
                    color: '#1E40AF',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Sparkles size={14} />
                  <span>
                    Saving automatically updates the Consent Form, regenerates demographics, and syncs with the Tab 4 Procedure Protocol schedule.
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                  marginTop: 20,
                  paddingTop: 14,
                  borderTop: '1px solid #E2E8F0'
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    color: '#475569',
                    padding: '8px 16px',
                    borderRadius: 7,
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: '#036d92',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '8px 20px',
                    borderRadius: 7,
                    fontWeight: 900,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(3, 109, 146, 0.3)'
                  }}
                >
                  ✓ Update &amp; Apply Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
