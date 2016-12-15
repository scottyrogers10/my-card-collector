BASE.require([
		"jQuery",
        "BASE.data.DataContext"
], function () {

    BASE.namespace("components.gem.forms");

    var Future = BASE.async.Future;
    var Fulfillment = BASE.async.Fulfillment;
    var emptyFuture = Future.fromResult();
    var DataContext = BASE.data.DataContext;

    components.gem.forms.OneToManyCollection = function (elem, tags, services) {
        var self = this;
        var $elem = $(elem);
        var $ok = $(tags["ok"]);
        var collectionForm = $(tags["collection"]).controller();
        var confirmDeleteModalFuture = null;
        var dialogModalFuture = null;
        var entityFormFuture = null;
        var entityViewFuture = null;
        var fulfillment = null;
        var parentEntity = null;
        var relationship = null;
        var displayService = null;
        var savingDialogModalFuture = null;
        var window = null;
        var array = null;

        var getEntityViewFuture = function (viewComponent) {
            if (entityViewFuture == null) {
                return entityViewFuture = services.get("windowService").createModalAsync({
                    componentName: viewComponent.name,
                    height: viewComponent.size && viewComponent.size.height || 500,
                    width: viewComponent.size && viewComponent.size.width || 800
                })
            }

            return entityViewFuture;
        };

        var getConfirmDeleteModal = function () {
            if (confirmDeleteModalFuture == null) {
                return confirmDeleteModalFuture = services.get("windowService").createModalAsync({
                    componentName: "gem-confirm",
                    height: 150,
                    width: 350
                })
            }

            return confirmDeleteModalFuture;
        };

        var getDialogModal = function () {
            if (dialogModalFuture == null) {
                return dialogModalFuture = services.get("windowService").createModalAsync({
                    componentName: "gem-dialog",
                    height: 150,
                    width: 350
                })
            }

            return dialogModalFuture;
        };

        var getSavingDialog = function () {
            if (savingDialogModalFuture == null) {
                return savingDialogModalFuture = services.get("windowService").createModalAsync({
                    componentName: "gem-saving-dialog"
                })
            }

            return savingDialogModalFuture;
        };

        var getEntityFormModal = function () {
            if (entityFormFuture == null) {
                return entityFormFuture = services.get("windowService").createModalAsync({
                    componentName: "gem-one-to-many-collection-entity-form",
                    height: 500,
                    width: 800
                })
            }

            return entityFormFuture;
        };

        var setupWindow = function (typeDisplay, window) {
            if (typeDisplay.windowSize) {
                window.setSize(typeDisplay.windowSize);
            }

            if (typeDisplay.maxWindowSize) {
                window.setMaxSize(typeDisplay.maxWindowSize);
            }

            if (typeDisplay.minWindowSize) {
                window.setMinSize(typeDisplay.minWindowSize);
            }
        };

        self.prepareToDeactivateAsync = function () {
            fulfillment.setValue(parentEntity[relationship.hasMany]);
        };

        self.activated = function () {
            collectionForm.focusSearch();
        };

        self.validateAsync = function () { };

        self.saveAsync = function () { };

        self.setConfigAsync = function (config) {
            fulfillment = new Fulfillment();
            displayService = config.displayService;
            parentEntity = config.entity;
            relationship = config.relationship;

            var array;
            var edm = displayService.service.getEdm();
            var keys = edm.getPrimaryKeyProperties(relationship.ofType).concat(edm.getAllKeyProperties(relationship.ofType));
            var Type = relationship.ofType;
            var typeDisplay = displayService.getDisplayByType(Type);
            var queryable;
            var delegate = {
                actions: []
            };

            // If the parent isn't saved remotely use in memory.
            if (parentEntity[relationship.hasKey] == null) {
                array = [];
                queryable = array.asQueryable();

                if (typeDisplay.canAdd) {

                    delegate.actions.push({
                        name: "create",
                        label: function () {
                            return "Create";
                        },
                        isActionable: function () {
                            return true;
                        },
                        isPrimary: true,
                        callback: function (items) {
                            var entity = new Type();

                            var window = null;
                            return getEntityFormModal().chain(function (windowManager) {
                                window = windowManager.window;

                                window.setName("Create new " + typeDisplay.labelInstance());

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
                            }).try();
                        }
                    });
                }

                if (typeDisplay.canEdit) {
                    var edit = {
                        name: "edit",
                        label: function () {
                            return "Edit";
                        },
                        isActionable: function (items) {
                            return items.length === 1;
                        },
                        isPrimary: false,
                        callback: function (items, itemsListData) {
                            var entity = items[0];
                            var index = itemsListData[0].index;

                            var window = null;
                            return getEntityFormModal().chain(function (windowManager) {
                                window = windowManager.window;

                                window.setName("Edit " + typeDisplay.labelInstance());

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
                                collectionForm.reloadItemAtIndex(index, entity);
                            }).finally(function () {
                                return window.closeAsync().try();
                            }).try();
                        }
                    };

                    delegate.actions.push(edit);

                    delegate.select = function (item, index) {
                        edit.callback([item], [{ entity: item, index, index }]);
                    };

                }

                if (typeDisplay.canDelete) {
                    delegate.actions.push({
                        name: "delete",
                        label: function () {
                            return "Delete";
                        },
                        isActionable: function (items) {
                            return items.length > 0;
                        },
                        isPrimary: false,
                        callback: function (items) {
                            return getConfirmDeleteModal().chain(function (windowManager) {
                                var controller = windowManager.controller;
                                var confirmFuture = controller.getConfirmationForMessageAsync("Are you sure you want to delete these items?");

                                windowManager.window.showAsync().try();

                                return confirmFuture;
                            }).chain(function () {

                                items.forEach(function (item) {
                                    var index = parentEntity[relationship.hasMany].indexOf(item);

                                    if (index > -1) {
                                        parentEntity[relationship.hasMany].splice(index, 1);
                                    }

                                    index = array.indexOf(item);

                                    if (index > -1) {
                                        array.splice(index, 1);
                                    }
                                });

                            }).chain(function () {
                                collectionForm.searchAsync().try();
                            }).try();
                        }
                    });
                }

            } else {
                queryable = displayService.service.asQueryable(relationship.ofType).where(function (expBuilder) {
                    return expBuilder.property(relationship.withForeignKey).isEqualTo(parentEntity[relationship.hasKey]);
                });

                if (typeDisplay.canAdd) {

                    delegate.actions.push({
                        name: "create",
                        label: function () {
                            return "Create";
                        },
                        isActionable: function (items) {
                            return true;
                        },
                        isPrimary: true,
                        callback: function () {
                            var entity = new Type();
                            var dataContext = new DataContext(displayService.service);
                            entity = dataContext.loadEntity(entity);

                            var window = null;
                            return getEntityFormModal().chain(function (windowManager) {
                                window = windowManager.window;

                                window.setName("Create new " + typeDisplay.labelInstance());

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
                                entity[relationship.withForeignKey] = parentEntity[relationship.hasKey];
                                var savingFuture = dataContext.saveChangesAsync();

                                return getSavingDialog().chain(function (windowManager) {
                                    return windowManager.controller.handleSavingFuture(savingFuture);
                                });

                            }).chain(function () {
                                collectionForm.searchAsync("").try();
                            }).finally(function () {
                                dataContext.dispose();
                                window.closeAsync().try();
                            }).try();
                        }
                    });

                }

                if (typeDisplay.canEdit) {
                    var edit = {
                        name: "edit",
                        label: function () {
                            return "Edit";
                        },
                        isActionable: function (items) {
                            return items.length === 1;
                        },
                        isPrimary: false,
                        callback: function (items, itemsListData) {
                            var entity = items[0];
                            var index = itemsListData[0].index;
                            var window = null;

                            var firstEntity = entity;

                            var dataContext = new DataContext(displayService.service);
                            entity = dataContext.loadEntity(entity);

                            return getEntityFormModal().chain(function (windowManager) {
                                window = windowManager.window;

                                window.setName("Edit " + typeDisplay.labelInstance());

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
                                var savingFuture = dataContext.saveChangesAsync();

                                return getSavingDialog().chain(function (windowManager) {
                                    return windowManager.controller.handleSavingFuture(savingFuture);
                                });

                            }).chain(function () {
                                collectionForm.reloadItemAtIndex(index, entity);
                            }).finally(function () {
                                dataContext.dispose();
                                window.closeAsync().try();
                            }).try();
                        }
                    };

                    delegate.actions.push(edit);

                    delegate.select = function (item, index) {
                        edit.callback([item], [{ entity: item, index, index }]);
                    };
                }

                if (typeDisplay.canDelete) {

                    delegate.actions.push({
                        name: "delete",
                        label: function () {
                            return "Delete";
                        },
                        isActionable: function (items) {
                            return items.length > 0;
                        },
                        isPrimary: false,
                        callback: function (items) {
                            var window;

                            return getConfirmDeleteModal().chain(function (windowManager) {
                                var controller = windowManager.controller;
                                var confirmFuture = controller.getConfirmationForMessageAsync("Are you sure you want to delete these items?");
                                window = windowManager.window;

                                windowManager.window.showAsync().try();

                                return confirmFuture;
                            }).chain(function () {
                                var removeItemFutures = items.map(function (item) {
                                    if (!relationship.optional) {
                                        return displayService.service.remove(Type, item);
                                    } else {
                                        var updates = {};
                                        updates[relationship.withForeignKey] = null;
                                        return displayService.service.update(Type, item, updates);
                                    }
                                });

                                var savingFuture = Future.all(removeItemFutures);

                                return getSavingDialog().chain(function (windowManager) {
                                    return windowManager.controller.handleSavingFuture(savingFuture, {
                                        savingText: "Deleteing Items...",
                                        savedText: "Successfully Deleted Item" + (items.length > 1 ? "s" : "")
                                    });
                                });

                            }).chain(function () {
                                collectionForm.searchAsync().try();
                            }).finally(function () {
                                window.closeAsync().try();
                            }).try();
                        }
                    });

                }
            }

            delegate.getProperties = function () {
                return BASE.clone(typeDisplay.listProperties, true);
            };

            delegate.search = function (text, orderByAsc, orderByDesc) {
                return typeDisplay.search(queryable, text, orderByAsc, orderByDesc);
            };

            if (Array.isArray(typeDisplay.actions)) {
                typeDisplay.actions.forEach(function (action) {
                    delegate.actions.push(action);
                });
            }

            if (typeof typeDisplay.searchAsync === "function") {
                delegate.searchAsync = function () {
                    return typeDisplay.searchAsync.apply(typeDisplay, arguments);
                };
            }

            if (typeDisplay.viewComponent && typeDisplay.viewComponent.name) {
                delegate.select = function (entity, listIndex) {
                    return getEntityViewFuture(typeDisplay.viewComponent).chain(function (windowManager) {
                        windowManager.controller.setConfig({
                            entity: entity,
                            index: listIndex,
                            displaySevice: displayService,
                            delegate: delegate
                        });

                        windowManager.window.showAsync().try();
                    }).try();
                };
            }

            collectionForm.setDelegate(delegate);
            return fulfillment;
        };

    };
});