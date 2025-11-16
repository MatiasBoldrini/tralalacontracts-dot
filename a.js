/**
 * @OnlyCurrentDoc
 * Script integral para la gestión de contactos y campañas.
 * VERSIÓN MAESTRA FINAL - CONTIENE TODAS LAS FUNCIONALIDADES INTEGRADAS Y CORREGIDAS.
 */

// =================================================================
// CONFIGURACIÓN GLOBAL Y MENÚ
// =================================================================

const HOJA_BORRADORES_DESTINO = "Borradores";
const HOJA_ENVIADOS = "Enviados";
const HOJA_CONFIG = "Configuracion";
const HOJA_ERRORES = "Errores de Importación";
const HOJA_ANALYTICS = "Analytics";
const LIMITE_DIARIO_ENVIOS = 1450;
const TAMANO_LOTE_IMPORTACION = 50;
const TAMANO_LOTE_VALIDACION = 100;
const PERSONAL_DOMAINS = new Set(['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'live.com', 'icloud.com', 'aol.com', 'msn.com', 'yahoo.com.ar', 'hotmail.com.ar', 'live.com.ar']);
const DOMAINS_A_ELIMINAR = new Set(['faroandes.com', 'adetech-industrial.com', 'tech-novation.com']);
const MAX_RUNTIME = 5.5 * 60 * 1000;
const COMPANY_SUFFIXES_TO_REMOVE = /(-?|\.?)(srl|sa|sas|sc|sl)$/i;
const INVALID_NAME_KEYWORDS = new Set([
	'rrhh', 'recursos', 'humanos', 'grupo', 'estudio', 'mail', 'info', 'comercial', 'ventas', 'contacto', 'busquedas',
	'seleccion', 'sistemas', 'postulante', 'postulantes', 'postulanteneuquen', 'reclutamiento', 'administracion',
	'secretaria', 'gerencia', 'soporte', 'consultora', 'consultores', 'randstad', 'faroandes', 'cv', 'curriculum',
	'empleo', 'empleos', 'talentohumano', 'talento', 'asunto', 'direccion', 'dirección'
]);
const MAPA_DE_TRADUCCIONES_CARGO = {
	'compras': ['compras', 'purchasing', 'buyer'],
	'gerente': ['gerente', 'manager']
};
const MAPA_DE_CAMPOS_FIJOS = [
	{ path: 'names[0].givenName', header: 'First Name' },
	{ path: 'names[0].familyName', header: 'Last Name' },
	{ path: 'organizations[0].name', header: 'Empresa' },
	{ path: 'organizations[0].title', header: 'Cargo/Posicion' },
	{
		path: 'urls',
		header: 'WEB (el de la empresa)',
		processor: (items) => {
			if (!items || items.length === 0) return '';
			const workUrl = items.find(u => u.type === 'work');
			return workUrl ? workUrl.value : (items[0] ? items[0].value : '');
		}
	},
	{ path: 'emailAddresses[0].value', header: 'Email' },
	{ path: 'biographies[0].value', header: 'Notes' },
	{ path: 'memberships', header: 'Tipo (etiquetas)', processor: (items, contact, allGroups) => (items || []).filter(m => m.contactGroupMembership?.contactGroupResourceName).map(m => allGroups[m.contactGroupMembership.contactGroupResourceName] || '').filter(Boolean).join(', ') },
	{
		path: 'phoneNumbers', header: 'Teléfonos', processor: (items) => {
			if (!items || items.length === 0) return '';
			const primary = items.find(p => p.metadata?.primary);
			return primary ? primary.value : items[0].value;
		}
	}
];

/**
 * =================================================================
 * MÓDULO DE MENÚ Y ENVÍO INTELIGENTE (VERSIÓN CORREGIDA)
 * =================================================================
 */

/**
 * [VERSIÓN COMPLETA Y CORREGIDA]
 * Crea el menú principal con TODAS las funciones originales del usuario,
 * asegurando que el botón de envío llame a la función inteligente 'iniciarEnvioInteligente'.
 */
function crearMenuPrincipal() {
	try {
		const ui = SpreadsheetApp.getUi();
		const menu = ui.createMenu('Gestor de Campañas');
		menu.addItem('1. Generar Correos (con Segmentación)', 'mostrarInterfazSegmentacion');
		menu.addSeparator();

		const subMenuRevision = ui.createMenu('2. Revisión y Envío');
		subMenuRevision.addItem('Previsualizador Avanzado', 'mostrarPrevisualizadorAvanzado');
		// --- CORRECCIÓN CLAVE: Se llama a la función correcta ---
		subMenuRevision.addItem('Iniciar Envío Inteligente', 'iniciarEnvioInteligente');
		menu.addSubMenu(subMenuRevision);
		menu.addSeparator();

		const subMenuMantenimiento = ui.createMenu('3. Mantenimiento y Estado');
		subMenuMantenimiento.addItem('Verificar Estado del Sistema de Envío', 'verificarEstadoSistemaDeEnvio');
		subMenuMantenimiento.addItem('Listar Correos Rebotados', 'iniciarListadoDeRebotes');
		subMenuMantenimiento.addItem('Reiniciar Historial de Rebotes', '_reiniciarFechaDeRebotes');
		subMenuMantenimiento.addItem('Verificar Estado de Rebotes', 'verificarEstadoDeRebotes');
		subMenuMantenimiento.addSeparator();
		subMenuMantenimiento.addItem('Verificar Estado (Generador de Campañas)', 'verificarEstadoDeCampana');
		subMenuMantenimiento.addItem('Verificar Estado (Importación a Hoja)', 'verificarEstadoImportacionHaciaHoja');
		subMenuMantenimiento.addSeparator();
		subMenuMantenimiento.addItem('Cancelar Todos los Procesos Pendientes', 'cancelarProcesosPendientes');
		menu.addSubMenu(subMenuMantenimiento);
		menu.addSeparator();

		const subMenuGestion = ui.createMenu('4. Gestión de Contactos');
		subMenuGestion.addItem('AUTORIZAR PERMISOS PRIMERO', 'solicitarPermisos');
		subMenuGestion.addSeparator();
		subMenuGestion.addItem('Importar desde Contactos a Hoja', 'mostrarInterfazImportacionGmail');
		subMenuGestion.addItem('Sincronizar Contactos (Hoja -> Gmail)', 'iniciarImportacionDeDatos');
		subMenuGestion.addItem('Verificar Estado de Sincronización', 'verificarEstadoSincronizacion');
		subMenuGestion.addSeparator();
		subMenuGestion.addItem('Validar Dominios de Hoja', 'iniciarValidacion');
		subMenuGestion.addItem('Eliminar Dominios Inválidos', 'eliminarFilasConDominioInvalido');
		subMenuGestion.addSeparator();

		const subMenuExtraccion = ui.createMenu('Extraer Contactos desde Gmail');
		subMenuExtraccion.addItem('Paso 1: Iniciar Extracción', 'mostrarOpcionesDeExtraccion');
		subMenuExtraccion.addItem('Verificar Estado de Extracción', 'verificarEstadoExtraccion');
		subMenuExtraccion.addSeparator();
		subMenuExtraccion.addItem('Paso 2: Eliminar Dominios Internos', 'eliminarDominiosInternos');
		subMenuExtraccion.addItem('Paso 3: Limpiar Duplicados por Email', 'iniciarLimpiezaDeDuplicados');
		subMenuExtraccion.addItem('Paso 4: Crear Resumen por Empresa', 'crearTablaDinamicaResumen');
		subMenuExtraccion.addSeparator();
		subMenuExtraccion.addItem('Cancelar Proceso de Extracción', 'cancelarProcesoDeExtraccion');
		subMenuGestion.addSubMenu(subMenuExtraccion);
		menu.addSubMenu(subMenuGestion);
		menu.addSeparator();
		menu.addItem('ENVIAR CORREO DE PRUEBA', 'enviarCorreoDePruebaConSeguimiento');

		menu.addItem('Configurar Alias de Envío', 'listarAliasesEnConfiguracion');
		menu.addItem('!!! LIMPIEZA TOTAL DE ACTIVADORES !!!', 'LIMPIEZA_TOTAL_DE_ACTIVADORES');
		menu.addToUi();
	} catch (e) {
		if (e.message.includes('Cannot call SpreadsheetApp.getUi() from this context')) {
			Logger.log('Menú no creado: El activador se ejecutó en un contexto sin interfaz de usuario.');
		} else {
			Logger.log(e);
			throw e;
		}
	}
}

// =================================================================
// CARGA DE DATOS PARA INTERFACES (UI)
// =================================================================

/**
 * [MODIFICADO]
 * Obtiene los datos para los filtros de la interfaz leyendo la hoja "TODOS".
 * @returns {object} Un objeto con arrays de 'etiquetas' y 'companies' únicos.
 */
function getDatosParaFiltros() {
	const cache = CacheService.getScriptCache();
	const cacheKey = 'filtros_desde_hoja_todos';

	const cachedData = cache.get(cacheKey);
	if (cachedData) {
		try {
			return JSON.parse(cachedData);
		} catch (e) {
			Logger.log('Error al parsear caché de filtros, se volverán a generar.');
		}
	}

	try {
		const hojaTodos = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("TODOS");
		if (!hojaTodos) {
			Logger.log('No se encontró la hoja "TODOS" para cargar los filtros.');
			return { etiquetas: [], companies: [] };
		}

		const datos = hojaTodos.getDataRange().getValues();
		const encabezados = datos.shift();

		// Encontrar los índices de las columnas relevantes
		const indiceEmpresa = encabezados.findIndex(h => h.toLowerCase().trim() === 'empresa');
		const indiceTipo = encabezados.findIndex(h => h.toLowerCase().trim() === 'tipo');

		const companySet = new Set();
		const etiquetasSet = new Set();

		if (indiceEmpresa !== -1) {
			datos.forEach(fila => {
				if (fila[indiceEmpresa]) {
					companySet.add(fila[indiceEmpresa].toString().trim());
				}
			});
		}

		if (indiceTipo !== -1) {
			datos.forEach(fila => {
				if (fila[indiceTipo]) {
					// Si hay varias etiquetas en una celda, separarlas por coma
					const etiquetasEnFila = fila[indiceTipo].toString().split(',');
					etiquetasEnFila.forEach(etiqueta => {
						if (etiqueta.trim()) {
							etiquetasSet.add(etiqueta.trim());
						}
					});
				}
			});
		}

		const result = {
			companies: Array.from(companySet).sort(),
			etiquetas: Array.from(etiquetasSet).sort()
		};

		// Guardar en caché por 5 minutos para acelerar recargas
		cache.put(cacheKey, JSON.stringify(result), 300);

		return result;

	} catch (e) {
		Logger.log('Error en getDatosParaFiltros (versión hoja TODOS): ' + e.toString());
		return { etiquetas: [], companies: [] };
	}
}

// =================================================================
// FUNCIONES DE INTERFAZ DE USUARIO (UI)
// =================================================================

function mostrarInterfazSegmentacion() {
	const html = HtmlService.createTemplateFromFile('SegmentacionHTML').evaluate().setTitle('Generador de Campañas').setWidth(350);
	SpreadsheetApp.getUi().showSidebar(html);
}

function mostrarPrevisualizadorAvanzado() {
	const html = HtmlService.createTemplateFromFile('PrevisualizadorHTML').evaluate().setTitle('Previsualizador Avanzado').setWidth(500).setHeight(450);
	SpreadsheetApp.getUi().showSidebar(html);
}

function mostrarOpcionesDeExtraccion() {
	const html = HtmlService.createHtmlOutputFromFile('OpcionesExtraccionHTML').setWidth(450).setHeight(170);
	SpreadsheetApp.getUi().showModalDialog(html, 'Iniciar Extracción de Contactos');
}

function mostrarInterfazImportacionGmail() {
	const html = HtmlService.createTemplateFromFile('ImportacionGmailHTML').evaluate().setTitle('Importar desde Contactos a Hoja').setWidth(450);
	SpreadsheetApp.getUi().showSidebar(html);
}

function iniciarImportacionDeDatos() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const allSheets = ss.getSheets();
	const sheetNames = allSheets.map(s => s.getName()).filter(name => {
		return !["Borradores", "Enviados", "Configuracion", "Errores de Importación", "Analytics", "Contactos Extraídos", "Resumen", "Resumen por Empresa"].includes(name);
	});
	if (sheetNames.length === 0) {
		SpreadsheetApp.getUi().alert('No se encontraron hojas válidas para importar.');
		return;
	}
	const template = HtmlService.createTemplateFromFile('SeleccionarHojaHTML');
	template.sheetNames = sheetNames;
	const html = template.evaluate().setWidth(400).setHeight(200);
	SpreadsheetApp.getUi().showModalDialog(html, 'Seleccionar Hoja para Sincronizar');
}


// =================================================================
// MÓDULO 1: GENERADOR DE CAMPAÑAS (ASÍNCRONO)
// =================================================================

/**
 * [VERSIÓN FINAL CON PLANTILLAS DINÁMICAS]
 * Obtiene la plantilla seleccionada en la hoja "Configuracion" y devuelve su contenido.
 * @returns {{asunto: string, cuerpo: string}} El asunto y el cuerpo del correo.
 */
function generarTextoPersonalizado() {
	const hojaConfig = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Configuracion");
	if (!hojaConfig) {
		throw new Error("La hoja 'Configuracion' no fue encontrada.");
	}

	// Lee el nombre de la plantilla a usar desde la hoja de configuración
	const datosConfig = hojaConfig.getDataRange().getValues();
	const filaPlantilla = datosConfig.find(fila => fila[0] === "Plantilla a usar");

	if (!filaPlantilla || !filaPlantilla[1]) {
		throw new Error("No se ha especificado una 'Plantilla a usar' en la hoja 'Configuracion'.");
	}

	const nombrePlantillaSeleccionada = filaPlantilla[1];

	// Obtiene el contenido de la plantilla usando la nueva función auxiliar
	const plantilla = _obtenerPlantilla(nombrePlantillaSeleccionada);

	if (!plantilla) {
		throw new Error(`La plantilla llamada '${nombrePlantillaSeleccionada}' no fue encontrada en la hoja 'Plantillas'.`);
	}

	// Devuelve el asunto y cuerpo de la plantilla encontrada
	return {
		asunto: plantilla.asunto,
		cuerpo: plantilla.cuerpo
	};
}

function iniciarGeneracionDeCampana(opciones) {
	cancelarProcesoDeCampana();
	const properties = PropertiesService.getUserProperties();
	properties.setProperty('campana_opciones', JSON.stringify(opciones));
	properties.setProperty('campana_estado', 'iniciando');
	SpreadsheetApp.getUi().alert('✅ Generador de Campañas Iniciado', 'El sistema está buscando los contactos. Puedes verificar el estado desde el menú "Mantenimiento y Estado".', SpreadsheetApp.getUi().ButtonSet.OK);
	ScriptApp.newTrigger('procesarLoteDeCampana').timeBased().after(1000).create();
}

function procesarLoteDeCampana() {
	const properties = PropertiesService.getUserProperties();
	const estado = properties.getProperty('campana_estado');
	if (estado === 'cancelado' || estado === 'finalizado') {
		_limpiarActivadoresDeCampana();
		return;
	}

	try {
		let proximoEstado = estado;
		if (estado === 'iniciando') {
			proximoEstado = _campana_fase1_recolectarContactos(properties);
		} else if (estado === 'generando_borradores') {
			proximoEstado = _campana_fase2_generarBorradores(properties);
		}

		if (proximoEstado && proximoEstado !== 'finalizado' && proximoEstado !== 'cancelado') {
			_limpiarActivadoresDeCampana();
			ScriptApp.newTrigger('procesarLoteDeCampana').timeBased().after(3000).create();
		} else if (proximoEstado === 'finalizado') {
			_limpiarActivadoresDeCampana();
			const total = properties.getProperty('campana_procesados') || 0;
			const errores = properties.getProperty('campana_errores') || 0;
			GmailApp.sendEmail(Session.getActiveUser().getEmail(), '✅ Campaña Generada', `Proceso finalizado.\n\nSe han creado ${total} borradores de correo en la hoja "${HOJA_BORRADORES_DESTINO}".\nHubo ${errores} contactos sin email.`);
		}
	} catch (e) {
		const userEmail = Session.getActiveUser().getEmail();
		GmailApp.sendEmail(userEmail, 'Error en Generador de Campañas', `El proceso falló en la fase '${estado}' con el error: ${e.message}`);
		cancelarProcesoDeCampana();
	}
}

/**
 * [VERSIÓN FINAL CON ANTI-DUPLICADOS]
 * Fase 1: Recolecta, filtra contactos, excluye bajas y elimina duplicados por email.
 */
function _campana_fase1_recolectarContactos(properties) {
	const opciones = JSON.parse(properties.getProperty('campana_opciones'));
	const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
	const hojaTodos = spreadsheet.getSheetByName("TODOS");
	if (!hojaTodos) {
		throw new Error('No se encontró la hoja "TODOS".');
	}

	const datos = hojaTodos.getDataRange().getValues();
	const encabezados = datos.shift();

	const indices = {
		empresa: encabezados.findIndex(h => h.toLowerCase().trim() === 'empresa'),
		email: encabezados.findIndex(h => h.toLowerCase().trim() === 'email'),
		tipo: encabezados.findIndex(h => h.toLowerCase().trim() === 'tipo'),
		cargo: encabezados.findIndex(h => h.toLowerCase().trim() === 'cargo/posicion'),
		nombre: encabezados.findIndex(h => h.toLowerCase().trim() === 'first name'),
		apellido: encabezados.findIndex(h => h.toLowerCase().trim() === 'last name'),
		suscripcion: encabezados.findIndex(h => h.toLowerCase().trim() === 'suscripción')
	};

	if (indices.email === -1) {
		throw new Error('La hoja "TODOS" debe tener una columna llamada "Email".');
	}

	const contactosFiltrados = datos.filter(fila => {
		// ... (toda la lógica de filtrado anterior se mantiene igual)
		if (fila.every(celda => celda === "")) return false;
		let cumple = true;
		if (indices.suscripcion !== -1) {
			const estadoSuscripcion = (fila[indices.suscripcion] || '').trim().toLowerCase();
			if (estadoSuscripcion === 'baja') {
				cumple = false;
			}
		}
		if (cumple && opciones.etiquetas && opciones.etiquetas.length > 0) {
			if (indices.tipo === -1) return false;
			const etiquetasFila = (fila[indices.tipo] || '').split(',').map(e => e.trim().toLowerCase());
			const etiquetasFiltro = opciones.etiquetas.map(e => e.toLowerCase());
			if (!etiquetasFiltro.some(etiqueta => etiquetasFila.includes(etiqueta))) cumple = false;
		}
		if (cumple && opciones.empresas && opciones.empresas.length > 0) {
			if (indices.empresa === -1) return false;
			const empresaFila = (fila[indices.empresa] || '').trim().toLowerCase();
			const empresasFiltro = opciones.empresas.map(e => e.toLowerCase());
			if (!empresasFiltro.includes(empresaFila)) cumple = false;
		}
		if (cumple && opciones.posicion) {
			if (indices.cargo === -1) return false;
			const posicionFila = (fila[indices.cargo] || '').toLowerCase();
			if (!posicionFila.includes(opciones.posicion.toLowerCase())) cumple = false;
		}
		if (!fila[indices.email] || !fila[indices.email].toString().includes('@')) cumple = false;
		return cumple;
	});

	// --- INICIO DEL NUEVO BLOQUE ANTI-DUPLICADOS ---
	const emailsUnicos = new Set();
	const contactosSinDuplicados = [];

	for (const fila of contactosFiltrados) {
		const email = (fila[indices.email] || '').trim().toLowerCase();
		// Solo añadimos la fila si el correo no ha sido visto antes
		if (email && !emailsUnicos.has(email)) {
			emailsUnicos.add(email);
			contactosSinDuplicados.push(fila);
		}
	}
	// --- FIN DEL NUEVO BLOQUE ANTI-DUPLICADOS ---

	// Ahora usamos la lista sin duplicados para el resto del proceso
	if (contactosSinDuplicados.length === 0) {
		properties.setProperty('campana_estado', 'cancelado');
		GmailApp.sendEmail(Session.getActiveUser().getEmail(), 'ℹ️ Campaña Detenida', 'El proceso se detuvo porque no se encontraron contactos (o eran duplicados) con los filtros seleccionados.');
		return 'cancelado';
	}

	// Y guardamos la lista limpia en las propiedades
	properties.setProperty('campana_contactosData', JSON.stringify(contactosSinDuplicados));
	properties.setProperty('campana_encabezados', JSON.stringify(encabezados));
	properties.setProperty('campana_total', contactosSinDuplicados.length.toString());
	properties.setProperty('campana_procesados', '0');
	properties.setProperty('campana_errores', '0');
	properties.setProperty('campana_estado', 'generando_borradores');

	return 'generando_borradores';
}


/**
 * [VERSIÓN FINAL CON LECTURA DIRECTA DE DATOS]
 * Fase 2: Genera los borradores reemplazando los marcadores leyendo
 * los datos directamente para asegurar la integridad de la información.
 */
function _campana_fase2_generarBorradores(properties) {
	const LOTE = 20;
	const opciones = JSON.parse(properties.getProperty('campana_opciones'));
	const contactosData = JSON.parse(properties.getProperty('campana_contactosData'));
	const encabezados = JSON.parse(properties.getProperty('campana_encabezados'));

	let procesados = parseInt(properties.getProperty('campana_procesados') || '0');
	let errores = parseInt(properties.getProperty('campana_errores') || '0');
	const loteDeFilas = contactosData.slice(procesados, procesados + LOTE);

	if (loteDeFilas.length === 0) { return 'finalizado'; }

	let hojaDestino = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Borradores");
	if (!hojaDestino) {
		hojaDestino = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Borradores");
		hojaDestino.appendRow(['Enviar', 'Destinatario', 'Asunto', 'Cuerpo', 'Nombre', 'Apellido', 'Empresa', 'Posición', 'Etiquetas']);
	}

	const indices = {
		nombre: encabezados.findIndex(h => h.toLowerCase().trim() === 'first name'),
		apellido: encabezados.findIndex(h => h.toLowerCase().trim() === 'last name'),
		email: encabezados.findIndex(h => h.toLowerCase().trim() === 'email'),
		empresa: encabezados.findIndex(h => h.toLowerCase().trim() === 'empresa'),
		cargo: encabezados.findIndex(h => h.toLowerCase().trim() === 'cargo/posicion'),
		tipo: encabezados.findIndex(h => h.toLowerCase().trim() === 'tipo')
	};

	const nuevasFilas = [];

	loteDeFilas.forEach(fila => {
		if (fila[indices.email] && fila[indices.email].toString().includes('@')) {
			const { asunto, cuerpo } = generarTextoPersonalizado(fila, encabezados, opciones.palabrasClave);

			// --- CAMBIO CLAVE: Se leen los datos directamente desde la 'fila' ---
			let cuerpoFinal = cuerpo.replace(/{{Email}}/g, encodeURIComponent(fila[indices.email]));
			cuerpoFinal = cuerpoFinal.replace(/{{Asunto}}/g, encodeURIComponent(asunto));

			const nombre = indices.nombre !== -1 ? fila[indices.nombre] : '';
			const apellido = indices.apellido !== -1 ? fila[indices.apellido] : '';
			const empresa = indices.empresa !== -1 ? fila[indices.empresa] : '';
			const posicion = indices.cargo !== -1 ? fila[indices.cargo] : '';
			const etiquetas = indices.tipo !== -1 ? fila[indices.tipo] : '';

			nuevasFilas.push([false, fila[indices.email], asunto, cuerpoFinal, nombre, apellido, empresa, posicion, etiquetas]);
		} else {
			errores++;
		}
	});

	if (nuevasFilas.length > 0) {
		const startRow = hojaDestino.getLastRow() + 1;
		const range = hojaDestino.getRange(startRow, 1, nuevasFilas.length, nuevasFilas[0].length);
		range.setValues(nuevasFilas);
		hojaDestino.getRange(startRow, 1, nuevasFilas.length, 1).insertCheckboxes();
	}

	procesados += loteDeFilas.length;
	properties.setProperty('campana_procesados', procesados.toString());
	properties.setProperty('campana_errores', errores.toString());

	if (procesados >= contactosData.length) { return 'finalizado'; }
	return 'generando_borradores';
}

function verificarEstadoDeCampana() {
	const properties = PropertiesService.getUserProperties();
	const estado = properties.getProperty('campana_estado');
	if (!estado || estado === 'cancelado' || estado === 'finalizado') {
		SpreadsheetApp.getUi().alert('Estado del Generador de Campañas', 'No hay ningún proceso de generación de campañas activo.', SpreadsheetApp.getUi().ButtonSet.OK);
		return;
	}
	const procesados = properties.getProperty('campana_procesados') || 0;
	const total = properties.getProperty('campana_total') || '??';
	const errores = properties.getProperty('campana_errores') || 0;
	SpreadsheetApp.getUi().alert('Estado del Generador de Campañas', `Fase actual: ${estado}\nBorradores generados: ${procesados} de ${total}\nContactos sin email: ${errores}`, SpreadsheetApp.getUi().ButtonSet.OK);
}

function cancelarProcesoDeCampana() {
	_limpiarActivadoresDeCampana();
	const properties = PropertiesService.getUserProperties();
	properties.setProperty('campana_estado', 'cancelado');
	properties.deleteProperty('campana_opciones');
	properties.deleteProperty('campana_contactosIds');
	properties.deleteProperty('campana_total');
	properties.deleteProperty('campana_procesados');
	properties.deleteProperty('campana_errores');
	Logger.log('Proceso de Campaña cancelado y propiedades limpiadas.');
}

function _limpiarActivadoresDeCampana() {
	const allTriggers = ScriptApp.getProjectTriggers();
	for (const trigger of allTriggers) {
		if (trigger.getHandlerFunction() === 'procesarLoteDeCampana') {
			ScriptApp.deleteTrigger(trigger);
		}
	}
}


// =================================================================
// MÓDULO 2: SINCRONIZACIÓN Y OTROS (Lógica Ficticia)
// =================================================================

// ** FUNCIÓN PRINCIPAL DE ENVÍO **
/**
 * [VERSIÓN OPTIMIZADA]
 * Inicia el proceso de envío de forma rápida, solo configura las propiedades
 * y el activador, sin ejecutar el primer envío directamente.
 */
function iniciarEnvioProgramado() {
	const ui = SpreadsheetApp.getUi();
	const properties = PropertiesService.getUserProperties();
	_limpiarActivadoresDeEnvio();

	const hojaBorradores = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Borradores");
	if (!hojaBorradores || hojaBorradores.getLastRow() < 2) {
		ui.alert('No hay borradores para enviar.');
		return;
	}
	const datosBorradores = hojaBorradores.getRange("A2:A" + hojaBorradores.getLastRow()).getValues();
	const correosAEnviar = datosBorradores.filter(fila => fila[0] === true).length;

	if (correosAEnviar === 0) {
		ui.alert('No hay correos marcados con la casilla "Enviar".');
		return;
	}

	const config = _obtenerConfiguracionEnvio();
	const ahora = new Date();
	// ... (El cálculo del intervalo no cambia)
	const finParts = config.horarios[ahora.getDay()].fin.toString().split(':');
	const horaFin = parseInt(finParts[0]) + (parseInt(finParts[1] || 0) / 60);
	const horaActual = ahora.getHours() + (ahora.getMinutes() / 60);
	const minutosRestantes = Math.max(0, (horaFin - horaActual) * 60);

	let intervaloMinutos = 1;
	if (minutosRestantes > 0 && correosAEnviar > 1) {
		const intervaloIdealSegundos = (minutosRestantes * 60) / correosAEnviar;
		const intervaloEfectivoSegundos = Math.min(intervaloIdealSegundos, config.tiempoMaxEsperaSeg);
		const intervaloSeguroSegundos = Math.max(20, intervaloEfectivoSegundos);
		intervaloMinutos = Math.max(1, Math.round(intervaloSeguroSegundos / 60));
	}

	properties.setProperty('envio_totalAEnviar', correosAEnviar.toString());
	properties.setProperty('envio_enviados_campana', '0');
	properties.setProperty('envio_intervalo', intervaloMinutos.toString());

	// --- CAMBIO CLAVE: Ya no se llama a procesarLoteDeEnvio() directamente ---
	ScriptApp.newTrigger('procesarLoteDeEnvio').timeBased().everyMinutes(intervaloMinutos).create();

	ui.alert('✅ Envío Programado Inteligente Iniciado',
		`Se enviarán ${correosAEnviar} correos en segundo plano, aproximadamente cada ${intervaloMinutos} minuto(s).`,
		ui.ButtonSet.OK);
}


/**
 * [VERSIÓN CORREGIDA Y ROBUSTA]
 * Lee la configuración de la hoja "Configuracion".
 * Esta versión es más robusta y elimina espacios en blanco de las celdas
 * para evitar errores de lectura en los valores "VERDADERO" o "FALSO".
 */
function _obtenerConfiguracionEnvio() {
	const hojaConfig = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Configuracion");
	const defaults = {
		limiteDiario: 1450,
		tiempoMaxEsperaSeg: 60,
		nombreRemitente: 'El equipo de FAROandes',
		horarios: []
	};
	if (!hojaConfig) return defaults;

	const datos = hojaConfig.getDataRange().getDisplayValues();

	// Se asegura de que la lectura del límite y el tiempo máximo no falle si las filas no existen.
	const filaLimite = datos.find(fila => fila[0] === 'Límite de Correos Diarios:');
	const limiteDiario = filaLimite ? parseInt(filaLimite[1]) : defaults.limiteDiario;

	const filaTiempoMax = datos.find(fila => fila[0] === 'Tiempo Máx. de espera');
	const tiempoMaxEsperaSeg = filaTiempoMax ? parseInt(filaTiempoMax[1]) : defaults.tiempoMaxEsperaSeg;

	const filaRemitente = datos.find(fila => fila[0] === 'Nombre del Remitente');
	const nombreRemitente = filaRemitente && filaRemitente[1] ? filaRemitente[1] : defaults.nombreRemitente;

	// --- CORRECCIÓN CLAVE ---
	// Se añade .trim() para eliminar espacios en blanco antes de la comparación.
	const horarios = datos.slice(6, 13).map(fila => ({
		dia: fila[0],
		habilitado: (fila[1] || '').toString().trim().toUpperCase() === 'VERDADERO', // Más seguro
		inicio: fila[2],
		fin: fila[3]
	}));

	return { limiteDiario, tiempoMaxEsperaSeg, nombreRemitente, horarios };
}

// ** FUNCIÓN AUXILIAR PARA VERIFICAR EL HORARIO **
/**
 * [VERSIÓN CORREGIDA]
 * Verifica si la hora actual está dentro del rango habilitado para el día actual.
 * @param {object} config El objeto de configuración leído de la hoja.
 * @returns {boolean} True si está en horario de envío.
 */
function _estaEnHorarioDeEnvio(config) {
	const ahora = new Date();
	const diaActual = ahora.getDay(); // Domingo = 0, Lunes = 1, ...
	const configDia = config.horarios[diaActual];

	if (!configDia || !configDia.habilitado) {
		Logger.log(`Envío deshabilitado para el día de hoy (${configDia.dia}).`);
		return false;
	}

	const horaActualDecimal = ahora.getHours() + (ahora.getMinutes() / 60);

	// --- CORRECCIÓN CLAVE: Se parsea la hora directamente para evitar errores de zona horaria ---
	const inicioParts = configDia.inicio.toString().split(':');
	const finParts = configDia.fin.toString().split(':');

	const horaInicioDecimal = parseInt(inicioParts[0]) + (parseInt(inicioParts[1] || 0) / 60);
	const horaFinDecimal = parseInt(finParts[0]) + (parseInt(finParts[1] || 0) / 60);

	const enHorario = horaActualDecimal >= horaInicioDecimal && horaActualDecimal < horaFinDecimal;

	if (!enHorario) {
		Logger.log(`Fuera de horario. Hora actual: ${horaActualDecimal.toFixed(2)}. Rango permitido: ${horaInicioDecimal.toFixed(2)} - ${horaFinDecimal.toFixed(2)}.`);
	}

	return enHorario;
}


function _limpiarActivadoresDeEnvio() {
	const triggers = ScriptApp.getProjectTriggers();
	triggers.forEach(trigger => {
		if (trigger.getHandlerFunction() === 'procesarLoteDeEnvio') {
			ScriptApp.deleteTrigger(trigger);
		}
	});
}
/**
 * [VERSIÓN FUNCIONAL]
 * Muestra el estado actual del proceso de envío programado.
 */
function verificarEstadoSistemaDeEnvio() {
	const properties = PropertiesService.getUserProperties();
	const totalAEnviar = properties.getProperty('envio_totalAEnviar');

	// Si no hay una variable 'totalAEnviar', significa que no hay un proceso activo.
	if (!totalAEnviar) {
		SpreadsheetApp.getUi().alert('Estado del Sistema de Envío', 'Actualmente no hay ningún proceso de envío en ejecución.', SpreadsheetApp.getUi().ButtonSet.OK);
		return;
	}

	// Si el proceso está activo, se recopila la información.
	const enviadosHoy = properties.getProperty('envio_correos_enviados_hoy') || 0;
	const intervalo = properties.getProperty('envio_intervalo') || 'N/A';

	const hojaBorradores = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Borradores");
	// Se cuentan las filas pendientes que tienen la casilla marcada.
	const pendientes = hojaBorradores.getRange("A2:A" + hojaBorradores.getLastRow()).getValues().filter(f => f[0] === true).length;

	const mensaje = `Proceso de envío ACTIVO:\n\n` +
		`- Correos pendientes en la cola: ${pendientes}\n` +
		`- Total de correos para este ciclo: ${totalAEnviar}\n` +
		`- Enviados en el día de hoy: ${enviadosHoy}\n` +
		`- Intervalo entre envíos: ${intervalo} minuto(s) aprox.`;

	SpreadApp.getUi().alert('Estado del Sistema de Envío', mensaje, SpreadsheetApp.getUi().ButtonSet.OK);
}
/**
 * ==================================================================
 * MÓDULO DE PROCESAMIENTO DE REBOTES (VERSIÓN FINAL)
 * ==================================================================
 */

/**
 * Crea un activador (trigger) para que la función 'buscarRebotes' se ejecute
 * automáticamente cada 15 minutos.
 */
function crearActivadorDeRebotes() {
	eliminarActivadorDeRebotes();
	ScriptApp.newTrigger('buscarRebotes')
		.timeBased()
		.everyMinutes(15)
		.create();
	Logger.log('¡Automatización de Rebotes Iniciada! El sistema buscará correos rebotados cada 15 minutos.');
}

/**
 * Elimina el activador que ejecuta la función de buscar rebotes.
 */
function eliminarActivadorDeRebotes() {
	const triggers = ScriptApp.getProjectTriggers();
	for (const trigger of triggers) {
		if (trigger.getHandlerFunction() === 'buscarRebotes') {
			ScriptApp.deleteTrigger(trigger);
		}
	}
	Logger.log('Se han eliminado los activadores de la función de rebotes.');
}

/**
 * [FUNCIÓN AUXILIAR FALTANTE]
 * Extrae la dirección de correo rebotada del cuerpo de un mensaje de notificación.
 * @param {string} body El cuerpo del correo de rebote.
 * @returns {string|null} La dirección de correo encontrada o null.
 */
function _extraerEmailRebotadoDelCuerpo(body) {
	const regexes = [
		// Busca un email entre < > al principio de una línea
		/^<([\w\.\-]+@[\w\.\-]+)>$/m,
		// Formatos estándar de notificaciones de rebote
		/final-recipient: rfc822; ([\w\.\-]+@[\w\.\-]+)/i,
		/original-recipient: rfc822;([\w\.\-]+@[\w\.\-]+)/i,
		/address(?:es)? failed:[\s\S]*<([\w\.\-]+@[\w\.\-]+)>/i,
		/no se ha entregado a ([\w\.\-]+@[\w\.\-]+) porque no se ha encontrado la dirección/i,
		/550 5.1.1 <([\w\.\-]+@[\w\.\-]+)>:/i
	];

	for (const regex of regexes) {
		const match = body.match(regex);
		if (match && match[1]) {
			return match[1].trim().toLowerCase();
		}
	}
	return null; // Devuelve null si no encuentra ninguna coincidencia
}

/**
 * Extrae el motivo del rebote del cuerpo del mensaje.
 * @param {string} body El cuerpo del correo de rebote.
 * @returns {string} El motivo del rebote.
 */
function _extraerMotivoRebote(body) {
	const reasonRegex = /diagnostic-code; ([\s\S]*?)(\n\n|$)/i;
	const match = body.match(reasonRegex);
	if (match && match[1]) {
		return match[1].replace(/\s+/g, ' ').trim();
	}
	// Fallback para mensajes en español
	if (body.includes('no se ha encontrado la dirección')) {
		return "La cuenta de correo no existe.";
	}
	return "Motivo no especificado.";
}


function listarAliasesEnConfiguracion() {
	SpreadsheetApp.getUi().alert('Función "listarAliasesEnConfiguracion" ejecutada.');
}
function iniciarValidacion() { SpreadsheetApp.getUi().alert('Función "iniciarValidacion" ejecutada.'); }


// =================================================================
// MÓDULO 3: IMPORTACIÓN ASÍNCRONA POR FASES (CONTACTOS -> HOJA) - VERSIÓN OPTIMIZADA
// =================================================================

// En tu archivo de script principal (.gs)
function cancelarProcesoDeImportacion() {
	_limpiarActivadoresDeImportacion();
	const properties = PropertiesService.getUserProperties();
	const props_a_borrar = [
		'importHaciaHoja_opciones', 'importHaciaHoja_estado', 'importHaciaHoja_contactosIds',
		'importHaciaHoja_nombreHoja', 'importHaciaHoja_descubrimiento_progreso',
		'importHaciaHoja_descubrimiento_campos', 'importHaciaHoja_encabezados',
		'importHaciaHoja_contactosIdsFinales', 'importHaciaHoja_finalTotal', 'importHaciaHoja_procesados'
	];

	// CORRECCIÓN: Se itera y borra cada propiedad de forma individual.
	props_a_borrar.forEach(prop => {
		properties.deleteProperty(prop);
	});

	Logger.log('Proceso de importación cancelado y todas sus propiedades han sido limpiadas.');
}
// =================================================================
// MÓDULO 3: IMPORTACIÓN ASÍNCRONA POR FASES (CONTACTOS -> HOJA)
// =================================================================

function iniciarProcesoDeImportacionHaciaHoja(opciones) {
	cancelarProcesoDeImportacion();
	// Validar que el nombre de la hoja no esté vacío
	if (!opciones.nombreHoja || opciones.nombreHoja.trim() === '') {
		SpreadsheetApp.getUi().alert('Error', 'El nombre para la hoja de destino no puede estar vacío.');
		return;
	}
	const properties = PropertiesService.getUserProperties();
	properties.setProperty('importHaciaHoja_opciones', JSON.stringify(opciones));
	properties.setProperty('importHaciaHoja_estado', 'iniciando');
	SpreadsheetApp.getUi().alert('✅ Proceso de Importación Iniciado', 'El sistema ha comenzado la Fase 1 (Recolección). Puedes verificar el estado desde el menú.', SpreadsheetApp.getUi().ButtonSet.OK);
	ScriptApp.newTrigger('procesarLoteDeImportacionHaciaHoja').timeBased().after(1000).create();
}
function procesarLoteDeImportacionHaciaHoja() {
	const properties = PropertiesService.getUserProperties();
	const estado = properties.getProperty('importHaciaHoja_estado');
	if (estado === 'cancelado' || estado === 'finalizado') {
		_limpiarActivadoresDeImportacion();
		return;
	}
	try {
		let proximoEstado = estado;
		if (estado === 'iniciando') {
			proximoEstado = _fase1_RecolectarIds(properties);
		} else if (estado === 'descubriendo_campos') {
			proximoEstado = _fase2_DescubrirCamposEnLote(properties);
		} else if (estado === 'filtrando_contactos') { // <-- NUEVA FASE
			proximoEstado = _fase3_FiltrarContactosEnLote(properties);
		} else if (estado === 'creando_hoja') {
			proximoEstado = _fase4_CrearHojaYEncabezados(properties);
		} else if (estado === 'procesando') {
			proximoEstado = _fase5_ProcesarLoteDeDatos(properties);
		}

		if (proximoEstado && proximoEstado !== 'finalizado' && proximoEstado !== 'cancelado') {
			_limpiarActivadoresDeImportacion();
			ScriptApp.newTrigger('procesarLoteDeImportacionHaciaHoja').timeBased().after(3000).create();
		} else if (proximoEstado === 'finalizado') {
			_limpiarActivadoresDeImportacion();
			const nombreHoja = properties.getProperty('importHaciaHoja_nombreHoja');
			const total = properties.getProperty('importHaciaHoja_finalTotal') || 0;
			GmailApp.sendEmail(Session.getActiveUser().getEmail(), '✅ Importación de Contactos Finalizada', `Se han importado ${total} contactos a la hoja "${nombreHoja}".`);
			cancelarProcesoDeImportacion();
		}
	} catch (e) {
		Logger.log(`Error crítico en importación (fase ${estado}): ${e.stack}`);
		GmailApp.sendEmail(Session.getActiveUser().getEmail(), '❌ Error Crítico en Proceso de Importación', `El proceso se ha detenido por un error:\n\n${e.message}`);
		cancelarProcesoDeImportacion();
	}
}

function _fase1_RecolectarIds(properties) {
	Logger.log("IMPORTHOJA - FASE 1: Recolectando IDs iniciales...");
	const opciones = JSON.parse(properties.getProperty('importHaciaHoja_opciones'));
	let resourceNames;

	if (!opciones.importarTodos && opciones.filtros.etiquetas && opciones.filtros.etiquetas.length > 0) {
		const groupResourceNames = new Set();
		opciones.filtros.etiquetas.forEach(groupName => {
			const group = _ejecutarConReintentos(() => People.ContactGroups.get(groupName, { maxMembers: 20000 }));
			if (group && group.memberResourceNames) {
				group.memberResourceNames.forEach(name => groupResourceNames.add(name));
			}
		});
		resourceNames = Array.from(groupResourceNames);
	} else {
		resourceNames = _getAllConnections('metadata').map(c => c.resourceName);
	}

	if (resourceNames.length === 0) {
		SpreadsheetApp.getUi().alert('No se encontraron contactos para los criterios iniciales.');
		return 'cancelado';
	}

	properties.setProperty('importHaciaHoja_contactosIds', JSON.stringify(resourceNames));
	properties.setProperty('importHaciaHoja_nombreHoja', opciones.nombreHoja);
	properties.setProperty('importHaciaHoja_descubrimiento_progreso', '0');
	properties.setProperty('importHaciaHoja_descubrimiento_campos', JSON.stringify([]));
	properties.setProperty('importHaciaHoja_estado', 'descubriendo_campos');
	Logger.log(`IMPORTHOJA - FASE 1: Completada. ${resourceNames.length} IDs recolectados. Pasando a Fase 2.`);
	return 'descubriendo_campos';
}

/**
 * [VERSIÓN FINAL CON MARCADORES ESTANDARIZADOS]
 * Fase 2: Genera los borradores reemplazando {{Email}} y {{Asunto}}.
 */
function _campana_fase2_generarBorradores(properties) {
	const LOTE = 20;
	const opciones = JSON.parse(properties.getProperty('campana_opciones'));
	const contactosData = JSON.parse(properties.getProperty('campana_contactosData'));
	const encabezados = JSON.parse(properties.getProperty('campana_encabezados'));

	let procesados = parseInt(properties.getProperty('campana_procesados') || '0');
	let errores = parseInt(properties.getProperty('campana_errores') || '0');
	const loteDeFilas = contactosData.slice(procesados, procesados + LOTE);

	if (loteDeFilas.length === 0) { return 'finalizado'; }

	let hojaDestino = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Borradores");
	if (!hojaDestino) {
		hojaDestino = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Borradores");
		hojaDestino.appendRow(['Enviar', 'Destinatario', 'Asunto', 'Cuerpo', 'Nombre', 'Apellido', 'Empresa', 'Posición', 'Etiquetas']);
	}

	const indices = {
		nombre: encabezados.findIndex(h => h.toLowerCase().trim() === 'first name'),
		apellido: encabezados.findIndex(h => h.toLowerCase().trim() === 'last name'),
		email: encabezados.findIndex(h => h.toLowerCase().trim() === 'email'),
		empresa: encabezados.findIndex(h => h.toLowerCase().trim() === 'empresa'),
		cargo: encabezados.findIndex(h => h.toLowerCase().trim() === 'cargo/posicion'),
		tipo: encabezados.findIndex(h => h.toLowerCase().trim() === 'tipo')
	};

	const nuevasFilas = [];

	loteDeFilas.forEach(fila => {
		const email = fila[indices.email];
		if (email && email.toString().includes('@')) {
			const { asunto, cuerpo } = generarTextoPersonalizado(fila, encabezados, opciones.palabrasClave);

			// Reemplaza TODOS los marcadores {{Email}} y {{Asunto}}
			let cuerpoFinal = cuerpo.replace(/{{Email}}/g, encodeURIComponent(email));
			cuerpoFinal = cuerpoFinal.replace(/{{Asunto}}/g, encodeURIComponent(asunto));

			const nombre = indices.nombre !== -1 ? fila[indices.nombre] : '';
			const apellido = indices.apellido !== -1 ? fila[indices.apellido] : '';
			const empresa = indices.empresa !== -1 ? fila[indices.empresa] : '';
			const posicion = indices.cargo !== -1 ? fila[indices.cargo] : '';
			const etiquetas = indices.tipo !== -1 ? fila[indices.tipo] : '';

			nuevasFilas.push([false, email, asunto, cuerpoFinal, nombre, apellido, empresa, posicion, etiquetas]);
		} else {
			errores++;
		}
	});

	if (nuevasFilas.length > 0) {
		const startRow = hojaDestino.getLastRow() + 1;
		const range = hojaDestino.getRange(startRow, 1, nuevasFilas.length, nuevasFilas[0].length);
		range.setValues(nuevasFilas);
		hojaDestino.getRange(startRow, 1, nuevasFilas.length, 1).insertCheckboxes();
	}

	procesados += loteDeFilas.length;
	properties.setProperty('campana_procesados', procesados.toString());
	properties.setProperty('campana_errores', errores.toString());

	if (procesados >= contactosData.length) { return 'finalizado'; }
	return 'generando_borradores';
}
function _fase3_FiltrarContactosEnLote(properties) {
	Logger.log("IMPORTHOJA - FASE 3: Filtrando contactos en lotes...");
	const LOTE_FILTRADO = 200;
	const opciones = JSON.parse(properties.getProperty('importHaciaHoja_opciones'));
	const contactosIds = JSON.parse(properties.getProperty('importHaciaHoja_contactosIds'));
	let progreso = parseInt(properties.getProperty('importHaciaHoja_filtrado_progreso'), 10);
	let idsFinales = JSON.parse(properties.getProperty('importHaciaHoja_contactosIdsFinales'));

	const idsDeLote = contactosIds.slice(progreso, progreso + LOTE_FILTRADO);

	if (idsDeLote.length === 0) {
		if (idsFinales.length === 0) {
			SpreadsheetApp.getUi().alert('Después de aplicar todos los filtros, no quedaron contactos para importar.');
			return 'cancelado';
		}
		properties.setProperty('importHaciaHoja_contactosIdsFinales', JSON.stringify(idsFinales));
		properties.setProperty('importHaciaHoja_estado', 'creando_hoja');
		Logger.log(`IMPORTHOJA - FASE 3: Completada. ${idsFinales.length} contactos pasaron el filtro. Pasando a Fase 4.`);
		return 'creando_hoja';
	}

	const response = _ejecutarConReintentos(() => People.People.getBatchGet({ resourceNames: idsDeLote, personFields: 'names,organizations,memberships,emailAddresses,urls' }));
	let contactosDetallados = (response.responses || []).map(r => r.person).filter(Boolean);

	contactosDetallados = contactosDetallados.filter(c => c.emailAddresses && c.emailAddresses.length > 0);
	if (!opciones.importarTodos) {
		contactosDetallados = _filterContacts(contactosDetallados, opciones.filtros);
	}

	const nuevosIdsValidos = contactosDetallados.map(c => c.resourceName);
	idsFinales = idsFinales.concat(nuevosIdsValidos);

	progreso += idsDeLote.length;
	properties.setProperty('importHaciaHoja_filtrado_progreso', progreso.toString());
	properties.setProperty('importHaciaHoja_contactosIdsFinales', JSON.stringify(idsFinales));
	Logger.log(`IMPORTHOJA - FASE 3: Progreso. Filtrados ${progreso} de ${contactosIds.length}.`);
	return 'filtrando_contactos';
}
function _fase4_CrearHojaYEncabezados(properties) {
	Logger.log('IMPORTHOJA - FASE 4: Creando hoja y encabezados...');
	const contactosIdsFinales = JSON.parse(properties.getProperty('importHaciaHoja_contactosIdsFinales'));

	const camposDinamicos = JSON.parse(properties.getProperty('importHaciaHoja_descubrimiento_campos'));
	const encabezadosFijos = MAPA_DE_CAMPOS_FIJOS.map(f => f.header);
	const encabezadosFinales = [...encabezadosFijos, ...camposDinamicos.sort()];

	const nombreHoja = properties.getProperty('importHaciaHoja_nombreHoja');
	const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
	let hoja = spreadsheet.getSheetByName(nombreHoja);
	if (hoja) { spreadsheet.deleteSheet(hoja); }
	hoja = spreadsheet.insertSheet(nombreHoja, 0);
	hoja.appendRow(encabezadosFinales);
	hoja.setFrozenRows(1);

	properties.setProperty('importHaciaHoja_encabezados', JSON.stringify(encabezadosFinales));
	properties.setProperty('importHaciaHoja_finalTotal', contactosIdsFinales.length.toString());
	properties.setProperty('importHaciaHoja_procesados', '0');
	properties.setProperty('importHaciaHoja_estado', 'procesando');
	Logger.log(`IMPORTHOJA - FASE 4: Completada. Hoja creada. Pasando a Fase 5 para ${contactosIdsFinales.length} contactos.`);
	return 'procesando';
}

function _fase5_ProcesarLoteDeDatos(properties) {
	Logger.log("IMPORTHOJA - FASE 5: Procesando lote de datos...");
	const LOTE_PROCESAMIENTO = 50;
	const nombreHoja = properties.getProperty('importHaciaHoja_nombreHoja');
	const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombreHoja);
	if (!hoja) throw new Error(`La hoja de destino ${nombreHoja} no fue encontrada.`);

	const encabezados = JSON.parse(properties.getProperty('importHaciaHoja_encabezados'));
	const contactosIds = JSON.parse(properties.getProperty('importHaciaHoja_contactosIdsFinales'));
	let procesados = parseInt(properties.getProperty('importHaciaHoja_procesados'), 10);

	const idsDeLote = contactosIds.slice(procesados, procesados + LOTE_PROCESAMIENTO);
	if (idsDeLote.length === 0) {
		Logger.log('IMPORTHOJA - FASE 5: Completada.');
		return 'finalizado';
	}

	const camposCompletos = 'names,nicknames,birthdays,genders,emailAddresses,phoneNumbers,addresses,organizations,relations,urls,biographies,memberships,userDefined';
	const response = _ejecutarConReintentos(() => People.People.getBatchGet({ resourceNames: idsDeLote, personFields: camposCompletos }));
	const allGroups = _getContactGroupsMap();

	const filas = (response.responses || []).map(res => {
		const contact = res.person;
		return encabezados.map(header => {
			const campoMapeado = MAPA_DE_CAMPOS_FIJOS.find(f => f.header === header);
			if (campoMapeado) {
				if (campoMapeado.processor) {
					const items = _get(contact, campoMapeado.path.split('[')[0]);
					return campoMapeado.processor(items, contact, allGroups);
				}
				return _get(contact, campoMapeado.path) || '';
			}
			const valor = contact[header];
			return Array.isArray(valor) ? valor.map(v => v.formattedValue || (typeof v === 'object' ? JSON.stringify(v) : v)).join('; ') : '';
		});
	});

	if (filas.length > 0) {
		hoja.getRange(procesados + 2, 1, filas.length, encabezados.length).setValues(filas);
	}

	procesados += filas.length;
	properties.setProperty('importHaciaHoja_procesados', procesados.toString());
	Logger.log(`IMPORTHOJA - FASE 5: Progreso. Importados ${procesados} de ${contactosIds.length}.`);

	return (procesados >= contactosIds.length) ? 'finalizado' : 'procesando';
}

