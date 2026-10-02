# ME

अच्छा, मैं चाहता हूँ कि तुम एक software बनाओ जो Mac और Windows, दोनों पर चल सके। ठीक है। वह software basically sale, purchase, worker की salaries, advance और miscellaneous payments वगैरह की entries के लिए होगा। ठीक है। तो यह standalone हो, without internet चलने वाला software हो, जो कि दोनों machines पर काम करे। उसमें होगा यह कि मैं main screen से login होऊँगा। तो उसमें आगे जो भी main page तुम design करोगे, वहां पर अगर मेरा कोई cash inward आ रहा है, उसकी entry मुझे करनी है। फर्ज करो कि Ali Enterprises से मुझे 10 लाख आए, मुझे वह entry करनी है। इसी तरह, अगर मुझे Musa Enterprises को 5 लाख की payment pay करनी है, तो उसकी entry के options हों। और याद रहे कि यह जो payments inward और outward होंगी, यह cash भी हो सकती हैं, cheque भी हो सकते हैं, online transfers भी हो सकते हैं। तो यह भी याद रखने हैं कि payment method क्या है। ठीक है। और उसके बाद मुझे account वगैरह भी नए add करने होंगे। जैसे कि फर्ज करो कि Ahmad Enterprise का नया account मैंने बनाना है, तो उसके लिए भी options और इसी तरह मेरे पास यह सारे dealer wise ledgers वगैरह create होंगे, और workers की salaries या advance या कुछ और expenses जैसे होते हैं, वह करने होंगे। Search options होगा। Search option में मैं फर्ज करो Ali लिखता हूँ, Ali Trader या Ali Enterprise, तो वह Ali लिखते हुए साथ ही suggestion show करता रहे typing के साथ-साथ, तो मैं वहां से select कर सकूँ। और search में dashes और capital letters यह सब ignore हों। मतलब कि मैं चाहे small letter से search करूँ या capital से, results अपने साथ-साथ दिखाता रहे। जरूरी नहीं कि वह case match हो तो फिर ही आए। और इसके साथ मेरा ख्याल है कि account जब बनाएँ, तो उसके साथ एक short ID भी उस account की generate हो जाए automatically. जैसे फर्ज करो मैं Ali Trader account बनाता हूँ एक, कि इसको मुझे माल देना है, sell करना है। तो Ali Trader मैंने नाम लिख दिया, उसके साथ ही एक short ID create हो जाए, उसी नाम से निकलकर। जैसे कि Ali Trader का A और T आ जाए, साथ में 01 fix हो और उसके बाद sequential number आ जाए। तो सबसे पहला account मैंने Ali Trader का add किया, तो वह होगा AT01, उसके साथ फिर से 1, AT011 हो जाएगा। अगर इसी तरह मैं दोबारा से नया account add करता हूँ Ali Enterprises, तो उसकी ID हो जाएगी AE012। मतलब कि जो last number है वह sequentially change होता जाए। इस तरह यह automatically, अगर फर्ज करो कोई account के letters तीन बनते हैं Ali Trading Company, तो यह बन जाएगा ATC। इसी तरह वह उसके तीनों words को pick करके ATC013 बन जाएगी ID। इस तरह से। फिर मतलब कि यह तो basic जो भी structure हो गया, वह चीज है। उसके ऊपर फिर वह एक चीज आएगी कि admin panel चाहिए होगा। Admin panel के अंदर मुझे, अगर मैं कोई भी entries या account या कोई भी ऐसी चीज delete करना चाहूँ, तो admin panel के अंदर login होकर वहां से मैं अगर कोई account delete करना है, उसको mark कर लूँ। Multiple account अगर delete करने हैं तो multiple marking का option हो, edit कर सकूँ और इस तरह से। लेकिन साथ में एक delete log भी बनाना है, कि जो भी entry अगर फर्ज करो entry या account मैं delete करता हूँ, तो वह log में जाए। कल को अगर मुझे जरूरत पड़ती है, तो मैं उस entry को reverse कर सकूँ या restore कर सकूँ। तो इस तरह इन सब कुछ चीजों को देखते हुए तुम देखो कि एक professional method में यह किस तरह से काम करेगा और क्या-क्या इसके लिए और चीजें हो सकती हैं या होनी चाहिए। तो यह सारा कुछ पहले मुझे एक plan करके बताओ। उसके बाद फिर हम आगे देखते हैं क्या करना है।

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://nexumlabs.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4a3a9f49-ed33-4715-ac5c-727e7e3cab49).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
