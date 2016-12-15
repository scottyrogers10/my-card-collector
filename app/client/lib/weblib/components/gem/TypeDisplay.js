BASE.require([
    "BASE.data.Edm",
    "String.prototype.toEnum",
    "String.prototype.toEnumFlag",
    "Number.prototype.toEnumString",
    "Number.prototype.toEnumFlagString",
    "Date.prototype.format",
    "String.prototype.trim",
    "BASE.query.Queryable"
], function () {
    BASE.namespace("components.gem");

    var prettifyRegex = /([A-Z]*?[A-Z]|^.)/g;
    var Queryable = BASE.query.Queryable;
    var Future = BASE.async.Future;

    var prettifyName = function (name) {
        return name.replace(prettifyRegex, function (match, part1, offset) {
            if (offset === 0) {
                return part1.toUpperCase();
            }
            return " " + part1.toUpperCase();
        });
    };

    /***********************************************************************/
    /*       These are all helpers methods for inputs and properties.      */
    /***********************************************************************/

    var createStringInput = function (propertyName, modelProperty) {
        var property = {
            name: propertyName,
            propertyName: propertyName,
            getValue: function (entity) {
                return entity[propertyName];
            },
            setValue: function (entity, value) {
                entity[propertyName] = value;
            },
            label: function () {
                return prettifyName(propertyName);
            },
            span: 6
        };

        if (typeof modelProperty.length === "number" && modelProperty.length > 255) {
            property.component = {
                name: "gem-textarea-input"
            };
        } else {
            property.component = {
                name: "gem-text-input"
            };
        }
        return property;
    };

    var createBooleanInput = function (propertyName) {
        var property = {
            name: propertyName,
            propertyName: propertyName,
            getValue: function (entity) {
                return entity[propertyName];
            },
            setValue: function (entity, value) {
                entity[propertyName] = value;
            },
            label: function () {
                return prettifyName(propertyName);
            },
            span: 6
        };

        property.component = {
            name: "gem-select-input",
            options: [{
                label: "Yes",
                value: true
            }, {
                label: "No",
                value: false
            }]
        };

        property.map = function (value) {
            return value === "true";
        };

        return property;
    };

    var createNumberInput = function (propertyName) {
        return  {
            name: propertyName,
            propertyName: propertyName,
            label: function () {
                return prettifyName(propertyName);
            },
            getValue: function (entity) {
                return entity[propertyName];
            },
            setValue: function (entity, value) {
                entity[propertyName] = value;
            },
            component: {
                name: "gem-number-input"
            },
            span: 6
        };
    };

    var createDateInput = function (propertyName) {
        var property = {
            name: propertyName,
            propertyName: propertyName,
            getValue: function (entity) {
                return entity[propertyName];
            },
            setValue: function (entity, value) {
                entity[propertyName] = value;
            },
            label: function () {
                return prettifyName(propertyName);
            },
            span: 6
        };

        property.component = {
            name: "gem-date-input"
        };

        return property;
    };

    var createDateTimeInput = function (propertyName) {
        var property = {
            name: propertyName,
            propertyName: propertyName,
            getValue: function (entity) {
                return entity[propertyName];
            },
            setValue: function (entity, value) {
                entity[propertyName] = value;
            },
            label: function () {
                return prettifyName(propertyName);
            },
            span: 6
        };

        property.component = {
            name: "gem-date-time-input"
        };

        return property;
    };

    var createEnumInput = function (propertyName, modelProperty) {
        var property = {
            name: propertyName,
            propertyName: propertyName,
            getValue: function (entity) {
                return entity[propertyName];
            },
            setValue: function (entity, value) {
                entity[propertyName] = value;
            },
            label: function () {
                return prettifyName(propertyName);
            },
            span: 6
        };

        var Type = modelProperty.genericTypeParameters[0];

        var options = Object.keys(Type).filter(function (key) {
            return Type[key] instanceof Enum;
        }).map(function (key) {
            var enumumeration = Type[key];
            return {
                label: enumumeration.displayName || enumumeration.name,
                value: enumumeration.valueOf()
            };
        });

        property.component = {
            name: "gem-select-input",
            options: options
        };

        property.map = function (value) { return parseInt(value, 10); };

        return property;
    };

    var createEnumFlagInput = function (propertyName, modelProperty) {
        var property = {
            name: propertyName,
            propertyName: propertyName,
            getValue: function (entity) {
                return entity[propertyName];
            },
            setValue: function (entity, value) {
                entity[propertyName] = value;
            },
            label: function () {
                return prettifyName(propertyName);
            },
            span: 6
        };
        var Type = modelProperty.genericTypeParameters[0];

        var options = Object.keys(Type).filter(function (key) {
            return Type[key] instanceof EnumFlag;
        }).map(function (key) {
            var enumumeration = Type[key];
            return {
                label: enumumeration.displayName || enumumeration.name,
                value: enumumeration.valueOf()
            };
        });

        property.component = {
            name: "gem-select-input",
            options: options
        };

        property.map = function (value) { return parseInt(value, 10); };

        return property;
    };

    var tokenize = function (text) {
        return text.split(" ").map(function (token) {
            return token.trim();
        }).filter(function (token) {
            return token.length > 0;
        });
    };

    var createStringSearchByListProperty = function (propertyName) {
        return function (queryable, tokenText, orderByAsc, orderByDesc) {
            var token = tokenText.trim();

            if (token) {
                queryable = queryable.or(function (expBuilder) {
                    return expBuilder.property(propertyName).contains(token);
                });
            }

            if (orderByAsc) {
                queryable = queryable.orderBy(function (expBuilder) {
                    return expBuilder.property(propertyName);
                });
            } else if (orderByDesc) {
                queryable = queryable.orderByDesc(function (expBuilder) {
                    return expBuilder.property(propertyName);
                });
            }

            return queryable;
        };
    };

    var createNumberSearchByListProperty = function (propertyName) {
        return function (queryable, tokenText, orderByAsc, orderByDesc) {
            var token = parseFloat(tokenText.trim());

            if (!isNaN(token)) {
                queryable = queryable.or(function (expBuilder) {
                    return expBuilder.property(propertyName).isEqualTo(token);
                });
            }

            if (orderByAsc) {
                queryable = queryable.orderBy(function (expBuilder) {
                    return expBuilder.property(propertyName);
                });
            } else if (orderByDesc) {
                queryable = queryable.orderByDesc(function (expBuilder) {
                    return expBuilder.property(propertyName);
                });
            }

            return queryable;
        };
    };

    var createDateSearchByListProperty = function (propertyName) {
        return function (queryable, tokenText, orderByAsc, orderByDesc) {
            var date = new Date(tokenText);
            date.setHours(0, 0, 0, 0);

            if (!isNaN(date.getTime()) && date.getFullYear() < 10000) {
                queryable = queryable.or(function (expBuilder) {
                    var nextDate = new Date(date);
                    nextDate.setDate(nextDate.getDate() + 1);

                    return expBuilder.and(
                        expBuilder.property(propertyName).isGreaterThanOrEqualTo(date),
                        expBuilder.property(propertyName).isLessThan(nextDate)
                        );
                });
            }

            if (orderByAsc) {
                queryable = queryable.orderBy(function (expBuilder) {
                    return expBuilder.property(propertyName);
                });
            } else if (orderByDesc) {
                queryable = queryable.orderByDesc(function (expBuilder) {
                    return expBuilder.property(propertyName);
                });
            }

            return queryable;
        };
    };

    var createBooleanSearchByListProperty = function (propertyName) {
        return function (queryable, tokenText, orderByAsc, orderByDesc) {
            if (orderByAsc) {
                queryable = queryable.orderBy(function (expBuilder) {
                    return expBuilder.property(propertyName);
                });
            } else if (orderByDesc) {
                queryable = queryable.orderByDesc(function (expBuilder) {
                    return expBuilder.property(propertyName);
                });
            }

            return queryable;
        };
    };

    var createEnumSearchByListProperty = function (propertyName) {
        return function (queryable, text, orderByAsc, orderByDesc) {
            if (orderByAsc) {
                queryable = queryable.orderBy(function (expBuilder) {
                    return expBuilder.property(propertyName);
                });
            } else if (orderByDesc) {
                queryable = queryable.orderByDesc(function (expBuilder) {
                    return expBuilder.property(propertyName);
                });
            }

            return queryable;
        };
    };

    /***********************************************************************/
    /*                          End of helpers.                            */
    /***********************************************************************/

    var TypeDisplay = function (Type, service, config) {
        var self = this;
        this.type = Type;
        this.edm = service.getEdm();
        this.primaryKeys = this.edm.getPrimaryKeyProperties(Type);
        this.keys = this.edm.getAllKeyProperties(Type).concat(this.primaryKeys);
        this.model = this.edm.getModelByType(Type);
        this.service = service;
        this.canAdd = true;
        this.canEdit = true;
        this.canDelete = true;
        this.canSelect = true;
        this.isExpirable = false;
        this.actions = [];
        this.generate();
    };

    TypeDisplay.prototype.search = function (queryable, text, orderByAsc, orderByDesc) {
        var tokens = tokenize(text);
        var listProperties = this.listProperties;

        if (tokens.length === 0) {
            tokens[0] = "";
        }

        return tokens.reduce(function (queryable, tokenText) {
            return queryable.merge(listProperties.reduce(function (queryable, listProperty) {
                var isOrderByAsc = orderByAsc.indexOf(listProperty.propertyName) > -1;
                var isOrderByDesc = orderByDesc.indexOf(listProperty.propertyName) > -1;

                var newQueryable = listProperty.search(queryable, tokenText, isOrderByAsc, isOrderByDesc);
                if (!(newQueryable instanceof Queryable)) {
                    throw new Error("Expected a Queryable to be returned from list property: " + listProperty.name);
                }

                return newQueryable;

            }, new Queryable()));

        }, queryable);
    };

    TypeDisplay.prototype.generate = function () {
        var model = this.model;
        var mainInputs = this.mainInputs = [];
        var tools = this.tools = [];
        var listProperties = this.listProperties = [];
        var relationships = this.createRelationshipProperties();
        var primaryKeys = this.primaryKeys;
        var primaryKey = primaryKeys[0];
        var keys = this.keys;

        Object.keys(model.properties).forEach(function (propertyName) {
            var modelProperty = model.properties[propertyName];

            var listProperty = {
                name: propertyName,
                propertyName: propertyName,
                getValue: function (entity) {
                    return entity[propertyName];
                },
                label: function () {
                    return prettifyName(propertyName);
                },
                display: function (value) {
                    if (value == null) {
                        return "";
                    }
                    return value;
                },
                isHidden: keys.indexOf(propertyName) > -1 ? true : false,
                isPrimaryKey: primaryKeys.indexOf(propertyName) > -1 ? true : false,
                width: 200
            };

            var relationshipConfig = relationships[propertyName];
            if (relationshipConfig) {

                if (relationshipConfig.relationship.withOne === propertyName) {
                    // One to many target will be an input instead of a tool.
                    mainInputs.push(relationshipConfig);
                } else {
                    // All other relationships are handled as tools.
                    tools.push(relationshipConfig);
                }

            } else if (modelProperty.type === String) {

                mainInputs.push(createStringInput(propertyName, modelProperty));
                listProperty.search = createStringSearchByListProperty(propertyName);
                listProperties.push(listProperty);

            } else if (modelProperty.type === Boolean) {

                mainInputs.push(createBooleanInput(propertyName));
                listProperty.search = createBooleanSearchByListProperty(propertyName);
                listProperties.push(listProperty);

            } else if (modelProperty.type === Double) {

                mainInputs.push(createNumberInput(propertyName));
                listProperty.search = createNumberSearchByListProperty(propertyName);
                listProperties.push(listProperty);

            } else if (modelProperty.type === Float) {

                mainInputs.push(createNumberInput(propertyName));
                listProperty.search = createNumberSearchByListProperty(propertyName);
                listProperties.push(listProperty);

            } else if (modelProperty.type === Integer) {

                mainInputs.push(createNumberInput(propertyName));
                listProperty.search = createNumberSearchByListProperty(propertyName);
                listProperties.push(listProperty);

            } else if (modelProperty.type === Binary) {

                mainInputs.push(createNumberInput(propertyName));
                listProperty.search = createNumberSearchByListProperty(propertyName);
                listProperties.push(listProperty);

            } else if (modelProperty.type === Byte) {

                mainInputs.push(createNumberInput(propertyName));
                listProperty.search = createNumberSearchByListProperty(propertyName);
                listProperties.push(listProperty);

            } else if (modelProperty.type === Decimal) {

                mainInputs.push(createNumberInput(propertyName));
                listProperty.search = createNumberSearchByListProperty(propertyName);
                listProperties.push(listProperty);

            } else if (modelProperty.type === DateTimeOffset) {

                mainInputs.push(createDateTimeInput(propertyName));
                listProperty.display = function (value) {
                    if (value == null) {
                        return "";
                    }
                    return value.format("mm/dd/yyyy");
                };

                listProperty.search = createDateSearchByListProperty(propertyName);
                listProperties.push(listProperty);

            } else if (modelProperty.type === Date) {

                mainInputs.push(createDateInput(propertyName));
                listProperty.display = function (value) {
                    if (value == null) {
                        return "";
                    }
                    return value.format("mm/dd/yyyy");
                };

                listProperty.search = createDateSearchByListProperty(propertyName);
                listProperties.push(listProperty);

            } else if (modelProperty.type === Location) {

            } else if (modelProperty.type === Enum) {

                mainInputs.push(createEnumInput(propertyName, modelProperty));
                listProperty.search = createEnumSearchByListProperty(propertyName);
                listProperties.push(listProperty);

            } else if (modelProperty.type === EnumFlag) {

                mainInputs.push(createEnumFlagInput(propertyName, modelProperty));
                listProperty.search = createEnumSearchByListProperty(propertyName);
                listProperties.push(listProperty);
            }

        });

    };

    TypeDisplay.prototype.labelInstance = function () {
        var model = this.model;

        if (typeof model.labelInstance === "function") {
            return model.labelInstance();
        } else if (typeof model.labelInstance === "string") {
            return model.labelInstance;
        } else {
            return prettifyName(model.collectionName);
        }
    };

    TypeDisplay.prototype.labelList = function () {
        var model = this.model;

        if (typeof model.labelList === "function") {
            return model.labelList();
        } else if (typeof model.labelList === "string") {
            return model.labelList;
        } else {
            return prettifyName(model.collectionName);
        }
    };

    TypeDisplay.prototype.displayInstance = function (instance) {
        var model = this.model;

        if (typeof model.displayInstance === "function") {
            return model.displayInstance(instance);
        } else {
            return Object.keys(instance).map(function (key) {
                return instance[key];
            }).join(", ");
        }
    };

    TypeDisplay.prototype.displayList = function (array) {
        var self = this;
        var model = this.model;

        if (typeof model.displayList === "function") {
            return model.displayList(instance);
        } else {
            return "( " + array.map(function (instance) {
                self.displayInstance(instance);
            }).join(" ), (") + " )"
        }
    };

    TypeDisplay.prototype.getInputByName = function (name) {
        var input = this.mainInputs.filter(function (input) {
            return input.name === name;
        })[0];

        if (input == null) {
            throw new Error("Couldn't find input with name: " + name);
        }

        return input;
    };

    TypeDisplay.prototype.getListPropertyByName = function (name) {
        var property = this.listProperties.filter(function (property) {
            return property.name === name;
        })[0];

        if (property == null) {
            throw new Error("Couldn't find list property with name: " + name);
        }

        return property;
    };

    TypeDisplay.prototype.getToolByName = function (name) {
        var tool = this.tools.filter(function (tool) {
            return tool.name === name;
        })[0];

        if (tool == null) {
            throw new Error("Couldn't find tool with name: " + name);
        }

        return tool;
    };

    TypeDisplay.prototype.configureInputByName = function (name, config) {
        var input = this.getInputByName(name);
        if (input != null) {
            Object.keys(config).forEach(function (key) {
                input[key] = config[key];
            });
        }
    };

    TypeDisplay.prototype.configureToolByName = function (name, config) {
        var tool = this.getToolByName(name);
        if (tool != null) {
            Object.keys(config).forEach(function (key) {
                tool[key] = config[key];
            });
        }
    };

    TypeDisplay.prototype.configureListPropertyByName = function (name, config) {
        var listProperty = this.getListPropertyByName(name);
        if (listProperty != null) {
            Object.keys(config).forEach(function (key) {
                listProperty[key] = config[key];
            });
        }
    };

    TypeDisplay.prototype.setSortOrderByNames = function (arrayOfNames) {
        var inputs = this.mainInputs.reduce(function (hash, input) {
            hash[input.propertyName] = input;
            return hash;
        }, {});

        var tools = this.tools.reduce(function (hash, tool) {
            hash[tool.name] = tool;
            return hash;
        }, {});

        var listProperties = this.listProperties.reduce(function (hash, property) {
            hash[property.propertyName] = property;
            return hash;
        }, {});

        arrayOfNames.forEach(function (name, index) {
            if (inputs[name]) {
                inputs[name].sortOrder = index;
            }

            if (tools[name]) {
                tools[name].sortOrder = index;
            }

            if (listProperties[name]) {
                listProperties[name].sortOrder = index;
            }
        });
    };

    TypeDisplay.prototype.setToolSortOrderByName = function (name, value) {
        var tool = this.getToolByName(name);
        tool.sortOrder = value;
    };

    TypeDisplay.prototype.setInputValidationByName = function (name, validationAsync) {
        var input = this.getInputByName(name);
        input.validationAsync = validationAsync;
    };

    TypeDisplay.prototype.setInputSortOrderByName = function (name, value) {
        var input = this.getInputByName(name);
        input.sortOrder = value;
    };

    TypeDisplay.prototype.setInputAsReadOnlyByName = function (name) {
        var input = this.getInputByName(name);
        input.readOnly = true;
    };

    TypeDisplay.prototype.setListPropertySortOrderByName = function (name, value) {
        var property = this.getListPropertyByName(name);
        property.sortOrder = value;
    };

    TypeDisplay.prototype.setPropertySortOrderByName = function (name, value) {
        var input = this.getInputByName(name);
        var property = this.getListPropertyByName(name);

        input.sortOrder = value;
        property.sortOrder = value;
    };

    TypeDisplay.prototype.removeListPropertyByName = function (name) {
        this.listProperties = this.listProperties.filter(function (property) {
            return property.name !== name;
        });
    };

    TypeDisplay.prototype.removeInputByName = function (name) {
        this.mainInputs = this.mainInputs.filter(function (property) {
            return property.name !== name;
        });
    };

    TypeDisplay.prototype.removeToolByName = function (name) {
        this.tools = this.tools.filter(function (property) {
            return property.name !== name;
        });
    };

    TypeDisplay.prototype.showId = function () {
        var primaryKey = this.primaryKeys[0];

        if (primaryKey == null) {
            return;
        }

        this.listProperties.push({
            name: "ID",
            propertyName: "ID",
            getValue: function (entity) {
                return entity[primaryKey];
            },
            label: function () {
                return "ID";
            },
            display: function (value) {
                if (value == null) {
                    return "";
                }
                return value;
            },
            search: function (queryable, tokenText, orderByAsc, orderByDesc) {
                var token = parseFloat(tokenText.trim());

                if (!isNaN(token)) {
                    queryable = queryable.or(function (expBuilder) {
                        return expBuilder.property(primaryKey).isEqualTo(token);
                    });
                }

                if (orderByAsc) {
                    queryable = queryable.orderBy(function (expBuilder) {
                        return expBuilder.property(primaryKey);
                    });
                } else if (orderByDesc) {
                    queryable = queryable.orderByDesc(function (expBuilder) {
                        return expBuilder.property(primaryKey);
                    });
                }

                return queryable;
            },
            width: 100
        });
    };

    TypeDisplay.prototype.setAsExpirable = function (readOnly) {
        if (!this.isExpirable) {
            this.isExpirable = true;

            // Remove these inputs from showing up on the main form.
            this.mainInputs = this.mainInputs.filter(function (input) {
                return input.propertyName !== "endDate" && input.propertyName !== "isExpired"
            });

            // Remove these inputs from showing up on the main form.
            this.listProperties = this.listProperties.filter(function (property) {
                return property.propertyName !== "endDate" && property.propertyName !== "isExpired"
            });

            var startDateInput;

            try {
                startDateInput = this.getInputByName("startDate")
            } catch (e) {
                console.log("Model missing startDate!!!  Expirable objects always have startDates. Collection " + this.model.collectionName);
            }

            if (startDateInput) {
                startDateInput.readOnly = readOnly || false;
            }

            var oldSearch = this.search;
            var typeDisplay = this;

            this.search = function (queryable, text, orderByAsc, orderByDesc) {
                var queryable = oldSearch.apply(typeDisplay, arguments);
                return queryable.and(function (expBuilder) {
                    return expBuilder.property("isExpired").isEqualTo(false);
                });
            };
        }
    };

    TypeDisplay.prototype.setToolAsHistoricalCollection = function (name) {
        var tool = this.getToolByName(name);

        if (tool == null) {
            throw new Error("Couldn't find tool by the name: " + name + ".");
        }

        tool.component = {
            name: "gem-historical-collection"
        };
    };

    TypeDisplay.prototype.setToolAsManyToManyHistoricalCollection = function (name) {
        var tool = this.getToolByName(name);

        if (tool == null) {
            throw new Error("Couldn't find tool by the name: " + name + ".");
        }

        var edm = this.edm;
        var Type = tool.relationship.type;
        var mappingType = tool.relationship.ofType;
        var relationships = edm.getOneToManyAsTargetRelationships(new mappingType());

        tool.mappingType = mappingType;


        if (relationships[0].type === Type) {
            tool.targetType = relationships[1].type;
            tool.mappingPropertyName = relationships[1].withForeignKey;
        } else {
            tool.targetType = relationships[0].type;
            tool.mappingPropertyName = relationships[0].withForeignKey;
        }

        tool.component = {
            name: "gem-many-to-many-historical-collection"
        };

    };

    TypeDisplay.prototype.setInputPropertiesAsRequired = function (propertyNames) {
        var self = this;
        var inputs = propertyNames.forEach(function (name) {
            var input = self.getInputByName(name);

            input.validateAsync = function (value) {
                if (value === null) {
                    return Future.fromError(new Error("Required"));
                }
                return Future.fromResult();
            };
        });

    };

    TypeDisplay.prototype.setSearchableListProperties = function (properties) {
        
        this.listProperties.forEach(function (property) {
            var index = properties.indexOf(property.name);
            if (index == -1) {
                property.search = function (queryable, token, isOrderAsc, isOrderDesc) {
                    if (isOrderAsc) {
                        queryable = queryable.orderBy(function (expBuilder) {
                            return expBuilder.property(property.propertyName);
                        });
                    }

                    if (isOrderDesc) {
                        queryable = queryable.orderByDesc(function (expBuilder) {
                            return expBuilder.property(property.propertyName);
                        });
                    }

                    return queryable;
                };
            }
        });
    };

    TypeDisplay.prototype.setToolAsSingleHistoricalCollection = function (name) {
        var tool = this.getToolByName(name);

        if (tool == null) {
            throw new Error("Couldn't find tool by the name: " + name + ".");
        }

        tool.component = {
            name: "gem-single-historical-collection"
        };
    };

    TypeDisplay.prototype.asQueryable = function () {
        return this.service.asQueryable(this.type);
    };

    TypeDisplay.prototype.createRelationshipProperties = function () {
        var instance = new this.type();
        var edm = this.edm;
        var model = this.model;
        var relationships = {};
        var oneToOne = edm.getOneToOneRelationships(instance);
        var oneToMany = edm.getOneToManyRelationships(instance);
        var manyToMany = edm.getManyToManyRelationships(instance);
        var oneToOneTargets = edm.getOneToOneAsTargetRelationships(instance);
        var oneToManyTargets = edm.getOneToManyAsTargetRelationships(instance);
        var manyToManyTargets = edm.getManyToManyAsTargetRelationships(instance);

        oneToOne.forEach(function (relationship) {
            relationships[relationship.hasOne] = {
                name: relationship.hasOne,
                relationship: relationship,
                label: function () {
                    return prettifyName(relationship.hasOne);
                },
                component: {
                    name: "gem-one-to-one-form"
                }
            };
        });

        oneToMany.forEach(function (relationship) {
            if (relationship.optional) {
                relationships[relationship.hasMany] = {
                    name: relationship.hasMany,
                    relationship: relationship,
                    label: function () {
                        return prettifyName(relationship.hasMany);
                    },
                    component: {
                        name: "gem-one-to-many-collection-optional-form"
                    }
                };
            } else {
                relationships[relationship.hasMany] = {
                    name: relationship.hasMany,
                    relationship: relationship,
                    label: function () {
                        return prettifyName(relationship.hasMany);
                    },
                    component: {
                        name: "gem-one-to-many-collection-form"
                    }
                };
            }
        });

        manyToMany.forEach(function (relationship) {
            relationships[relationship.hasMany] = {
                name: relationship.hasMany,
                relationship: relationship,
                label: function () {
                    return prettifyName(relationship.hasMany);
                },
                component: {
                    name: "gem-many-to-many-form"
                }
            };
        });

        oneToOneTargets.forEach(function (relationship) {
            //relationships[relationship.withOne] = {
            //    name: relationship.withOne,
            //    relationship: relationship,
            //    label: function () {
            //        return prettifyName(relationship.withOne);
            //    },
            //    component: {
            //        name: "gem-one-to-one-target-form"
            //    }
            //};
        });

        oneToManyTargets.forEach(function (relationship) {
            relationships[relationship.withOne] = {
                name: relationship.withOne,
                propertyName: relationship.withOne,
                relationship: relationship,
                label: function () {
                    return prettifyName(relationship.withOne);
                },
                component: {
                    name: "gem-one-to-many-target-input"
                },
                span: 6
            };
        });

        manyToManyTargets.forEach(function (relationship) {
            relationships[relationship.withMany] = {
                name: relationship.withMany,
                relationship: relationship,
                label: function () {
                    return prettifyName(relationship.withMany);
                },
                component: {
                    name: "gem-many-to-many-target-form"
                }
            };
        });

        return relationships;
    };

    components.gem.TypeDisplay = TypeDisplay;

});