function verificarEstadoImportacionHaciaHoja() {
	const properties = PropertiesService.getUserProperties();
	const estado = properties.getProperty('importHaciaHoja_estado');
	if (!estado || estado === 'cancelado' || estado === 'finalizado') {
		SpreadsheetApp.getUi().alert('Estado de la Importación', 'No hay ningún proceso de importación activo.', SpreadsheetApp.getUi().ButtonSet.OK);
		return;
	}

	let mensajeProgreso = `Fase actual: ${estado}\n`;
	const nombreHoja = properties.getProperty('importHaciaHoja_nombreHoja') || "Aún no definida";
	mensajeProgreso += `Hoja destino: "${nombreHoja}"\n`;

	if (estado === 'descubriendo_campos') {
		const progreso = properties.getProperty('importHaciaHoja_descubrimiento_progreso') || 0;
		const total = JSON.parse(properties.getProperty('importHaciaHoja_contactosIds') || '[]').length;
		mensajeProgreso += `Progreso: Analizando campos (${progreso} de ${total}).`;
	} else if (estado === 'filtrando_contactos') {
		const progreso = properties.getProperty('importHaciaHoja_filtrado_progreso') || 0;
		const total = JSON.parse(properties.getProperty('importHaciaHoja_contactosIds') || '[]').length;
		mensajeProgreso += `Progreso: Filtrando contactos (${progreso} de ${total}).`;
	} else if (estado === 'procesando') {
		const procesados = properties.getProperty('importHaciaHoja_procesados') || 0;
		const total = properties.getProperty('importHaciaHoja_finalTotal') || '??';
		mensajeProgreso += `Progreso: Escribiendo en hoja (${procesados} de ${total}).`;
	}
	SpreadsheetApp.getUi().alert('Estado de la Importación', mensajeProgreso, SpreadsheetApp.getUi().ButtonSet.OK);
}

