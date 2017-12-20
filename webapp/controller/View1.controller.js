/*global location */
//Almacena las promesas lanzadas
var vPromise = {
	torre: "",
	sociedad: "",
	proceso: ""
};

//Almacena procesos filtrados
var vFiltroSelect = {
	//..Para el tab __filter1
	proceso: [],
	//..Para el tab __filter2
	procesoStatus: []
};

sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	'sap/ui/core/util/Export',
	'sap/ui/core/util/ExportTypeCSV',
	'jquery.sap.global'
], function(Controller, MessageBox, Export, ExportTypeCSV, jQuery) {
	"use strict";

	return Controller.extend("com.report.controller.View1", {

		onInit: function() {
			//Lanzar promesa para obtener sociedad
			this.fnObtenerSociedadAsyn();
			//Lanzar promesa para obtener status
			this.fnObtenerStatus();
			//Lanzar promesa para obtener torres
			this.fnObtenerTorreAsyn();
			//Lanzar promesa para obtener proceso
			this.fnObtenerProcesoAsyn();

			var oData = {
				"sociedad": [{
					"Socied": "",
					"Tickets": "",
					"DISPLAY_NAME": ""
				}]
			};

			var oModel = new sap.ui.model.json.JSONModel(oData);
			this.getView().setModel(oModel);

			// var oVizFrame = this.byId('DueDateGridFrame');
			// var oVizPopover = this.byId('vizPopover');
			// //console.log(oVizPopover)
			// oVizPopover.connect(oVizFrame.getVizUid());

			// oVizFrame.setVizProperties({
			// 	title: {
			// 		text: "Tickets Por Sociedad"
			// 	}
			// });

			var oVizFrameDonut = this.byId('DueDateGridFrameDonut');
			var oVizPopoverDonut = this.byId('vizPopoverDonut');
			//console.log(oVizPopover)
			oVizPopoverDonut.connect(oVizFrameDonut.getVizUid());

			oVizFrameDonut.setVizProperties({
				title: {
					text: "Tickets Por Sociedad"
				}
			});

		},

		fnConsultar: function() {
			var vFechaPa = this.getView().byId("__datePicker").getValue(),
				inputs = [
					this.getView().byId("__datePicker"),
					this.getView().byId("__datePicker2")
				],

				canContinue = true;

			if (vFechaPa === "") {
				MessageBox.error("El parámetro fecha es obligatorio", null, "Mensaje del sistema", "OK", null);
				return;

			}

			// check that inputs are not empty
			// this does not happen during data binding as this is only triggered by changes
			jQuery.each(inputs, function(i, input) {
				input.setValueState("Success");
				if (!input.getValue()) {
					input.setValueState("Error");
				}
			});

			jQuery.each(inputs, function(i, input) {
				if ("Error" === input.getValueState()) {
					canContinue = false;
					return false;
				}
			});

			if (!canContinue) {
				jQuery.sap.require("sap.m.MessageBox");
				sap.m.MessageBox.alert("Complete los campos obligatorios");
				return;
			}

			var sServiceUrl = "/sap/opu/odata/sap/ZSGW_CHARTS_SRV/",
				//Definir modelo del servicio web
				oModelService = new sap.ui.model.odata.ODataModel(sServiceUrl, true),
				vStatus = this.getView().byId("__input2"),
				vFecha = this.getView().byId("__datePicker").getValue(),
				vFecha2 = this.getView().byId("__datePicker2").getValue(),
				vFechaValue = vFecha + "T00:00:00",
				vFechaValue2 = vFecha2 + "T00:00:00",
				vCheck = this.getView().byId("_checkGestion").getSelected() ? "X" : "",
				vSociedad = this.getView().byId("__inputSociedad"),
				oRead = "";
			// vFechaValue = "2017" + "-" + "10" + "-" + "02" + "T00:00:00";
			// "2017-10-01"

			if (vStatus.getName() !== "") {

				//Leer datos del ERP
				oRead = this.fnReadEntity(oModelService, "/SocGraficoSet?$filter=Datum eq datetime'" + vFechaValue +
					"' and Datum2 eq datetime'" +
					vFechaValue2 + "' and Estat eq '" + vStatus.getName() + "' and Gestion eq '" + vCheck + "' and Bukrs eq '" + vSociedad.getName() + "'", null, false);
			} else {
				oRead = this.fnReadEntity(oModelService, "/SocGraficoSet?$filter=Datum eq datetime'" + vFechaValue +
					"' and Datum2 eq datetime'" +
					vFechaValue2 + "' and Gestion eq '" + vCheck + "' and Bukrs eq '" + vSociedad.getName() + "'", null, false);
			}

			if (oRead.tipo === "S") {
				var oData = {
					"sociedad": oRead.datos.results
				};

			} else {
				MessageBox.error(oRead.msjs, null, "Mensaje del sistema", "OK", null);
			}

			var vRowTotal = oData.sociedad[oData.sociedad.length - 1];
			oData.sociedad = oData.sociedad.slice(0, oData.sociedad.length - 1);

			var oModel = new sap.ui.model.json.JSONModel(oData);
			this.getView().setModel(oModel);

			var oVizFrameDonut = this.byId('DueDateGridFrameDonut');
			var oVizPopoverDonut = this.byId('vizPopoverDonut');
			var vTitle = "";

			if (this.getView().byId("_checkGestion").getSelected()) {
				vTitle = oRead.datos.results[0].Titulo + " " + oRead.datos.results[0].Gestiones;
			} else {
				vTitle = oRead.datos.results[0].Titulo + " " + oRead.datos.results[0].Tickets;
			}

			//console.log(oVizPopover)
			oVizPopoverDonut.connect(oVizFrameDonut.getVizUid());

			oVizFrameDonut.setVizProperties({
				title: {
					text: vTitle
				},

				plotArea: {

					dataLabel: {
						visible: true,
						// formatString: "#,##%"
						formatString: "#%"
					}
				}
			});

			var vPanel = this.byId('panel1'),
				vPane2 = this.byId('panel2');

			vPanel.setVisible(true);
			vPane2.setVisible(true);

			var table1 = this.byId("Table1"),
				vTitleTable = this.getView().byId("_titleTable");

			table1.setModel(oModel);
			vTitleTable.setText(vTitle);

			this.fnSetGraficoTotal(vRowTotal, oRead.datos.results[0].Titulo);
		},

		//Funciones Nuevas	

		/**
		 * Consumir servicio READ
		 * @public
		 * @param {object} pModel Modelo del Servicio Web
		 * @param {string} pEntidad Nombre de la entidad a consumir
		 * @param {object} pFilters Objeto con los filtros definidos
		 */
		fnReadEntity: function(pModelo, pEntidad, pFilters, pTpRequest) {
			var vMensaje = null;
			var oMensaje = {};

			var fnSucess = function(data, response) {
				oMensaje.tipo = "S";
				oMensaje.datos = data;
			};
			var fnError = function(e) {
				vMensaje = JSON.parse(e.response.body);
				vMensaje = vMensaje.error.message.value;

				oMensaje.tipo = "E";
				oMensaje.msjs = vMensaje;
			};

			pModelo.read(pEntidad, null, pFilters, pTpRequest, fnSucess, fnError);

			return oMensaje;
		},

		/**
		 * Consultar Status
		 * @public
		 */
		fnObtenerStatus: function() {

			//Url Servicio
			// var sServiceUrl = this.getView().getModel().sServiceUrl;
			var sServiceUrl = "/sap/opu/odata/sap/ZSGW_CHARTS_SRV/";
			//Definir modelo del servicio web
			var oModelService = new sap.ui.model.odata.ODataModel(sServiceUrl, true);

			if (!vPromise.statusTicket) {
				vPromise.statusTicket = this.fnReadEntityAsyn(oModelService, "/StatusSet", null, true);
			}
		},

		/**
		 * Consumir servicio READ
		 * @public
		 * @param {object} pModel Modelo del Servicio Web
		 * @param {string} pEntidad Nombre de la entidad a consumir
		 * @param {object} pFilters Objeto con los filtros definidos
		 */
		fnReadEntityAsyn: function(pModelo, pEntidad, pFilters, pTpRequest) {
			var vMensaje = null;
			var oMensaje = {};
			// var sociedadPromise = new Promise();
			var promise = jQuery.Deferred();

			var fnSucess = function(data, response) {
				oMensaje.tipo = "S";
				oMensaje.datos = data;
				promise.resolve(oMensaje);
			};
			var fnError = function(e) {
				vMensaje = JSON.parse(e.response.body);
				vMensaje = vMensaje.error.message.value;

				oMensaje.tipo = "E";
				oMensaje.msjs = vMensaje;
				promise.reject(vMensaje);
			};

			pModelo.read(pEntidad, null, pFilters, pTpRequest, fnSucess, fnError);

			// return oMensaje;
			return promise;
		},

		fnStatus: function(oEvent) {
			this.inputActi = oEvent.getSource().sId;
			this.fnOpenDialog("com.report.view.fragment.ListStatus");
			this.fnObtenerDatosListaStatus();
		},

		/**
		 * Abrir Fragment.
		 * @public
		 * @param {string} pFragment es Ruta.NombreFragment a abrir
		 */
		fnOpenDialog: function(sRutaFragment) {
			// var ruta = "com.alfa.fragment.PedCrossSelling";
			// var ruta = "com.alfa.fragment.Clientes";
			this.oFragment = new Object();
			this.oFragment.view = null;

			this.fnLoadDialog(sRutaFragment, this.oFragment);
			this.oFragment.view.open();
		},

		/**
		 * Instanciar Fragment.
		 * @public
		 * @param {string} sRutaFragment es Ruta.NombreFragment a instanciar
		 * @param {object} objFragment Objeto global contenedor del fragment
		 * @returns {object}
		 */
		fnLoadDialog: function(sRutaFragment, objFragment) {
			if (objFragment.view) {
				return;
			}
			// associate controller with the fragment
			objFragment.view = sap.ui.xmlfragment(sRutaFragment, this);
			this.getView().addDependent(objFragment.view);
		},

		/**
		 * Obtener promesa de lista de activo fijo
		 * @public
		 */
		fnObtenerDatosListaStatus: function(pCdInv) {
			var vListStatus;

			//Obtengo la promesa para verificar si ya estan las sociedad
			vPromise.statusTicket.then(function(data) {
				vListStatus = data;
			});

			//Si existe la promesa se pasan los datos
			if (vListStatus && vListStatus.datos.results.length > 0) {
				//Recupera el modelo global
				var oDataStatus = "";
				//SI el modelo NO existe, se crea.
				if (!oDataStatus) {
					oDataStatus = {
						lstItemStatus: []
					};
				}

				oDataStatus.lstItemStatus = vListStatus.datos.results;
				var oLista = sap.ui.getCore().getElementById("lstStatus");
				var oModel = new sap.ui.model.json.JSONModel(oDataStatus);
				oLista.setModel(oModel);

				//Si no existe la promesa, se consulta en modo sincrono
			} else {
				this.fnObtenerListStatusSyn();
			}
		},

		/**
		 * Obtener lista de status
		 * @public
		 */
		fnObtenerListStatusSyn: function() {
			//Url Servicio
			var sServiceUrl = this.getView().getModel().sServiceUrl,
				//Definir modelo del servicio web
				oModelService = new sap.ui.model.odata.ODataModel(sServiceUrl, true);

			//Leer datos del ERP
			var oRead = this.fnReadEntity(oModelService, "/StatusSet", null, false);

			//Si hay exito en el servicio
			if (oRead.tipo === "S") {
				//Recupera el modelo global
				var oDataStatus = "";
				//SI el modelo NO existe, se crea.
				if (!oDataStatus) {
					oDataStatus = {
						lstItemStatus: []
					};
				}

				oDataStatus.lstItemStatus = oRead.datos.results;
				var oLista = sap.ui.getCore().getElementById("lstStatus");
				var oModel = new sap.ui.model.json.JSONModel(oDataStatus);
				oLista.setModel(oModel);
			} else {
				MessageBox.error("No existen datos de status", null, "Mensaje del sistema", "OK", null);
			}
		},

		/**
		 * Seleccionar status
		 * @public
		 */
		fnSeleccionarStatus: function(oEvent) {
			//Contexto del item seleccionado
			var bindingContext = oEvent.getParameters().selectedItem.getBindingContext(),
				vStatusId = this.inputActi.split("--"),
				vStatus = this.getView().byId(vStatusId[1]);

			vStatus.setValue(bindingContext.getProperty("Desstat"));
			vStatus.setName(bindingContext.getProperty("Statustk"));

			//Cerrar Fragment
			this.fnCloseFragment();
		},

		/**
		 * Cerrar el fragment
		 * @public
		 */
		fnCloseFragment: function() {
			this.fnCloseDialog(this.oFragment);
			delete this.oFragment;
		},

		/**
		 * Cerrar Fragment.
		 * @public
		 * @param {object} objFragment Objeto global contenedor del fragment
		 */
		fnCloseDialog: function(objFragment) {
			//objFragment.view.close();
			objFragment.view.destroy();
		},

		/**
		 * Limpiar campos filtros.
		 * @public
		 */
		fnLimpiar: function() {
			var vStatus = this.getView().byId("__input2"),
				vFecha = this.getView().byId("__datePicker"),
				vFecha2 = this.getView().byId("__datePicker2"),
				vCheck = this.getView().byId("_checkGestion"),
				vSociedad = this.getView().byId("__inputSociedad");

			vStatus.setValue(null);
			vFecha.setValue(null);
			vFecha2.setValue(null);
			vCheck.setSelected(null);
			vSociedad.setValue(null);
			vSociedad.setName(null);
		},

		onDataExport: sap.m.Table.prototype.exportData || function(oEvent) {

			var oExport = new Export({

				// Type that will be used to generate the content. Own ExportType's can be created to support other formats
				exportType: new ExportTypeCSV({
					separatorChar: ";"
				}),

				// Pass in the model created above
				models: this.getView().getModel(),

				// binding information for the rows aggregation
				rows: {
					path: "/ProductCollection"
				},

				// column definitions with column name and binding info for the content

				columns: [{
					name: "Product",
					template: {
						content: "{Name}"
					}
				}, {
					name: "Product ID",
					template: {
						content: "{ProductId}"
					}
				}, {
					name: "Supplier",
					template: {
						content: "{SupplierName}"
					}
				}, {
					name: "Dimensions",
					template: {
						content: {
							parts: ["Width", "Depth", "Height", "DimUnit"],
							formatter: function(width, depth, height, dimUnit) {
								return width + " x " + depth + " x " + height + " " + dimUnit;
							},
							state: "Warning"
						}
						// "{Width} x {Depth} x {Height} {DimUnit}"
					}
				}, {
					name: "Weight",
					template: {
						content: "{WeightMeasure} {WeightUnit}"
					}
				}, {
					name: "Price",
					template: {
						content: "{Price} {CurrencyCode}"
					}
				}]
			});

			// download exported file
			oExport.saveFile().catch(function(oError) {
				MessageBox.error("Error when downloading data. Browser might not be supported!\n\n" + oError);
			}).then(function() {
				oExport.destroy();
			});
		},

		fnObtenerArrayTotalTorre: function(pFilaArray) {
			var vTotalList = [];
			// vItemTotal = {Torre: "", Total: ""};

			for (var property in pFilaArray) {
				var vItemTotal = {};

				switch (property) {
					case "Compras":
						vItemTotal.Torre = property;
						vItemTotal.Total = pFilaArray[property];

						vTotalList.push(vItemTotal);

						break;

					case "Contabilidad":
						vItemTotal.Torre = property;
						vItemTotal.Total = pFilaArray[property];

						vTotalList.push(vItemTotal);

						break;

					case "Cxp":
						vItemTotal.Torre = property;
						vItemTotal.Total = pFilaArray[property];

						vTotalList.push(vItemTotal);

						break;

					case "Nomina":
						vItemTotal.Torre = property;
						vItemTotal.Total = pFilaArray[property];

						vTotalList.push(vItemTotal);

						break;

					case "Tesoreria":
						vItemTotal.Torre = property;
						vItemTotal.Total = pFilaArray[property];

						vTotalList.push(vItemTotal);

						break;
					default:
				}
			}

			return vTotalList;

		},

		fnSetGraficoTotal: function(pTotal, pTitle) {
			var oVizFrameDonutTotal = this.byId('DueDateGridFrameDonutTotal'),
				oVizPopoverDonutTotal = this.byId('vizPopoverDonutTotal'),
				vTitleTotal = pTitle + " por torre",
				// vListTotal = [],
				oData = {},
				oDataTable = {
					total: []
				},
				oModel = "",
				vTable2 = this.byId("Table2"),
				vTitleTable2 = this.getView().byId("_titleTable2"),
				oModelTable = "";

			pTotal.Sociedad = "TOTAL";
			oDataTable.total.push(pTotal);
			oModelTable = new sap.ui.model.json.JSONModel(oDataTable);
			vTable2.setModel(oModelTable);
			vTitleTable2.setText(vTitleTotal);

			oData.totalGrafico = this.fnObtenerArrayTotalTorre(pTotal);

			oModel = new sap.ui.model.json.JSONModel(oData);
			// this.getView().setModel(oModel);

			oVizFrameDonutTotal.setModel(oModel);

			oVizPopoverDonutTotal.connect(oVizFrameDonutTotal.getVizUid());
			oVizFrameDonutTotal.setVizProperties({
				title: {
					text: vTitleTotal
				},

				plotArea: {
					dataLabel: {
						visible: true,
						// formatString: "#,##%"
						formatString: "#%"
					}
				}
			});
		},

		/**
		 * Obtener procesos
		 * @public
		 */
		fnObtenerTorreAsyn: function() {
			//Url Servicio
			var sServiceUrl = "/sap/opu/odata/sap/ZSGW_CHARTS_SRV/",
				//Definir modelo del servicio web
				oModelService = new sap.ui.model.odata.ODataModel(sServiceUrl, true);

			if (!vPromise.torre) {
				vPromise.torre = this.fnReadEntityAsyn(oModelService, "/TorreFiltroSet", null, true);
			}
		},

		/**
		 * Obtener procesos
		 * @public
		 */
		fnObtenerProcesoAsyn: function() {
			//Url Servicio
			var sServiceUrl = "/sap/opu/odata/sap/ZSGW_CHARTS_SRV/",
				//Definir modelo del servicio web
				oModelService = new sap.ui.model.odata.ODataModel(sServiceUrl, true);

			if (!vPromise.proceso) {
				vPromise.proceso = this.fnReadEntityAsyn(oModelService, "/ProcesoFiltroSet", null, true);
			}
		},

		/**
		 * Abrir mathcode torre
		 * @public
		 */
		fnTorre: function(oEvent) {
			this.inputActi = oEvent.getSource().sId;
			this.fnOpenDialog("com.report.view.fragment.Torre");
			this.fnConsultarTorre();
		},

		/**
		 * Obtener las torres para filtrar
		 * @public
		 */
		fnObtenerFiltroTorre: function() {
			var vTorrePromise,
				vTorreArray = [];

			//Obtengo la promesa para torres
			if (vPromise.torre) {
				vPromise.torre.then(function(data) {
					vTorrePromise = data;
				});
			}

			//Si existe la promesa se pasan los datos
			if (vTorrePromise && vTorrePromise.tipo === 'S') {
				vTorreArray = vTorrePromise.datos.results;

				//Si no existe la promesa, se consulta en modo sincrono
			} else {
				vTorreArray = this.fnObtenerTorreSyn();
			}

			return vTorreArray;
		},

		/**
		 * Obtener Torres Sincrono
		 * @public
		 */
		fnObtenerTorreSyn: function() {
			//Url Servicio
			var sServiceUrl = "/sap/opu/odata/sap/ZSGW_CHARTS_SRV/",
				//Definir modelo del servicio web
				oModelService = new sap.ui.model.odata.ODataModel(sServiceUrl, true),
				vTorreArray = [];

			//Leer datos del ERP
			var oRead = this.fnReadEntity(oModelService, "/TorreFiltroSet", null, false);

			//Si hay exito en el servicio
			if (oRead.tipo === "S") {
				vTorreArray = oRead.datos.results;
			} else {
				MessageBox.error(oRead.msjs, null, "Mensaje del sistema", "OK", null);
			}

			return vTorreArray;
		},

		/**
		 * Obtener Torre Mahtcode
		 * @public
		 */
		fnConsultarTorre: function() {
			var oDataTorre = "",
				vListTorre = [];

			//Obtener torres	
			vListTorre = this.fnObtenerFiltroTorre();

			//SI el modelo NO existe, se crea.
			if (!oDataTorre) {
				oDataTorre = {
					lstItemsTorre: []
				};
			}

			oDataTorre.lstItemsTorre = vListTorre;
			var oLista = sap.ui.getCore().getElementById("lstTorre");
			var oModel = new sap.ui.model.json.JSONModel(oDataTorre);
			oLista.setModel(oModel);
		},

		/**
		 * Seleccionar Torre
		 * @public
		 */
		fnSeleccionarTorre: function(oEvent) {

			//Contexto del item seleccionado
			var bindingContext = oEvent.getParameters().selectedItem.getBindingContext(),
				vTorreId = this.inputActi.split("--"),
				//Asignar Valor
				oTorre = this.getView().byId(vTorreId[1]),
				vListProceso = [],
				vListProcesoFilter = [],
				oLista = "",
				oModel = "",
				oDataProceso = "";

			oTorre.setValue(bindingContext.getProperty("Destorre"));
			oTorre.setName(bindingContext.getProperty("Codtorre"));

			vListProceso = this.fnObtenerFiltroProceso();

			switch (vTorreId[1]) {
				case "__inputBarraTorre":

					vListProcesoFilter = vListProceso.filter(results => results.Codtorre === bindingContext.getProperty("Codtorre"));

					//SI el modelo NO existe, se crea.
					if (!oDataProceso) {
						oDataProceso = {
							ProcesoSet: []
						};
					}

					oLista = this.getView().byId("_procesoBarra");
					oDataProceso.ProcesoSet = vListProcesoFilter;
					oModel = new sap.ui.model.json.JSONModel(oDataProceso);
					oLista.setModel(oModel);

					break;

				case "__inputStatusTorre":

					vListProcesoFilter = vListProceso.filter(results => results.Codtorre === bindingContext.getProperty("Codtorre"));

					//SI el modelo NO existe, se crea.
					if (!oDataProceso) {
						oDataProceso = {
							ProcesoSet: []
						};
					}

					oLista = this.getView().byId("_procesoComboBoxStatus");
					oDataProceso.ProcesoSet = vListProcesoFilter;
					oModel = new sap.ui.model.json.JSONModel(oDataProceso);
					oLista.setModel(oModel);

					break;

				default:
			}

			this.fnCloseFragment();
		},

		/**
		 * Buscar Torre
		 * @public
		 */
		fnBuscarTorre: function(oEvent) {
			var sQuery = oEvent.getParameter("value");
			var filters = [],
				filter1 = "",
				filter2 = "";

			if (sQuery && sQuery.length > 0) {
				filter1 = new sap.ui.model.Filter("Destorre", sap.ui.model.FilterOperator.Contains, sQuery);
				filter2 = new sap.ui.model.Filter("Codtorre", sap.ui.model.FilterOperator.Contains, sQuery);
				filters = new sap.ui.model.Filter([filter1, filter2], false);
				// filters = [new sap.ui.model.Filter("Maktx", sap.ui.model.FilterOperator.Contains, sQuery)];
			}

			// Update list binding
			sap.ui.getCore().byId("lstTorre").getBinding("items").filter(filters);

			//On phone devices, there is nothing to select from the list
			if (sap.ui.Device.system.phone) {
				return;
			}
		},

		/**
		 * Abrir mathcode sociedad
		 * @public
		 */
		fnSociedad: function(oEvent) {
			this.inputActi = oEvent.getSource().sId;
			this.fnOpenDialog("com.report.view.fragment.Sociedad");
			this.fnConsultarSociedad();
		},

		/**
		 * Obtener Sociedad Mahtcode
		 * @public
		 */
		fnConsultarSociedad: function() {
			var oDataSociedad = "",
				vListSociedad = [];

			//Obtener torres	
			vListSociedad = this.fnObtenerFiltroSociedad();

			//SI el modelo NO existe, se crea.
			if (!oDataSociedad) {
				oDataSociedad = {
					lstItemsSociedad: []
				};
			}

			oDataSociedad.lstItemsSociedad = vListSociedad;
			var oLista = sap.ui.getCore().getElementById("lstSociedad");
			var oModel = new sap.ui.model.json.JSONModel(oDataSociedad);
			oLista.setModel(oModel);
		},

		/**
		 * Obtener las torres para filtrar
		 * @public
		 */
		fnObtenerFiltroSociedad: function() {
			var vTorrePromise,
				vTorreArray = [];

			//Obtengo la promesa para torres
			if (vPromise.sociedad) {
				vPromise.sociedad.then(function(data) {
					vTorrePromise = data;
				});
			}

			//Si existe la promesa se pasan los datos
			if (vTorrePromise && vTorrePromise.tipo === 'S') {
				vTorreArray = vTorrePromise.datos.results;

				//Si no existe la promesa, se consulta en modo sincrono
			} else {
				vTorreArray = this.fnObtenerSociedadSyn();
			}

			return vTorreArray;
		},

		/**
		 * Obtener Sociedad Sincrono
		 * @public
		 */
		fnObtenerSociedadSyn: function() {
			//Url Servicio
			var sServiceUrl = "/sap/opu/odata/sap/ZSGW_CHARTS_SRV/",
				//Definir modelo del servicio web
				oModelService = new sap.ui.model.odata.ODataModel(sServiceUrl, true),
				vTorreArray = [];

			//Leer datos del ERP
			var oRead = this.fnReadEntity(oModelService, "/SociedadSet", null, false);

			//Si hay exito en el servicio
			if (oRead.tipo === "S") {
				vTorreArray = oRead.datos.results;
			} else {
				MessageBox.error(oRead.msjs, null, "Mensaje del sistema", "OK", null);
			}

			return vTorreArray;
		},

		/**
		 * Obtener sociedad
		 * @public
		 */
		fnObtenerSociedadAsyn: function() {
			//Url Servicio
			var sServiceUrl = "/sap/opu/odata/sap/ZSGW_CHARTS_SRV/",
				//Definir modelo del servicio web
				oModelService = new sap.ui.model.odata.ODataModel(sServiceUrl, true);

			if (!vPromise.sociedad) {
				vPromise.sociedad = this.fnReadEntityAsyn(oModelService, "/SociedadSet", null, true);
			}
		},

		/**
		 * Buscar sociedad
		 * @public
		 */
		fnBuscarSociedad: function(oEvent) {
			var sQuery = oEvent.getParameter("value");
			var filters = [],
				filter1 = "",
				filter2 = "";

			if (sQuery && sQuery.length > 0) {
				filter1 = new sap.ui.model.Filter("Butxt", sap.ui.model.FilterOperator.Contains, sQuery);
				filter2 = new sap.ui.model.Filter("Bukrs", sap.ui.model.FilterOperator.Contains, sQuery);
				filters = new sap.ui.model.Filter([filter1, filter2], false);
				// filters = [new sap.ui.model.Filter("Maktx", sap.ui.model.FilterOperator.Contains, sQuery)];
			}

			// Update list binding
			sap.ui.getCore().byId("lstSociedad").getBinding("items").filter(filters);

			//On phone devices, there is nothing to select from the list
			if (sap.ui.Device.system.phone) {
				return;
			}

		},

		/**
		 * Seleccionar sociedad
		 * @public
		 */
		fnSeleccionarSociedad: function(oEvent) {

			//Contexto del item seleccionado
			var bindingContext = oEvent.getParameters().selectedItem.getBindingContext(),
				vSociedadId = this.inputActi.split("--"),
				//Asignar Valor
				oSociedad = this.getView().byId(vSociedadId[1]);
			oSociedad.setValue(bindingContext.getProperty("Butxt"));
			oSociedad.setName(bindingContext.getProperty("Bukrs"));

			this.fnCloseFragment();
		},

		/**
		 * Abrir mathcode proceso
		 * @public
		 */
		fnProceso: function(oEvent) {
			this.inputActi = oEvent.getSource().sId;
			this.fnOpenDialog("com.report.view.fragment.Proceso");
			this.fnConsultarProceso();
		},

		/**
		 * Obtener Sociedad Mahtcode
		 * @public
		 */
		fnConsultarProceso: function() {
			var oDataProceso = "",
				vListProceso = [];

			//Obtener proceso	
			vListProceso = this.fnObtenerFiltroProceso();

			//SI el modelo NO existe, se crea.
			if (!oDataProceso) {
				oDataProceso = {
					lstItemsProceso: []
				};
			}

			oDataProceso.lstItemsProceso = vListProceso;
			var oLista = sap.ui.getCore().getElementById("lstProceso");
			var oModel = new sap.ui.model.json.JSONModel(oDataProceso);
			oLista.setModel(oModel);
		},

		/**
		 * Obtener procesos para filtrar
		 * @public
		 */
		fnObtenerFiltroProceso: function() {
			var vTorrePromise,
				vTorreArray = [];

			//Obtengo la promesa para torres
			if (vPromise.proceso) {
				vPromise.proceso.then(function(data) {
					vTorrePromise = data;
				});
			}

			//Si existe la promesa se pasan los datos
			if (vTorrePromise && vTorrePromise.tipo === 'S') {
				vTorreArray = vTorrePromise.datos.results;

				//Si no existe la promesa, se consulta en modo sincrono
			} else {
				vTorreArray = this.fnObtenerProcesoSyn();
			}

			return vTorreArray;
		},

		/**
		 * Obtener Proceso Sincrono
		 * @public
		 */
		fnObtenerProcesoSyn: function() {
			//Url Servicio
			var sServiceUrl = "/sap/opu/odata/sap/ZSGW_CHARTS_SRV/",
				//Definir modelo del servicio web
				oModelService = new sap.ui.model.odata.ODataModel(sServiceUrl, true),
				vTorreArray = [];

			//Leer datos del ERP
			var oRead = this.fnReadEntity(oModelService, "/ProcesoFiltroSet", null, false);

			//Si hay exito en el servicio
			if (oRead.tipo === "S") {
				vTorreArray = oRead.datos.results;
			} else {
				MessageBox.error(oRead.msjs, null, "Mensaje del sistema", "OK", null);
			}

			return vTorreArray;
		},

		/**
		 * Buscar proceso
		 * @public
		 */
		fnBuscarProceso: function(oEvent) {
			var sQuery = oEvent.getParameter("value");
			var filters = [],
				filter1 = "",
				filter2 = "";

			if (sQuery && sQuery.length > 0) {
				filter1 = new sap.ui.model.Filter("Desproc", sap.ui.model.FilterOperator.Contains, sQuery);
				filter2 = new sap.ui.model.Filter("Codproc", sap.ui.model.FilterOperator.Contains, sQuery);
				filters = new sap.ui.model.Filter([filter1, filter2], false);
				// filters = [new sap.ui.model.Filter("Maktx", sap.ui.model.FilterOperator.Contains, sQuery)];
			}

			// Update list binding
			sap.ui.getCore().byId("lstProceso").getBinding("items").filter(filters);

			//On phone devices, there is nothing to select from the list
			if (sap.ui.Device.system.phone) {
				return;
			}

		},

		/**
		 * Seleccionar proceso
		 * @public
		 */
		fnSeleccionarProceso: function(oEvent) {

			//Contexto del item seleccionado
			var bindingContext = oEvent.getParameters().selectedItem.getBindingContext(),
				vSociedadId = this.inputActi.split("--"),
				//Asignar Valor
				oSociedad = this.getView().byId(vSociedadId[1]);
			oSociedad.setValue(bindingContext.getProperty("Desproc"));
			oSociedad.setName(bindingContext.getProperty("Codproc"));

			this.fnCloseFragment();
		},

		/**
		 * Consultar Gráfico Barra
		 * @public
		 */
		fnConsultarBarra: function() {

			var vFechaPa = this.getView().byId("__datePickerBarra1").getValue(),
				vFechaFn = this.getView().byId("__datePickerBarra2").getValue(),
				vEstado = this.getView().byId("__inputBarra1"),
				vTorre = this.getView().byId("__inputBarraTorre"),
				vSociedad = this.getView().byId("__inputBarraSociedad"),
				vProceso = this.getView().byId("__inputBarraProceso"),
				sServiceUrl = "/sap/opu/odata/sap/ZSGW_CHARTS_SRV/",
				//Definir modelo del servicio web
				oModelService = new sap.ui.model.odata.ODataModel(sServiceUrl, true),
				vFechaValue = vFechaPa + "T00:00:00",
				vFechaValue2 = vFechaFn + "T00:00:00",
				oRead = "",
				oData = {
					items: []
				},
				oDataCant = {
					items: []
				},

				inputs = [
					this.getView().byId("__datePickerBarra1"),
					this.getView().byId("__datePickerBarra2"),
					this.getView().byId("__inputBarra1"),
					this.getView().byId("__inputBarraTorre")
				],

				canContinue = true,

				vFilterProceso = this.getView().byId("_procesoBarra").getSelectedKeys(),
				vProcesoRange = "",
				vCheck = this.getView().byId("_checkGestionBarra").getSelected() ? "X" : "";

			if (vFechaPa === "") {
				MessageBox.error("El parámetro fecha es obligatorio", null, "Mensaje del sistema", "OK", null);
				return;

			}

			// check that inputs are not empty
			// this does not happen during data binding as this is only triggered by changes
			jQuery.each(inputs, function(i, input) {
				input.setValueState("Success");
				if (!input.getValue()) {
					input.setValueState("Error");
				}
			});

			jQuery.each(inputs, function(i, input) {
				if ("Error" === input.getValueState()) {
					canContinue = false;
					return false;
				}
			});

			if (!canContinue) {
				jQuery.sap.require("sap.m.MessageBox");
				sap.m.MessageBox.alert("Complete los campos obligatorios");
				return;
			}

			//Agregar filtros de proceso
			for (var i = 0; i < vFilterProceso.length; i++) {
				var vItemProceso = vFilterProceso[i];

				if (i !== 0) {
					vProcesoRange = vProcesoRange + " or Codproc eq '" + vItemProceso + "' ";
				} else {
					vProcesoRange = vProcesoRange + "Codproc eq '" + vItemProceso + "'";
				}
			}

			// var prueba = "/GraficoTimeBarraSet?$filter=Fecin eq datetime'" + vFechaValue +
			// 		"' and Fecfi eq datetime'" +
			// 		vFechaValue2 + "' and Estat eq '" + vEstado.getName() + "' and Codtorre eq '" + vTorre.getName() +
			// 		"' and Bukrs eq '" + vSociedad.getName() + "' and Codproc eq '" + vProceso.getName() + "'";

			// 	//Leer datos del ERP
			// 	oRead = this.fnReadEntity(oModelService, prueba, null, false);						

			// //Leer datos del ERP
			// oRead = this.fnReadEntity(oModelService, "/GraficoTimeBarraSet?$filter=Fecin eq datetime'" + vFechaValue +
			// 	"' and Fecfi eq datetime'" +
			// 	vFechaValue2 + "' and Estat eq '" + vEstado.getName() + "' and Codtorre eq '" + vTorre.getName() +
			// 	"' and Bukrs eq '" + vSociedad.getName() + "' and Codproc eq '" + vProceso.getName() + "'", null, false);			

			if (vProcesoRange !== "") {

				//Leer datos del ERP
				oRead = this.fnReadEntity(oModelService, "/GraficoTimeBarraSet?$filter=Fecin eq datetime'" + vFechaValue +
					"' and Fecfi eq datetime'" +
					vFechaValue2 + "' and Estat eq '" + vEstado.getName() + "' and Codtorre eq '" + vTorre.getName() +
					"' and Bukrs eq '" + vSociedad.getName() + "' and (" + vProcesoRange + ")", null, false);

			} else {

				//Leer datos del ERP
				oRead = this.fnReadEntity(oModelService, "/GraficoTimeBarraSet?$filter=Fecin eq datetime'" + vFechaValue +
					"' and Fecfi eq datetime'" +
					vFechaValue2 + "' and Estat eq '" + vEstado.getName() + "' and Codtorre eq '" + vTorre.getName() +
					"' and Bukrs eq '" + vSociedad.getName() + "'", null, false);

			}

			if (oRead.tipo === "S") {
				oData.items = oRead.datos.results;
			} else {
				MessageBox.error(oRead.msjs, null, "Mensaje del sistema", "OK", null);
			}

			this.fnGenerateGraphicTicketTime(oData);

			//Leer datos del ERP
			oRead = "";
			if (vProcesoRange !== "") {
				//Leer datos del ERP
				oRead = this.fnReadEntity(oModelService, "/GraficoCantidadBarraSet?$filter=Fecin eq datetime'" + vFechaValue +
					"' and Fecfi eq datetime'" +
					vFechaValue2 + "' and Estat eq '" + vEstado.getName() + "' and Codtorre eq '" + vTorre.getName() +
					"' and Bukrs eq '" + vSociedad.getName() + "' and Gestion eq '" + vCheck + "' and (" + vProcesoRange + ")", null, false);
			} else {

				//Leer datos del ERP
				oRead = this.fnReadEntity(oModelService, "/GraficoCantidadBarraSet?$filter=Fecin eq datetime'" + vFechaValue +
					"' and Fecfi eq datetime'" +
					vFechaValue2 + "' and Estat eq '" + vEstado.getName() + "' and Codtorre eq '" + vTorre.getName() +
					"' and Bukrs eq '" + vSociedad.getName() + "' and Gestion eq '" + vCheck + "'", null, false);
			}

			// //Leer datos del ERP
			// oRead = "";
			// oRead = this.fnReadEntity(oModelService, "/GraficoCantidadBarraSet?$filter=Fecin eq datetime'" + vFechaValue +
			// 	"' and Fecfi eq datetime'" +
			// 	vFechaValue2 + "' and Estat eq '" + vEstado.getName() + "' and Codtorre eq '" + vTorre.getName() +
			// 	"' and Bukrs eq '" + vSociedad.getName() + "' and Codproc eq '" + vProceso.getName() + "'", null, false);

			if (oRead.tipo === "S") {
				oDataCant.items = oRead.datos.results;
			} else {
				MessageBox.error(oRead.msjs, null, "Mensaje del sistema", "OK", null);
			}

			this.fnGenerateGraphicTicketCant(oDataCant);
		},

		fnGenerateGraphicTicketTime: function(pData) {
			var vBarTime = this.getView().byId("idVizFrameBarraTime"),
				vPopover = this.getView().byId("idPopOverBarraTime"),
				oModelTable = new sap.ui.model.json.JSONModel(pData),
				oDataset = new sap.viz.ui5.data.FlattenedDataset({
					dimensions: [{
						name: "Proceso",
						value: "{Desproc}"
					}],

					measures: [{
						name: "Dias",
						value: "{Dias}"
					}, {
						name: "Horas",
						value: "{Horde}"
					}],

					data: {
						path: "/items"

					}
				});

			vBarTime.setVizProperties({
				plotArea: {
					// colorPalette: d3.scale.category20().range(),
					dataLabel: {
						showTotal: true
					},

					tooltip: {
						visible: true
					}

				},
				// tooltip: {
				// 	visible: true
				// },
				title: {
					text: "Tiempo por proceso"
				}
			});

			vBarTime.setDataset(oDataset);
			vBarTime.setModel(oModelTable);

			var oFeedValueDia = new sap.viz.ui5.controls.common.feeds.FeedItem({
					"uid": "valueAxis",
					"type": "Measure",
					"values": ["Dias"]
				}),

				oFeedValueHora = new sap.viz.ui5.controls.common.feeds.FeedItem({
					"uid": "valueAxis",
					"type": "Measure",
					"values": ["Horas"]
				}),

				oFeedProceso = new sap.viz.ui5.controls.common.feeds.FeedItem({
					"uid": "categoryAxis",
					"type": "Dimension",
					"values": ["Proceso"]
				});

			//Se valida que las opciones no existan
			if (!vBarTime.getFeeds().length > 0) {
				vBarTime.addFeed(oFeedValueDia);
				vBarTime.addFeed(oFeedValueHora);
				vBarTime.addFeed(oFeedProceso);
			}

			vPopover.connect(vBarTime.getVizUid());

		},

		fnGenerateGraphicTicketCant: function(pData) {
			var vBarCant = this.getView().byId("idVizFrameBarraCant"),
				vPopover = this.getView().byId("idPopOverBarraCant"),
				oModelTable = new sap.ui.model.json.JSONModel(pData),
				vItemsText = pData.items[0],
				oDataset = new sap.viz.ui5.data.FlattenedDataset({
					dimensions: [{
						name: "Proceso",
						value: "{Desproc}"
					}],

					measures: [{
						// name: "Cantidad",
						name: vItemsText.GvTitulo,
						value: "{Cantidad}"
					}],

					data: {
						path: "/items"
					}
				});

			vBarCant.setVizProperties({
				plotArea: {
					// colorPalette: d3.scale.category20().range(),
					dataLabel: {
						showTotal: true
					},

					tooltip: {
						visible: true
					}

				},
				tooltip: {
					visible: true
				},
				title: {
					text: "Tickets por proceso " + vItemsText.GvTorre
				}
			});

			vBarCant.setDataset(oDataset);
			vBarCant.setModel(oModelTable);

			var oFeedValueDia = new sap.viz.ui5.controls.common.feeds.FeedItem({
					"uid": "valueAxis",
					"type": "Measure",
					// "values": ["Gestión"]
					"values": [vItemsText.GvTitulo]
				}),

				oFeedValueHora = new sap.viz.ui5.controls.common.feeds.FeedItem({
					"uid": "valueAxis",
					"type": "Measure",
					"values": ["Cantidad"]
				}),

				oFeedProceso = new sap.viz.ui5.controls.common.feeds.FeedItem({
					"uid": "categoryAxis",
					"type": "Dimension",
					"values": ["Proceso"]
				});

			vBarCant.removeAllFeeds();

			//Se valida que las opciones no existan
			// if (!vBarCant.getFeeds().length > 0) {
			vBarCant.addFeed(oFeedValueDia);
			// vBarTime.addFeed(oFeedValueHora);
			vBarCant.addFeed(oFeedProceso);
			// }

			vPopover.connect(vBarCant.getVizUid());
		},

		/**
		 * Limpiar campos filtros gráfico barras.
		 * @public
		 */
		fnLimpiarBarra: function() {
			var vStatus = this.getView().byId("__inputBarra1"),
				vFecha = this.getView().byId("__datePickerBarra1"),
				vFecha2 = this.getView().byId("__datePickerBarra2"),
				vTorre = this.getView().byId("__inputBarraTorre"),
				vSociedad = this.getView().byId("__inputBarraSociedad"),
				// vProceso = this.getView().byId("__inputBarraProceso"),
				vListaProceso = this.getView().byId("_procesoBarra"),
				vCheck = this.getView().byId("_checkGestionBarra");

			vStatus.setValue(null);
			vFecha.setValue(null);
			vFecha2.setValue(null);
			vTorre.setValue(null);
			vSociedad.setValue(null);
			vCheck.setSelected(null);
			// vProceso.setValue(null);
			vListaProceso.setSelectedKeys([]);
			//Almacena procesos filtrados
			vFiltroSelect.proceso = [];
		},

		/**
		 * Consultar Gráfico Barra
		 * @public
		 */
		fnConsultarStatus: function() {

			var vFechaPa = this.getView().byId("__datePickerStatus1").getValue(),
				vFechaFn = this.getView().byId("__datePickerStatus2").getValue(),
				vTorre = this.getView().byId("__inputStatusTorre"),
				vSociedad = this.getView().byId("__inputStatusSociedad"),
				// vProceso = this.getView().byId("__inputStatusProceso"),
				sServiceUrl = "/sap/opu/odata/sap/ZSGW_CHARTS_SRV/",
				//Definir modelo del servicio web
				oModelService = new sap.ui.model.odata.ODataModel(sServiceUrl, true),
				vFechaValue = vFechaPa + "T00:00:00",
				vFechaValue2 = vFechaFn + "T00:00:00",
				oRead = "",
				oDataStatus = {
					items: []
				},

				inputs = [
					this.getView().byId("__datePickerStatus1"),
					this.getView().byId("__datePickerStatus2"),
					this.getView().byId("__inputStatusTorre")
				],

				canContinue = true,
				vFilterProceso = this.getView().byId("_procesoComboBoxStatus").getSelectedKeys(),
				vProcesoRange = "";

			if (vFechaPa === "") {
				MessageBox.error("El parámetro fecha es obligatorio", null, "Mensaje del sistema", "OK", null);
				return;
			}

			// check that inputs are not empty
			// this does not happen during data binding as this is only triggered by changes
			jQuery.each(inputs, function(i, input) {
				input.setValueState("Success");
				if (!input.getValue()) {
					input.setValueState("Error");
				}
			});

			jQuery.each(inputs, function(i, input) {
				if ("Error" === input.getValueState()) {
					canContinue = false;
					return false;
				}
			});

			if (!canContinue) {
				jQuery.sap.require("sap.m.MessageBox");
				sap.m.MessageBox.alert("Complete los campos obligatorios");
				return;
			}

			//Agregar filtros de proceso
			for (var i = 0; i < vFilterProceso.length; i++) {
				var vItemProceso = vFilterProceso[i];

				if (i !== 0) {
					vProcesoRange = vProcesoRange + " or Codproc eq '" + vItemProceso + "' ";
				} else {
					vProcesoRange = vProcesoRange + "Codproc eq '" + vItemProceso + "'";
				}
			}

			// //Leer datos del ERP
			// oRead = this.fnReadEntity(oModelService, "/GraficoStatusTicketSet?$filter=Fecin eq datetime'" + vFechaValue +
			// 	"' and Fecfi eq datetime'" +
			// 	vFechaValue2 + "' and Codtorre eq '" + vTorre.getName() + "' and Bukrs eq '" + vSociedad.getName() +
			// 	"' and Codproc eq '" + vProceso.getName() + "'", null, false);			

			if (vProcesoRange !== "") {
				//Leer datos del ERP
				oRead = this.fnReadEntity(oModelService, "/GraficoStatusTicketSet?$filter=Fecin eq datetime'" + vFechaValue +
					"' and Fecfi eq datetime'" +
					vFechaValue2 + "' and Codtorre eq '" + vTorre.getName() + "' and Bukrs eq '" + vSociedad.getName() +
					"' and (" + vProcesoRange + ")", null, false);
			} else {
				//Leer datos del ERP
				oRead = this.fnReadEntity(oModelService, "/GraficoStatusTicketSet?$filter=Fecin eq datetime'" + vFechaValue +
					"' and Fecfi eq datetime'" +
					vFechaValue2 + "' and Codtorre eq '" + vTorre.getName() + "' and Bukrs eq '" + vSociedad.getName() + "'", null, false);
			}

			if (oRead.tipo === "S") {
				oDataStatus.items = oRead.datos.results;
			} else {
				MessageBox.error(oRead.msjs, null, "Mensaje del sistema", "OK", null);
			}

			this.fnSetGraficoStatus(oDataStatus);
		},

		/**
		 * Gráfico status
		 * @public
		 */
		fnSetGraficoStatus: function(pData) {
			var oVizFrameDonutTotal = this.byId('DueDateGridFrameDonutStatus'),
				oVizPopoverDonutTotal = this.byId('vizPopoverDonutStatus'),
				oModel = "",
				oData = {
					totalGrafico: []
				},
				vTitle = "";

			oData.totalGrafico = this.fnObtenerArrayStatus(pData.items[0]);

			oModel = new sap.ui.model.json.JSONModel(oData);

			if (pData && pData.items.length > 0) {
				vTitle = pData.items[0].Socie + "\n       Torre: " + pData.items[0].Desto;
			}

			oVizFrameDonutTotal.setModel(oModel);

			oVizPopoverDonutTotal.connect(oVizFrameDonutTotal.getVizUid());
			oVizFrameDonutTotal.setVizProperties({
				title: {
					text: vTitle
				},

				plotArea: {
					dataLabel: {
						visible: true,
						// formatString: "#,##%"
						formatString: "#%"
					}
				}
			});
		},

		/**
		 * Obtener data para gráfico status
		 * @public
		 */
		fnObtenerArrayStatus: function(pFilaArray) {
			var vTotalList = [];
			// vItemTotal = {Torre: "", Total: ""};

			for (var property in pFilaArray) {
				var vItemTotal = {};

				switch (property) {
					case "Abierto":
						vItemTotal.Status = property;
						vItemTotal.Total = pFilaArray[property];

						vTotalList.push(vItemTotal);

						break;

					case "Cerrado":
						vItemTotal.Status = property;
						vItemTotal.Total = pFilaArray[property];

						vTotalList.push(vItemTotal);

						break;

					case "Anulado":
						vItemTotal.Status = property;
						vItemTotal.Total = pFilaArray[property];

						vTotalList.push(vItemTotal);

						break;
					default:
				}
			}

			return vTotalList;

		},

		/**
		 * Limpiar campos filtros gráfico barras.
		 * @public
		 */
		fnLimpiarStatus: function() {
			var vFecha = this.getView().byId("__datePickerStatus1"),
				vFecha2 = this.getView().byId("__datePickerStatus2"),
				vTorre = this.getView().byId("__inputStatusTorre"),
				vSociedad = this.getView().byId("__inputStatusSociedad"),
				// vProceso = this.getView().byId("__inputStatusProceso"),
				vListaProceso = this.getView().byId("_procesoComboBoxStatus");

			vFecha.setValue(null);
			vFecha2.setValue(null);
			vTorre.setValue(null);
			vSociedad.setValue(null);
			// vProceso.setValue(null);
			vListaProceso.setSelectedKeys([]);
			//Almacena procesos filtrados
			vFiltroSelect.procesoStatus = [];
		},

		/**
		 * Seleccionar tab
		 * @public
		 */
		fnSelectTab: function(oEvent) {
			var vKey = oEvent.getParameter("key"),
				oDataProceso = "",
				vListProceso = [],
				oLista = "",
				oModel = "",
				vTorre = this.getView().byId("__inputBarraTorre"),
				vTorreStatus = this.getView().byId("__inputStatusTorre");

			switch (vKey) {
				case "__xmlview0--__filter1":
					//Obtener lista proceso	
					vListProceso = this.fnObtenerFiltroProceso();

					//SI el modelo NO existe, se crea.
					if (!oDataProceso) {
						oDataProceso = {
							ProcesoSet: []
						};
					}

					if (vTorre.getName() !== "") {
						oDataProceso.ProcesoSet = vListProceso.filter(results => results.Codtorre === vTorre.getName());
					} else {
						oDataProceso.ProcesoSet = vListProceso;
					}

					oLista = this.getView().byId("_procesoBarra");
					oModel = new sap.ui.model.json.JSONModel(oDataProceso);
					oLista.setModel(oModel);

					if (vFiltroSelect.proceso.length > 0) {
						oLista.setSelectedKeys(vFiltroSelect.proceso);
					}

					break;
				case "__xmlview0--__filter2":
					//Obtener lista proceso	
					vListProceso = this.fnObtenerFiltroProceso();

					//SI el modelo NO existe, se crea.
					if (!oDataProceso) {
						oDataProceso = {
							ProcesoSet: []
						};
					}

					if (vTorreStatus.getName() !== "") {
						oDataProceso.ProcesoSet = vListProceso.filter(results => results.Codtorre === vTorreStatus.getName());
					} else {
						oDataProceso.ProcesoSet = vListProceso;
					}

					oLista = this.getView().byId("_procesoComboBoxStatus");
					oModel = new sap.ui.model.json.JSONModel(oDataProceso);
					oLista.setModel(oModel);

					if (vFiltroSelect.procesoStatus.length > 0) {
						oLista.setSelectedKeys(vFiltroSelect.procesoStatus);
					}

					break;
				default:
			}

		},

		/**
		 * Evento al terminar de seleccionar proceso barra
		 * @public
		 */
		fnHhandleSelectionFinishComboBoxBarra: function(oEvent) {
			//Agregar filtros proceso
			var vFilterProceso = this.getView().byId("_procesoBarra").getSelectedKeys();
			vFiltroSelect.proceso = vFilterProceso;
		},

		/**
		 * Evento al terminar de seleccionar proceso status
		 * @public
		 */
		fnHhandleSelectionFinishComboBoxStatus: function(oEvent) {
			//Agregar filtros proceso
			var vFilterProceso = this.getView().byId("_procesoComboBoxStatus").getSelectedKeys();
			vFiltroSelect.procesoStatus = vFilterProceso;
		},
	});
});