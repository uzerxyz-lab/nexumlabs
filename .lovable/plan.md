# Cash Book / Ledger Software — Plan

## Pehle aik zaroori baat
Main jo software banata hoon woh web app hota hai. Mac aur Windows dono par chalane ka tareeqa:
isay **installable offline app (PWA)** banaunga — Chrome/Edge/Safari mein aik dafa khol kar "Install" karne se yeh desktop par apne icon ke saath, apni window mein khulega, bilkul normal software ki tarah, aur **internet ke baghair** chalega.

Data rakhne ke do tareeqay:
- **Mukammal offline (default)** — sara data usi machine mein save hoga. Internet ki zaroorat nahi, lekin dono machines ka data alag rahega (backup file export/import se transfer hoga).
- **Cloud sync** — data online bhi rahe taake dono machines par aik jaisa data dikhe; internet na ho to offline chale aur baad mein sync ho jaye.

Yeh choice aap bata dein; baqi plan dono mein aik jaisa hai.

## 1. Login
- Main screen par username + password.
- Do roles: **User** (entries karega) aur **Admin** (delete/edit/restore kar sakega).
- Admin panel ke liye alag password confirmation.

## 2. Accounts (Parties / Dealers / Workers)
- Naya account: naam, type (Customer / Supplier / Worker / Expense head), phone, address, opening balance.
- **Auto short ID**: naam ke initials + `01` + sequential number.
  - Ali Trader → `AT011`
  - Ali Enterprises → `AE012`
  - Ali Trading Company → `ATC013`
- ID hamesha unique rahegi.

## 3. Entries (main screen se)
Har entry mein: date, account, amount, payment method, reference, remarks.
- **Cash Inward** (receipt) — maslan Ali Enterprises se 10,00,000 aaye.
- **Cash Outward** (payment) — maslan Musa Enterprises ko 5,00,000 diye.
- **Sale** aur **Purchase** entries.
- **Worker**: Salary, Advance.
- **Miscellaneous expenses** (bijli, transport, chai-pani waghera — expense heads aap khud bana sakenge).
- **Payment method**: Cash / Cheque / Online transfer — cheque par cheque no. aur bank, online par bank/reference.
- **Auto capital**: har naam, remarks aur text field mein har word ka pehla letter khud capital ho jayega (ali trader → Ali Trader).

## 4. Search (har jagah)
- Typing ke saath saath suggestions.
- Capital/small, dash, space, dot sab ignore — `ali-trader`, `ALI TRADER`, `alitrader` sab same result.
- Short ID se bhi search (`AT011`).

## 5. Ledgers aur Reports
- **Dealer-wise ledger**: date-wise entries, running balance, closing balance.
- **Cash book / Day book**: kisi bhi din ka total inward, outward, closing cash.
- **Worker ledger**: salary, advance, baqaya.
- **Expense report**: head-wise total.
- Date range filter, print aur Excel/PDF export.

## 6. Admin Panel
- Accounts aur entries ki list, **checkbox se multiple selection**.
- Edit aur Delete (soft delete — data khatam nahi hoga).
- **Delete Log**: kya delete hua, kisne, kab, poori details — wahin se **Restore** button.
- Edit karne par purani value bhi log mein rahegi (audit trail).

## 7. Keyboard Shortcuts
- Ctrl+S = Save, Ctrl+C / Ctrl+V / Ctrl+X = Copy / Paste / Cut, Ctrl+A = Select all
- Ctrl+Z = Undo (aakhri entry/tabdeeli wapas), Ctrl+Y = Redo
- Ctrl+F = Search, Ctrl+N = Nayi entry, Ctrl+P = Print, Esc = Cancel, Enter/Tab = agla field
- Mac par Cmd bhi kaam karega.

## 8. Mazeed professional features (meri tajweez)
- **Dashboard**: aaj ka cash in/out, total receivable, total payable, pending parties.
- **Backup / Restore**: aik click mein poori file export, doosri machine par import.
- **Financial year closing** aur opening balance carry forward.
- **Receipt / Voucher print** har entry ki.
- **Cheque tracking**: pending / cleared / bounced.
- **Duplicate entry warning** (same party, same amount, same din).
- Urdu/English UI (agar chahiye).

## 9. Banane ki tarteeb
1. Design + login + dashboard
2. Accounts + auto short ID + search
3. Entries + payment methods + auto capital
4. Ledgers aur reports + print/export
5. Admin panel + delete log + restore
6. Shortcuts, offline install, backup/restore

---
### Aage barhne se pehle bata dein
1. Data sirf aik machine par offline, ya dono machines mein sync?
2. Sale/Purchase mein item-wise detail (qty, rate) chahiye ya sirf total amount?
3. Currency aur date format? (PKR, dd-mm-yyyy?)
4. Kitne users honge — sirf aap aur admin, ya staff ke alag accounts bhi?