function cancelarProcesoDeImportacion() {
	_limpiarActivadoresDeImportacion();
	const properties = PropertiesService.getUserProperties();
	const props_a_borrar = [
		'importHaciaHoja_opciones', 'importHaciaHoja_estado', 'importHaciaHoja_contactosIds',
		'importHaciaHoja_nombreHoja', 'importHaciaHoja_descubrimiento_progreso',
		'importHaciaHoja_descubrimiento_campos', 'importHaciaHoja_encabezados',
		'importHaciaHoja_contactosIdsFinales', 'importHaciaHoja_finalTotal', 'importHaciaHoja_procesados',
		'importHaciaHoja_filtrado_progreso' // <-- Propiedad nueva a limpiar
	];
	props_a_borrar.forEach(prop => properties.deleteProperty(prop));
	Logger.log('Proceso de importación cancelado y todas sus propiedades han sido limpiadas.');
}

function _limpiarActivadoresDeImportacion() {
	const allTriggers = ScriptApp.getProjectTriggers();
	for (const trigger of allTriggers) {
		if (trigger.getHandlerFunction() === 'procesarLoteDeImportacionHaciaHoja') {
			ScriptApp.deleteTrigger(trigger);
		}
	}
}

// =================================================================
// FUNCIÓN DE CONTEO OPTIMIZADA
// =================================================================

