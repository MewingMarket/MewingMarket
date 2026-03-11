/**
 * =========================================================
 * FILE: docs/airtable-backup.js
 * SCOPO: Documentazione interna dei nomi REALI delle tabelle
 *        e degli ID REALI presi dalla documentazione API.
 *
 * NON VIENE MAI ESEGUITO.
 * Serve come riferimento permanente per evitare errori.
 * =========================================================
 */

/* -------------------------------------------------------
   📌 BASE ID (UNICA)
   -------------------------------------------------------
   ID Base Airtable reale:
   appHmsjBVyXyLpopU

   Variabile consigliata:
   AIRTABLE_BASE = appHmsjBVyXyLpopU
*/

/* -------------------------------------------------------
   📌 TABELLA: Catalogo Prodotti Digitali
   -------------------------------------------------------
   Nome tabella esatto: "Catalogo prodotti digitali"
   ID tabella reale: tbl1s5Oq9cBDM4Avvh

   Variabili consigliate:
   AIRTABLE_TABLE_NAME = Catalogo prodotti digitali
   AIRTABLE_TABLE_ID   = tbl1s5Oq9cBDM4Avvh

   Campi principali:
   - Immagine (Attachment)
   - TitoloBreve (Text)
   - Slug (Text)
   - Prezzo (Number)
   - DescrizioneBreve (Text)
   - DescrizioneLunga (Long text)
   - youtube_url (URL)
   - youtube_title (Text)
   - youtube_thumbnail (URL)
   - youtube_description (Long text)
   - youtube_last_video_url (URL)
   - youtube_last_video_title (Text)
   - YouTubeVideoID (Text)
   - paypal_link (URL)
   - Stato (Single select)
   - Tag (Text / Multi-select)
   - File_consegna (Attachment)
   - Vendite_totali (Rollup)
*/

/* -------------------------------------------------------
   📌 TABELLA: Vendite
   -------------------------------------------------------
   Nome tabella esatto: "Vendite"
   ID tabella reale: tbls5QgOq8DN4aAvh

   Variabili consigliate:
   AIRTABLE_VENDITE_NAME = Vendite
   AIRTABLE_VENDITE_ID   = tbls5QgOq8DN4aAvh

   Campi principali:
   - UID
   - Prodotto
   - Prezzo
   - Origine
   - UTMSource
   - UTMCampaign
   - UTMMedium
   - Referrer
   - PaginaIngresso
   - PaginaUscita
   - Timestamp
   - prodotto (Link)
   - ordine (Link)
   - utente (Link)
*/

/* -------------------------------------------------------
   📌 TABELLA: Ordini
   -------------------------------------------------------
   Nome tabella esatto: "Ordini"
   ID tabella reale: tbl1n674fEuyp7cVw5K

   Variabili consigliate:
   AIRTABLE_ORDINI_NAME = Ordini
   AIRTABLE_ORDINI_ID   = tbl1n674fEuyp7cVw5K

   Campi principali:
   - id_ordine
   - utente (Link)
   - prodotti (Link)
   - totale
   - data
   - stato
   - metodo_pagamento
   - paypal_transaction_id
*/

/* -------------------------------------------------------
   📌 TABELLA: Feedback
   -------------------------------------------------------
   Nome tabella esatto: "Feedback"
   ID tabella reale: tbl1De4tLCRcZetB5

   Variabili consigliate:
   AIRTABLE_FEEDBACK_NAME = Feedback
   AIRTABLE_FEEDBACK_ID   = tbl1De4tLCRcZetB5

   Campi principali:
   - utente (Link)
   - prodotto (Link)
   - rating
   - testo
   - data
   - pubblicato
   - risposta_admin
   - segnalato
*/

/* -------------------------------------------------------
   📌 TABELLA: Carrello
   -------------------------------------------------------
   Nome tabella esatto: "Carrello"
   ID tabella reale: tbl4cA7fBCbana8Kg7e

   Variabili consigliate:
   AIRTABLE_CARRELLO_NAME = Carrello
   AIRTABLE_CARRELLO_ID   = tbl4cA7fBCbana8Kg7e

   Campi principali:
   - totale
   - ultima_modifica
   - utente (Link)
*/

/* -------------------------------------------------------
   📌 TABELLA: Utenti
   -------------------------------------------------------
   Nome tabella esatto: "Utenti"
   ID tabella reale: tblhR9oPrFAfj5htjqo

   Variabili consigliate:
   AIRTABLE_UTENTI_NAME = Utenti
   AIRTABLE_UTENTI_ID   = tblhR9oPrFAfj5htjqo

   Campi principali:
   - email
   - password_hash
   - ruolo
   - data_registrazione
*/
