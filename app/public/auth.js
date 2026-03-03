/* ============================
   AUTH.JS - Gestione login/logout certificati
      ============================ */

      console.log("AUTH JS CARICATO");

      /* -----------------------------------------
         UTENTE LOGGATO?
         ----------------------------------------- */
         function isLogged() {
             try {
                     const session = localStorage.getItem("session");
                             const email = localStorage.getItem("email");

                                     const token = localStorage.getItem("token");
                                             const utenteEmail = localStorage.getItem("utenteEmail");

                                                     if ((session && email) || (token && utenteEmail)) {
                                                                 return true;
                                                                         }

                                                                                 return false;
                                                                                     } catch (e) {
                                                                                             return false;
                                                                                                 }
                                                                                                 }

                                                                                                 /* -----------------------------------------
                                                                                                    ESPONE LO STATO UTENTE AL RESTO DEL SITO
                                                                                                    ----------------------------------------- */
                                                                                                    window.isLogged = isLogged();
                                                                                                    window.userEmail =
                                                                                                        localStorage.getItem("utenteEmail") ||
                                                                                                            localStorage.getItem("email") ||
                                                                                                                null;

                                                                                                                console.log("Auth state:", {
                                                                                                                    isLogged: window.isLogged,
                                                                                                                        email: window.userEmail
                                                                                                                        });

                                                                                                                        /* -----------------------------------------
                                                                                                                           LOGOUT
                                                                                                                           ----------------------------------------- */
                                                                                                                           function logout() {
                                                                                                                               try {
                                                                                                                                       localStorage.removeItem("session");
                                                                                                                                               localStorage.removeItem("email");
                                                                                                                                                       localStorage.removeItem("token");
                                                                                                                                                               localStorage.removeItem("utenteEmail");
                                                                                                                                                                   } catch (e) {}

                                                                                                                                                                       window.location.href = "index.html";
                                                                                                                                                                       }