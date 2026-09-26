# Cash Book / Ledger Software — Plan

## पहले एक ज़रूरी बात
यहाँ मैं जो बनाता हूँ वह web app होता है। Mac और Windows दोनों पर चलाने का तरीका:
app को **installable offline app (PWA)** बनाऊँगा — Chrome/Edge/Safari से एक बार खोलकर "Install" करने पर वह desktop पर अपने icon के साथ, अपनी window में खुलेगा, बिल्कुल normal software की तरह, और **internet के बिना** चलेगा।

Data दो तरह से रखा जा सकता है:
- **पूरी तरह offline (default)** — सारा data उसी machine के अंदर save होगा। कोई internet नहीं, पर दोनों machines का data अलग-अलग रहेगा (backup file export/import से transfer होगा)।
- **Cloud sync** — data online भी रखा जाए ताकि दोनों machines पर एक ही data दिखे, और internet न हो तो offline चले और बाद में sync हो जाए।

यह चुनाव आप बता दें; बाकी plan दोनों में एक जैसा है।

## 1. Login
- Main screen पर username + password.
- दो roles: **User** (entries करेगा) और **Admin** (delete/edit/restore कर सकेगा)।
- Admin panel के लिए अलग password (दोबारा confirm)।

## 2. Accounts (Parties / Dealers / Workers)
- नया account बनाना: नाम, type (Customer / Supplier / Worker / Expense head), phone, address, opening balance.
- **Auto short ID**: नाम के initials + `01` + sequential number.
  - Ali Trader → `AT011`
  - Ali Enterprises → `AE012`
  - Ali Trading Company → `ATC013`
- ID unique रहेगी; टकराव हो तो number अपने आप आगे बढ़ेगा।

## 3. Entries (main screen से)
हर entry में: date, account, amount, payment method, reference, remarks.
- **Cash Inward** (receipt) — जैसे Ali Enterprises से 10,00,000 आए।
- **Cash Outward** (payment) — जैसे Musa Enterprises को 5,00,000 दिए।
- **Sale** और **Purchase** entries (item/description, qty, rate, total — जितना आप चाहें उतना simple)।
- **Worker**: Salary, Advance.
- **Miscellaneous expenses** (bijli, transport, चाय-पानी आदि — expense heads आप खुद बना सकेंगे)।
- **Payment method**: Cash / Cheque / Online transfer — cheque पर cheque no. व bank, online पर bank/reference field.

## 4. Search (हर जगह)
- Typing के साथ-साथ suggestions।
- Case ignore, dash/space/dot ignore — `ali-trader`, `ALI TRADER`, `alitrader` सब एक ही result देंगे।
- Short ID से भी search (`AT011`)।

## 5. Ledgers और Reports
- **Dealer-wise ledger**: date wise entries, running balance, closing balance.
- **Cash book / Day book**: किसी भी दिन का total inward, outward, closing cash.
- **Worker ledger**: salary, advance, बकाया।
- **Expense report**: head-wise total.
- Date range filter, print और Excel/PDF export.

## 6. Admin Panel
- Accounts और entries की list, **checkbox से multiple selection**.
- Edit और Delete (soft delete — data गायब नहीं होगा)।
- **Delete Log**: क्या delete हुआ, किसने, कब, पूरी details के साथ — वहीं से **Restore** का button।
- Edit करने पर भी पुराना value log में रहेगा (audit trail)।

## 7. इसके अलावा जो professional तौर पर होना चाहिए (मेरा suggestion)
- **Dashboard**: आज का cash in/out, total receivable, total payable, top pending parties.
- **Backup / Restore**: एक click में पूरी file export, दूसरी machine पर import — Mac↔Windows दोनों तरफ।
- **Financial year / date-wise closing** और opening balance carry forward.
- **Receipt / Voucher print** — हर entry की slip.
- **Cheque tracking**: pending / cleared / bounced status.
- **Duplicate entry warning** (same party, same amount, same day)।
- **Keyboard shortcuts** — fast data entry के लिए (नई entry, save, search)।
- **Urdu/English दोनों में UI** (अगर चाहिए हो)।

## 8. बनाने का क्रम
1. Design + login + dashboard का ढाँचा
2. Accounts + auto short ID + search
3. Entries (inward/outward, sale/purchase, salary/advance/expense) + payment methods
4. Ledgers और reports + print/export
5. Admin panel + delete log + restore
6. Offline install (PWA) + backup/restore

---
### आगे बढ़ने से पहले बताइए
1. Data सिर्फ offline एक machine पर, या दोनों machines में sync?
2. Sale/Purchase में item-wise detail (qty, rate) चाहिए या सिर्फ total amount?
3. Currency और date format? (PKR / INR, dd-mm-yyyy)
4. कितने users बनेंगे — सिर्फ आप और एक admin, या staff के अलग accounts भी?
