sap.ui.define([
    './BaseController',
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/m/Dialog',
    'sap/m/Label',
    'sap/m/Text',
    'sap/m/VBox',
    'sap/m/Button',
    'sap/m/MessageToast'
], function (BaseController, JSONModel, Filter, FilterOperator, Dialog, Label, Text, VBox, Button, MessageToast) {
    "use strict";

    return BaseController.extend("sap.ui.demo.bulletinboard.controller.App", {

        formatCurrency: function (value) {
            if (!value) {
                return "";
            }

            var formatter = sap.ui.core.format.NumberFormat.getCurrencyInstance({
                currency: 'BRL', 
                style: 'currency', 
                currencyDisplay: 'symbol', 
                maximumFractionDigits: 2 
            });

            return formatter.format(value);
        },

        onInit: function () {

            var oView = this.getView();
            
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.loadData("https://localhost:44311/api/NotaFiscal").then(function () {
                oView.setModel(oModel); 
            }).catch(function (error) {
                console.error("Erro ao carregar dados:", error);
            });
        
            var oRouter = this.getRouter();
            if (oRouter) {
                oRouter.initialize();
            }
        },
        
        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("newValue");
            var oList = this.byId("idNotasList");
            var oBinding = oList.getBinding("items");

            var aFilters = [];
            if (sQuery && sQuery.length > 0) {
                var oFilter = new Filter("numeroNota", FilterOperator.EQ, sQuery);
                aFilters.push(oFilter);
            }

            oBinding.filter(aFilters);
        },


        onCriarNotaFiscalButtonPress: function () {
            var oModel = this.getView().getModel();
            var oData = oModel.getData();
            var oNovaNotaFiscal = {
                numeroNota: oData.NumeroNota,
                valor: oData.Valor,
                cliente: {
                    nome: oData.ClienteNome,
                },
                fornecedor: {
                    nome: oData.FornecedorNome
                }
            };

            sap.ui.core.BusyIndicator.show();

            jQuery.ajax({
                type: "POST",
                contentType: "application/json",
                url: "https://localhost:44311/api/NotaFiscal/CriarNotaFiscal",
                data: JSON.stringify(oNovaNotaFiscal),
                success: function () {
                    oModel.loadData("https://localhost:44311/api/NotaFiscal").then(function () {

                    }).catch(function (error) {
                        console.error("Erro ao atualizar dados:", error);
                    });

                    oModel.setProperty("/NumeroNota", "");
                    oModel.setProperty("/Valor", "");
                    oModel.setProperty("/ClienteNome", "");
                    oModel.setProperty("/FornecedorNome", "");

                    sap.ui.core.BusyIndicator.hide();

                 MessageToast.show("Nota fiscal criada com sucesso!");
                }.bind(this),

                error: function (oError) {
                    console.error("Erro ao criar a nota fiscal:", oError);
                    sap.ui.core.BusyIndicator.hide();
                }
            });
        },

        onDetalhesPress: function (oEvent) {
            var oView = this.getView();
            var oItem = oEvent.getSource();
            var sNotaId = oItem.getBindingContext().getProperty('numeroNota');
        
            var sUrl = "https://localhost:44311/api/NotaFiscal/Detalhes/" + sNotaId;
            var oModelDetalhes = new sap.ui.model.json.JSONModel();
        
            oModelDetalhes.loadData(sUrl).then(function () {

                oView.setModel(oModelDetalhes, "Nota");
        
                if (!this.oFixedSizeDialog) {
                    this.oFixedSizeDialog = new Dialog({
                        title: "Detalhes da Nota Fiscal",
                        content: new VBox({
                            items: [
                                new Label({ text: "Número da Nota:" }),
                                new Text({ text: "{Nota>/numeroNota}" }),
                                new Label({ text: "Valor:" }),
                                new Text({ text: "{Nota>/valor}" }),
                                new Label({ text: "Nome do Cliente:" }),
                                new Text({ text: "{Nota>/cliente/nome}" }),
                                new Label({ text: "Nome do Fornecedor:" }),
                                new Text({ text: "{Nota>/fornecedor/nome}" })
                            ]
                        }),
                        endButton: new Button({
                            text: "Fechar",
                            press: function () {
                                this.oFixedSizeDialog.close();
                            }.bind(this)
                        })
                    });
        
                    this.getView().addDependent(this.oFixedSizeDialog);
                }
        
                this.oFixedSizeDialog.open();
            }.bind(this)).catch(function (error) {
                console.error("Erro ao carregar detalhes da nota:", error);
            });
        },       
    });
});
