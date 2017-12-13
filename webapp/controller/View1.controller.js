/*global location */
//Almacena las promesas lanzadas
var vPromise = {};

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
			//Lanzar promesa para obtener status
			this.fnObtenerStatus();

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
			var vFechaPa = this.getView().byId("__datePicker").getValue();

			if (vFechaPa === "") {
				MessageBox.error("El parámetro fecha es obligatorio", null, "Mensaje del sistema", "OK", null);
				return;

			}

			// this.getView().byId("__datePicker").setLocale("en-US");
			// this.getView().byId("__datePicker2").setLocale("en-US");
			// vFecha = this.getView().byId("__datePicker").getValue().split("/"),
			// vFecha2 = this.getView().byId("__datePicker2").getValue().split("/"),	
			// vAno = 20 + vFecha[2],
			// vDia = vFecha[1].length === 1 ? "0" + vFecha[1] : vFecha[1],
			// vMes = vFecha[0].length === 1 ? "0" + vFecha[0] : vFecha[0],
			// vFechaValue = vAno + "-" + vMes + "-" + vDia + "T00:00:00",
			// vAno2 = 20 + vFecha2[2],
			// vDia2 = vFecha2[1].length === 1 ? "0" + vFecha2[1] : vFecha2[1],
			// vMes2 = vFecha2[0].length === 1 ? "0" + vFecha2[0] : vFecha2[0],
			// vFechaValue2 = vAno2 + "-" + vMes2 + "-" + vDia2 + "T00:00:00",			

			var sServiceUrl = "/sap/opu/odata/sap/ZSGW_CHARTS_SRV/",
				//Definir modelo del servicio web
				oModelService = new sap.ui.model.odata.ODataModel(sServiceUrl, true),
				vStatus = this.getView().byId("__input2"),
				vFecha = this.getView().byId("__datePicker").getValue(),
				vFecha2 = this.getView().byId("__datePicker2").getValue(),
				vFechaValue = vFecha + "T00:00:00",
				vFechaValue2 = vFecha2 + "T00:00:00",
				vCheck = this.getView().byId("_checkGestion").getSelected() ? "X" : "",
				oRead = "";
			// vFechaValue = "2017" + "-" + "10" + "-" + "02" + "T00:00:00";
			// "2017-10-01"

			if (vStatus.getName() !== "") {

				//Leer datos del ERP
				oRead = this.fnReadEntity(oModelService, "/SocGraficoSet?$filter=Datum eq datetime'" + vFechaValue +
					"' and Datum2 eq datetime'" +
					vFechaValue2 + "' and Estat eq '" + vStatus.getName() + "' and Gestion eq '" + vCheck + "'", null, false);
			} else {
				oRead = this.fnReadEntity(oModelService, "/SocGraficoSet?$filter=Datum eq datetime'" + vFechaValue +
					"' and Datum2 eq datetime'" +
					vFechaValue2 + "' and Gestion eq '" + vCheck + "'", null, false);
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

			this.fnSetGraficoTotal(vRowTotal);
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

		fnStatus: function() {
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
				this.fnObtenerListStatusSyn(vInveNum.getValue());
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
				vStatus = this.getView().byId("__input2");

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
				vCheck = this.getView().byId("_checkGestion");

			vStatus.setValue(null);
			vFecha.setValue(null);
			vFecha2.setValue(null);
			vCheck.setSelected(null);
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

		fnSetGraficoTotal: function(pTotal) {
			var oVizFrameDonutTotal = this.byId('DueDateGridFrameDonutTotal'),
				oVizPopoverDonutTotal = this.byId('vizPopoverDonutTotal'),
				vTitleTotal = "Total Tickets Por Torre",
				// vListTotal = [],
				oData = {},
				oDataTable = {
					total: []
				},
				oModel = "",
				vTable2 = this.byId("Table2"),
				oModelTable = "";

			oDataTable.total.push(pTotal);
			oModelTable = new sap.ui.model.json.JSONModel(oDataTable);
			vTable2.setModel(oModelTable);

			oData.totalGrafico = this.fnObtenerArrayTotalTorre(pTotal);

			oModel = new sap.ui.model.json.JSONModel(oData);
			// this.getView().setModel(oModel);

			oVizFrameDonutTotal.setModel(oModel);

			oVizPopoverDonutTotal.connect(oVizFrameDonutTotal.getVizUid());
			oVizFrameDonutTotal.setVizProperties({
				title: {
					text: vTitleTotal
				}
			});
		}

	});
});