function contarContactosParaImportar(opciones) {
	const ui = SpreadsheetApp.getUi();
	const filtros = opciones.filtros;

	if (filtros.empresa || filtros.posicion) {
		const confirmacion = ui.alert('Advertencia de Rendimiento',
			'Ha ingresado un filtro de texto (Empresa o Cargo). Para calcular el total, el script debe revisar TODOS sus contactos, lo que puede tardar varios minutos.\n\n¿Desea continuar con el cálculo lento?',
			ui.ButtonSet.YES_NO);
		if (confirmacion !== ui.Button.YES) {
			return { total: 'Cancelado', error: null };
		}
		try {
			const todosLosContactos = _getAllConnections('names,emailAddresses,organizations,memberships');
			const contactosFiltrados = _filterContacts(todosLosContactos, filtros);
			return { total: contactosFiltrados.length, error: null };
		} catch (e) {
			return { total: 0, error: `Error en el conteo completo: ${e.message}` };
		}
	}

	if (filtros.etiquetas && filtros.etiquetas.length > 0) {
		try {
			const groupResourceNames = new Set();
			filtros.etiquetas.forEach(groupName => {
				const group = _ejecutarConReintentos(() => People.ContactGroups.get(groupName, { maxMembers: 20000 }));
				if (group && group.memberResourceNames) {
					group.memberResourceNames.forEach(name => groupResourceNames.add(name));
				}
			});
			return { total: groupResourceNames.size, error: null };
		} catch (e) {
			return { total: 0, error: `Error obteniendo miembros del grupo: ${e.message}` };
		}
	}

	try {
		const response = _ejecutarConReintentos(() => People.People.Connections.list('people/me', { pageSize: 1, personFields: 'metadata' }));
		return { total: response.totalPeople || 0, error: null };
	} catch (e) {
		return { total: 0, error: `Error contando total de contactos: ${e.message}` };
	}
}


// =================================================================
// MÓDULO 4: EXTRACCIÓN DE CONTACTOS DESDE GMAIL
// =================================================================

function iniciarProcesoDeExtraccion(esNuevaExtraccion) {
	const ui = SpreadsheetApp.getUi();
	const userEmail = Session.getActiveUser().getEmail();
	if (esNuevaExtraccion) {
		cancelarProcesoDeExtraccion();
		const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
		let sheet = spreadsheet.getSheetByName("Contactos Extraídos");
		if (sheet) {
			sheet.clear();
			const newHeader = ['First Name', 'Last Name', 'Empresa', 'WEB', 'Email', 'Notes', 'Tipo', 'Fecha de Correo', 'Enlace a Correo'];
			sheet.appendRow(newHeader);
			sheet.setFrozenRows(1);
		}
		ui.alert(`✅ Nueva extracción iniciada para ${userEmail}`, 'Se ha limpiado el progreso anterior y se escanearán todos los correos.', ui.ButtonSet.OK);
	} else {
		const properties = PropertiesService.getUserProperties();
		const startIndex = properties.getProperty('start_index');
		if (!startIndex || parseInt(startIndex) === 0) {
			const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
			const sheet = spreadsheet.getSheetByName("Contactos Extraídos");
			if (!sheet || sheet.getLastRow() < 2) {
				const response = ui.alert('No se encontró un proceso anterior para continuar.', '¿Desea iniciar una nueva extracción desde cero?', ui.ButtonSet.YES_NO);
				if (response == ui.Button.YES) { iniciarProcesoDeExtraccion(true); }
				return;
			}
			const ultimoProgresoEstimado = sheet.getLastRow() - 1;
			const response = ui.alert('Recuperación de Proceso',
				`El progreso guardado se perdió, pero la hoja ya contiene ${ultimoProgresoEstimado} contactos.\n\nEl script re-escaneará los correos para encontrar el punto de continuación. No se agregarán duplicados, pero puede tardar en mostrar resultados nuevos.\n\n¿Desea intentar la recuperación?`,
				ui.ButtonSet.YES_NO);
			if (response == ui.Button.NO) { return; }
		}
		ui.alert(`▶️ Reanudando extracción para ${userEmail}`, `El proceso continuará desde el último punto guardado o recuperado.`, ui.ButtonSet.OK);
	}
	_limpiarActivadoresDeExtraccion();
	ScriptApp.newTrigger('procesoDeExtraccionPrincipal').timeBased().everyMinutes(10).create();
	procesoDeExtraccionPrincipal();
}

function verificarEstadoExtraccion() {
	const properties = PropertiesService.getUserProperties();
	const progreso = properties.getProperty('hilos_procesados');
	const ui = SpreadsheetApp.getUi();
	if (progreso) {
		ui.alert('Estado de la Extracción', `✅ Proceso activo.\n\nSe han procesado ${progreso} hilos de correo hasta el momento.`, ui.ButtonSet.OK);
	} else {
		const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
		const sheet = spreadsheet.getSheetByName("Contactos Extraídos");
		if (!sheet || sheet.getLastRow() < 2) {
			ui.alert('Estado de la Extracción', 'ℹ️ El proceso no está en ejecución y la hoja de contactos está vacía.', ui.ButtonSet.OK);
		} else {
			const lastRow = sheet.getLastRow();
			const contactCount = lastRow - 1;
			const lastDate = sheet.getRange(lastRow, 8).getDisplayValue();
			ui.alert('Estado de la Extracción', `ℹ️ El proceso está detenido.\n\nTu hoja ya contiene ${contactCount} contactos.\nEl último contacto agregado es del: ${lastDate}.\n\nPara seguir, selecciona "Continuar Proceso" desde el menú.`, ui.ButtonSet.OK);
		}
	}
}

function procesoDeExtraccionPrincipal() {
	const startTime = new Date().getTime();
	const properties = PropertiesService.getUserProperties();
	const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
	let sheet = spreadsheet.getSheetByName("Contactos Extraídos");
	const newHeader = ['First Name', 'Last Name', 'Empresa', 'WEB', 'Email', 'Notes', 'Tipo', 'Fecha de Correo', 'Enlace a Correo'];
	if (!sheet) {
		sheet = spreadsheet.insertSheet("Contactos Extraídos");
		sheet.appendRow(newHeader);
	}

	const existingEmails = new Set();
	if (sheet.getLastRow() > 1) {
		const totalRows = sheet.getLastRow();
		const BATCH_SIZE = 1000;
		for (let startRow = 2; startRow <= totalRows; startRow += BATCH_SIZE) {
			const endRow = Math.min(startRow + BATCH_SIZE - 1, totalRows);
			const emailColumn = sheet.getRange(startRow, 5, endRow - startRow + 1, 1).getValues();
			emailColumn.forEach(row => {
				if (row[0] && typeof row[0] === 'string' && row[0].includes('@')) {
					existingEmails.add(row[0].toLowerCase().trim());
				}
			});
			if (totalRows > 5000) {
				Logger.log(`Leyendo emails existentes: ${Math.min(endRow, totalRows)} de ${totalRows} filas procesadas`);
			}
		}
	}

	Logger.log(`Se encontraron ${existingEmails.size} correos ya existentes en la hoja.`);
	let start = parseInt(properties.getProperty('start_index') || '0');
	if (start === 0 && existingEmails.size > 0) {
		const estimacionHilos = Math.max(0, Math.floor(existingEmails.size * 10));
		start = estimacionHilos;
		properties.setProperty('start_index', start.toString());
		Logger.log(`Estimación de continuación: comenzando desde el hilo ${start} (basado en ${existingEmails.size} contactos existentes)`);
	}

	const processedInThisRun = new Set();
	let threads;
	let nuevosContactosEncontrados = 0;
	let lotesSinNuevosContactos = 0;
	do {
		const currentTime = new Date().getTime();
		if (currentTime - startTime > MAX_RUNTIME) {
			properties.setProperty('start_index', start.toString());
			Logger.log(`Tiempo agotado. Progreso guardado. Reiniciando desde el hilo ${start}.`);
			return;
		}

		threads = GmailApp.getInboxThreads(start, 50);
		if (threads.length === 0) {
			const totalRows = sheet.getLastRow() > 0 ? sheet.getLastRow() - 1 : 0;
			let resumenSheet = spreadsheet.getSheetByName("Resumen");
			if (!resumenSheet) { resumenSheet = spreadsheet.insertSheet("Resumen", 0); }
			resumenSheet.clear();
			resumenSheet.getRange("A1").setValue(`✅ Proceso Finalizado. Total de contactos en la lista: ${totalRows}.`);
			cancelarProcesoDeExtraccion();
			return;
		}

		let contactosEnEsteLote = 0;
		for (const thread of threads) {
			const threadLink = thread.getPermalink();
			const messages = thread.getMessages();
			for (const message of messages) {
				const messageDate = message.getDate();
				const foundContacts = parseContactsFromHeader(message.getFrom()).concat(parseContactsFromHeader(message.getTo())).concat(parseContactsFromHeader(message.getCc()));
				for (const contact of foundContacts) {
					const emailLower = contact.email.toLowerCase().trim();
					if (!existingEmails.has(emailLower) && !processedInThisRun.has(emailLower)) {
						sheet.appendRow([contact.firstName, contact.lastName, contact.company, contact.web, contact.email, contact.notes, contact.type, messageDate, threadLink]);
						processedInThisRun.add(emailLower);
						existingEmails.add(emailLower);
						nuevosContactosEncontrados++;
						contactosEnEsteLote++;
					}
				}
			}
		}

		start += threads.length;
		properties.setProperty('start_index', start.toString());
		properties.setProperty('hilos_procesados', start.toString());

		Logger.log(`Procesados hasta el hilo ${start}... Nuevos contactos en esta ejecución: ${nuevosContactosEncontrados}. Progreso guardado.`);
		if (contactosEnEsteLote === 0) {
			lotesSinNuevosContactos++;
			if (lotesSinNuevosContactos >= 5 && start > 1000) {
				Logger.log(`No se encontraron nuevos contactos en ${lotesSinNuevosContactos} lotes consecutivos. Considerando finalizar el proceso.`);
				const totalRows = sheet.getLastRow() > 0 ? sheet.getLastRow() - 1 : 0;
				let resumenSheet = spreadsheet.getSheetByName("Resumen");
				if (!resumenSheet) { resumenSheet = spreadsheet.insertSheet("Resumen", 0); }
				resumenSheet.clear();
				resumenSheet.getRange("A1").setValue(`✅ Proceso Finalizado. Total de contactos en la lista: ${totalRows}.`);
				cancelarProcesoDeExtraccion();
				return;
			}
		} else {
			lotesSinNuevosContactos = 0;
		}

	} while (threads.length > 0);
	const finalRowCount = sheet.getLastRow() > 0 ? sheet.getLastRow() - 1 : 0;
	let resumenSheet = spreadsheet.getSheetByName("Resumen");
	if (!resumenSheet) { resumenSheet = spreadsheet.insertSheet("Resumen", 0); }
	resumenSheet.clear();
	resumenSheet.getRange("A1").setValue(`✅ Proceso Finalizado. Total de contactos en la lista: ${finalRowCount}.`);
	cancelarProcesoDeExtraccion();
}

function parseContactsFromHeader(header) {
	if (!header) return [];
	const contacts = [];
	const individuals = header.split(',');
	for (const person of individuals) {
		let explicitName = '', email = '';
		const matchWithAngleBrackets = person.match(/(.*)<(.*)>/);
		if (matchWithAngleBrackets) {
			explicitName = matchWithAngleBrackets[1].replace(/"/g, '').trim();
			email = matchWithAngleBrackets[2].trim();
		} else {
			email = person.trim();
		}
		const emailRegex = /[\w\.\-+%]+@[\w\.\-]+\.\w+/;
		if (!emailRegex.test(email)) continue;
		email = email.toLowerCase();
		const domain = email.split('@')[1] || '';
		if (DOMAINS_A_ELIMINAR.has(domain)) continue;
		let firstName = '', lastName = '', company = '', web = '', type = '';
		if (PERSONAL_DOMAINS.has(domain)) {
			company = 'Personal'; web = ''; type = 'Personal';
		} else if (domain) {
			let companyNameBase = domain.split('.')[0];
			companyNameBase = companyNameBase.replace(COMPANY_SUFFIXES_TO_REMOVE, '');
			company = capitalizeWords(companyNameBase);
			web = domain; type = company;
		}
		if (explicitName) {
			const nameParts = explicitName.split(' ').filter(part => part.length > 0);
			firstName = capitalizeWords(nameParts.shift() || '');
			lastName = capitalizeWords(nameParts.join(' '));
		} else {
			const localPart = email.split('@')[0];
			if (localPart.includes('.') || localPart.includes('_')) {
				const separator = localPart.includes('.') ? '.' : '_';
				const nameParts = localPart.split(separator);
				firstName = capitalizeWords(nameParts[0]);
				lastName = capitalizeWords(nameParts.slice(1).join(' '));
			} else {
				firstName = 'No Definido'; lastName = '';
			}
		}
		const firstNameLower = firstName.toLowerCase();
		if (firstName.includes('@') || INVALID_NAME_KEYWORDS.has(firstNameLower) || (company && company !== 'Personal' && firstNameLower === company.toLowerCase()) || firstName.length <= 2) {
			firstName = 'No Definido';
			lastName = '';
		}
		let notes = '';
		if (['noreply', 'no-reply', 'noresponder', 'info@', 'contacto@'].some(kw => email.includes(kw))) {
			notes = 'Correo Automático / Genérico';
		}
		contacts.push({ firstName, lastName, company, web, email, notes, type });
	}
	return contacts;
}

function iniciarLimpiezaDeDuplicados() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const allSheets = ss.getSheets();
	const sheetNames = allSheets.map(s => s.getName());
	if (sheetNames.length === 0) {
		SpreadsheetApp.getUi().alert('No se encontraron hojas en este documento.');
		return;
	}

	const template = HtmlService.createTemplateFromFile('SeleccionarHojaLimpieza');
	template.sheetNames = sheetNames;
	const html = template.evaluate().setWidth(400).setHeight(200);
	SpreadsheetApp.getUi().showModalDialog(html, 'Seleccionar Hoja para Limpiar');
}

/**
 * [VERSIÓN MEJORADA]
 * Ejecuta un proceso de limpieza avanzado que incluye:
 * 1. Reemplazo de texto según el mapa en la hoja "Configuracion".
 * 2. Eliminación de filas que contengan palabras clave de la hoja "Configuracion".
 * 3. Eliminación de duplicados por email, conservando la fila más completa.
 */
function ejecutarLimpiezaDeDuplicados(sheetName) {
	const ui = SpreadsheetApp.getUi();
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const sheet = ss.getSheetByName(sheetName);
	const HOJA_ELIMINADOS_DESTINO = "Duplicados Eliminados";

	if (!sheet || sheet.getLastRow() < 2) {
		ui.alert(`Error: La hoja '${sheetName}' está vacía o no existe.`);
		return;
	}
	ui.alert('Iniciando proceso de limpieza avanzado...', 'Este proceso puede tardar varios minutos. Se te notificará al finalizar.', ui.ButtonSet.OK);

	// --- PASO 1: LEER CONFIGURACIÓN ---
	const configSheet = ss.getSheetByName("Configuracion");
	let palabrasParaEliminar = new Set();
	let mapaDeReemplazo = new Map();
	if (configSheet) {
		const configData = configSheet.getRange("E2:G" + configSheet.getLastRow()).getValues();
		configData.forEach(row => {
			// Mapa de Reemplazo (Columnas E y F)
			if (row[0]) mapaDeReemplazo.set(row[0].toString().toLowerCase(), row[1]);
			// Palabras para Eliminar (Columna G)
			if (row[2]) palabrasParaEliminar.add(row[2].toString().toLowerCase());
		});
	}

	// --- PASO 2: LEER DATOS Y APLICAR REEMPLAZOS ---
	const dataRange = sheet.getDataRange();
	let data = dataRange.getValues();
	const header = data.shift();
	const emailIndex = header.findIndex(h => h.toString().toLowerCase().includes('email'));
	if (emailIndex === -1) {
		ui.alert("Error: No se encontró una columna de 'Email'.");
		return;
	}

	if (mapaDeReemplazo.size > 0) {
		data = data.map(row => row.map(cell => {
			const cellLower = cell.toString().toLowerCase();
			return mapaDeReemplazo.has(cellLower) ? mapaDeReemplazo.get(cellLower) : cell;
		}));
	}

	// --- PASO 3: FILTRAR POR PALABRAS CLAVE Y CORREOS INVÁLIDOS ---
	let filasValidas = [];
	const filasParaEliminar = [];
	const emailFormatRegex = /[\w\.\-+%]+@[\w\.\-]+\.\w+/;

	data.forEach(row => {
		const email = row[emailIndex]?.toString().trim().toLowerCase() || '';
		const contienePalabraClave = palabrasParaEliminar.size > 0 && row.some(cell => palabrasParaEliminar.has(cell.toString().toLowerCase()));

		if (!email || !emailFormatRegex.test(email) || contienePalabraClave) {
			filasParaEliminar.push(row);
		} else {
			filasValidas.push(row);
		}
	});

	// --- PASO 4: PROCESAR DUPLICADOS POR EMAIL ---
	const emailMap = new Map();
	filasValidas.forEach(row => {
		const email = row[emailIndex].toString().trim().toLowerCase();
		const score = row.filter(String).length; // Prioriza la fila con más datos
		if (!emailMap.has(email) || score > emailMap.get(email).score) {
			if (emailMap.has(email)) {
				filasParaEliminar.push(emailMap.get(email).row);
			}
			emailMap.set(email, { row, score });
		} else {
			filasParaEliminar.push(row);
		}
	});

	// --- PASO 5: ESCRIBIR RESULTADOS ---
	const filasUnicas = Array.from(emailMap.values()).map(entry => entry.row);
	let eliminadosSheet = ss.getSheetByName(HOJA_ELIMINADOS_DESTINO);
	if (!eliminadosSheet) {
		eliminadosSheet = ss.insertSheet(HOJA_ELIMINADOS_DESTINO);
	}
	eliminadosSheet.clear();
	eliminadosSheet.appendRow(header);
	if (filasParaEliminar.length > 0) {
		eliminadosSheet.getRange(2, 1, filasParaEliminar.length, header.length).setValues(filasParaEliminar);
	}

	sheet.clearContents();
	sheet.getRange(1, 1, 1, header.length).setValues([header]);
	if (filasUnicas.length > 0) {
		sheet.getRange(2, 1, filasUnicas.length, header.length).setValues(filasUnicas);
	}

	ui.alert(`Limpieza Avanzada Completada`, `Se mantuvieron ${filasUnicas.length} filas únicas.\nSe movieron ${filasParaEliminar.length} filas a la hoja '${HOJA_ELIMINADOS_DESTINO}'.`, ui.ButtonSet.OK);
}

