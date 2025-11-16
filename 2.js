/**
 * VERSIÓN COMPLETA - Maneja todos los tipos de rebotes
 * Incluye: Failure, Delay, Undelivered, y mensajes en español
 */
function listarRebotesEnHoja() {
    const LOTE = 100;
    const properties = PropertiesService.getUserProperties();
    const userEmail = Session.getActiveUser().getEmail();
    
    // Verificar/crear hoja
    let hojaRegistro = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Rebotados");
    if (!hojaRegistro) {
      hojaRegistro = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Rebotados");
      hojaRegistro.appendRow(['Fecha', 'Email Rebotado', 'Motivo', 'Tipo', 'Enlace']);
      hojaRegistro.setFrozenRows(1);
    }
  
    try {
      const ahora = new Date();
      const ultimaRevisionTimestamp = properties.getProperty('ultimaFechaListadoRebotes');
  
      // BÚSQUEDA AMPLIADA para capturar TODOS los tipos de rebotes
      const queries = [
        'from:"Mail Delivery Subsystem"',
        'from:"mailer-daemon"',
        'from:"Mail Delivery System"',
        'from:"postmaster"',
        'subject:"Delivery Status Notification"',
        'subject:"Undelivered Mail"',
        'subject:"Mail delivery failed"',
        'subject:"No se puede entregar"',
        'subject:"No se pudo entregar"',
        'subject:"Returned mail"',
        'subject:"Delivery incomplete"'
      ];
      
      // Combinar todas las búsquedas con OR
      let searchQuery = `(${queries.join(' OR ')}) -in:trash`;
  
      if (ultimaRevisionTimestamp) {
        const timestampSegundos = Math.floor(parseInt(ultimaRevisionTimestamp) / 1000);
        searchQuery += ` after:${timestampSegundos}`;
      }
  
      Logger.log(`Búsqueda ampliada de rebotes: ${searchQuery}`);
  
      const threads = GmailApp.search(searchQuery, 0, LOTE);
  
      if (!threads || threads.length === 0) {
        SpreadsheetApp.getUi().alert("✅ Listado de Rebotes", "No se encontraron correos rebotados nuevos.", SpreadsheetApp.getUi().ButtonSet.OK);
        _limpiarActivadores('listarRebotesEnHoja');
        properties.setProperty('ultimaFechaListadoRebotes', ahora.getTime().toString());
        return;
      }
  
      Logger.log(`Se encontraron ${threads.length} hilos con posibles rebotes`);
      let procesados = 0;
      let errores = 0;
  
      threads.forEach(thread => {
        const messages = thread.getMessages();
        messages.forEach(message => {
          try {
            const messageUrl = thread.getPermalink();
            const subject = message.getSubject();
            const from = message.getFrom();
            const body = message.getPlainBody();
            
            // Determinar el tipo de rebote
            let tipoRebote = "Desconocido";
            if (subject.includes("Failure")) tipoRebote = "Fallo Permanente";
            else if (subject.includes("Delay")) tipoRebote = "Retraso Temporal";
            else if (subject.includes("Undelivered")) tipoRebote = "No Entregado";
            else if (subject.includes("No se puede entregar") || subject.includes("No se pudo entregar")) tipoRebote = "No Entregado (ES)";
            
            // Extraer email(s) rebotado(s) - puede haber múltiples
            const emailsRebotados = _extraerTodosLosEmailsRebotados(body);
            
            if (emailsRebotados.length > 0) {
              emailsRebotados.forEach(emailRebotado => {
                const motivo = _extraerMotivoReboteCompleto(body, emailRebotado);
                hojaRegistro.appendRow([
                  new Date(), 
                  emailRebotado, 
                  motivo, 
                  tipoRebote,
                  messageUrl
                ]);
                Logger.log(`✅ Rebote procesado: ${emailRebotado} (${tipoRebote})`);
                procesados++;
              });
            } else {
              // Si no podemos extraer el email, lo registramos para análisis
              Logger.log(`⚠️ No se pudo extraer email de: ${subject}`);
              hojaRegistro.appendRow([
                new Date(), 
                'NO EXTRAÍDO', 
                `Subject: ${subject} | From: ${from} | Body: ${body.substring(0, 200)}...`, 
                'Error Parseo',
                messageUrl
              ]);
              errores++;
            }
  
            // Marcar como procesado
            message.moveToTrash();
  
          } catch (e) {
            Logger.log(`Error procesando mensaje: ${e.message}`);
            errores++;
          }
        });
      });
  
      // Si procesamos un lote completo, programar continuación
      if (threads.length === LOTE) {
        _limpiarActivadores('listarRebotesEnHoja');
        ScriptApp.newTrigger('listarRebotesEnHoja').timeBased().after(2 * 60 * 1000).create();
        Logger.log(`Lote procesado. ${procesados} rebotes encontrados. Continuará en 2 minutos.`);
      } else {
        // Proceso completado
        properties.setProperty('ultimaFechaListadoRebotes', ahora.getTime().toString());
        SpreadsheetApp.getUi().alert(
          "✅ Proceso Completado", 
          `Se procesaron ${procesados} rebotes.\n${errores > 0 ? `Hubo ${errores} mensajes que no se pudieron procesar.` : ''}`, 
          SpreadsheetApp.getUi().ButtonSet.OK
        );
        _limpiarActivadores('listarRebotesEnHoja');
      }
  
    } catch (e) {
      Logger.log(`ERROR CRÍTICO: ${e.toString()}`);
      SpreadsheetApp.getUi().alert("❌ Error", `Error en el proceso: ${e.message}`, SpreadsheetApp.getUi().ButtonSet.OK);
      _limpiarActivadores('listarRebotesEnHoja');
    }
  }
  
  /**
   * NUEVA FUNCIÓN - Extrae TODOS los emails rebotados de un mensaje
   * (puede haber múltiples en un solo correo)
   */
  function _extraerTodosLosEmailsRebotados(body) {
    const emailsEncontrados = new Set();
    
    // Lista completa de patrones para diferentes formatos
    const patrones = [
      // Formato <email@domain.com>: al inicio de línea
      /^<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>:/gm,
      
      // Formato para "delivering your message to"
      /delivering your message to\s+<?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?/gi,
      
      // Formato "could not be delivered to"
      /could not be delivered to\s+<?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?/gi,
      
      // Formato mailto: (para mensajes en español)
      /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
      
      // Formato "destinatarios o grupos:" (español)
      /destinatarios o grupos:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
      
      // Formato final-recipient
      /final-recipient:\s*(?:rfc822;)?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
      
      // Formato original-recipient
      /original-recipient:\s*(?:rfc822;)?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
      
      // Formato 550 error
      /550.*?<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/gi,
      
      // Formato "User unknown" precedido por email
      /<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>\.\.\.\s*User unknown/gi,
      
      // Formato "The following message to"
      /The following message to\s+<?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?/gi,
      
      // Formato "No se ha encontrado la dirección" (precedido por el email)
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})[^@]*No se ha encontrado la direcci/gi,
      
      // Formato genérico para capturar emails después de palabras clave
      /(?:to|recipient|destinatario|address|deliver|sent to|for|para)\s*:?\s*<?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?/gi
    ];
  
    // Aplicar todos los patrones
    patrones.forEach(patron => {
      let match;
      // Reiniciar el índice de búsqueda para patrones globales
      if (patron.global) {
        patron.lastIndex = 0;
      }
      while ((match = patron.exec(body)) !== null) {
        if (match[1]) {
          const email = match[1].trim().toLowerCase();
          // Validar y excluir emails del sistema
          if (email.includes('@') && 
              !email.includes('googlemail.com') && 
              !email.includes('google.com') && 
              !email.includes('mailer-daemon') &&
              !email.includes('postmaster') &&
              !email.includes('trendmicro.com') &&
              !email.includes('utn.edu.ar') &&
              !email.includes('faroandes.com')) { // Excluir tu propio dominio
            emailsEncontrados.add(email);
          }
        }
      }
    });
    
    return Array.from(emailsEncontrados);
  }
  
  /**
   * FUNCIÓN MEJORADA - Extrae el motivo específico para cada email rebotado
   */
  function _extraerMotivoReboteCompleto(body, emailBuscado) {
    // Buscar el contexto alrededor del email específico
    const emailEscapado = emailBuscado.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const contextPattern = new RegExp(
      `(?:^|\\n)([^\\n]*${emailEscapado}[^\\n]*(?:\\n[^\\n]*){0,3})`,
      'i'
    );
    
    const contextMatch = body.match(contextPattern);
    const contexto = contextMatch ? contextMatch[1] : body;
    
    // Buscar motivos específicos en el contexto
    const motivosEspecificos = [
      { pattern: /550 5\.4\.1.*?Access denied/i, mensaje: "Acceso denegado por el servidor destinatario" },
      { pattern: /550 5\.1\.1.*?User unknown/i, mensaje: "Usuario desconocido" },
      { pattern: /550 5\.1\.1.*?No such user/i, mensaje: "El usuario no existe" },
      { pattern: /550 5\.7\.1.*?Unable to relay/i, mensaje: "No se puede retransmitir el mensaje" },
      { pattern: /mailbox.*?full/i, mensaje: "Buzón lleno" },
      { pattern: /mailbox.*?unavailable/i, mensaje: "Buzón no disponible" },
      { pattern: /No se ha encontrado la direcci.n/i, mensaje: "Dirección de email no encontrada" },
      { pattern: /No se pudo entregar/i, mensaje: "No se pudo entregar el mensaje" },
      { pattern: /timed out/i, mensaje: "Tiempo de espera agotado" },
      { pattern: /Connection refused/i, mensaje: "Conexión rechazada" },
      { pattern: /temporary problem/i, mensaje: "Problema temporal con el servidor" },
      { pattern: /Delivery incomplete/i, mensaje: "Entrega incompleta - reintentando" },
      { pattern: /recipient.*?rejected/i, mensaje: "Destinatario rechazado" },
      { pattern: /Invalid recipient/i, mensaje: "Destinatario inválido" },
      { pattern: /does not exist/i, mensaje: "El destinatario no existe" }
    ];
    
    for (const {pattern, mensaje} of motivosEspecificos) {
      if (pattern.test(contexto)) {
        // Si encontramos un código de error específico, lo incluimos
        const codigoMatch = contexto.match(/\b(5\d{2}\s+\d\.\d\.\d)\b/);
        if (codigoMatch) {
          return `${mensaje} (Código: ${codigoMatch[1]})`;
        }
        return mensaje;
      }
    }
    
    // Si no encontramos un patrón específico, buscar cualquier código de error
    const codigoGenerico = contexto.match(/\b(5\d{2}\s+\d\.\d\.\d[^)]*)/);
    if (codigoGenerico) {
      return `Error del servidor: ${codigoGenerico[1]}`;
    }
    
    // Último recurso: devolver las primeras 150 caracteres del contexto
    return contexto.substring(0, 150).replace(/\s+/g, ' ').trim() || "Motivo no especificado";
  }