CREATE TABLE IF NOT EXISTS faq (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  categoria TEXT NOT NULL,
  domanda TEXT NOT NULL,
  risposta_base TEXT NOT NULL,
  keywords TEXT,
  fonte TEXT
);

INSERT INTO faq (categoria, domanda, risposta_base, keywords, fonte) VALUES
-- ACQUISTO & PAGAMENTO
('acquisto', 'Come funziona MewingMarket?', 'Acquisti un prodotto digitale tramite PayPal e ricevi subito il link per scaricare il file via email e nella Dashboard.', 'acquisto,pagamento,come funziona', 'FAQ.json'),
('acquisto', 'Come pago un prodotto?', 'Il pagamento avviene tramite PayPal. Dopo il pagamento ricevi automaticamente il link di download.', 'pagamento,paypal', 'termini'),
('acquisto', 'Cosa significa Completa pagamento?', 'Serve a rigenerare il link PayPal per completare un ordine rimasto in attesa di pagamento.', 'completa pagamento,ordine in attesa', 'ordini.js'),

-- DOWNLOAD
('download', 'Dove trovo i miei download?', 'Dopo il pagamento ricevi una email con il link di download. Puoi scaricare i prodotti anche dalla Dashboard, sezione I miei download.', 'download,email,dashboard', 'download.html'),
('download', 'Non ho ricevuto l’email di download.', 'Controlla Spam, Promozioni e Posta indesiderata.', 'email download,non ricevuta', 'guide.js'),
('download', 'Il file non si scarica.', 'Prova da un altro browser o dispositivo. Se il problema persiste, contatta il supporto.', 'file non scaricabile,errore download', 'resi-rimborsi'),

-- ORDINI
('ordini', 'Dove trovo i miei ordini?', 'Nella Dashboard, sezione I miei ordini.', 'ordini,dashboard', 'ordini.html'),
('ordini', 'Come annullo un ordine?', 'Puoi annullare un ordine dalla Dashboard se lo stato non è ancora completato.', 'annulla ordine,cancellazione ordine', 'ordini.js'),
('ordini', 'Perché il mio ordine è in attesa di pagamento?', 'Il pagamento non è stato completato. Puoi usare Completa pagamento.', 'attesa pagamento,ordine incompleto', 'ordini.js'),

-- RIMBORSI
('rimborsi', 'Posso chiedere un rimborso?', 'Sì, valutiamo ogni richiesta caso per caso per problemi tecnici, file non scaricabile o acquisti duplicati.', 'rimborso,richiesta rimborso', 'FAQ.json'),
('rimborsi', 'Come richiedo un rimborso?', 'Puoi usare la pagina dedicata ai rimborsi o contattare il supporto.', 'richiedere rimborso,procedura rimborso', 'resi-rimborsi'),
('rimborsi', 'Quando non è previsto un rimborso?', 'Non è previsto per prodotti già scaricati correttamente o per uso improprio.', 'rimborso negato,non previsto', 'resi-rimborsi'),

-- ACCOUNT
('account', 'Come accedo al mio account?', 'Vai sulla pagina di login e inserisci email e password.', 'login,accesso', 'guide.js'),
('account', 'Ho dimenticato la password.', 'Puoi usare la procedura di reset basata sul codice fiscale.', 'reset password,codice fiscale', 'guide.js'),
('account', 'Come elimino il mio account?', 'Puoi eliminare l’account dalla Dashboard, sezione Elimina account.', 'elimina account,cancellazione account', 'elimina-account.html'),

-- DASHBOARD
('dashboard', 'Cosa posso fare nella Dashboard?', 'Puoi gestire ordini, download, recensioni, profilo ed eliminazione account.', 'dashboard,funzioni dashboard', 'dashboard.html'),
('dashboard', 'Come cambio email?', 'Dalla Dashboard puoi inserire la nuova email e confermare con la password attuale.', 'cambio email,modifica email', 'profilo.js'),
('dashboard', 'Come cambio password?', 'Dalla Dashboard puoi inserire la password attuale e quella nuova.', 'cambio password,modifica password', 'profilo.js'),

-- PRODOTTI
('prodotti', 'Cosa contiene un prodotto digitale?', 'Ogni prodotto include un file digitale scaricabile e, se presente, contenuti aggiuntivi come video YouTube.', 'contenuto prodotto,file digitale', 'schema prodotti + catalogo.js'),
('prodotti', 'Dove trovo il file del prodotto?', 'Il file è inviato via email e disponibile nella Dashboard.', 'file prodotto,download', 'download.html'),
('prodotti', 'Posso usare i prodotti commercialmente?', 'No, sono ad uso personale salvo diversa indicazione.', 'uso commerciale,licenza', 'termini'),

-- SUPPORTO
('supporto', 'In quanto tempo rispondete?', 'Generalmente entro 24–48 ore.', 'tempi risposta,supporto', 'regole'),
('supporto', 'Come contatto il supporto?', 'Puoi usare email o WhatsApp Business.', 'contattare supporto,assistenza', 'pagine legali'),

-- TECNICO
('tecnico', 'Il link non funziona.', 'Prova da un altro browser. Se il problema persiste, contatta il supporto.', 'link non funziona,errore link', 'resi-rimborsi'),
('tecnico', 'Il video YouTube non si apre.', 'Il video è accessibile tramite link esterno. Controlla la connessione o riprova più tardi.', 'youtube,video non apre', 'catalogo.js');