function crearTablaDinamicaResumen() {
	const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
	const sourceSheet = spreadsheet.getSheetByName("Contactos Extraídos");
	const ui = SpreadsheetApp.getUi();
	if (!sourceSheet || sourceSheet.getLastRow() < 2) {
		ui.alert('No hay datos para generar un resumen.'); return;
	}
	let pivotSheet = spreadsheet.getSheetByName("Resumen por Empresa");
	if (pivotSheet) { spreadsheet.deleteSheet(pivotSheet); }
	pivotSheet = spreadsheet.insertSheet("Resumen por Empresa");
	const sourceRange = sourceSheet.getDataRange();
	const empresaColumnIndex = 3;
	const emailColumnIndex = 5;
	try {
		const pivotTable = pivotSheet.getRange('A1').createPivotTable(sourceRange);
		pivotTable.addRowGroup(empresaColumnIndex).sortAscending();
		pivotTable.addPivotValue(emailColumnIndex, SpreadsheetApp.PivotTableSummarizeFunction.COUNTA).setDisplayName('Cantidad de Contactos');
		ui.alert('✅ Se ha creado la hoja "Resumen por Empresa".');
	} catch (e) {
		Logger.log(e);
		ui.alert('Ocurrió un error al crear la tabla dinámica: ' + e.message);
	}
}

function eliminarDominiosInternos() {
	const ui = SpreadsheetApp.getUi();
	const response = ui.alert('Confirmación', '¿Seguro que quieres eliminar permanentemente los contactos de dominios internos?', ui.ButtonSet.YES_NO);
	if (response == ui.Button.NO) { return; }
	const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Contactos Extraídos");
	if (!sheet || sheet.getLastRow() < 2) { ui.alert('No hay datos para procesar.'); return; }
	const data = sheet.getDataRange().getValues();
	const rowsToDelete = [];
	const emailColumnIndex = 4;
	for (let i = 1; i < data.length; i++) {
		const email = data[i][emailColumnIndex] || '';
		const domain = email.split('@')[1] || '';
		if (DOMAINS_A_ELIMINAR.has(domain)) {
			rowsToDelete.push(i + 1);
		}
	}
	for (let i = rowsToDelete.length - 1; i >= 0; i--) {
		sheet.deleteRow(rowsToDelete[i]);
	}
	ui.alert(`Limpieza completada. Se eliminaron ${rowsToDelete.length} filas.`);
}

/**
 * [VERSIÓN CORREGIDA]
 * Cancela el proceso de extracción, mostrando una alerta solo si se le indica.
 * @param {boolean} mostrarAlerta - Si es true, muestra un cartel de confirmación.
 */
function cancelarProcesoDeExtraccion(mostrarAlerta = true) {
	_limpiarActivadoresDeExtraccion();
	const userProperties = PropertiesService.getUserProperties();
	userProperties.deleteProperty('start_index');
	userProperties.deleteProperty('hilos_procesados');
	Logger.log('Activadores y propiedades del proceso de extracción han sido limpiados.');

	// Solo muestra la alerta si la función fue llamada con ese propósito
	if (mostrarAlerta) {
		SpreadsheetApp.getUi().alert('El proceso de extracción ha sido cancelado.');
	}
}

function _limpiarActivadoresDeExtraccion() {
	const allTriggers = ScriptApp.getProjectTriggers();
	for (const trigger of allTriggers) {
		if (trigger.getHandlerFunction() === 'procesoDeExtraccionPrincipal') {
			ScriptApp.deleteTrigger(trigger);
		}
	}
}

// =================================================================
// MÓDULO 5: SINCRONIZACIÓN ASÍNCRONA (HOJA -> GMAIL) - VERSIÓN OPTIMIZADA
// =================================================================

function ejecutarImportacionDesdeHoja(sheetName) {
	const ui = SpreadsheetApp.getUi();
	const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
	if (!sheet || sheet.getLastRow() < 2) {
		ui.alert('Error', `La hoja "${sheetName}" está vacía o no existe.`, ui.ButtonSet.OK);
		return;
	}

	const data = sheet.getDataRange().getValues();
	const headers = data[0];
	const rows = data.slice(1);

	const emailIndex = headers.findIndex(h => h.toString().toLowerCase().includes('email'));
	const firstNameIndex = headers.findIndex(h => h.toString().toLowerCase().includes('first name') || h.toString().toLowerCase().includes('nombre'));
	const lastNameIndex = headers.findIndex(h => h.toString().toLowerCase().includes('last name') || h.toString().toLowerCase().includes('apellido'));
	const companyIndex = headers.findIndex(h => h.toString().toLowerCase().includes('empresa') || h.toString().toLowerCase().includes('company'));
	const positionIndex = headers.findIndex(h => h.toString().toLowerCase().includes('cargo') || h.toString().toLowerCase().includes('position') || h.toString().toLowerCase().includes('posicion'));
	const phoneIndex = headers.findIndex(h => h.toString().toLowerCase().includes('teléfono') || h.toString().toLowerCase().includes('telefono') || h.toString().toLowerCase().includes('phone'));
	const webIndex = headers.findIndex(h => h.toString().toLowerCase().includes('web') || h.toString().toLowerCase().includes('url'));
	const notesIndex = headers.findIndex(h => h.toString().toLowerCase().includes('notes') || h.toString().toLowerCase().includes('notas'));

	if (emailIndex === -1) {
		ui.alert('Error', 'No se encontró una columna de email en la hoja seleccionada.', ui.ButtonSet.OK);
		return;
	}

	const validRows = rows.filter(row => {
		const email = row[emailIndex];
		return email && typeof email === 'string' && email.includes('@');
	});
	if (validRows.length === 0) {
		ui.alert('Error', 'No se encontraron filas con emails válidos para sincronizar.', ui.ButtonSet.OK);
		return;
	}

	cancelarProcesoSincronizacion();
	const properties = PropertiesService.getUserProperties();
	properties.setProperty('sync_opciones', JSON.stringify({
		sheetName: sheetName,
		headers: headers,
		emailIndex: emailIndex,
		firstNameIndex: firstNameIndex,
		lastNameIndex: lastNameIndex,
		companyIndex: companyIndex,
		positionIndex: positionIndex,
		phoneIndex: phoneIndex,
		webIndex: webIndex,
		notesIndex: notesIndex,
		totalRows: validRows.length
	}));
	properties.setProperty('sync_estado', 'iniciando');
	properties.setProperty('sync_procesados', '0');
	properties.setProperty('sync_errores', '0');
	ui.alert('✅ Sincronización Iniciada',
		`Se procesarán ${validRows.length} contactos desde la hoja "${sheetName}".\n\nEl proceso se ejecutará en segundo plano. Puedes verificar el estado desde el menú.`,
		ui.ButtonSet.OK);
	ScriptApp.newTrigger('procesarLoteDeSincronizacion').timeBased().after(1000).create();
}

function procesarLoteDeSincronizacion() {
	const properties = PropertiesService.getUserProperties();
	const estado = properties.getProperty('sync_estado');
	if (estado === 'cancelado' || estado === 'finalizado') {
		_limpiarActivadoresDeSincronizacion();
		return;
	}

	try {
		let proximoEstado = estado;
		if (estado === 'iniciando') {
			proximoEstado = _sync_fase1_prepararDatos(properties);
		} else if (estado === 'sincronizando') {
			proximoEstado = _sync_fase2_procesarLote(properties);
		}

		if (proximoEstado && proximoEstado !== 'finalizado' && proximoEstado !== 'cancelado') {
			_limpiarActivadoresDeSincronizacion();
			ScriptApp.newTrigger('procesarLoteDeSincronizacion').timeBased().after(3000).create();
		} else if (proximoEstado === 'finalizado') {
			_limpiarActivadoresDeSincronizacion();
			const total = properties.getProperty('sync_procesados') || 0;
			const errores = properties.getProperty('sync_errores') || 0;
			const sheetName = JSON.parse(properties.getProperty('sync_opciones')).sheetName;
			GmailApp.sendEmail(Session.getActiveUser().getEmail(), '✅ Sincronización Finalizada',
				`Proceso completado.\n\nSe han sincronizado ${total} contactos desde la hoja "${sheetName}".\nHubo ${errores} errores.`);
		}
	} catch (e) {
		const userEmail = Session.getActiveUser().getEmail();
		GmailApp.sendEmail(userEmail, 'Error en Sincronización', `El proceso falló en la fase '${estado}' con el error: ${e.message}`);
		cancelarProcesoSincronizacion();
	}
}

function _sync_fase1_prepararDatos(properties) {
	Logger.log('Fase 1 (Sync): Preparando datos y obteniendo emails existentes...');
	const opciones = JSON.parse(properties.getProperty('sync_opciones'));
	const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(opciones.sheetName);
	const data = sheet.getDataRange().getValues();
	const rows = data.slice(1);

	const validRows = rows.filter(row => {
		const email = row[opciones.emailIndex];
		return email && typeof email === 'string' && email.includes('@');
	});
	if (validRows.length === 0) {
		SpreadsheetApp.getUi().alert('No se encontraron filas con emails válidos para sincronizar.');
		return 'cancelado';
	}

	const allConnections = _getAllConnections('emailAddresses');
	const existingEmails = new Set();
	allConnections.forEach(contact => {
		if (contact.emailAddresses) {
			contact.emailAddresses.forEach(email => {
				existingEmails.add(email.value.toLowerCase().trim());
			});
		}
	});

	properties.setProperty('sync_datos', JSON.stringify(validRows));
	properties.setProperty('sync_existingEmails', JSON.stringify(Array.from(existingEmails)));
	properties.setProperty('sync_total', validRows.length.toString());
	properties.setProperty('sync_procesados', '0');
	properties.setProperty('sync_errores', '0');
	properties.setProperty('sync_estado', 'sincronizando');
	Logger.log(`Fase 1 (Sync) completada. ${validRows.length} filas válidas preparadas. ${existingEmails.size} emails existentes cacheados.`);
	return 'sincronizando';
}

function _sync_fase2_procesarLote(properties) {
	const LOTE = 20;
	const opciones = JSON.parse(properties.getProperty('sync_opciones'));
	const datos = JSON.parse(properties.getProperty('sync_datos'));
	let procesados = parseInt(properties.getProperty('sync_procesados') || '0');
	let errores = parseInt(properties.getProperty('sync_errores') || '0');
	const filasDeLote = datos.slice(procesados, procesados + LOTE);
	if (filasDeLote.length === 0) {
		return 'finalizado';
	}

	Logger.log(`Procesando lote de sincronización: ${procesados + filasDeLote.length} de ${datos.length}...`);

	const existingEmails = new Set(JSON.parse(properties.getProperty('sync_existingEmails') || '[]'));

	const contactosNuevos = filasDeLote.filter(fila => {
		const email = fila[opciones.emailIndex].toLowerCase().trim();
		return !existingEmails.has(email);
	});
	Logger.log(`De ${filasDeLote.length} contactos en el lote, ${contactosNuevos.length} son nuevos.`);

	if (contactosNuevos.length > 0) {
		const contactDataArray = contactosNuevos.map(fila => {
			const email = fila[opciones.emailIndex];
			const firstName = opciones.firstNameIndex >= 0 ? fila[opciones.firstNameIndex] : '';
			const lastName = opciones.lastNameIndex >= 0 ? fila[opciones.lastNameIndex] : '';
			const company = opciones.companyIndex >= 0 ? fila[opciones.companyIndex] : '';
			const position = opciones.positionIndex >= 0 ? fila[opciones.positionIndex] : '';
			const phone = opciones.phoneIndex >= 0 ? fila[opciones.phoneIndex] : '';
			const web = opciones.webIndex >= 0 ? fila[opciones.webIndex] : '';
			const notes = opciones.notesIndex >= 0 ? fila[opciones.notesIndex] : '';

			const contactData = {
				emailAddresses: [{ value: email }],
				names: [{ givenName: firstName || '', familyName: lastName || '' }],
				organizations: [{ name: company || '', title: position || '' }]
			};
			if (phone) contactData.phoneNumbers = [{ value: phone }];
			if (web) contactData.urls = [{ value: web, type: 'work' }];
			if (notes) contactData.biographies = [{ value: notes }];
			return contactData;
		});

		try {
			const batchRequest = {
				requests: contactDataArray.map(contactData => ({ createContact: { contact: contactData } }))
			};
			const batchResponse = _ejecutarConReintentos(() => People.People.batchCreateContacts(batchRequest));

			const exitosos = (batchResponse.createdPeople || []).length;
			const fallidos = contactDataArray.length - exitosos;

			procesados += exitosos;
			errores += fallidos;

			Logger.log(`Batch completado: ${exitosos} creados, ${fallidos} fallidos`);
		} catch (e) {
			Logger.log(`Error en batch create: ${e.message}. Reintentando uno por uno.`);
			for (const contactData of contactDataArray) {
				try {
					_ejecutarConReintentos(() => People.People.createContact(contactData));
					procesados++;
				} catch (individualError) {
					Logger.log(`Error creando contacto individual: ${individualError.message}`);
					errores++;
				}
			}
		}
	}
	const yaExistian = filasDeLote.length - contactosNuevos.length;
	procesados += yaExistian;

	properties.setProperty('sync_procesados', procesados.toString());
	properties.setProperty('sync_errores', errores.toString());
	if (procesados >= datos.length) {
		return 'finalizado';
	}
	return 'sincronizando';
}

// =================================================================
// FUNCIONES AUXILIARES Y COMUNES
// =================================================================

function solicitarPermisos() {
	try {
		const email = Session.getActiveUser().getEmail();
		SpreadsheetApp.getUi().alert('Autorización Requerida', 'Si no apareció una ventana emergente de Google para solicitar permisos, es posible que ya estén todos concedidos. Tu correo es: ' + email, SpreadsheetApp.getUi().ButtonSet.OK);
	} catch (e) {
		SpreadsheetApp.getUi().alert('Error de Permisos', 'Aún faltan permisos por autorizar. Por favor, ejecuta otra función para activar la solicitud de permisos de Google.', SpreadsheetApp.getUi().ButtonSet.OK);
	}
}

function getActiveUserEmail() { return Session.getActiveUser().getEmail(); }

function _ejecutarConReintentos(funcionAEjecutar, maxRetries = 3) {
	let retryCount = 0;
	while (retryCount < maxRetries) {
		try {
			return funcionAEjecutar();
		} catch (e) {
			Logger.log(`Error en la API (intento ${retryCount + 1}/${maxRetries}): ${e.message}`);
			retryCount++;
			if (retryCount >= maxRetries) {
				throw new Error(`La operación falló después de ${maxRetries} intentos. Último error: ${e.message}`);
			}
			Utilities.sleep(Math.pow(2, retryCount) * 1000 + Math.random() * 1000);
		}
	}
}

function _getAllConnections(personFields) {
	const cacheKey = `connections_v2_${personFields}`;
	const cache = CacheService.getScriptCache();
	const cachedData = cache.get(cacheKey);
	if (cachedData) {
		try { return JSON.parse(cachedData); } catch (e) { /* Fall through */ }
	}

	let allConnections = [];
	let pageToken = null;
	do {
		const response = _ejecutarConReintentos(() => People.People.Connections.list('people/me', {
			pageSize: 1000,
			pageToken: pageToken,
			personFields: personFields,
			sortOrder: 'FIRST_NAME_ASCENDING'
		}));
		if (response && response.connections) {
			allConnections = allConnections.concat(response.connections);
		}
		pageToken = response ? response.nextPageToken : null;
	} while (pageToken);

	try {
		cache.put(cacheKey, JSON.stringify(allConnections), 300);
	} catch (e) {
		Logger.log('Error caching connections data (tamaño excedido?)');
	}

	return allConnections;
}

function _get(obj, path, defaultValue = null) {
	const travel = regexp => String.prototype.split.call(path, regexp).filter(Boolean).reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj);
	const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
	return result === undefined || result === obj ? defaultValue : result;
}
/**
 * Cuenta los contactos en la hoja "TODOS" basándose en los filtros de la interfaz.
 * @param {object} filtros Un objeto con los criterios de la barra lateral.
 * @returns {number | string} El número de contactos o un mensaje de error.
 */
/**
 * [VERSIÓN CORREGIDA Y COMPLETA]
 * Cuenta los contactos en la hoja "TODOS" basándose en los filtros de la interfaz.
 * @param {object} filtros Un objeto con los criterios de la barra lateral.
 * @returns {number | string} El número de contactos que coinciden o un mensaje de error.
 */
function countContactsWithFilters(filtros) {
	try {
		const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
		const hojaTodos = spreadsheet.getSheetByName("TODOS");

		if (!hojaTodos) {
			return "Error: Hoja 'TODOS' no encontrada.";
		}

		const datos = hojaTodos.getDataRange().getValues();
		if (datos.length < 2) {
			return 0; // Hoja vacía o solo con encabezados
		}
		const encabezados = datos.shift();

		// Mapeo de columnas
		const indices = {
			empresa: encabezados.findIndex(h => h.toLowerCase().trim() === 'empresa'),
			email: encabezados.findIndex(h => h.toLowerCase().trim() === 'email'),
			tipo: encabezados.findIndex(h => h.toLowerCase().trim() === 'tipo'),
			cargo: encabezados.findIndex(h => h.toLowerCase().trim() === 'cargo/posicion')
		};

		if (indices.email === -1) {
			return "Error: Falta la columna 'Email'.";
		}

		const contactosFiltrados = datos.filter(fila => {
			// Si la fila está completamente vacía, no la contamos.
			if (fila.every(celda => celda === "")) return false;

			let cumple = true;

			// 1. Filtrar por Etiquetas (columna "Tipo") - LÓGICA "O"
			if (filtros.etiquetas && filtros.etiquetas.length > 0) {
				if (indices.tipo === -1) {
					cumple = false;
				} else {
					const etiquetasFila = (fila[indices.tipo] || '').split(',').map(e => e.trim().toLowerCase());
					const etiquetasFiltro = filtros.etiquetas.map(e => e.toLowerCase());

					// --- CORRECCIÓN CLAVE ---
					// Se usa .some() para que cumpla si tiene AL MENOS UNA de las etiquetas (Lógica "O")
					if (!etiquetasFiltro.some(etiqueta => etiquetasFila.includes(etiqueta))) {
						cumple = false;
					}
				}
			}

			// 2. Filtrar por Empresa
			if (cumple && filtros.empresas && filtros.empresas.length > 0) {
				if (indices.empresa === -1) {
					cumple = false;
				} else {
					const empresaFila = (fila[indices.empresa] || '').trim().toLowerCase();
					const empresasFiltro = filtros.empresas.map(e => e.toLowerCase());
					if (!empresasFiltro.includes(empresaFila)) {
						cumple = false;
					}
				}
			}

			// 3. Filtrar por Cargo/Posición
			if (cumple && filtros.posicion) {
				if (indices.cargo === -1) {
					cumple = false;
				} else {
					const posicionFila = (fila[indices.cargo] || '').toLowerCase();
					if (!posicionFila.includes(filtros.posicion.toLowerCase())) {
						cumple = false;
					}
				}
			}

			// 4. Asegurar que la fila tiene un email válido
			if (!fila[indices.email] || !fila[indices.email].toString().includes('@')) {
				cumple = false;
			}

			return cumple;
		});

		return contactosFiltrados.length;

	} catch (e) {
		Logger.log("Error en countContactsWithFilters: " + e.message);
		return "Error: " + e.message;
	}
}

