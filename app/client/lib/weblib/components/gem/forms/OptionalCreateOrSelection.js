BASE.require([
    "jQuery",
    "BASE.async.Fulfillment",
    "BASE.data.DataContext"
], function () {

    BASE.namespace("components.gem.forms");

    var Future = BASE.async.Future;
    var Fulfillment = BASE.async.Fulfillment;

    components.gem.forms.OptionalCreateOrSelection = function (elem, tags, services) {
        var self = this;
        var $elem = $(elem);
        var $createNewButton = $(tags["create-new-button"]);
        var $fromExistingButton = $(tags["from-existing-button"]);

        var fulfillment = null;
        var window = null;
        var entityFormFuture = null;
        var selectionFormFuture = null;
        var displayService = null;
        var typeDisplay = null;
        var parentEntity = null;
        var relationship = null;

        var getEntityFormModal = function () {
            if (entityFormFuture == null) {
                var windowService = services.get("windowService");
                entityFormFuture = windowService.createModalAsync({
                    componentName: "gem-one-to-many-collection-entity-form",
                    height: 500,
                    width: 800
                });
            } else {
                return entityFormFuture;
            }
        };

        var getSelectionFormAsync = function () {
            if (selectionFormFuture == null) {
                var windowService = services.get("windowService");
                selectionFormFuture = windowService.createModalAsync({
                    componentName: "gem-selection-entity-form",
                    height: 600,
                    width: 400
                });
            } else {
                return selectionFormFuture;
            }
        };

        var openSelectionFormAsync = function () {
            var window;
            return getSelectionFormAsync().chain(function (windowManager) {
                var controller = windowManager.controller;
                window = windowManager.window;
                window.setName("Select An Existing " + typeDisplay.labelInstance());

                return controller.getEntityAsync({
                    displayService: displayService,
                    typeDisplay: typeDisplay,
                    parentEntity: parentEntity,
                    relationship: relationship
                }).chain(function (entity) {

                });
            });
        };

        var openEntityFormAsync = function () {
            var entity = new Type();
            var dataContext = new DataContext(displayService.service);
            entity = dataContext.loadEntity(entity);

            var window = null;
            return getEntityFormModal().chain(function (windowManager) {
                window = windowManager.window;

                window.setName("Create " + typeDisplay.labelInstance());

                setupWindow(typeDisplay, window);

                var controller = windowManager.controller;
                var saveFuture = controller.setConfigAsync({
                    displayService: displayService,
                    parentEntity: parentEntity,
                    entity: entity,
                    relationship: relationship
                });

                windowManager.window.showAsync().try();
                return saveFuture
            }).chain(function (entity) {
                entity[relationship.withForeignKey] = parentEntity[relationship.hasKey];
                return dataContext.saveChangesAsync();
            }).catch(function (error) {
                return getDialogModal().chain(function (windowManager) {
                    var dialogWindow = windowManager.window;
                    var controller = windowManager.controller;

                    var fulfillment = controller.getConfirmationForMessageAsync("There was an error while saving: " + error.message);

                    dialogWindow.setName("Error");
                    dialogWindow.setColor("#c70000");

                    return dialogWindow.showAsync().chain(function () {
                        return fulfillment;
                    });
                });
            }).chain(function () {
                collectionForm.searchAsync("").try();
            }).finally(function () {
                dataContext.dispose();
                window.closeAsync().try();
            });
        };

        var openInMemoryEntityFormAsync = function () {
            var entity = new Type();

            var window = null;
            return getEntityFormModal().chain(function (windowManager) {
                window = windowManager.window;

                window.setName("Create " + typeDisplay.labelInstance());

                setupWindow(typeDisplay, window);

                var controller = windowManager.controller;
                var saveFuture = controller.setConfigAsync({
                    displayService: displayService,
                    parentEntity: parentEntity,
                    entity: entity,
                    relationship: relationship
                });

                windowManager.window.showAsync().try();
                return saveFuture
            }).chain(function () {
                array.push(entity);
                parentEntity[relationship.hasMany].push(entity);
            }).chain(function () {
                collectionForm.searchAsync("").try();
            }).finally(function () {
                window.closeAsync().try();
            });
        };

        self.getEntityAsync = function (config) {
            fulfillment = new Fulfillment();
            displayService = config.displayService;
            parentEntity = config.entity;
            relationship = config.relationship;
            typeDisplay = displayService.getDisplayByType(relationship.ofType);
        };

        self.init = function (windowValue) {
            window = windowValue;
            window.setName("Select Option");
            window.setSize({
                width: 300,
                height: 180
            });
        };

        self.activated = function () {
            window.disableResize();
            window.disableMove();
            window.hideMaximizeButton();
        };

        $createNewButton.on("click", function () {
            var openFuture;

            if (parentEntity[relationship.hasKey] === null) {
                openFuture = openInMemoryEntityFormAsync();
            } else {
                openFuture = openEntityFormAsync();
            }

            openFuture.chain(function () {
                return window.closeAsync();
            }).try();
        });

        $fromExistingButton.on("click", function () {
            openSelectionFormAsync().chain(function () {
                return window.closeAsync();
            }).try();
        });

    };

});