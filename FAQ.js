document.addEventListener('DOMContentLoaded', () => {
    // Seleziona tutti i titoli delle domande
    const faqTitles = document.querySelectorAll('.faq-item h3');
    
    faqTitles.forEach(title => {
        // Aggiunge l'evento del click a ogni domanda
        title.addEventListener('click', () => {
            const answer = title.nextElementSibling;
            
            // Verifica se la risposta è già visibile
            if (answer.style.display === 'block') {
                answer.style.display = 'none';
            } else {
                // Chiude eventuali altre risposte aperte (opzionale, per ordine)
                document.querySelectorAll('.faq-item p').forEach(p => p.style.display = 'none');
                
                // Mostra la risposta selezionata
                answer.style.display = 'block';
            }
        });
    });
});