function _filterContacts(contacts, filtros) {
	return contacts.filter(contact => {
		if (!contact) return false;

		if (filtros.etiquetas && filtros.etiquetas.length > 0) {
			const contactGroups = (contact.memberships || [])
				.filter(m => m.contactGroupMembership?.contactGroupResourceName)
				.map(m => m.contactGroupMembership.contactGroupResourceName);
			const tieneTodasLasEtiquetas = filtros.etiquetas.every(etiquetaResourceName => contactGroups.includes(etiquetaResourceName));
			if (!tieneTodasLasEtiquetas) return false;
		}

		if (filtros.empresa) {
			const contactCompany = (_get(contact, 'organizations[0].name') || '').toLowerCase();
			if (!contactCompany.includes(filtros.empresa.toLowerCase())) return false;
		}

		if (filtros.posicion) {
			const contactTitle = (_get(contact, 'organizations[0].title') || '').toLowerCase();
			const terminoBusqueda = filtros.posicion.toLowerCase();
			const terminosRelevantes = MAPA_DE_TRADUCCIONES_CARGO[terminoBusqueda] || [terminoBusqueda];
			const tieneElCargo = terminosRelevantes.some(termino => contactTitle.includes(termino));
			if (!tieneElCargo) return false;
		}

		return true;
	});
}

function _getContactGroupsMap() {
	const cache = CacheService.getScriptCache();
	const cacheKey = 'contact_groups_map_v2';
	const cachedData = cache.get(cacheKey);
	if (cachedData) {
		try { return JSON.parse(cachedData); } catch (e) { /* Fall through */ }
	}

	try {
		const allGroups = _ejecutarConReintentos(() => People.ContactGroups.list({ pageSize: 1000 })).contactGroups || [];
		const groupMap = {};
		allGroups.forEach(g => {
			if (g.resourceName && g.name) groupMap[g.resourceName] = g.name;
		});
		cache.put(cacheKey, JSON.stringify(groupMap), 600);
		return groupMap;
	} catch (e) {
		Logger.log(`Error obteniendo grupos de contactos: ${e.message}`);
		return {};
	}
}

function capitalizeWords(str) {
	if (!str) return '';
	return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}



/**
 * [FUNCIÓN QUE FALTABA]
 * Activa el "freno de emergencia" para el bucle de envío y elimina
 * cualquier activador futuro para la campaña de correos.
 * Es llamada por 'cancelarProcesosPendientes'.
 */
function cancelarProcesoDeEnvio(mostrarAlerta = false) {
	// Activa el freno de emergencia que la función 'iniciarEnvioInteligente' revisa.
	PropertiesService.getUserProperties().setProperty('proceso_envio_cancelado', 'true');
	Logger.log('Freno de emergencia para el envío activado.');

	const triggers = ScriptApp.getProjectTriggers();
	for (const trigger of triggers) {
		// Busca y elimina el activador que continuaría la campaña mañana.
		if (trigger.getHandlerFunction() === 'iniciarEnvioInteligente') {
			ScriptApp.deleteTrigger(trigger);
			Logger.log('Activador de envío futuro eliminado.');
		}
	}
	if (mostrarAlerta) {
		SpreadsheetApp.getUi().alert('Proceso de envío detenido.');
	}
}

function _limpiarActivadoresDeSincronizacion() {
	const allTriggers = ScriptApp.getProjectTriggers();
	for (const trigger of allTriggers) {
		if (trigger.getHandlerFunction() === 'procesarLoteDeSincronizacion') {
			ScriptApp.deleteTrigger(trigger);
		}
	}
}

/**
 * Cancela el proceso de sincronización y limpia las propiedades y activadores.
 */
function cancelarProcesoSincronizacion() {
	_limpiarActivadoresDeSincronizacion();
	const properties = PropertiesService.getUserProperties();
	properties.setProperty('sync_estado', 'cancelado');
	properties.deleteProperty('sync_opciones');
	properties.deleteProperty('sync_datos');
	properties.deleteProperty('sync_total');
	properties.deleteProperty('sync_procesados');
	properties.deleteProperty('sync_errores');
	Logger.log('Proceso de sincronización cancelado y propiedades limpiadas.');
}

function verificarEstadoSincronizacion() {
	const properties = PropertiesService.getUserProperties();
	const estado = properties.getProperty('sync_estado');
	if (!estado || estado === 'cancelado' || estado === 'finalizado') {
		SpreadsheetApp.getUi().alert('Estado de la Sincronización', 'No hay ningún proceso de sincronización activo.', SpreadsheetApp.getUi().ButtonSet.OK);
		return;
	}

	const procesados = properties.getProperty('sync_procesados') || 0;
	const total = properties.getProperty('sync_total') || '??';
	const errores = properties.getProperty('sync_errores') || 0;
	const opciones = JSON.parse(properties.getProperty('sync_opciones') || '{}');
	const sheetName = opciones.sheetName || 'Desconocida';
	SpreadsheetApp.getUi().alert('Estado de la Sincronización',
		`Fase actual: ${estado}\nHoja origen: "${sheetName}"\nContactos sincronizados: ${procesados} de ${total}\nErrores: ${errores}`,
		SpreadsheetApp.getUi().ButtonSet.OK);
}

// =================================================================
// FUNCIONES DE OPTIMIZACIÓN Y CACHE
// =================================================================

function limpiarCache() {
	try {
		const cache = CacheService.getScriptCache();
		cache.removeAll();
		Logger.log('Cache limpiado exitosamente');
		return true;
	} catch (e) {
		Logger.log(`Error limpiando cache: ${e.message}`);
		return false;
	}
}

function optimizarMemoria() {
	limpiarCache();
	if (typeof gc === 'function') {
		gc();
	}
	Logger.log('Optimización de memoria completada');
}

function invalidarCache(tipo) {
	const cache = CacheService.getScriptCache();
	const cacheKeys = {
		'connections': ['connections_v2_names,emailAddresses,organizations,memberships', 'connections_v2_metadata', 'connections_v2_organizations'],
		'groups': ['contact_groups_map_v2'],
		'filtros': ['filtros_v2_true', 'filtros_v2_false']
	};
	if (cacheKeys[tipo]) {
		cache.removeAll(cacheKeys[tipo]);
		Logger.log(`Cache de ${tipo} invalidado`);
	} else {
		Logger.log(`Tipo de cache '${tipo}' no reconocido`);
	}
}
/**
 * [NUEVA FUNCIÓN]
 * Actúa como puente entre la interfaz y el proceso de fondo para generar campañas.
 * @param {object} opciones Los filtros seleccionados en la barra lateral.
 * @returns {string} Un mensaje de éxito para mostrar en la interfaz.
 */
function generarContenidoSegmentado(opciones) {
	try {
		// Llama a la función que REALMENTE inicia el proceso asíncrono
		iniciarGeneracionDeCampana(opciones);
		// Devuelve el mensaje de éxito que la interfaz espera
		return '✅ Proceso iniciado en segundo plano. Ya puedes cerrar esta ventana.';
	} catch (e) {
		Logger.log('Error al intentar iniciar la campaña desde generarContenidoSegmentado: ' + e.message);
		// Lanza un error para que el FailureHandler de la interfaz lo capture si es necesario
		throw new Error('No se pudo iniciar el proceso. Error: ' + e.message);
	}
}
/**
 * [NUEVA FUNCIÓN]
 * Se activa al editar la hoja para manejar la casilla "Seleccionar Todas".
 * @param {Event} e El objeto del evento de edición.
 */
function onEdit(e) {
	const range = e.range;
	const sheet = range.getSheet();
	const editedRow = range.getRow();
	const editedCol = range.getColumn();
	const HOJA_BORRADORES = "Borradores";

	// Verifica si la edición ocurrió en la celda A1 de la hoja "Borradores"
	if (sheet.getName() === HOJA_BORRADORES && editedRow === 1 && editedCol === 1) {
		const masterCheckboxValue = range.getValue(); // true si está marcada, false si no
		const lastRow = sheet.getLastRow();

		// Si hay más de una fila, actualiza todas las casillas de la columna A
		if (lastRow > 1) {
			const checkboxesRange = sheet.getRange(2, 1, lastRow - 1, 1);
			checkboxesRange.setValue(masterCheckboxValue);
		}
	}
}
/**
 * [NUEVA FUNCIÓN]
 * Se activa al editar la hoja para manejar la casilla "Seleccionar Todas".
 * @param {GoogleAppsScript.Events.SheetsOnEdit} e El objeto del evento de edición.
 */
function onEdit(e) {
	const range = e.range;
	const sheet = range.getSheet();

	// Solo actuar si la edición es en la celda A1 de la hoja "Borradores"
	if (sheet.getName() === "Borradores" && range.getRow() === 1 && range.getColumn() === 1) {
		const masterCheckboxValue = range.getValue();
		const lastRow = sheet.getLastRow();

		if (lastRow > 1) {
			// Aplica el valor de la casilla maestra a todas las demás en la columna A
			sheet.getRange(2, 1, lastRow - 1, 1).setValue(masterCheckboxValue);
		}
	}
}
/**
 * [NUEVA FUNCIÓN]
 * Obtiene los datos de los correos marcados en la hoja "Borradores".
 * @returns {Array<Object>} Un array de objetos, cada uno representando un correo.
 */
function getDatosParaPrevisualizar() {
	const hojaBorradores = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Borradores");
	const datos = hojaBorradores.getDataRange().getValues();
	const encabezados = datos.shift(); // Quita la fila de encabezados
	const correosSeleccionados = [];

	datos.forEach((fila, index) => {
		const checkbox = fila[0];
		if (checkbox === true) {
			correosSeleccionados.push({
				numeroFila: index + 2, // El número de fila real en la hoja
				destinatario: fila[1],
				asunto: fila[2],
				cuerpo: fila[3]
			});
		}
	});
	return correosSeleccionados;
}

/**
 * [NUEVA FUNCIÓN]
 * Guarda los cambios realizados en el previsualizador en la hoja de cálculo.
 * @param {number} numeroFila El número de la fila a actualizar.
 * @param {string} nuevoAsunto El nuevo texto del asunto.
 * @param {string} nuevoCuerpo El nuevo cuerpo del correo en HTML.
 * @returns {string} Un mensaje de confirmación.
 */
function guardarCambiosCorreo(numeroFila, nuevoAsunto, nuevoCuerpo) {
	try {
		const hojaBorradores = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Borradores");
		hojaBorradores.getRange(numeroFila, 3).setValue(nuevoAsunto); // Columna C: Asunto
		hojaBorradores.getRange(numeroFila, 4).setValue(nuevoCuerpo); // Columna D: Cuerpo
		return "Guardado exitosamente.";
	} catch (e) {
		return "Error al guardar: " + e.message;
	}
}

// Función de ejemplo para la firma, puedes personalizarla después.
function getFirmaHtml() {
	return "<b>El equipo de FAROandes</b><br><i>Ciencia, innovación y futuro</i>";
}
/**
 * [NUEVA FUNCIÓN AUXILIAR]
 * Busca y recupera una plantilla específica desde la hoja "Plantillas".
 * @param {string} nombrePlantilla El nombre de la plantilla a buscar.
 * @returns {{asunto: string, cuerpo: string} | null} El objeto con el asunto y cuerpo, o null si no se encuentra.
 */
function _obtenerPlantilla(nombrePlantilla) {
	const cache = CacheService.getScriptCache();
	const cacheKey = 'plantillas_email';
	let plantillas = {};

	// Intenta cargar las plantillas desde la caché para mejorar el rendimiento
	const cachedPlantillas = cache.get(cacheKey);
	if (cachedPlantillas) {
		plantillas = JSON.parse(cachedPlantillas);
	} else {
		// Si no está en caché, lee la hoja y la guarda en caché por 10 minutos.
		const hojaPlantillas = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Plantillas");
		if (hojaPlantillas) {
			const datos = hojaPlantillas.getDataRange().getValues();
			datos.shift(); // Omitir encabezados
			datos.forEach(fila => {
				const nombre = fila[0];
				if (nombre) {
					plantillas[nombre] = { asunto: fila[1], cuerpo: fila[2] };
				}
			});
			cache.put(cacheKey, JSON.stringify(plantillas), 600); // Cache por 10 minutos
		}
	}

	return plantillas[nombrePlantilla] || null;
}
// =================================================================
// MÓDULO 5: VALIDACIÓN DE DOMINIOS (ASÍNCRONO)
// =================================================================

const HOJA_A_VALIDAR_POR_DEFECTO = "TODOS";
const COLUMNA_ESTADO_DOMINIO = "Estado Dominio"; // Nombre de la nueva columna

/**
 * [VERSIÓN CORREGIDA]
 * Inicia la interfaz DEDICADA para que el usuario seleccione la hoja a validar.
 */
function iniciarValidacion() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const allSheets = ss.getSheets();
	const sheetNames = allSheets.map(s => s.getName()).filter(name => {
		return !["Borradores", "Enviados", "Configuracion", "Errores de Importación", "Analytics", "Plantillas"].includes(name);
	});
	if (sheetNames.length === 0) {
		SpreadsheetApp.getUi().alert('No se encontraron hojas válidas para validar.');
		return;
	}

	// --- CAMBIO CLAVE: Usa el nuevo archivo HTML ---
	const template = HtmlService.createTemplateFromFile('SeleccionarHojaValidacion');
	template.sheetNames = sheetNames;

	const html = template.evaluate().setWidth(400).setHeight(200);
	SpreadsheetApp.getUi().showModalDialog(html, 'Seleccionar Hoja para Validar Dominios');
}

/**
 * [VERSIÓN CORREGIDA]
 * Inicia el proceso de validación. Llama al activador con el nombre estandarizado.
 */
