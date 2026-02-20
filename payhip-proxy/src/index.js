
export default {
      async fetch(request) {
          const url = new URL(request.url);

              // Endpoint catalogo automatico
                  if (url.pathname === "/api/catalog") {
                        return await generateCatalog();
                            }

                                // Proxy normale verso Payhip
                                    const target = "https://payhip.com";
                                        const newUrl = target + url.pathname + url.search;

                                            const response = await fetch(newUrl, {
                                                  method: request.method,
                                                        headers: request.headers,
                                                              body:
                                                                      request.method !== "GET" && request.method !== "HEAD"
                                                                                ? await request.arrayBuffer()
                                                                                          : undefined,
                                                                                              });

                                                                                                  const newHeaders = new Headers(response.headers);
                                                                                                      newHeaders.delete("content-security-policy");
                                                                                                          newHeaders.delete("x-frame-options");

                                                                                                              return new Response(response.body, {
                                                                                                                    status: response.status,
                                                                                                                          headers: newHeaders,
                                                                                                                              });
                                                                                                                                },
                                                                                                                                };

                                                                                                                                // Catalogo automatico usando l'API interna Payhip
                                                                                                                                async function generateCatalog() {
                                                                                                                                  const apiUrl = "https://payhip.com/api/products?store=MewingMarket";

                                                                                                                                    const res = await fetch(apiUrl, {
                                                                                                                                        headers: {
                                                                                                                                              "Accept": "application/json"
                                                                                                                                                  }
                                                                                                                                                    });

                                                                                                                                                      const data = await res.json();

return new Response(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json" }
      });
      }