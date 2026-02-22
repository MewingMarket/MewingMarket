/**
 * FILE: docs/airtable-backup.js
 * SCOPO: Documentazione interna dei nomi REALI delle tabelle e dei campi Airtable.
 * NON VIENE MAI ESEGUITO. NON CONTIENE CODICE ATTIVO.
 *
 * Questo file serve come riferimento permanente per evitare errori nei router,
 * nelle API e nelle patch future.
 */

/* -------------------------------------------------------
   📌 TABELLA: Vendite
   -------------------------------------------------------
   Nome tabella esatto: "Vendite"

   Campi:
   - UID (Primary key)
   - Prodotto
   - Prezzo
   - Origine
   - UTMSource
   - UTMCampaign
   - UTMMedium
   - Referrer
   - PaginaIngresso
   - PaginaUscita
   - UltimoIntent
   - UltimoMessaggio
   - Device
   - Lingua
   - Timestamp
   - prodotto (Link to record)
   - ordine (Link to record)
   - utente (Link to record)
*/

/* -------------------------------------------------------
   📌 TABELLA: Ordini
   -------------------------------------------------------
   Nome tabella esatto: "Ordini"

   Campi:
   - id_ordine (Primary key)
   - utente (Link to record)
   - prodotti (Link to record)
   - totale (Number)
   - data (DateTime)
   - stato (Single select)
   - metodo_pagamento (Single select)
   - paypal_transaction_id (Text)
   - Vendite (Link to record)
   - Newsletter_Log (Link to record)
*/

/* -------------------------------------------------------
   📌 TABELLA: Feedback
   -------------------------------------------------------
   Nome tabella esatto: "Feedback"

   Campi:
   - ID Feedback (Primary key)
   - utente (Link to record)
   - prodotto (Link to record)
   - rating (Number)
   - testo (Long text)
   - data (DateTime)
   - pubblico (Checkbox)
   - risposta_admin (Text)
   - segnalato (Checkbox)
   - sentiment (Text)
   - categoria_feedback (Single select)
*/

/* -------------------------------------------------------
   📌 TABELLA: Carrello
   -------------------------------------------------------
   Nome tabella esatto: "Carrello"

   Campi:
   - Id (Primary key)
   - totale (Formula)
   - ultima_modifica (DateTime)
   - utente (Link to record)
*/

/* -------------------------------------------------------
   📌 TABELLA: Admin
   -------------------------------------------------------
   Nome tabella esatto: "Admin"

   Campi:
   - Email (Primary key)
   - PasswordHash (Text)
   - UltimoReset (DateTime)
*/

/* -------------------------------------------------------
   📌 TABELLA: Catalogo Prodotti Digitali
   -------------------------------------------------------
   Nome tabella esatto: "Catalogo Prodotti Digitali"

   Campi:
   - Immagine (Attachment)
   - TitoloBreve (Text)
   - Slug (Text)
   - Prezzo (Number / Currency)
   - DescrizioneBreve (Text)
   - DescrizioneLunga (Long text)
   - youtube_url (URL)
   - youtube_title (Text)
   - youtube_thumbnail (URL)
   - Validazione Prodotti (Link to record)
   - youtube_description (Long text)
   - youtube_last_video_url (URL)
   - youtube_last_video_title (Text)
   - YouTubeVideoID (Text)
   - paypal_link (URL)
   - Stato (Single select)
   - Tag (Text / Multi-select)
   - File_consegna (Attachment)
   - Vendite_totali (Rollup / Number)
*/

/* -------------------------------------------------------
   📌 TABELLA: Utenti
   -------------------------------------------------------
   Nome tabella esatto: "Utenti"

   Campi:
   - email (Primary key)
   - password_hash (Text)
   - ruolo (Single select)
   - data_registrazione (DateTime)
*/