function ejecutarValidacionDeDominios(sheetName) {
	const ui = SpreadsheetApp.getUi();
	const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

	if (!sheet) {
		ui.alert(`Error: No se encontró la hoja "${sheetName}".`);
		return;
	}

	ui.alert('Iniciando optimización...', 'Fase 1 de 2: Se marcarán los dominios comunes (Gmail, Hotmail, etc.). Esto puede tardar un momento.', ui.ButtonSet.OK);
	SpreadsheetApp.flush();

	const encabezados = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
	const emailIndex = encabezados.findIndex(h => h.toLowerCase().trim() === 'email');
	let estadoIndex = encabezados.findIndex(h => h === COLUMNA_ESTADO_DOMINIO);

	if (estadoIndex === -1) {
		estadoIndex = sheet.getLastColumn();
		sheet.insertColumns(estadoIndex + 1);
		sheet.getRange(1, estadoIndex + 1).setValue(COLUMNA_ESTADO_DOMINIO);
	}

	const DOMINIOS_COMUNES = new Set(['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'live.com', 'icloud.com', 'aol.com', 'msn.com', 'yahoo.com.ar', 'hotmail.com.ar', 'live.com.ar']);

	const rangoCompleto = sheet.getRange(2, 1, sheet.getLastRow() - 1, estadoIndex + 1);
	const datosCompletos = rangoCompleto.getValues();
	let dominiosComunesEncontrados = 0;

	for (let i = 0; i < datosCompletos.length; i++) {
		const estadoActual = datosCompletos[i][estadoIndex];
		if (!estadoActual) {
			const email = datosCompletos[i][emailIndex];
			if (email && typeof email === 'string' && email.includes('@')) {
				const domain = email.split('@')[1].toLowerCase();
				if (DOMINIOS_COMUNES.has(domain)) {
					datosCompletos[i][estadoIndex] = 'Válido';
					dominiosComunesEncontrados++;
				}
			}
		}
	}

	const rangoEstados = sheet.getRange(2, estadoIndex + 1, datosCompletos.length, 1);
	const nuevosEstados = datosCompletos.map(row => [row[estadoIndex]]);
	rangoEstados.setValues(nuevosEstados);

	SpreadsheetApp.flush();

	cancelarProcesoDeValidacion();
	const properties = PropertiesService.getUserProperties();
	properties.setProperty('validacion_sheetName', sheetName);
	properties.setProperty('validacion_estado', 'iniciando');

	// --- CORRECCIÓN CLAVE ---
	// Se asegura de llamar a la función sin acento.
	ScriptApp.newTrigger('procesarLoteDeValidacion').timeBased().after(1000).create();

	ui.alert('✅ Proceso de Validación Iniciado',
		`Fase 1 completada: ${dominiosComunesEncontrados} dominios comunes han sido marcados como válidos.\n\nFase 2: El sistema ha comenzado a validar los dominios restantes en segundo plano.`,
		ui.ButtonSet.OK);
}

/**
 * Verifica si un dominio tiene registros MX usando la API de DNS de Google.
 */
function _verificarDominio(domain, cache) {
	const cached = cache.get(domain);
	if (cached) {
		return cached === 'valid';
	}

	try {
		const url = `https://dns.google/resolve?name=${domain}&type=MX`;
		const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
		const result = JSON.parse(response.getContentText());

		// Si la respuesta tiene "Answer", el registro MX existe y el dominio es válido para recibir correo.
		const isValid = result.hasOwnProperty('Answer');
		cache.put(domain, isValid ? 'valid' : 'invalid', 21600); // Cache por 6 horas
		return isValid;
	} catch (e) {
		Logger.log(`Error al validar dominio ${domain}: ${e.message}`);
		return false; // Asumir como inválido si hay error
	}
}

function cancelarProcesoDeValidacion() {
	_limpiarActivadoresDeValidacion();
	const properties = PropertiesService.getUserProperties();
	properties.deleteProperty('validacion_sheetName');
	properties.deleteProperty('validacion_estado');
	properties.deleteProperty('validacion_filaActual');
	properties.deleteProperty('validacion_validos');
	properties.deleteProperty('validacion_invalidos');
}

function _limpiarActivadoresDeValidacion() {
	const allTriggers = ScriptApp.getProjectTriggers();
	for (const trigger of allTriggers) {
		if (trigger.getHandlerFunction() === 'procesarLoteDeValidacion') {
			ScriptApp.deleteTrigger(trigger);
		}
	}
}
/**
 * [NUEVA FUNCIÓN]
 * Elimina todas las filas de la hoja "TODOS" donde la columna "Estado Dominio"
 * sea "Inválido".
 */
function eliminarFilasConDominioInvalido() {
	const ui = SpreadsheetApp.getUi();
	const hojaNombre = "TODOS"; // La hoja sobre la que actuará la función
	const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(hojaNombre);

	if (!sheet) {
		ui.alert(`Error: No se encontró la hoja "${hojaNombre}".`);
		return;
	}

	const datos = sheet.getDataRange().getValues();
	const encabezados = datos[0];
	const estadoIndex = encabezados.findIndex(h => h === "Estado Dominio");

	if (estadoIndex === -1) {
		ui.alert(`Error: No se encontró la columna "Estado Dominio" en la hoja "${hojaNombre}".`);
		return;
	}

	// Pide confirmación al usuario antes de proceder
	const respuesta = ui.alert(
		'Confirmación de Borrado',
		'¿Está seguro de que desea eliminar permanentemente todas las filas con dominio "Inválido"? Esta acción no se puede deshacer.',
		ui.ButtonSet.YES_NO
	);

	if (respuesta === ui.Button.NO) {
		ui.alert('Operación cancelada.');
		return;
	}

	ui.alert('Iniciando proceso de eliminación...', 'Esto puede tardar unos minutos. Se te notificará al finalizar.', ui.ButtonSet.OK);

	let filasEliminadas = 0;
	// Se itera en reversa para no afectar los índices de las filas al eliminar
	for (let i = datos.length - 1; i >= 1; i--) {
		const fila = datos[i];
		if (fila[estadoIndex] === 'Inválido') {
			sheet.deleteRow(i + 1);
			filasEliminadas++;
		}
	}

	ui.alert('Proceso Completado', `Se han eliminado ${filasEliminadas} filas con dominios inválidos.`, ui.ButtonSet.OK);
}
/**
 * [VERSIÓN CORREGIDA Y ESTANDARIZADA]
 * Procesa un lote de filas. El nombre de la función y la llamada al siguiente
 * activador no tienen acento para evitar errores.
 */
/**
 * [VERSIÓN CORREGIDA FINAL]
 * Procesa un lote de filas. Se corrige el nombre de la variable 'estadoIndex'.
 */
function procesarLoteDeValidacion() {
	const properties = PropertiesService.getUserProperties();
	const estado = properties.getProperty('validacion_estado');
	if (estado === 'cancelado' || estado === 'finalizado') {
		_limpiarActivadoresDeValidacion();
		return;
	}

	const sheetName = properties.getProperty('validacion_sheetName');
	const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
	const encabezados = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
	const emailIndex = encabezados.findIndex(h => h.toLowerCase().trim() === 'email');

	// --- CORRECCIÓN CLAVE ---
	// La variable ahora se llama 'estadoIndex' consistentemente.
	let estadoIndex = encabezados.findIndex(h => h === COLUMNA_ESTADO_DOMINIO);

	if (estadoIndex === -1) {
		estadoIndex = sheet.getLastColumn();
		sheet.insertColumns(estadoIndex + 1);
		sheet.getRange(1, estadoIndex + 1).setValue(COLUMNA_ESTADO_DOMINIO);
	}

	const todosLosEstados = sheet.getRange(2, estadoIndex + 1, sheet.getLastRow() - 1, 1).getValues();
	let primeraFilaVacia = -1;
	for (let i = 0; i < todosLosEstados.length; i++) {
		if (todosLosEstados[i][0] === '') {
			primeraFilaVacia = i + 2;
			break;
		}
	}

	if (primeraFilaVacia === -1) {
		properties.setProperty('validacion_estado', 'finalizado');
		_limpiarActivadoresDeValidacion();
		GmailApp.sendEmail(Session.getActiveUser().getEmail(), '✅ Validación de Dominios Finalizada', `Proceso completado en la hoja "${sheetName}". No se encontraron más dominios por validar.`);
		return;
	}

	const LOTE = 100;
	const datos = sheet.getRange(primeraFilaVacia, 1, LOTE, estadoIndex + 1).getValues();
	const dominiosAValidar = new Set();
	const cache = CacheService.getScriptCache();
	const DOMINIOS_COMUNES = new Set(['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'live.com', 'icloud.com', 'aol.com', 'msn.com', 'yahoo.com.ar', 'hotmail.com.ar', 'live.com.ar']);

	datos.forEach(fila => {
		if (!fila[estadoIndex]) {
			const email = fila[emailIndex];
			if (email && typeof email === 'string' && email.includes('@')) {
				const domain = email.split('@')[1].toLowerCase();
				if (!DOMINIOS_COMUNES.has(domain) && !cache.get(domain)) {
					dominiosAValidar.add(domain);
				}
			}
		}
	});

	const resultadosDominios = {};
	Array.from(dominiosAValidar).forEach(domain => {
		resultadosDominios[domain] = _verificarDominio(domain, cache);
	});

	const resultadosParaEscribir = datos.map(fila => {
		const estadoActual = fila[estadoIndex];
		if (estadoActual) {
			return [estadoActual];
		}

		const email = fila[emailIndex];
		if (email && typeof email === 'string' && email.includes('@')) {
			const domain = email.split('@')[1].toLowerCase();
			if (DOMINIOS_COMUNES.has(domain)) {
				return ['Válido'];
			}
			const esValido = resultadosDominios[domain] !== undefined ? resultadosDominios[domain] : (cache.get(domain) === 'valid');
			return [esValido ? 'Válido' : 'Inválido'];
		}
		return [''];
	});

	sheet.getRange(primeraFilaVacia, estadoIndex + 1, resultadosParaEscribir.length, 1).setValues(resultadosParaEscribir);

	const ultimaFilaProcesada = primeraFilaVacia + datos.length;
	if (ultimaFilaProcesada > sheet.getLastRow()) {
		properties.setProperty('validacion_estado', 'finalizado');
		_limpiarActivadoresDeValidacion();
	} else {
		_limpiarActivadoresDeValidacion();
		ScriptApp.newTrigger('procesarLoteDeValidacion').timeBased().after(3000).create();
	}
}

/**
 * Función auxiliar que verifica si la hora actual está dentro del rango de envío
 * permitido para el día de hoy, según la configuración.
 * @param {object} configuracion El objeto devuelto por _obtenerConfiguracionEnvio.
 * @returns {boolean} Verdadero si está en horario de envío, falso si no.
 */
function _estaEnHorarioDeEnvio(configuracion) {
	const ahora = new Date();
	const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
	const diaActual = diasSemana[ahora.getDay()];

	const horarioHoy = configuracion.horarios.find(h => h.dia === diaActual);

	if (!horarioHoy || !horarioHoy.habilitado) {
		Logger.log(`Envío pausado: El día de hoy (${diaActual}) no está habilitado para envíos.`);
		return false;
	}

	const horaInicio = new Date(ahora.toDateString() + ' ' + horarioHoy.inicio);
	const horaFin = new Date(ahora.toDateString() + ' ' + horarioHoy.fin);

	if (ahora >= horaInicio && ahora <= horaFin) {
		return true;
	} else {
		Logger.log(`Envío pausado: La hora actual (${ahora.toLocaleTimeString()}) está fuera del rango de envío (${horarioHoy.inicio} - ${horarioHoy.fin}).`);
		return false;
	}
}
/**
 * [VERSIÓN FINAL CON DIÁLOGO DE CONFIRMACIÓN RESTAURADO]
 * Inicia el proceso de envío mostrando el plan de campaña y utilizando
 * un cerrojo estricto para evitar duplicados.
 */
function iniciarEnvioInteligente() {
	const properties = PropertiesService.getUserProperties();
	const ui = SpreadsheetApp.getUi();
	const lock = LockService.getScriptLock();

	// Cerrojo para evitar ejecuciones simultáneas
	if (!lock.tryLock(5000)) {
		ui.alert("Un proceso de envío ya está en ejecución. Por favor, espere a que termine o cancélelo desde el menú de Mantenimiento.");
		return;
	}

	try {
		// Limpieza de activadores viejos
		_limpiarActivadores('procesarLoteAsincrono');

		const ss = SpreadsheetApp.getActiveSpreadsheet();
		const hojaBorradores = ss.getSheetByName("Borradores");

		const datosBorradores = hojaBorradores.getDataRange().getValues();
		const encabezados = datosBorradores.shift(); // Quita el encabezado
		const indiceEstado = encabezados.indexOf("Estado");

		// 1. Crear la "cola de tareas" con los números de fila a procesar
		const filaQueue = [];
		datosBorradores.forEach((fila, index) => {
			const estado = (indiceEstado !== -1) ? fila[indiceEstado] : '';
			// Añadir a la cola solo si la casilla está marcada Y no ha sido enviado
			if (fila[0] === true && estado !== 'Enviado') {
				filaQueue.push(index + 2); // Guardamos el número de fila real
			}
		});

		if (filaQueue.length === 0) {
			ui.alert("No hay correos nuevos seleccionados para enviar.");
			return;
		}

		// 2. Calcular el cupo diario
		const enviadosHoy = _obtenerConteoCorreosEnviadosHoy();
		if (enviadosHoy === -1) return;

		const configuracion = _obtenerConfiguracionEnvio();
		const cupoRestanteHoy = configuracion.limiteDiario - enviadosHoy;

		// 3. Determinar el lote a enviar hoy
		const loteParaHoy = filaQueue.slice(0, Math.min(filaQueue.length, cupoRestanteHoy));

		// --- DIÁLOGO DE CONFIRMACIÓN RESTAURADO ---
		let mensajeConfirmacion = `**Diagnóstico de Límite Diario:**\n` +
			`- Límite diario configurado: ${configuracion.limiteDiario}\n` +
			`- Correos ya enviados hoy: ${enviadosHoy}\n` +
			`- Cupo restante para hoy: ${cupoRestanteHoy}\n\n` +
			`**Plan de envío propuesto:**\n` +
			`- Correos a enviar hoy: ${loteParaHoy.length}\n` +
			`- Correos pendientes para mañana: ${filaQueue.length - loteParaHoy.length}\n\n` +
			`¿Desea iniciar el proceso?`;

		const respuesta = ui.alert('Confirmar Campaña', mensajeConfirmacion, ui.ButtonSet.YES_NO);
		// --- FIN DEL DIÁLOGO ---

		if (respuesta != ui.Button.YES) {
			ui.alert('Proceso cancelado por el usuario.');
			return;
		}

		if (loteParaHoy.length === 0) {
			ui.alert('No hay cupo para enviar correos hoy.');
			return;
		}

		// 4. Guardar la cola y empezar el proceso
		properties.setProperty('fila_queue', JSON.stringify(loteParaHoy));
		properties.setProperty('envio_en_progreso', 'true');

		ScriptApp.newTrigger('procesarLoteAsincrono').timeBased().after(1000).create();

		ui.alert('✅ Proceso Iniciado', 'El sistema ha comenzado a enviar correos en segundo plano.', ui.ButtonSet.OK);

	} finally {
		// Se libera el cerrojo para que el proceso en segundo plano pueda ejecutarse
		lock.releaseLock();
	}
}

/**
 * [VERSIÓN FINAL OPTIMIZADA - PROCESAMIENTO POR LOTES]
 * Procesa la cola de envíos en ráfagas de 4.5 minutos para maximizar la
 * velocidad y minimizar el tiempo de espera entre correos.
 */
function procesarLoteAsincrono() {
	const lock = LockService.getScriptLock();
	if (!lock.tryLock(10000)) {
		Logger.log("Ejecución omitida: Ya hay un proceso de envío en curso.");
		return;
	}

	let filaQueue = JSON.parse(PropertiesService.getUserProperties().getProperty('fila_queue') || '[]');

	try {
		const properties = PropertiesService.getUserProperties();
		if (properties.getProperty('envio_en_progreso') !== 'true') {
			_limpiarActivadores('procesarLoteAsincrono');
			return;
		}

		const startTime = new Date().getTime();
		const MAX_RUNTIME_MS = 4.5 * 60 * 1000; // Trabajar por 4.5 minutos
		const configuracion = _obtenerConfiguracionEnvio();

		// --- INICIA EL BUCLE DE TRABAJO INTENSIVO ---
		while (new Date().getTime() - startTime < MAX_RUNTIME_MS) {
			if (filaQueue.length === 0) {
				Logger.log("No hay más correos en la cola. Finalizando campaña.");
				_limpiarActivadores('procesarLoteAsincrono');
				properties.deleteProperty('envio_en_progreso');
				return; // Termina la ejecución
			}

			if (!_estaEnHorarioDeEnvio(configuracion)) {
				Logger.log("Fuera de horario de envío. Pausando hasta mañana.");
				_limpiarActivadores('procesarLoteAsincrono');
				programarContinuacionParaManana();
				return; // Termina la ejecución
			}

			const filaParaProcesar = filaQueue.shift();
			procesarUnCorreo(filaParaProcesar);
		}
		// --- FIN DEL BUCLE ---

		if (filaQueue.length > 0) {
			Logger.log(`Fin de ráfaga. Quedan ${filaQueue.length} correos. Reprogramando en 10 segundos.`);
			_limpiarActivadores('procesarLoteAsincrono');
			ScriptApp.newTrigger('procesarLoteAsincrono').timeBased().after(10 * 1000).create();
		} else {
			Logger.log("Campaña finalizada exitosamente.");
			_limpiarActivadores('procesarLoteAsincrono');
			properties.deleteProperty('envio_en_progreso');
		}

	} finally {
		PropertiesService.getUserProperties().setProperty('fila_queue', JSON.stringify(filaQueue));
		lock.releaseLock();
	}
}

/**
 * [VERSIÓN FINAL DE ALTO RENDIMIENTO]
 * Procesa un correo minimizando las llamadas a la API de Sheets para
 * maximizar la velocidad de envío.
 */
function procesarUnCorreo(numeroDeFila) {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const hojaBorradores = ss.getSheetByName("Borradores");
	const hojaEnviados = ss.getSheetByName("Enviados");
	const URL_WEB_APP = "https://script.google.com/macros/s/AKfycbyO0Enzfdc8DVM-bFeLR97zVn_QARsogCWP3URY-UbApSnT8Ds7sV4HQmfAOyutr63J/exec";
	const configuracion = _obtenerConfiguracionEnvio();

	try {
		// 1. UNA SOLA LECTURA: Obtenemos todos los datos de la fila de una vez.
		const datosFila = hojaBorradores.getRange(numeroDeFila, 1, 1, 6).getValues()[0]; // Leemos solo las primeras 6 columnas necesarias
		const [isChecked, destinatarioEmail, asunto, cuerpoOriginal, nombre, apellido] = datosFila;
		const nombreCompleto = `${nombre} ${apellido}`.trim();

		// 2. CONSTRUCCIÓN DE ENLACES (rápido, en memoria)
		const enlaceBaja = `${URL_WEB_APP}?action=unsubscribe&rid=${encodeURIComponent(destinatarioEmail)}`;
		const enlaceSeguimiento = `${URL_WEB_APP}?action=track&rid=${encodeURIComponent(destinatarioEmail)}&subject=${encodeURIComponent(asunto)}`;
		let cuerpoFinal = cuerpoOriginal.replace(/{{EnlaceDeBaja}}/g, enlaceBaja).replace(/{{EnlaceDeSeguimiento}}/g, enlaceSeguimiento);

		// 3. ENVÍO (la operación que más tarda)
		const borrador = GmailApp.createDraft(destinatarioEmail, asunto, "", {
			htmlBody: cuerpoFinal,
			name: configuracion.nombreRemitente
		});
		borrador.send();

		// 4. UNA SOLA ESCRITURA: Registramos todo al final.
		// En lugar de actualizar y luego añadir, hacemos todo en lote.
		const enlacePermanente = `https://mail.google.com/mail/u/0/#sent/${borrador.getMessage().getId()}`;
		const destinatarioFinal = nombreCompleto ? `${nombreCompleto} <${destinatarioEmail}>` : destinatarioEmail;
		hojaEnviados.appendRow([new Date(), destinatarioFinal, asunto, enlacePermanente, "Enviado", ""]);

		// Desmarcamos la casilla como señal de que ya se procesó.
		hojaBorradores.getRange(numeroDeFila, 1).setValue(false);

	} catch (e) {
		Logger.log(`FALLO CRÍTICO al procesar la fila ${numeroDeFila}: ${e.toString()}`);
		// Si falla, marcamos la fila con error.
		hojaBorradores.getRange(numeroDeFila, 1, 1, 2).setBackground("#f4cccc"); // Coloreamos casilla y destinatario
		hojaBorradores.getRange(numeroDeFila, 1).setComment(e.message);
	}
}

/**
 * Crea un activador para continuar la campaña al día siguiente.
 * @param {boolean} mostrarAlerta - Controla si se debe mostrar una alerta.
 */
function programarContinuacionParaManana(mostrarAlerta = true) {
	cancelarProcesosPendientes(false); // Llama a la versión silenciosa
	const ahora = new Date();
	const manana = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1, 7, 5);
	ScriptApp.newTrigger('iniciarEnvioInteligente').timeBased().at(manana).create();
	Logger.log(`Campaña programada para continuar el ${manana.toLocaleDateString()}.`);
}
/**
 * Cuenta los correos enviados hoy de forma precisa.
 */
function _obtenerConteoCorreosEnviadosHoy() {
	try {
		const spreadsheetTimeZone = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone() || Session.getScriptTimeZone();
		const hoyEnTuZona = Utilities.formatDate(new Date(), spreadsheetTimeZone, "yyyy-MM-dd");
		const fechaDeMedianoche = new Date(hoyEnTuZona);
		const timestamp = Math.floor(fechaDeMedianoche.getTime() / 1000);
		const searchQuery = `in:sent after:${timestamp}`;
		const threads = GmailApp.search(searchQuery);
		return threads.length;
	} catch (e) {
		SpreadsheetApp.getUi().alert("Error Crítico", `No se pudo realizar el conteo de correos: ${e.message}`);
		return -1;
	}
}

/**
 * Sub-función que contiene solo la lógica del diagnóstico avanzado.
 */
function _diagnosticoConAPI(fechaDeMedianoche) {
	const informeAPI = { exito: false, conteoFinal: 0, etapas: [], errores: [] };
	const timestamp = Math.floor(fechaDeMedianoche.getTime() / 1000);
	const cacheBuster = `cb=${Math.random().toString(36).substring(7)}`;
	const searchQuery = `in:sent after:${timestamp} ${cacheBuster}`;
	informeAPI.etapas.push(` -> Consulta a la API: "${searchQuery}"`);

	try {
		let pageToken = null;
		do {
			const response = Gmail.Users.Messages.list('me', { q: searchQuery, maxResults: 500, pageToken: pageToken });
			if (response.messages) {
				informeAPI.conteoFinal += response.messages.length;
			}
			pageToken = response.nextPageToken;
		} while (pageToken);
		informeAPI.exito = true;
		informeAPI.etapas.push(` -> Diagnóstico API finalizado. Total encontrado: ${informeAPI.conteoFinal}`);
	} catch (e) {
		informeAPI.errores.push(e.toString());
		informeAPI.etapas.push(` -> ERROR en diagnóstico API: ${e.message}`);
	}
	return informeAPI;
}
/**
 * [FUNCIÓN DE INSPECCIÓN PROFUNDA]
 * Obtiene los 10 últimos mensajes enviados y registra sus metadatos
 * para un análisis detallado. No realiza ningún conteo.
 */
function inspeccionarCorreosEnviadosRecientes() {
	Logger.log("--- INICIO DE LA INSPECCIÓN DE CORREOS ENVIADOS ---");
	try {
		// 1. Obtener la lista de los 10 mensajes más recientes que provienen del usuario.
		const miEmail = Session.getActiveUser().getEmail();
		const listResponse = Gmail.Users.Messages.list('me', {
			q: `from:${miEmail} -in:trash`, // Búsqueda amplia por remitente
			maxResults: 10
		});

		if (!listResponse.messages || listResponse.messages.length === 0) {
			Logger.log("RESULTADO: No se encontró NINGÚN mensaje con la búsqueda 'from:me'. Esto confirma que la API no los está encontrando.");
			Logger.log("--- FIN DE LA INSPECCIÓN ---");
			SpreadsheetApp.getUi().alert("Inspección Finalizada", "El registro de ejecución muestra que la API no encontró ningún correo enviado desde tu dirección. Revisa los registros.", SpreadsheetApp.getUi().ButtonSet.OK);
			return;
		}

		Logger.log(`Se encontraron ${listResponse.messages.length} mensajes recientes. Inspeccionando cada uno...`);

		// 2. Obtener los detalles de cada mensaje encontrado.
		listResponse.messages.forEach((message, index) => {
			const msgDetails = Gmail.Users.Messages.get('me', message.id, { format: 'METADATA' });
			const headers = msgDetails.payload.headers;
			const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject');
			const dateHeader = headers.find(h => h.name.toLowerCase() === 'date');

			const fechaUTC = new Date(parseInt(msgDetails.internalDate));

			Logger.log(`\n--- Correo #${index + 1} ---`);
			Logger.log(`ID del Mensaje: ${msgDetails.id}`);
			Logger.log(`Asunto: ${subjectHeader ? subjectHeader.value : 'Sin Asunto'}`);
			Logger.log(`Fecha (Encabezado): ${dateHeader ? dateHeader.value : 'Sin Fecha'}`);
			Logger.log(`Fecha Interna (Timestamp de Google): ${msgDetails.internalDate} -> ${fechaUTC.toISOString()} (UTC)`);
			Logger.log(`Etiquetas aplicadas: [${msgDetails.labelIds.join(', ')}]`);
		});

		Logger.log("\n--- FIN DE LA INSPECCIÓN ---");
		SpreadsheetApp.getUi().alert("Inspección Finalizada", "Se han registrado los detalles de tus últimos correos. Por favor, revisa los registros de ejecución.", SpreadsheetApp.getUi().ButtonSet.OK);

	} catch (e) {
		Logger.log(`ERROR DURANTE LA INSPECCIÓN: ${e.toString()}`);
		Logger.log(e.stack);
		Logger.log("--- FIN DE LA INSPECCIÓN CON ERROR ---");
		SpreadsheetApp.getUi().alert("Error durante la Inspección", `Ocurrió un error. Revisa los registros de ejecución para ver el detalle.`, SpreadsheetApp.getUi().ButtonSet.OK);
	}
}
/**
 * [VERSIÓN FINAL CON SEGUIMIENTO CORREGIDO]
 * Procesa todas las solicitudes de la aplicación web (bajas y seguimiento).
 * Esta versión tiene un registro de errores mejorado para depurar el seguimiento de aperturas.
 * @param {object} e El objeto del evento con los parámetros de la URL.
 */
function doGet(e) {
	try {
		const action = e.parameter.action;
		// Registro detallado para depuración
		Logger.log("doGet activado. Parámetros recibidos: " + JSON.stringify(e.parameter));

		// Lógica para Darse de Baja (se mantiene igual)
		if (action === 'unsubscribe') {
			const userEmail = e.parameter.rid || "";
			if (!userEmail) {
				Logger.log("Solicitud de baja recibida sin email (rid).");
				return HtmlService.createHtmlOutput("<h1>Error</h1><p>Email no especificado.</p>");
			}

			const hojaContactos = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("TODOS");
			const datos = hojaContactos.getDataRange().getValues();
			const encabezados = datos.shift();
			const indiceEmail = encabezados.indexOf("Email");
			const indiceSuscripcion = encabezados.indexOf("Suscripción");

			if (indiceEmail !== -1 && indiceSuscripcion !== -1) {
				let filaEncontrada = -1;
				for (let i = 0; i < datos.length; i++) {
					if (datos[i][indiceEmail] && datos[i][indiceEmail].toLowerCase() === userEmail.toLowerCase()) {
						filaEncontrada = i;
						break;
					}
				}
				if (filaEncontrada !== -1) {
					hojaContactos.getRange(filaEncontrada + 2, indiceSuscripcion + 1).setValue("Baja");
				}
			}
			return HtmlService.createHtmlOutput("<h1>Confirmación</h1><p>Has sido dado de baja de nuestra lista de correos.</p>");
		}

		// Lógica para Píxel de Seguimiento (CORREGIDA Y MEJORADA)
		else if (action === 'track') {
			const recipient = e.parameter.rid || "No especificado";
			const subject = e.parameter.subject || "No especificado";

			Logger.log(`Seguimiento de apertura detectado. Destinatario: ${recipient}, Asunto: ${subject}`);

			const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Registro de Aperturas');
			if (sheet) {
				sheet.appendRow([new Date(), recipient, subject]);
			} else {
				Logger.log("ERROR: No se encontró la hoja 'Registro de Aperturas'.");
			}
		}

	} catch (error) {
		Logger.log(`Error crítico en doGet: ${error.toString()}`);
	}

	// Siempre devuelve la imagen invisible para no romper la carga del correo
	const gifData = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
	const imageBytes = Utilities.base64Decode(gifData);
	return ContentService.createImageOutput(imageBytes).setMimeType(ContentService.MimeType.GIF);
}

/**
 * Busca y elimina todos los activadores (triggers) que estén
 * asociados a una función con un nombre específico.
 * @param {string} nombreFuncion El nombre de la función cuyos activadores se eliminarán.
 */
function _limpiarActivadores(nombreFuncion) {
	const triggers = ScriptApp.getProjectTriggers();
	let contador = 0;
	for (const trigger of triggers) {
		if (trigger.getHandlerFunction() === nombreFuncion) {
			ScriptApp.deleteTrigger(trigger);
			contador++;
		}
	}
	if (contador > 0) {
		Logger.log(`Se eliminaron ${contador} activadores para la función '${nombreFuncion}'.`);
	}
}

function enviarCorreoDePruebaConSeguimiento() {
	Logger.log("1. Iniciando la función de prueba...");
	const ui = SpreadsheetApp.getUi();
	try {
		Logger.log("2. Dentro del bloque try...catch.");

		// IMPORTANTE: Pon aquí tu propia dirección de correo para recibir la prueba.
		const TU_EMAIL_DE_PRUEBA = "marcelo@boldrini.com.ar";

		// URL de tu última implementación correcta.
		const URL_WEB_APP = "https://script.google.com/macros/s/AKfycbyO0Enzfdc8DVM-bFeLR97zVn_QARsogCWP3URY-UbApSnT8Ds7sV4HQmfAOyutr63J/exec";

		const asuntoDePrueba = "Prueba final de seguimiento (con registros)";
		Logger.log("3. Constantes definidas. Email de prueba: " + TU_EMAIL_DE_PRUEBA);

		const enlaceBaja = `${URL_WEB_APP}?action=unsubscribe&rid=${encodeURIComponent(TU_EMAIL_DE_PRUEBA)}`;
		const enlaceSeguimiento = `${URL_WEB_APP}?action=track&rid=${encodeURIComponent(TU_EMAIL_DE_PRUEBA)}&subject=${encodeURIComponent(asuntoDePrueba)}`;
		Logger.log("4. Enlaces de seguimiento y baja construidos.");

		const cuerpoHTML =
			'<p>Este es el cuerpo del mensaje de prueba (método directo).</p>' +
			'<p>Si ves este correo con imágenes habilitadas, la apertura debería registrarse correctamente.</p>' +
			'<hr>' +
			'<p style="font-size:12px; color:#888;">' +
			'  Para darte de baja, haz clic <a href="' + enlaceBaja + '">aquí</a>.' +
			'</p>' +
			'<img src="' + enlaceSeguimiento + '" width="1" height="1" alt="">';
		Logger.log("5. Cuerpo HTML construido.");

		GmailApp.sendEmail(TU_EMAIL_DE_PRUEBA, asuntoDePrueba, "Cuerpo de texto plano.", {
			htmlBody: cuerpoHTML
		});
		Logger.log("6. Correo enviado exitosamente (justo antes de la alerta).");

		ui.alert("Prueba Enviada", `Se ha enviado un correo de prueba a ${TU_EMAIL_DE_PRUEBA}.`, ui.ButtonSet.OK);

	} catch (e) {
		Logger.log("ERROR: Se ha producido una excepción: " + e.toString());
		Logger.log("Stack Trace: " + e.stack);
		ui.alert("Error en el Envío de Prueba", e.message, ui.ButtonSet.OK);
	}
	Logger.log("7. Fin de la ejecución de la función de prueba.");
}
function onOpen() {
	SpreadsheetApp.getUi()
		.createMenu('CONTADOR GMAIL')
		.addItem('Actualizar correos enviados hoy', 'actualizarConteoCorreos')
		.addToUi();
}

function actualizarConteoCorreos() {
	// --- CONFIGURACIÓN ---
	// Reemplaza 'Hoja 1' con el nombre de tu hoja
	var nombreDeLaHoja = 'Enviados';
	// Reemplaza 'A1' con la celda donde quieres el resultado
	var celdaDeDestino = 'G1';
	// ---------------------

	var hoy = new Date();
	var inicioDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
	var finDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);

	var busqueda = 'from:info@faroandes.com after:' + Math.floor(inicioDelDia.getTime() / 1000) + ' before:' + Math.floor(finDelDia.getTime() / 1000);

	var conteoTotal = 0;
	var pagina = 0;
	var hilosDePagina;

	try {
		// Bucle para obtener resultados en páginas de 500
		do {
			hilosDePagina = GmailApp.search(busqueda, pagina * 500, 500);
			conteoTotal += hilosDePagina.length;
			pagina++;
		} while (hilosDePagina.length == 500); // Continúa mientras la página esté llena (500 resultados)

		// Escribe el resultado final en la celda especificada
		var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombreDeLaHoja);
		hoja.getRange(celdaDeDestino).setValue(conteoTotal);

	} catch (e) {
		// Si hay un error, lo muestra en una ventana emergente
		SpreadsheetApp.getUi().alert('Error: ' + e.message);
	}
}
/**
 * FUNCIÓN DE EMERGENCIA: Elimina todos los activadores (triggers) del proyecto
 * para garantizar un entorno limpio y evitar ejecuciones fantasma.
 */
function LIMPIEZA_TOTAL_DE_ACTIVADORES() {
	const triggers = ScriptApp.getProjectTriggers();
	for (const trigger of triggers) {
		ScriptApp.deleteTrigger(trigger);
	}
	SpreadsheetApp.getUi().alert('Limpieza Completa', 'Todos los activadores del proyecto han sido eliminados.', SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * [INICIADOR - SIN CAMBIOS]
 * Inicia el proceso de listado de rebotes en segundo plano.
 */
function iniciarListadoDeRebotes() {
	const ui = SpreadsheetApp.getUi();
	const confirmacion = ui.alert(
		'Confirmar Listado de Rebotes',
		'El sistema buscará correos rebotados y los listará en la hoja "registroderebotes". El proceso se ejecutará en segundo plano. ¿Desea continuar?',
		ui.ButtonSet.YES_NO
	);

	if (confirmacion === ui.Button.YES) {
		_limpiarActivadores('listarRebotesEnHoja');
		ScriptApp.newTrigger('listarRebotesEnHoja').timeBased().after(5 * 1000).create();
		ui.alert('Proceso Iniciado', 'La búsqueda y listado de rebotes ha comenzado en segundo plano.', SpreadsheetApp.getUi().ButtonSet.OK);
	}
}



// No hay cambios en esta función auxiliar, pero asegúrate de tenerla en tu script.
function _extraerMotivoRebote(body) {
	const reasonRegex = /diagnostic-code; ([\s\S]*?)(\n\n|$)/i;
	const match = body.match(reasonRegex);
	if (match && match[1]) {
		return match[1].replace(/\s+/g, ' ').trim();
	}
	if (body.includes('no se ha encontrado la dirección')) {
		return "La cuenta de correo no existe.";
	}
	return "Motivo no especificado.";
}
/**
 * [CORREGIDO] Reinicia la fecha del último escaneo de rebotes.
 * Se asegura de usar el nombre de variable correcto.
 */
function _reiniciarFechaDeRebotes() {
	// --- CORRECCIÓN CLAVE ---
	// Ahora borra la propiedad con el nombre correcto.
	PropertiesService.getUserProperties().deleteProperty('ultimaFechaListadoRebotes');
	SpreadsheetApp.getUi().alert("Historial de búsqueda de rebotes reiniciado correctamente.");
}
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
 * [NUEVA HERRAMIENTA DE DIAGNÓSTICO]
 * Verifica si existe algún activador pendiente para el proceso de listado de rebotes
 * e informa al usuario si el proceso está activo o finalizado.
 */
function verificarEstadoDeRebotes() {
	const triggers = ScriptApp.getProjectTriggers();
	let triggerPendiente = false;
	for (const trigger of triggers) {
		if (trigger.getHandlerFunction() === 'listarRebotesEnHoja') {
			triggerPendiente = true;
			break; // Se encontró un activador, no es necesario seguir buscando
		}
	}

	if (triggerPendiente) {
		SpreadsheetApp.getUi().alert('Estado del Proceso de Rebotes', 'El proceso está ACTIVO.\n\nHay una tarea de búsqueda programada para ejecutarse en los próximos minutos.', SpreadsheetApp.getUi().ButtonSet.OK);
	} else {
		SpreadsheetApp.getUi().alert('Estado del Proceso de Rebotes', 'El proceso ha FINALIZADO.\n\nNo hay más tareas de búsqueda de rebotes pendientes.', SpreadsheetApp.getUi().ButtonSet.OK);
	}
}
/**
 * [VERSIÓN COMPLETA Y ROBUSTA]
 * Cancela TODOS los procesos activos del sistema. Esta función busca y elimina
 * los activadores de todos los módulos conocidos (campañas, envíos, importación,
 * extracción, sincronización, validación y rebotes).
 */
function cancelarProcesosPendientes(mostrarAlerta = true) {
	Logger.log('Iniciando cancelación de todos los procesos y activadores...');

	// Lista de todos los nombres de funciones que generan activadores en tu sistema
	const funcionesConActivadores = [
		'procesarLoteDeCampana',             // Módulo: Generador de Campañas
		'procesarLoteDeImportacionHaciaHoja', // Módulo: Importación Contactos -> Hoja
		'procesoDeExtraccionPrincipal',      // Módulo: Extracción Gmail -> Hoja
		'procesarLoteDeSincronizacion',      // Módulo: Sincronización Hoja -> Gmail
		'procesarLoteDeValidacion',          // Módulo: Validación de Dominios
		'listarRebotesEnHoja',               // Módulo: Listado de Rebotes
		'procesarLoteDeEnvio',               // Módulo: Envío Inteligente (versión antigua)
		'procesarLoteAsincrono',             // Módulo: Envío Inteligente (versión nueva)
		'iniciarEnvioInteligente'            // Módulo: Envío Inteligente (reprogramación)
	];

	// Llama a la función auxiliar para limpiar los activadores de cada proceso
	funcionesConActivadores.forEach(nombreFuncion => {
		_limpiarActivadores(nombreFuncion);
	});

	// Adicionalmente, se ejecutan las funciones de cancelación específicas
	// que también limpian las propiedades de estado de cada proceso.
	cancelarProcesoDeCampana();
	cancelarProcesoDeImportacion();
	cancelarProcesoDeExtraccion(false); // El 'false' es para que no muestre su propia alerta
	cancelarProcesoSincronizacion();
	cancelarProcesoDeValidacion();
	cancelarProcesoDeEnvio(false);

	if (mostrarAlerta) {
		SpreadsheetApp.getUi().alert('Cancelación Completa', 'Se ha enviado la señal para detener todos los procesos en segundo plano. Todos los activadores pendientes han sido eliminados.', SpreadsheetApp.getUi().ButtonSet.OK);
	}
	Logger.log('Todos los procesos pendientes y sus activadores han sido cancelados.');
}
/**
 * [NUEVA FUNCIÓN AUXILIAR RECURSIVA - VERSIÓN CORREGIDA]
 * Navega de forma recursiva a través de todas las partes de un mensaje de correo
 * para encontrar y devolver el contenido de la primera parte 'text/plain' que encuentre.
 *
 * @param {Array} parts Las partes del payload del mensaje a analizar.
 * @return {string} El cuerpo del texto decodificado o una cadena vacía si no se encuentra.
 */
function getPlainTextBodyRecursive_(parts) {
	for (const part of parts) {
		// --- CORRECCIÓN CLAVE: Se cambió "gbody.data" por el correcto "body.data" ---
		if (part.mimeType === 'text/plain' && part.body && part.body.data) {
			try {
				return Utilities.newBlob(Utilities.base64Decode(part.body.data, Utilities.Charset.UTF_8)).getDataAsString();
			} catch (e) {
				Logger.log(`Error al decodificar una parte 'text/plain': ${e.message}`);
			}
		}
		// Si la parte actual contiene más sub-partes, llama a esta misma función para que las explore
		if (part.parts) {
			const body = getPlainTextBodyRecursive_(part.parts);
			if (body) {
				return body; // Devuelve el cuerpo tan pronto como lo encuentre en las sub-partes
			}
		}
	}
	return ''; // Devuelve vacío si no se encontró nada en este nivel
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