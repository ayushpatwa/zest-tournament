// Localized Tournament & FairPlay Rules Data

export const getLocalizedRules = (lang = 'en') => {
  const normalized = (lang || 'en').toLowerCase();

  if (normalized === 'hi') {
    return [
      {
        id: 'account_entry',
        icon: '📋',
        title: 'अकाउंट और एंट्री नियम',
        subtitle: 'मैच में भाग लेने से पहले कृपया ध्यान से पढ़ें',
        items: [
          '🔥 केवल FREE FIRE MAX की अनुमति है।',
          '🚫 प्रतिबंधित कैरेक्टर: ORION, A124, RYDEN सभी मोड में बैन हैं।',
          '⛔ एक से अधिक नाम या अकाउंट का उपयोग = सीधा बैन (केवल 1 अकाउंट अनुमत)।',
          '⚠️ बायो में "I AM HACKER" लिखना सख्त मना है (होस्ट द्वारा किक या पेनाल्टी)।',
          'केवल रजिस्टर्ड खिलाड़ी ही मैचों में शामिल हो सकते हैं।',
          'इन-गेम नाम (IGN) साधारण होना चाहिए (स्टाइलिश फॉन्ट या सिंबल की अनुमति नहीं है)।',
          '🚫 हैक या चीट चैट मिलने पर = सीधा स्थायी बैन।',
          'गलत जानकारी या गलत UID देने पर: ❌ कोई पुरस्कार नहीं, ❌ कोई रिफंड नहीं।',
          '🔥 न्यूनतम लेवल-40 अनिवार्य है।',
          '📹 निकासी (Withdrawal) या अनबैन के लिए HUD POV रिकॉर्डिंग अनिवार्य है।'
        ]
      },
      {
        id: 'id_password',
        icon: '🔑',
        title: 'रूम ID और पासवर्ड नियम',
        items: [
          'मैच ID और पासवर्ड मैच शुरू होने से 15 मिनट पहले ऐप में शेयर किया जाएगा।',
          'वेटिंग टाइम सिर्फ ID शेयर होने के बाद ही गिना जाएगा।',
          'समय चूकने पर Zest Tournament जिम्मेदार नहीं होगा।'
        ]
      },
      {
        id: 'joining_slots',
        icon: '🚪',
        title: 'मैच जॉइनिंग और स्लॉट नियम',
        items: [
          '📹 कस्टम रूम में जाने से पहले स्क्रीन रिकॉर्डिंग चालू करना अनिवार्य है।',
          'मैच में शामिल होने के बाद अपने आवंटित स्लॉट में ही रहें।',
          'स्लॉट बदलने या छोड़ने पर: ❌ किक, ❌ कोई रिफंड नहीं।',
          'देरी से जुड़ने या मैच छूटने पर कोई रिफंड नहीं मिलेगा।',
          'रूम फुल होने पर वैध वीडियो प्रमाण देने पर ही रिफंड दिया जाएगा।',
          'यदि होस्ट गलत रूम शुरू करता है, तो पहले राउंड के अंदर प्रमाण सहित रिपोर्ट करें (मैच दोबारा कराया जाएगा)।',
          'पहला राउंड समाप्त होने के बाद कोई रिपोर्ट स्वीकार नहीं होगी।'
        ]
      },
      {
        id: 'cs_lonewolf',
        icon: '⚔️',
        title: 'फेयर गेमप्ले नियम (CS / लोन वोल्फ)',
        items: [
          'ग्रेनेड (Grenade) की अनुमति बिल्कुल नहीं है।',
          'टीमिंग (Teaming) सख्त वर्जित है।',
          'हैक, बग्स और ग्लिच का उपयोग सख्त मना है।',
          'ज़ोन पैक (Zone Pack) की अनुमति नहीं है।',
          'कैंपिंग (Camping) की अनुमति नहीं है।',
          'अन-रजिस्टर्ड खिलाड़ियों को रूम में इनवाइट न करें।',
          '🚫 चीटिंग पकड़े जाने पर: स्थायी बैन + जुर्माना।'
        ]
      },
      {
        id: 'cs_headshot',
        icon: '🎯',
        title: 'CS हेडशॉट नियम',
        items: [
          'CS हेडशॉट मैचों में केवल हेडशॉट किल्स ही मान्य होंगे।',
          'कैरेक्टर स्किल्स और गन एट्रिब्यूट्स बंद (OFF) रहेंगे।',
          '🔥 केवल हेडशॉट वाली गन्स की ही अनुमति है।'
        ]
      },
      {
        id: 'game_weapons',
        icon: '🎮',
        title: 'गेम व हथियार प्रतिबंध',
        items: [
          'सर्वाइवल: यदि मैच फुल नहीं होता, तो प्राइज पूल तदनुसार समायोजित हो सकता है।',
          'सोलो पर किल: प्रतिबंधित पात्रों (Orion, Ryden, A124) को छोड़कर सभी पात्र अनुमत हैं।',
          'डबल वेक्टर और M79 लॉन्चर का उपयोग सख्त वर्जित है।',
          'घोड़े (Horses) पूरी तरह से प्रतिबंधित हैं।',
          'सर्वाइवल मोड में स्नाइपर (Sniper) की अनुमति नहीं है।'
        ]
      },
      {
        id: 'screen_recording',
        icon: '📹',
        title: 'स्क्रीन रिकॉर्डिंग व POV नियम (अति महत्वपूर्ण)',
        items: [
          'पूरे मैच के दौरान स्क्रीन रिकॉर्डिंग चालू रहना अनिवार्य है।',
          'रिकॉर्डिंग रूम ID और पासवर्ड मिलने से पहले शुरू होनी चाहिए।',
          'POV कम से कम 24 घंटे तक सुरक्षित रखना अनिवार्य है।',
          'HUD और फ्री फायर POV 24 घंटे तक न रखने पर = सीधा बैन।',
          'प्रमाण उपलब्ध न कराने पर: ❌ कोई पुरस्कार नहीं, ❌ कोई रिफंड नहीं।'
        ]
      },
      {
        id: 'match_limit',
        icon: '⚠️',
        title: 'दैनिक मैच सीमा नियम',
        subtitle: 'डेली मैच लिमिट पॉलिसी',
        items: [
          'प्रतिदिन केवल 8 मैच खेलने की अनुमति है।',
          'दैनिक सीमा पार होने पर प्रत्येक अतिरिक्त मैच पर पेनाल्टी लागू होगी (₹8 से ₹25)।'
        ]
      },
      {
        id: 'device',
        icon: '📱',
        title: 'डिवाइस नियम',
        items: [
          'केवल एंड्रॉइड और आईओएस मोबाइल डिवाइस की अनुमति है।',
          'पीसी, एमुलेटर, टैबलेट और बाहरी कीबोर्ड/माउस सख्त वर्जित हैं।'
        ]
      },
      {
        id: 'penalty',
        icon: '🚫',
        title: 'जुर्माना और बैन नियम',
        subtitle: 'किसी भी नियम के उल्लंघन पर:',
        items: [
          '⚠️ जुर्माना (Penalty)',
          '❌ कोई रिफंड नहीं',
          '🚫 स्थायी खाता प्रतिबंध (Permanent Ban)',
          '❌ DPI की अनुमति नहीं है: DPI का उपयोग करने पर पेनाल्टी और बैन।'
        ]
      },
      {
        id: 'final_note',
        icon: '⚡',
        title: 'अंतिम सूचना और अस्वीकरण',
        items: [
          'सभी नियमों का पालन करना अनिवार्य है।',
          'एडमिन का निर्णय अंतिम और सर्वमान्य होगा।',
          'अस्वीकरण: गरेना फ्री फायर के इन-गेम ग्लिच के लिए जेस्ट टूर्नामेंट जिम्मेदार नहीं होगा।',
          '🔥 Zest Tournament – Play Fair, Win Fair'
        ]
      }
    ];
  }

  if (normalized === 'ta') {
    return [
      {
        id: 'account_entry',
        icon: '📋',
        title: 'கணக்கு & நுழைவு விதிகள்',
        subtitle: 'போட்டியில் சேர்வதற்கு முன் கவனமாகப் படியுங்கள்',
        items: [
          '🔥 FREE FIRE MAX மட்டுமே அனுமதிக்கப்படும்.',
          '🚫 தடைசெய்யப்பட்ட கதாபாத்திரங்கள்: ORION, A124, RYDEN.',
          '⛔ ஒன்றுக்கு மேற்பட்ட பெயர்கள் அல்லது கணக்குகள் = நேரடித் தடை (1 கணக்கு மட்டுமே).',
          '⚠️ பயோவில் "I AM HACKER" என்று குறிப்பிடக்கூடாது.',
          'பதிவுசெய்த வீரர்கள் மட்டுமே போட்டிகளில் பங்கேற்க முடியும்.',
          'விளையாட்டுப் பெயர் (IGN) எளிமையாக இருக்க வேண்டும் (எழுத்துருக்கள் / குறியீடுகள் கூடாது).',
          '🚫 ஹேக் அல்லது சீட் சாட் கண்டறியப்பட்டால் = நேரடி நிரந்தரத் தடை.',
          'தவறான தகவலுக்கு: ❌ பரிசு இல்லை, ❌ கட்டணம் திரும்பப் பெறப்படாது.',
          '🔥 குறைந்தபட்சம் நிலை-40 (Level 40) தேவை.',
          '📹 பணம் எடுக்க HUD POV திரைப்பதிவு கட்டாயமாகும்.'
        ]
      },
      {
        id: 'id_password',
        icon: '🔑',
        title: 'Room ID & கடவுச்சொல் விதிகள்',
        items: [
          'போட்டி தொடங்குவதற்கு 15 நிமிடங்களுக்கு முன் Room ID & கடவுச்சொல் பகிரப்படும்.',
          'காத்திருப்பு நேரம் ID பகிரப்பட்ட பின்னரே கணக்கிடப்படும்.',
          'நேரத்தைத் தவறவிட்டால் Zest Tournament பொறுப்பேற்காது.'
        ]
      },
      {
        id: 'joining_slots',
        icon: '🚪',
        title: 'இணைதல் & ஸ்லாட் விதிகள்',
        items: [
          '📹 Room இல் நுழைவதற்கு முன்பே திரைப்பதிவு (Screen Recording) தொடங்குவது கட்டாயம்.',
          'உங்களுக்கு ஒதுக்கப்பட்ட ஸ்லாட்டிலேயே விளையாட வேண்டும்.',
          'ஸ்லாட்டை மாற்றினால்: ❌ நீக்கம், ❌ கட்டணம் திரும்பக் கிடைக்காது.',
          'தாமதமாக இணைந்தால் அல்லது போட்டியைத் தவறவிட்டால் பணம் திரும்பக் கிடைக்காது.'
        ]
      },
      {
        id: 'cs_lonewolf',
        icon: '⚔️',
        title: 'நேர்மையான விளையாட்டு விதிகள் (CS / Lone Wolf)',
        items: [
          'கிரெனேட் (Grenade) பயன்படுத்தக் கூடாது.',
          'டீமிங் (Teaming) செய்யக் கூடாது.',
          'ஹேக், பக்ஸ் மற்றும் க்ளிட்ச் பயன்பாடு முற்றிலும் தடைசெய்யப்பட்டுள்ளது.',
          'ஸோன் பேக் (Zone Pack) மற்றும் கேம்பிங் (Camping) தடைசெய்யப்பட்டுள்ளது.',
          'ஏமாற்றினால்: நிரந்தரத் தடை + அபராதம்.'
        ]
      },
      {
        id: 'cs_headshot',
        icon: '🎯',
        title: 'CS ஹெட்ஷாட் விதிகள்',
        items: [
          'ஹெட்ஷாட் போட்டிகளில் ஹெட்ஷாட் கில் மட்டுமே அனுமதிக்கப்படும்.',
          'கேரக்டர் ஸ்கில்ஸ் மற்றும் கன் அட்ரிபியூட்ஸ் ஆஃப் (OFF) செய்யப்படும்.'
        ]
      },
      {
        id: 'game_weapons',
        icon: '🎮',
        title: 'ஆயுத கட்டுப்பாடுகள்',
        items: [
          'Double Vector மற்றும் M79 Launcher முற்றிலும் தடைசெய்யப்பட்டுள்ளது.',
          'குதிரைகள் (Horses) தடைசெய்யப்பட்டுள்ளன.',
          'சர்வைவல் போட்டிகளில் ஸ்னைப்பர் (Sniper) தடைசெய்யப்பட்டுள்ளது.'
        ]
      },
      {
        id: 'screen_recording',
        icon: '📹',
        title: 'திரைப்பதிவு & POV விதிகள் (முக்கியமானது)',
        items: [
          'போட்டி முழுவதும் திரைப்பதிவு ஆன் செய்யப்பட்டிருக்க வேண்டும்.',
          'POV ஐ குறைந்தது 24 மணிநேரம் சேமித்து வைக்க வேண்டும் (இல்லையெனில் நேரடித் தடை).',
          'சான்று வழங்காவிட்டால்: ❌ பரிசு இல்லை, ❌ கட்டணம் திரும்பக் கிடைக்காது.'
        ]
      },
      {
        id: 'match_limit',
        icon: '⚠️',
        title: 'தினசரி போட்டி வரம்பு',
        subtitle: 'Match Limit Policy',
        items: [
          'ஒரு நாளைக்கு 8 போட்டிகள் மட்டுமே அனுமதிக்கப்படும்.',
          'வரம்பைத் தாண்டினால் கூடுதல் போட்டிகளுக்கு அபராதம் விதிக்கப்படும்.'
        ]
      },
      {
        id: 'device',
        icon: '📱',
        title: 'சாதனக் கொள்கை',
        items: [
          'ஆண்ட்ராய்டு மற்றும் ஐஓஎஸ் மொபைல்கள் மட்டுமே அனுமதிக்கப்படும்.',
          'பிசி, எமுலேட்டர் மற்றும் வெளிப்புற விசைப்பலகை முற்றிலும் தடைசெய்யப்பட்டுள்ளது.'
        ]
      },
      {
        id: 'penalty',
        icon: '🚫',
        title: 'அபராதம் & தடை விதிகள்',
        subtitle: 'விதிமீறல்களுக்கு:',
        items: [
          '⚠️ அபராதம் (Penalty)',
          '❌ பணம் திரும்பப் பெறப்படாது',
          '🚫 நிரந்தரத் தடை',
          '❌ DPI தடைசெய்யப்பட்டுள்ளது.'
        ]
      },
      {
        id: 'final_note',
        icon: '⚡',
        title: 'இறுதி அறிக்கை',
        items: [
          'அனைத்து விதிகளையும் பின்பற்றுவது கட்டாயமாகும்.',
          'நிர்வாகியின் முடிவே இறுதியானது.',
          '🔥 Zest Tournament – Play Fair, Win Fair'
        ]
      }
    ];
  }

  if (normalized === 'te') {
    return [
      {
        id: 'account_entry',
        icon: '📋',
        title: 'ఖాతా & ప్రవేశ నిబంధనలు',
        subtitle: 'మ్యాచ్‌లో చేరే ముందు దయచేసి జాగ్రత్తగా చదవండి',
        items: [
          '🔥 FREE FIRE MAX మాత్రమే అనుమతించబడుతుంది.',
          '🚫 నిషేధిత క్యారెక్టర్లు: ORION, A124, RYDEN.',
          '⛔ బహుళ పేర్లు లేదా బహుళ ఖాతాల ఉపయోగం = డైరెక్ట్ బ్యాన్ (1 ఖాతా మాత్రమే).',
          'బయోలో "I AM HACKER" అని రాయకూడదు.',
          'నమోదైన ఆటగాళ్ళు మాత్రమే మ్యాచ్‌లలో చేరగలరు.',
          'గేమ్ పేరు సాధారణంగా ఉండాలి (స్టైలిష్ ఫాంట్‌లు నిషేధం).',
          '🚫 హ్యాక్ చాట్ దొరికితే = శాశ్వత బ్యాన్.',
          'తప్పుడు సమాచారానికి: ❌ బహుమతి లేదు, ❌ వాపసు లేదు.',
          '🔥 కనీస లెవల్-40 తప్పనిసరి.',
          '📹 డబ్బు విత్‌డ్రా కోసం HUD POV రికార్డింగ్ తప్పనిసరి.'
        ]
      },
      {
        id: 'id_password',
        icon: '🔑',
        title: 'రూమ్ ID & పాస్‌వర్డ్ నిబంధనలు',
        items: [
          'మ్యాచ్ ప్రారంభానికి 15 నిమిషాల ముందు రూమ్ ID & పాస్‌వర్డ్ యాప్‌లో షేర్ చేయబడుతుంది.',
          'సమయం మిస్ అయితే Zest Tournament బాధ్యత వహించదు.'
        ]
      },
      {
        id: 'joining_slots',
        icon: '🚪',
        title: 'చేరడం & స్లాట్‌ల నిబంధనలు',
        items: [
          '📹 రూమ్‌లో చేరడానికి ముందే స్క్రీన్ రికార్డింగ్ ప్రారంభించడం తప్పనిసరి.',
          'కేటాయించిన స్లాట్‌లోనే ఉండాలి. స్లాట్ మారితే కిక్ మరియు వాపసు ఉండదు.'
        ]
      },
      {
        id: 'cs_lonewolf',
        icon: '⚔️',
        title: 'ఫెయిర్ గేమ్‌ప్లే (CS / Lone Wolf)',
        items: [
          'గ్రెనేడ్ ఉపయోగం నిషేధం.',
          'టీమింగ్ నిషేధం.',
          'హ్యాక్స్ మరియు బగ్స్ వాడకం పూర్తిగా నిషేధం.',
          'జోన్ ప్యాక్ మరియు క్యాంపింగ్ నిషేధం.',
          'మోసానికి పాల్పడితే: శాశ్వత బ్యాన్ + జరిమానా.'
        ]
      },
      {
        id: 'cs_headshot',
        icon: '🎯',
        title: 'CS హెడ్‌షాట్ నిబంధనలు',
        items: [
          'హెడ్‌షాట్ మ్యాచ్‌లలో హెడ్‌షాట్ కిల్స్ మాత్రమే లెక్కించబడతాయి.',
          'క్యారెక్టర్ స్కిల్స్ మరియు గన్ అట్రిబ్యూట్స్ OFF లో ఉంటాయి.'
        ]
      },
      {
        id: 'game_weapons',
        icon: '🎮',
        title: 'ఆయుధ ఆంక్షలు',
        items: [
          'Double Vector మరియు M79 Launcher పూర్తిగా నిషేధించబడ్డాయి.',
          'గుర్రాలు (Horses) నిషేధం.',
          'సర్వైవల్‌లో స్నిపర్ నిషేధం.'
        ]
      },
      {
        id: 'screen_recording',
        icon: '📹',
        title: 'స్క్రీన్ రికార్డింగ్ & POV (చాలా ముఖ్యం)',
        items: [
          'మ్యాచ్ అంతటా స్క్రీన్ రికార్డింగ్ తప్పనిసరి.',
          'POV ని కనీసం 24 గంటలు భద్రపరచాలి (లేకపోతే డైరెక్ట్ బ్యాన్).'
        ]
      },
      {
        id: 'match_limit',
        icon: '⚠️',
        title: 'రోజువారీ మ్యాచ్ పరిమితి',
        subtitle: 'Match Limit Policy',
        items: [
          'రోజుకు 8 మ్యాచ్‌లు మాత్రమే అనుమతించబడతాయి.',
          'పరిమితి దాటితే జరిమానా విధించబడుతుంది.'
        ]
      },
      {
        id: 'device',
        icon: '📱',
        title: 'పరికర విధానం',
        items: [
          'ఆండ్రాయిడ్ మరియు ఐఓఎస్ మొబైల్స్ మాత్రమే అనుమతి.',
          'పిసి, ఎమ్యులేటర్ పూర్తిగా నిషేధం.'
        ]
      },
      {
        id: 'penalty',
        icon: '🚫',
        title: 'జరిమానా & నిషేధం',
        subtitle: 'ఉల్లంఘనలపై:',
        items: [
          '⚠️ జరిమానా (Penalty)',
          '❌ వాపసు లేదు',
          '🚫 శాశ్వత నిషేధం',
          '❌ DPI నిషేధించబడింది.'
        ]
      },
      {
        id: 'final_note',
        icon: '⚡',
        title: 'ముగింపు గమనిక',
        items: [
          'అన్ని నిబంధనలను పాటించడం తప్పనిసరి.',
          'అడ్మిన్ నిర్ణయమే తుది నిర్ణయం.',
          '🔥 Zest Tournament – Play Fair, Win Fair'
        ]
      }
    ];
  }

  if (normalized === 'bn') {
    return [
      {
        id: 'account_entry',
        icon: '📋',
        title: 'অ্যাকাউন্ট ও প্রবেশের নিয়মাবলী',
        subtitle: 'ম্যাচে অংশ নেওয়ার আগে অনুগ্রহ করে সাবধানে পড়ুন',
        items: [
          '🔥 শুধুমাত্র FREE FIRE MAX অনুমোদিত।',
          '🚫 নিষিদ্ধ চরিত্র: ORION, A124, RYDEN.',
          '⛔ একাধিক নাম বা অ্যাকাউন্টের ব্যবহার = সরাসরি ব্যান (শুধুমাত্র ১টি অ্যাকাউন্ট)।',
          'বায়োতে "I AM HACKER" লেখা যাবে না।',
          'শুধুমাত্র নিবন্ধিত খেলোয়াড়রাই ম্যাচে অংশ নিতে পারবেন।',
          'গেমের নাম সহজ হতে হবে (স্টাইলিশ ফন্ট বা চিহ্ন নিষিদ্ধ)।',
          '🚫 হ্যাক চ্যাট পাওয়া গেলে = সরাসরি আজীবন ব্যান।',
          'ভুল তথ্যের জন্য: ❌ কোনো পুরস্কার নেই, ❌ কোনো রিফান্ড নেই।',
          '🔥 ন্যূনতম লেভেল-৪০ বাধ্যতামূলক।',
          '📹 টাকা তোলার জন্য HUD POV রেকর্ডিং বাধ্যতামূলক।'
        ]
      },
      {
        id: 'id_password',
        icon: '🔑',
        title: 'রুম আইডি ও পাসওয়ার্ড নিয়মাবলী',
        items: [
          'ম্যাচ শুরুর ১৫ মিনিট আগে অ্যাপে রুম আইডি ও পাসওয়ার্ড শেয়ার করা হবে।',
          'সময় মিস করলে Zest Tournament দায়ী থাকবে না।'
        ]
      },
      {
        id: 'joining_slots',
        icon: '🚪',
        title: 'যুক্ত হওয়া ও স্লটের নিয়মাবলী',
        items: [
          '📹 রুমে ঢোকার আগেই স্ক্রিন রেকর্ডিং চালু করা বাধ্যতামূলক।',
          'বরাদ্দকৃত স্লটেই থাকতে হবে। স্লট পরিবর্তন করলে কোনো রিফান্ড পাওয়া যাবে না।'
        ]
      },
      {
        id: 'cs_lonewolf',
        icon: '⚔️',
        title: 'ন্যায্য গেমপ্লে (CS / Lone Wolf)',
        items: [
          'গ্রেনেড (Grenade) ব্যবহার নিষিদ্ধ।',
          'টিমিং নিষিদ্ধ।',
          'হ্যাক বা কোনো গ্লিচ ব্যবহার সম্পূর্ণ নিষিদ্ধ।',
          'জোন প্যাক এবং ক্যাম্পিং নিষিদ্ধ।',
          'প্রতারণা ধরা পড়লে: আজীবন ব্যান + জরিমানা।'
        ]
      },
      {
        id: 'cs_headshot',
        icon: '🎯',
        title: 'CS হেডশট নিয়মাবলী',
        items: [
          'হেডশট ম্যাচে শুধু হেডশট কিল গণনা করা হবে।',
          'ক্যারেক্টার স্কিল ও গান অ্যাট্রিবিউটস বন্ধ (OFF) থাকবে।'
        ]
      },
      {
        id: 'game_weapons',
        icon: '🎮',
        title: 'অস্ত্রের বিধিনিষেধ',
        items: [
          'Double Vector এবং M79 Launcher সম্পূর্ণ নিষিদ্ধ।',
          'ঘোড়া (Horses) নিষিদ্ধ।',
          'সারভাইভালে স্নাইপার নিষিদ্ধ।'
        ]
      },
      {
        id: 'screen_recording',
        icon: '📹',
        title: 'স্ক্রিন রেকর্ডিং ও POV (অত্যন্ত গুরুত্বপূর্ণ)',
        items: [
          'ম্যাচ চলাকালীন স্ক্রিন রেকর্ডিং চালু থাকা বাধ্যতামূলক।',
          'POV কমপক্ষে ২৪ ঘণ্টা সংরক্ষণ করতে হবে (নতুবা সরাসরি ব্যান)।'
        ]
      },
      {
        id: 'match_limit',
        icon: '⚠️',
        title: 'দৈনিক ম্যাচ সীমা',
        subtitle: 'Match Limit Policy',
        items: [
          'দিনে সর্বোচ্চ ৮টি ম্যাচ খেলা যাবে।',
          'সীমা অতিক্রম করলে অতিরিক্ত ম্যাচে জরিমানা প্রযোজ্য।'
        ]
      },
      {
        id: 'device',
        icon: '📱',
        title: 'ডিভাইস নীতি',
        items: [
          'শুধুমাত্র অ্যান্ড্রয়েড ও আইওএস মোবাইল অনুমোদিত।',
          'পিসি ও এমুলেটর সম্পূর্ণ নিষিদ্ধ।'
        ]
      },
      {
        id: 'penalty',
        icon: '🚫',
        title: 'পেনাল্টি ও ব্যান নিয়মাবলী',
        subtitle: 'নিয়ম লঙ্ঘনের ক্ষেত্রে:',
        items: [
          '⚠️ জরিমানা (Penalty)',
          '❌ কোনো রিফান্ড নেই',
          '🚫 স্থায়ী অ্যাকাউন্ট ব্যান',
          '❌ DPI নিষিদ্ধ।'
        ]
      },
      {
        id: 'final_note',
        icon: '⚡',
        title: 'চূড়ান্ত মন্তব্য',
        items: [
          'সব নিয়ম মেনে চলা বাধ্যতামূলক।',
          'অ্যাডমিনের সিদ্ধান্তই চূড়ান্ত।',
          '🔥 Zest Tournament – Play Fair, Win Fair'
        ]
      }
    ];
  }

  // Default English / Hinglish
  return [
    {
      id: 'account_entry',
      icon: '📋',
      title: 'ACCOUNT & ENTRY RULES',
      subtitle: 'Please Read Carefully Before Joining Any Match',
      items: [
        '🔥 ONLY FREE FIRE MAX ALLOWED.',
        '🚫 BANNED CHARACTERS FROM ALL MODES: ORION, A124, RYDEN.',
        '⛔ MULTIPLE NAME OR MULTIPLE ACCOUNT USE = DIRECT BAN (1 account only).',
        '⚠️ NOT MENTIONED IN BIO THAT I AM HACKER (Kick or penalty as per host).',
        'Only registered players can join tournament matches.',
        'In-game name must be simple (No stylish fonts/symbols allowed).',
        '🚫 HACK CHAT FOUND = DIRECT PERMANENT BAN.',
        'Wrong info or incorrect Free Fire UID: ❌ No Prize, ❌ No Refund.',
        '🔥 MINIMUM LEVEL-40 MANDATORY.',
        '📹 HUD POV MUST FOR WITHDRAWAL OR UNBAN.'
      ]
    },
    {
      id: 'id_password',
      icon: '🔑',
      title: 'ID & PASSWORD RULES',
      items: [
        'Match ID & Password will be shared in the app 15 minutes before start.',
        'Waiting time counts only after Room ID is shared.',
        'Zest Tournament is not responsible if you miss the match start time.'
      ]
    },
    {
      id: 'joining_slots',
      icon: '🚪',
      title: 'MATCH JOINING & SLOTS RULES',
      items: [
        '📹 SCREEN RECORDING IS COMPULSORY BEFORE ENTERING THE ROOM.',
        'Stay in your allotted slot after joining the room.',
        'Changing slots or leaving: ❌ Kick, ❌ No Refund.',
        'No refund for late joins or missed matches.',
        'If room is full, refund granted only with valid video proof.',
        'If host starts the wrong room, report in round 1 with proof for a remake.',
        'No remake or refund reports accepted after round 1.'
      ]
    },
    {
      id: 'cs_lonewolf',
      icon: '⚔️',
      title: 'FAIR GAMEPLAY RULES (CS / LONE WOLF)',
      items: [
        'Grenades are strictly NOT allowed.',
        'Teaming is strictly NOT allowed.',
        'Hacks, bugs, and glitches strictly NOT allowed.',
        'Zone pack is strictly NOT allowed.',
        'Camping is strictly NOT allowed.',
        'Inviting unregistered players is NOT allowed.',
        '🚫 Cheating detected: Direct Permanent BAN + Penalty.'
      ]
    },
    {
      id: 'cs_headshot',
      icon: '🎯',
      title: 'CS HEADSHOT RULES',
      items: [
        'In CS Headshot matches, ONLY headshot kills count.',
        'Character skills and gun attributes will be turned OFF.',
        '🔥 Only Head Guns allowed.'
      ]
    },
    {
      id: 'game_weapons',
      icon: '🎮',
      title: 'GAME RULES & WEAPON RESTRICTIONS',
      items: [
        'SURVIVAL: If match is not full, prize pool may adjust accordingly.',
        'SOLO PER KILL: All characters allowed except banned ones (🚫 Orion, Ryden, A124).',
        '🚫 Specific weapons DOUBLE VECTOR AND M79 LAUNCHER STRICTLY BANNED.',
        '🚫 Horses are banned.',
        '🚫 SURVIVAL: SNIPERS NOT ALLOWED.'
      ]
    },
    {
      id: 'screen_recording',
      icon: '📹',
      title: 'SCREEN RECORDING & POV RULES (MANDATORY)',
      items: [
        'Screen recording ON is compulsory throughout the match.',
        'Recording must start before Room ID & Password are opened.',
        'POV must be saved for at least 24 hours (otherwise DIRECT BAN).',
        'HUD POV MUST for cash withdrawal and unban requests.',
        'No POV provided upon request = ❌ No Prize, ❌ No Refund.'
      ]
    },
    {
      id: 'match_limit',
      icon: '⚠️',
      title: 'MATCH LIMIT RULES',
      subtitle: 'Daily Match Limit Policy',
      items: [
        'Only 8 matches per day allowed.',
        'Exceeding daily limit incurs penalty charges (₹8 to ₹25 per extra match).'
      ]
    },
    {
      id: 'device',
      icon: '📱',
      title: 'DEVICE RULES',
      items: [
        'Only mobile Android & iOS devices allowed.',
        'PC, Emulator, Tablet, or external mouse/keyboard usage is strictly banned.'
      ]
    },
    {
      id: 'penalty',
      icon: '🚫',
      title: 'PENALTY & BAN RULES',
      subtitle: 'On any rule violation:',
      items: [
        '⚠️ Penalty',
        '❌ No Refund',
        '🚫 Permanent Account BAN',
        '❌ DPI NOT ALLOWED: DPI usage will result in penalty and ban.'
      ]
    },
    {
      id: 'final_note',
      icon: '⚡',
      title: 'FINAL NOTE & DISCLAIMER',
      items: [
        'Following all tournament rules is mandatory.',
        'Admin decision is final and binding.',
        'Maintain sportsmanship and fair play.',
        'Disclaimer: Zest Tournament is not responsible for Garena Free Fire server glitches.',
        '🔥 Zest Tournament – Play Fair, Win Fair'
      ]
    }
  ];
};
