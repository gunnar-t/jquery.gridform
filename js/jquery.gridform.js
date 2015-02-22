/** @namespace */
var gridform = gridform || {};
/**
 * jquery.gridform v0.4 alpha
 *
 * Built as jQuery PlugIn for usage with bootstrap 3.x
 * can be overwritten for usage with other libs
 *
 * (c) Gunnar Thies, 2014
 *
 * MIT-License 2014
 *
 */
(function ($) {

	gridform.forms = {};
	gridform.types = {};
    
    //Extend jquery with an "all" method for promises
    //Thanks to when.js (https://github.com/cujojs/when)
    if ($.when.all===undefined) {
        $.when.all = function(deferreds) {
            var deferred = new $.Deferred();
            $.when.apply($, deferreds).then(
                function() {
                    deferred.resolve(Array.prototype.slice.call(arguments));
                },
                function() {
                    deferred.fail(Array.prototype.slice.call(arguments));
                });

            return deferred;
        }
    }

	/**
	 * Gridform base object
	 *
	 * This is the constructor for any gridform object.
	 *
	 * @class gridform.form
	 * @param settings {Object} JSON object with all the settings
	 */
	gridform.form = function (settings) {
		return this.init(settings);
	};

	/**
	 * Prototype for the gridform
	 */
	gridform.form.prototype = {

		settings : null,
		fieldsById : {},
		renderedAtTarget : null,
		rendered : null,
		fieldCount : null,
        hiddenFields: null,
		//default settings that can be overwritten on prototype level :)
		defaultSettings : {
			// These are the defaults.
			//Debug mode
			debug : false,
			//Mode is edit / you can switch to view-mode
			mode : 'edit',
			//LabelType: inline vs. over
			labelType : 'inline',
			//Alignment of labels; default: right
			labelAlign : 'right',
			//directly show error tooltips
			showTooltipInstantly : false,
			//where to show the tooltips
			tooltipOrientation : "bottom",
			//success should not be shown by green color (if you do not want a rainbow coloured form :))
			successIsGreen : false,
			//use font-awesome for checkboxes and radio-buttons
			useFontAwesome : false,
            //use iCheck for nicer checkboxes (if so, font-awesome is ignored for checkboxes and radio buttons)
            useICheck: false,
			//mark mandatory fields by an asterisk
			markMandatoryFields : true,
			//Icons for the status
			icon_success : 'glyphicon glyphicon-ok',
			icon_error : 'glyphicon glyphicon-remove',
			icon_warning : 'glyphicon glyphicon-warning-sign',
			icon_waiting : 'glyphicon glyphicon-refresh',
			//language
			language : {
				// this is shown as error message for a mandatory field
				'mandatoryField' : 'This is a mandatory field',
				// this is shown when a field is in loading state
				'loading' : 'Loading ...',
				// this is the placeholder element in a not yet selected select box
				'selectPlaceholder' : '-',
			},
			//dimensions
			dimensions : {},

		},

		/**
		 * Init the gridform object
		 *
		 * @param userSettings {Object} JSON object with all the settings
		 */
		init : function (userSettings) {

			//Settings
			this.settings = $.extend({}, this.defaultSettings, userSettings);
                    
            //If iCheck should be used..the types "radio" and "checkbox", "boolean" are overwritten to
            //"iradio", "icheckbox", "iboolean"
            if(this.settings.useICheck !== false){
                for(var x in this.settings.fields){
                    var type = this.settings.fields[x]['type'];
                    if(type == "checkbox" || type == "boolean" || type == "radio"){
                        this.settings.fields[x]['type'] = "i"+type;
                    }
                }
            } else {
            
                //Maybe some types of iradio, icheck or iboolean needs to be corrected to the basic types
                for(var x in this.settings.fields){
                    var type = this.settings.fields[x]['type'];
                    if(type == "icheckbox" || type == "iboolean" || type == "iradio"){
                        this.settings.fields[x]['type'] = type.substr(1);
                    }
                }
            
            }

			return this;

		},

		/**
		 * Render the grid to the given selector
		 *
		 * @param target {Object} Target object
		 * @param debugOptions {Object} JSON object with debug settings (optional)
		 */
		render : function (target, debugOptions) {

			//Reset the field count, otherwise the validation is not working
			this.fieldCount = 0;
			this.rendered = 0;
			this.fieldsById = {};
            this.hiddenFields = {};
            
			//If target is an object, it needs the selector property
			if (typeof target === "object") {
				if (target.selector === undefined)
					return false;
				else
					target = target.selector;
			}
			//Try to search for a given element (if not undefined)
			if (target !== undefined && $(target).length !== 1)
				return false;
			//Target or predefined setting
			this.settings.target = (target !== undefined) ? target : this.settings.target;
			//Is the current target existing
			if ($(this.settings.target).length !== 1)
				return false;
			//Delete all html code from the target before (even if it is the same!!)
			$(this.renderedAtTarget).html("");

			this.rendered += 1;
			this.renderedAtTarget = this.settings.target;

			//Build the grid table
			var html = this.__buildTable(debugOptions);
			//Set the grid to the target
			$(this.settings.target).html(html);
			//Now render all the field-contents
			this.__buildContents(debugOptions);

			//If a record is given, load the data
			this.setData(this.settings.record);

			//Fire event after finalizing the render method
			$(gridform.forms[this.settings.name]).trigger("rendered", [{'rendered' : this.rendered}]);

			return this;
		},

		/**
		 * Build the html table for the grid
		 *
		 * @ignore
		 * @param debugOptions {Object} JSON object with debug settings (optional)
		 */
		__buildTable : function (debugOptions) {

			//Check how many rows and cols we need
			this.cols = 0;
			this.rows = 0;
			var fields = {};
			this.focusOnField = null;

			for (var x in this.settings.fields) {
				//Get row and col by splitting the key at the _
				var splitting = x.split("_");

				var r = parseInt(splitting[0], 10);
				var c = parseInt(splitting[1], 10);
				//If row or col is non numeric the fild is ignored!
				if (isNaN(c) || isNaN(r)) {
					console.error("The field " + this.settings.fields[x].id + " is missing correct row and col parameter!");
					continue;
				}
				this.cols = (c > this.cols) ? c : this.cols;
				this.rows = (r > this.rows) ? r : this.rows;

				//For the index by id...
				this.settings.fields[x].row = r;
				this.settings.fields[x].col = c;

				//Is the field id free or already taken?!
				if (this.fieldsById[this.settings.fields[x].id] !== undefined) {
					console.error("The id '" + this.settings.fields[x].id + "' is already taken, the field is deleted from the grid!");
					delete this.settings.fields[x];
				} else {
					//Add the field
					this.fieldsById[this.settings.fields[x].id] = this.settings.fields[x];

					//check if this field wants the focus
					if (this.settings.fields[x].hasFocus === true) {
						if (this.focusOnField === null) {
							this.focusOnField = this.settings.fields[x].id;
						} else {
							console.error("Focus is already configured for field '" + this.focusOnField + "'.");
						}
					}

					//counter for the number of fields (if the can be validated and contain data)
					if (gridform.types[this.settings.fields[x].type] !== undefined && gridform.types[this.settings.fields[x].type].containsData === true) {
						this.fieldCount++;
					}
				}

			}

			//Nice for more complex formulars :)
			//Colspanned cells
			var spannedCells = {};

			var showCellNames = false;
			if (debugOptions !== undefined && debugOptions.showCellNames === true) {
				showCellNames = true;
			}

			var labelAlign = 'left';
			if (this.settings.labelAlign === "right") {
				labelAlign = "right";
			} else if (this.settings.labelAlign === "left") {
				labelAlign = "left";
			}

			//Build the table
            var debugClass = (showCellNames)? 'gridformDebug': '';
			var html = '<table class="gridform '+debugClass+'" border=0><tbody>';

			if (this.settings.labelType === "inline") {

				//Build an empty row to set the column widths as set by the settings
				html += '<tr class="'+debugClass+'">';
				for (var c = 1; c <= this.cols; c++) {
					var labelWidth = '';
					var contentWidth = '';
					if (this.settings.dimensions['col_' + c] !== undefined) {
						labelWidth = (this.settings.dimensions['col_' + c].labelWidth !== undefined) ? 'width:' + this.settings.dimensions['col_' + c].labelWidth : '';
						contentWidth = (this.settings.dimensions['col_' + c].contentWidth !== undefined) ? 'width:' + this.settings.dimensions['col_' + c].contentWidth : '';
					}
					html += '<td class="'+debugClass+'" style="' + labelWidth + '"></td>';
					html += '<td class="'+debugClass+'" style="' + contentWidth + '"></td>';
				}
				html += '</tr>';

				for (var r = 1; r <= this.rows; r++) {
					//Build all cells in that row
					html += '<tr>';
					for (var c = 1; c <= this.cols; c++) {
						//Row and col identifier
						var rc = r + '_' + c;

						//Do we have a field at this position?
						if (this.settings.fields[rc] === undefined) {

							if (spannedCells[rc] !== undefined) {
								//This field is "colspanned" but empty, so no problem!
								continue;
							}

							//No field configured ... empty cells
							html += '<td data-id="' + rc + '" class="gridform_content '+debugClass+'" colspan="2">';
							if (showCellNames)html += rc;
							html += '</td>';
						} else {

							//There is a field, therefore (if a label is configured) place for a label and a field-container
							if (spannedCells[rc] !== undefined) {
								//Sorry, but this field cannot be placed here?!
								console.error("The field '" + this.settings.fields[rc].id + "' cannot be placed at '" + rc + "'. This cell is colspanned by field '" + spannedCells[rc] + "'");
								continue;
							}
							//Has the field a colspan ?!
							var colspan = 1;
							if (this.settings.fields[rc].colspan !== undefined) {
								colspan = parseInt(this.settings.fields[rc].colspan, 10);
							}
							//Has the field a rowspan
							var rowspan = 1;
							if (this.settings.fields[rc].rowspan !== undefined) {
								rowspan = parseInt(this.settings.fields[rc].rowspan, 10);
							}

							//If there is some rowspan, then the next rows (that are "spanned") needs to be ignored
							for (var x = r; x < (r + rowspan); x++) {
								//If there is some colspan, then the next cells (that are "spanned") needs to be ignored
								for (var y = c; y < c + colspan; y++) {
									if (this.settings.debug)console.log("The cell " + x + '_' + y + " is filled by field '" + this.settings.fields[rc].id + "'");
									spannedCells[x + '_' + y] = this.settings.fields[rc].id;
								}

							}

							//True colspan
							colspan = (colspan * 2) - 1;

							//Place for an label
							//is a label allowed for the type?
							var labelAllowed = (gridform.types[this.settings.fields[rc].type] !== undefined && gridform.types[this.settings.fields[rc].type].labelAllowed === false) ? false : true;

							if (this.settings.fields[rc].label === undefined || labelAllowed === false) {
								//colspan plus one (there is no label!)
								colspan++;
								html += '<td data-id="' + rc + '" class="gridform_content '+debugClass+'" colspan="' + colspan + '" rowspan="' + rowspan + '">';
								if (showCellNames)html += rc + ' ' + this.settings.fields[rc].label;
								html += '</td>';
							} else {
								//Label and ... field

								html += '<td data-id="' + rc + '" class="gridform_label '+debugClass+'" style="text-align:' + labelAlign + ';" rowspan="' + rowspan + '">';
								if (showCellNames)
									html += '<small>' + rc + ': ' + this.settings.fields[rc].label + '</small>';
								html += '</td>';
								//Field
								html += '<td data-id="' + rc + '" class="gridform_content '+debugClass+'" style="height:100%;vertical-align:top;" colspan="' + colspan + '" rowspan="' + rowspan + '">';
								if (showCellNames)
									html += '<small>' + rc + ': field ' + this.settings.fields[rc].id + '</small>';
								html += '</td>';
							}

						}

					}
					html += '</tr>';

				}
			} else if (this.settings.labelType === "over") {

				//Build an empty row to set the column widths as set by the settings (just take a look at the contentWidths)
				html += '<tr class="'+debugClass+'">';
				for (var c = 1; c <= this.cols; c++) {
					var contentWidth = '';
					if (this.settings.dimensions['col_' + c] !== undefined) {
						contentWidth = (this.settings.dimensions['col_' + c].contentWidth !== undefined) ? 'width:' + this.settings.dimensions['col_' + c].contentWidth : '';
					}
					html += '<td class="'+debugClass+'" style="' + contentWidth + '"></td>';
				}
				html += '</tr>';

				for (var r = 1; r <= this.rows; r++) {

					//Build all cells in that row
					//This is always two <tr> per logical ROW

					html += '<tr class="'+debugClass+'">';
					for (var c = 1; c <= this.cols; c++) {
						//Row and col identifier
						var rc = r + '_' + c;

						//Do we have a field at this position?
						if (this.settings.fields[rc] === undefined) {

							if (spannedCells[rc] !== undefined) {
								//This field is "spanned" but empty, so no problem!
								continue;
							}
							//No field configured ... empty cells (label and content-area therefore rowspan:2)
							html += '<td data-id="' + rc + '" class="gridform_content '+debugClass+'" rowspan="2">';
							if (showCellNames)
								html += rc;
							html += '</td>';

						} else {

							//There is a field, therefore (if a label is configured) place for a label and a field-container
							if (spannedCells[rc] !== undefined) {
								//Sorry, but this field cannot be placed here?!
								console.error("The field '" + this.settings.fields[rc].id + "' cannot be placed at '" + rc + "'. This cell is filled by field '" + spannedCells[rc].id + "'");
								continue;
							}
							//Has the field a colspan ?!
							var colspan = 1;
							if (this.settings.fields[rc].colspan !== undefined) {
								colspan = parseInt(this.settings.fields[rc].colspan, 10);
							}
							//and the logical rowspan...(must be corrected later, because a logical rowspanned row has two tr to span => label and content!)
							var rowspan = 1;
							if (this.settings.fields[rc].rowspan !== undefined) {
								rowspan = parseInt(this.settings.fields[rc].rowspan, 10);
							}

							//If there is some rowspan, then the next rows (that are "spanned") needs to be ignored
							for (var x = r; x < (r + rowspan); x++) {
								//If there is some colspan, then the next cells (that are "spanned") needs to be ignored
								for (var y = c; y < c + colspan; y++) {
									if (this.settings.debug)console.log("The cell " + x + '_' + y + " is filled by field content '" + this.settings.fields[rc].id + "'");
									spannedCells[x + '_' + y] = this.settings.fields[rc];
								}
							}

							//Place for an label
							//is a label allowed for the type?
							var labelAllowed = (gridform.types[this.settings.fields[rc].type] !== undefined && gridform.types[this.settings.fields[rc].type].labelAllowed === false) ? false : true;

							if (this.settings.fields[rc].label === undefined || labelAllowed === false) {

								//Rowspan is here now the configured rowspan * 2 (there is no label)
								html += '<td data-id="' + rc + '" class="gridform_content '+debugClass+'" colspan="' + colspan + '" rowspan="' + (rowspan * 2) + '">';
								if (showCellNames)
									html += rc;
								html += '</td>';

							} else {
								//Label
								html += '<td data-id="' + rc + '" class="gridform_label '+debugClass+'" style="text-align:' + labelAlign + ';" colspan="' + colspan + '">';
								if (showCellNames)
									html += '<small>' + rc + ': ' + this.settings.fields[rc].label + '</small>';
								html += '</td>';

							}

						}

					}
					html += '</tr>';

					//Build all cells in that row with field content
					html += '<tr class="'+debugClass+'">';
					for (var c = 1; c <= this.cols; c++) {
						//Row and col identifier
						var rc = r + '_' + c;

						//Do we have a field at this position?
						if (this.settings.fields[rc] !== undefined) {

							//There is a field, therefore (if a label is configured) place for a label and a field-container
							if (spannedCells[rc] !== undefined && this.settings.fields[rc] !== spannedCells[rc]) {
								//Sorry, but this field cannot be placed here?!
								console.error("The field '" + this.settings.fields[rc].id + "' cannot be placed at '" + rc + "'. This cell is filled by field '" + spannedCells[rc].id + "'");
								continue;
							}

							//is a label allowed for the type?
							var labelAllowed = (gridform.types[this.settings.fields[rc].type] !== undefined && gridform.types[this.settings.fields[rc].type].labelAllowed === false) ? false : true;

							//If a label is existing and was added, then here the content field needs to be added
							if (this.settings.fields[rc].label !== undefined && labelAllowed === true) {

								//Has the field a colspan ?!
								var colspan = 1;
								if (this.settings.fields[rc].colspan !== undefined) {
									colspan = parseInt(this.settings.fields[rc].colspan, 10);
								}
								//and the logical rowspan...(must be corrected later, because a logical rowspanned row has two tr to span => label and content!)
								var rowspan = 1;
								if (this.settings.fields[rc].rowspan !== undefined) {
									rowspan = parseInt(this.settings.fields[rc].rowspan, 10);
								}

								//Field
								html += '<td data-id="' + rc + '" class="gridform_content '+debugClass+'" style="height:100%;vertical-align:top;" colspan="' + colspan + '" rowspan="' + ((rowspan * 2) - 1) + '">';
								if (showCellNames)
									html += '<small>' + rc + ': field ' + this.settings.fields[rc].id + '</small>';
								html += '</td>';
							}
						}
					}
					html += '</tr>';
				}
			}

			html += '</tbody></table>';

			return html;

		},

		/**
		 * Builds the input fields
		 *
		 * @ignore
		 * @param debugOptions {Object} JSON object with debug settings (optional)
		 */
		__buildContents : function (debugOptions) {

			if (debugOptions !== undefined && debugOptions.showCellNames === true) {
				return;
			}

			//Build the label and field content
			for (var x in this.settings.fields) {
				var type = this.settings.fields[x].type;
				var field = this.settings.fields[x];
                
				//Cell-selector
				var cellSelectorLabel = this.settings.target + ' td[data-id=' + x + '].gridform_label';
				var cellSelectorContent = this.settings.target + ' td[data-id=' + x + '].gridform_content';

				//Is there a type like this
				if (gridform.types[type] == undefined) {
					console.error("No type " + type + " is known?!");
				}

				//Is there is an internal function for that type
				if (gridform.types[type] !== undefined && typeof gridform.types[type]['setLabel'] === "function") {
					//Call that function (will return a string or false => then the method itself will render something ...)
					var html = gridform.types[type]['setLabel'](field, cellSelectorLabel, this);
					if (typeof html === "string") {
						$(cellSelectorLabel).html(html);
					}
				} else {
					console.error("No setLabel function for type " + type);
				}

				//Is there is an internal function for that type
				if (gridform.types[type] !== undefined && typeof gridform.types[type]['render'] === "function") {
					//Call that function (will return a string or false => then the method itself will render something ...)
					var html = gridform.types[type]['render'](field, cellSelectorContent, this);
					if (typeof html === "string") {
						$(cellSelectorContent).html(html);
					}
				} else {
					console.error("No rendering function for type " + type);
				}

				//Set a focus (if configured)
				if (this.focusOnField !== null) {
					this.getElement(this.focusOnField).focus();
				}

				//Are there functions for some methods after adding the grid, label and contents to the DOM
				//e.g. Event Handler, async loadable Selection-Options, etc....
				if (gridform.types[type] !== undefined && typeof gridform.types[type]['afterDOMCreation'] === "function") {
					gridform.types[type]['afterDOMCreation'](field, cellSelectorContent, this);
				}
				var that = this;
				//Maybe the option "validateOnBlur" is set, so get the element and attach the validation method to the blur event!
				if (field.validateOnBlur === true && (field.mandatory === true || typeof field.validate === "function")) {
					//get the element
					var elem = this.getElement(field.id);
					//wrap that event handler in a lambda function for correct scope
					//otherwise the id will be that of the last element of the form :)
					(function (id) {
						elem.on("blur", function () {
							that.validate(id);
						});
					})(field.id);
				}
			}
            
            //Register the hidden fields
            for (var x in this.settings.hiddenFields) {
                
                //Is the field id free or already taken (by a none hidden field?!
				if (this.fieldsById[this.settings.hiddenFields[x].id] !== undefined) {
					console.error("The id '" + this.settings.hiddenFields[x].id + "' is already taken, the hidden field is deleted from the grid!");
					delete this.settings.hiddenFields[x];
                    continue;
				}
                
                var id = this.settings.hiddenFields[x].id;
                
                //Register the hidden field
                //if there is a value given in the settings?
                if(this.settings.hiddenFields[x].value !== undefined){
                    this.hiddenFields[id] = this.settings.hiddenFields[x].value;
                } else {
                    this.hiddenFields[id] = null;
                }
                
                
            }
            

		},

		/**
		 * Sets data of a record in the form
		 *
		 * @param record {Object} JSON object with the record data
		 */
		setData : function (record) {

			//Set the data in the grid
			for (var x in record) {
				//Is there an field with the given id
				if (this.fieldsById[x] !== undefined) {
					
					//Search for the set-method of the correct type
					var type = this.fieldsById[x].type;
					var field = this.fieldsById[x];
					//Cell-selector
					var cellSelector = this.settings.target + ' td[data-id=' + field.row + '_' + field.col + '].gridform_content';
					//Is there an internal function for that type
					if (gridform.types[type] !== undefined && typeof gridform.types[type]['set'] === "function") {
						//Call that function
						gridform.types[type]['set'](this.fieldsById[x], record[x], cellSelector, this);
					} else {
						console.error("No set function for type " + type);
					}

				} else if(this.hiddenFields[x] !== undefined){
                    //set the value for the hidden field
                    this.hiddenFields[x] = record[x];                
                } else {
                    //Error
					console.error("No field with id " + x + ", so I can set the data!");
				}
			}
		},

		/**
		 * Switch from edit to view mode and vice versa
		 *
		 * @param mode {String} "edit" or "view" to switch the mode
		 */
		switchMode : function (mode) {

			if (mode !== "edit" && mode !== "view")
				return false;

			if (mode !== this.mode) {
				//Set the new mode
				this.settings.mode = mode;
				//Rerender the table
				this.render();
			}

		},

		/**
		 * Returns an element (field) by id
		 *
		 * @param id {String} Id of the field
		 */
		getElement : function (id) {

			var field = this.fieldsById[id];
			if (field === undefined)
				return false;

			var cellSelectorContent = this.settings.target + ' td[data-id=' + field.row + '_' + field.col + '].gridform_content';

			if (gridform.types[field.type] !== undefined && typeof gridform.types[field.type]['getFieldNode'] === "function") {
				//Call that function
				return gridform.types[field.type]['getFieldNode'](field, cellSelectorContent, this);
			} else {
				if (this.settings.debug)console.log("getElement: No getFieldNode-Method for field type " + field.type);
				return false;
			}

		},

		/**
		 * Sets the status of a field
		 *
		 * @param id {String} Id of the field
		 * @param type {String} Type to set (warning,success,error,waiting)
		 * @param message {String} In case of a warning or error you can set a message text
		 */
		setStatus : function (id, type, message) {

			var field = this.fieldsById[id];
			if (field === undefined)
				return false;
			//Reset any existing fieldmark
			this.resetFieldMarks(id);

			//get the cell where this field is
			var cellSelectorLabel = this.settings.target + ' td[data-id=' + field.row + '_' + field.col + '].gridform_label';
			var cellSelectorContent = this.settings.target + ' td[data-id=' + field.row + '_' + field.col + '].gridform_content';

			if (gridform.types[field.type] !== undefined && typeof gridform.types[field.type]['set' + type] === "function") {
				//Call that function
				gridform.types[field.type]['set' + type](field, message, cellSelectorLabel, cellSelectorContent, this);
			} else {
				if (this.settings.debug)console.log("No set" + type + "-Method for field type " + field.type);
			}

		},

		/**
		 * Shortcut for setting a field to status "success"
		 *
		 * @param id {String} Id of the field
		 */
		setSuccess : function (id) {
			this.setStatus(id, "Success");
		},

		/**
		 * Shortcut for setting a field to status "warning"
		 *
		 * @param id {String} Id of the field
		 * @param message {String} In case of a warning or error you can set a message text
		 */
		setWarning : function (id, message) {
			this.setStatus(id, "Warning", message);
		},

		/**
		 * Shortcut for setting a field to status "error"
		 *
		 * @param id {String} Id of the field
		 * @param message {String} In case of a warning or error you can set a message text
		 */
		setError : function (id, error) {
			this.setStatus(id, "Error", error);
		},

		/**
		 * Shortcut for setting a field to status "waiting"
		 *
		 * @param id {String} Id of the field
		 */
		setWaiting : function (id) {
			this.setStatus(id, "Waiting");
		},

		/**
		 * Reset the field (reset all the fieldmarks) so no status is set to the field
		 *
		 * If the id is omitted all the fields in the form are reseted
		 *
		 * @param id {String} Id of the field
		 */
		resetFieldMarks : function (id) {

			var that = this;

			//Internal function
			function reset(id) {
				var field = that.fieldsById[id];
				if (field === undefined)
					return false;
				//get the cell where that field is
				var cellSelectorLabel = that.settings.target + ' td[data-id=' + field.row + '_' + field.col + '].gridform_label';
				var cellSelectorContent = that.settings.target + ' td[data-id=' + field.row + '_' + field.col + '].gridform_content';

				if (gridform.types[field.type] !== undefined && typeof gridform.types[field.type]['resetFieldMark'] === "function") {
					//Call that function
					gridform.types[field.type]['resetFieldMark'](field, cellSelectorLabel, cellSelectorContent, that);
				} else {
					if (this.settings.debug)console.log("No resetFieldMark-Method for field type " + field.type);
				}

			};

			if (id === undefined) {
				//Reset all fields
				for (var x in this.fieldsById) {
					reset(this.fieldsById[x].id);
				}
			} else {

				reset(id);

			}

		},

		/**
		 * Flush a single field or the whole form (all the data is deleted!)
		 *
		 * If the id is omitted all fields in the form are flushed
		 *
		 * @param id {String} Id of the field
		 */
		flush : function (id) {

			var that = this;

			//Internal function
			function flush(id) {

				//Also reset field marks
				that.resetFieldMarks(id);

				var field = that.fieldsById[id];
				var type = field.type;
				if (field === undefined)
					return false;
				//get the cell where this field is
				var cellSelector = that.settings.target + ' td[data-id=' + field.row + '_' + field.col + '].gridform_content';

				//Is there an internal function for that type
				if (gridform.types[type] !== undefined && typeof gridform.types[type]['flush'] === "function") {
					//Call that function
					gridform.types[type]['flush'](cellSelector, that);
				}
			};

			if (id === undefined) {
				//Reset all fields
				for (var x in this.fieldsById) {
					flush(this.fieldsById[x].id);
				}
			} else {
				flush(id);
			}

		},

		/**
		 * Return the data of a single field or the whole form as JSON object
		 *
		 * If the id is omitted the whole form data is returned
		 *
		 * @param id {String} Id of the field
		 */
		getData : function (id) {

			var that = this;

			//Internal function
			function get(id) {

				var field = that.fieldsById[id];
				var type = field.type;
				if (field === undefined)
					return undefined;
				//get the cell where this field is
				var cellSelector = that.settings.target + ' td[data-id=' + field.row + '_' + field.col + '].gridform_content';

				//Does that type contain data?
				if (gridform.types[type] !== undefined && gridform.types[type].containsData === false)
					return undefined;

				//Is there an internal function for that type
				if (gridform.types[type] !== undefined && typeof gridform.types[type]['get'] === "function") {
					//Call that function
					return gridform.types[type]['get'](field, cellSelector);
				}

				return undefined;

			};

			if (id === undefined) {
				var data = {};
				//Get all fields
				for (var x in this.fieldsById) {
					var d = get(this.fieldsById[x].id);
					if (d !== undefined) {
						data[this.fieldsById[x].id] = d;
					}
				}
                //Get all hidden fields 
                for(var x in this.hiddenFields){
                    data[x] = this.hiddenFields[x];
                }
				return data;

			} else {
                //is it a hidden field
                if(this.fieldsById[id] !== undefined){
                    return get(id);
                } else if(this.hiddenFields[id] !== undefined){
                    return this.hiddenFields[id];
                } else {
                    console.error("No such field " + id);
                }
			}

		},

		/**
		 * Validates a field or the whole form
		 *
		 * If you define a validator function then a callback is needed to return the validator return value!
		 *
		 * @param id {String} Id of the field
		 * @param callback {Function} Callback function for the return of the validate option
		 */
		validate: function (id, callback) {

			var that = this;

			//Internal function
			function validate(id, deferred) {
                             
				//Reset the field
				that.resetFieldMarks(id);

				var field = that.fieldsById[id];
				if (field === undefined){
                    deferred.resolve('No field with this id');
                    return false;
                }
				var type = field.type;

				//Is this a field with data
				if (gridform.types[type].containsData !== true){
                    deferred.resolve(true);
                    return false;
                }

				//get the cell where this field is
				var cellSelector = that.settings.target + ' td[data-id=' + field.row + '_' + field.col + '].gridform_content';
				var valid = true;

				var value = that.getData(field.id);
				//Mandatory field
				if (field.mandatory === true &&
					(value === "" || value === null || value === undefined ||
						(typeof value === "object" && value.length === 0))) {
					that.setError(id, that.settings.language.mandatoryField);
						
					if (that.settings.debug)console.log("Validated: " + field.id + " " + false);
                    deferred.resolve(false);                    
					return;
				}

				//maybe a custom validate function for the field (then no other function gets fired!)
				if (typeof field.validate === "function") {
					//set the field to waiting
					that.setWaiting(field.id);
					var value = that.getData(id);
					//call the validate-function with "value" and then the callback from the validating method
					field.validate(value, function (valid) {

						//if the field was set to waiting...then reset the status
						if ($(cellSelector).find("div.form-group").data("status") === "waiting") {
							that.resetFieldMarks(field.id);
							if (that.settings.mode === "edit") {
								that.enable(true, field.id);
							}
						}

						if (valid === true) {
							that.setSuccess(id);
						} else {
							that.setError(id, valid);
						}

						if (that.settings.debug)console.log("Validated: " + field.id + " " + valid);
                        deferred.resolve(valid);                     
				
					});

				} else {

                    var valid = true;
					//Is there an internal function for that type
					if (gridform.types[type] !== undefined && typeof gridform.types[type]['validate'] === "function") {
						//Call that function
						var valid = gridform.types[type]['validate'](field, cellSelector);
                    }
                    
                    if (valid !== true) {
						that.setError(id, valid);
					} else {                        
                        that.setSuccess(id);
                    }
                    if (that.settings.debug)console.log("Validated: " + field.id + "  " + valid);
                    
					deferred.resolve(valid);
					
				}

			};

            
            var deferreds = [];           
            
			if (id === undefined) {
                //Lock all fields while validating
				this.enable(false);
				//validate all fields
				for (var x in this.fieldsById) {
                    var deferred = $.Deferred();
                    deferreds.push(deferred);
					validate(this.fieldsById[x].id, deferred);
				}
   
			} else {
				//just one field
                //lock the field
				this.enable(false, id);                
                var deferred = $.Deferred();
                deferreds.push(deferred);
				validate(id, deferred);
			}         
                        
            //When all deferreds are done, trigger the event and return the 
            //validation result (if any callback was given)
            $.when.all(deferreds).then(function(objects) {
            
                var valid = true;
                //Check all objects for a "true"
                for(var x in objects){
                    if(objects[x] !== true)valid = false;
                }
                that.enable(true);                
                //Trigger the event
				$(gridform.forms[that.settings.name]).trigger("validated",false);
                
                if(typeof callback == "function"){
                    callback(valid);
                }
            }); 
            
		},

		/**
		 * Enable/disable a field or the whle field
		 *
		 * @param enable {Boolean} Enable (true) or disable (false) a field or the whole form
		 * @param id {String} Id of the field
		 */
		enable : function (enable, id) {
			//only in edit mode this is switchable....
			if (this.settings.mode !== "edit")
				return false;

			var that = this;

			//Internal function
			function enableField(enable, id) {
				var field = that.fieldsById[id];
				if (field === undefined)
					return false;
				var type = field.type;
				//get the cell where this field is
				var cellSelector = that.settings.target + ' td[data-id=' + field.row + '_' + field.col + '].gridform_content';

				//Is there an internal function for that type
				if (gridform.types[type] !== undefined && typeof gridform.types[type]['enable'] === "function") {
					//Call that function
					gridform.types[type]['enable'](field, enable, cellSelector);
				}
			};

			if (id === undefined) {
				//Enable all fields
				for (var x in this.fieldsById) {
					enableField(enable, this.fieldsById[x].id);
				}

			} else {
				enableField(enable, id);
			}

		},
        
              
        

	};
    
    
    
    /**
	 * Abstract field type
	 *
	 * All fields extend this type and overwrite some of the methods.
	 *
	 * @class mastertype
	 */
	gridform.types.__mastertype = {

		/** @property {boolean} is a label allowed (e.g. the headline or separator has no label, just a field content) */
		labelAllowed : true,
		//if this field contains data (and can be validated!)
		containsData : true,

		/**
		 * Set a label for the type
		 *
		 * @memberOf mastertype
		 * @param data {Object} JSON object with config data of the field
		 * @param cellSelectorLabel {string} String with the cell selector expression
		 * @param parent {Object} gridform object
		 */
		setLabel : function (data, cellSelectorLabel, parent) {

			var html = '<div class="form-group" style="display:inline;">';
			html += '   <label class="control-label">' + data.label;
			//Mark mandatory fields with an asterisk
			if (parent.settings.markMandatoryFields === true && data.mandatory === true) {
				html += ' *';
			}
			html += '</label>';
			html += '</div>';

			return html;

		},

		/**
		 * Render the field
		 *
		 * @memberOf mastertype
		 * @param data {Object} JSON object with config data of the field
		 * @param cellSelectorLabel {string} String with the cell selector expression
		 * @param parent {Object} gridform object
		 */
		render : function (data, cellSelector, parent) {
			return '';
		},

		/**
		 * Set the field value
		 *
		 * @memberOf mastertype
		 * @param data {Object} JSON object with config data of the field
		 * @param value {String|Object} value of the field
		 * @param cellSelectorLabel {string} String with the cell selector expression
		 * @param parent {Object} gridform object
		 */
		set : function (data, value, cellSelector, parent) {},

		/**
		 * Set a placeholder for the field
		 *
		 * @memberOf mastertype
		 * @param data {Object} JSON object with config data of the field
		 * @param value {String} value of the placeholder
		 * @param cellSelectorLabel {string} String with the cell selector expression
		 * @param parent {Object} gridform object
		 */
		setPlaceholder : function (data, value, cellSelector, parent) {
			return '';
		},

		/**
		 * Returns the value of the field
		 *
		 * @memberOf mastertype
		 * @param data {Object} JSON object with config data of the field
		 * @param cellSelectorLabel {string} String with the cell selector expression
		 * @returns {Object|String} returns a string or more complex data (depends on the field type)
		 */
		get : function (data, cellSelector) {},

		/**
		 * Flush/Reset the field
		 *
		 * @memberOf mastertype
		 * @param cellSelectorLabel {string} String with the cell selector expression
		 * @param parent {Object} gridform object
		 */
		flush : function (cellSelector, parent) {},

		/**
		 * Enable/disable the field
		 *
		 * @memberOf mastertype
		 * @param field {Object} JSON object with config data of the field
		 * @param enable {Boolean} True or false for enabling and disabling of the field
		 * @param cellSelectorLabel {string} String with the cell selector expression
		 */
		enable : function (field, enable, cellSelector) {},

		/**
		 * Get the HTML node (representation) of the field
		 *
		 * @memberOf mastertype
		 * @param field {Object} JSON object with config data of the field
		 * @param cellSelectorLabel {string} String with the cell selector expression
		 * @returns {Object} HTML node (the field from the DOM)
		 */
		getFieldNode : function (field, cellSelector) {},

		/**
		 * Set the field status
		 *
		 * @memberOf mastertype
		 * @param field {Object} JSON object with config data of the field
		 * @param type {String} status type (waiting, error, success, error)
		 * @param cellSelectorLabel {string} String with the cell selector expression of the label
		 * @param cellSelectorContent {string} String with the cell selector expression of the content
		 * @param parent {Object} gridform object
		 */
		setStatus : function (field, type, cellSelectorLabel, cellSelectorContent, parent) {

			//if the status is "success" but the setting "successIsGreen" is false, do not add a success class (that is coloured)
			if (type === "success" && parent.settings.successIsGreen === false) {}
			else {
				$(cellSelectorLabel).find("div.form-group").addClass("has-" + type);
				$(cellSelectorContent).find("div.form-group").addClass("has-" + type);
			}

			//set the data-status to the given type
			$(cellSelectorContent).find("div.form-group").data("status", type);

			if (field.hasFeedback === true) {
				$(cellSelectorContent).find("span.form-control-feedback").addClass(parent.settings['icon_' + type]).show();
			}

		},

		/**
		 * Set the field status to "error"
		 *
		 * @memberOf mastertype
		 * @param field {Object} JSON object with config data of the field
		 * @param error {String} error text message
		 * @param cellSelectorLabel {string} String with the cell selector expression of the label
		 * @param cellSelectorContent {string} String with the cell selector expression of the content
		 * @param parent {Object} gridform object
		 */
		setError : function (field, error, cellSelectorLabel, cellSelectorContent, parent) {
			//set the error
			this.setStatus(field, 'error', cellSelectorLabel, cellSelectorContent, parent);

			//if tooltip is available
			if (typeof $.fn.tooltip === "function") {
				//set error text
				$(cellSelectorContent).find("div.form-group")
				.attr("data-toggle", "tooltip")
				.attr("data-placement", parent.settings.tooltipOrientation)
				.attr("title", error);
				if (parent.settings.showTooltipInstantly === true) {
					$(cellSelectorContent).find("div.form-group").tooltip("show");
				} else {
					$(cellSelectorContent).find("div.form-group").tooltip();
				}
			}
		},

		/**
		 * Set the field status to "success"
		 *
		 * @memberOf mastertype
		 * @param field {Object} JSON object with config data of the field
		 * @param message {String} success text message (DEPRECATED!?!)
		 * @param cellSelectorLabel {string} String with the cell selector expression of the label
		 * @param cellSelectorContent {string} String with the cell selector expression of the content
		 * @param parent {Object} gridform object
		 */
		setSuccess : function (field, message, cellSelectorLabel, cellSelectorContent, parent) {
			//set the error
			this.setStatus(field, 'success', cellSelectorLabel, cellSelectorContent, parent);
		},

		/**
		 * Set the field status to "warning"
		 *
		 * @memberOf mastertype
		 * @param field {Object} JSON object with config data of the field
		 * @param message {String} warning text message
		 * @param cellSelectorLabel {string} String with the cell selector expression of the label
		 * @param cellSelectorContent {string} String with the cell selector expression of the content
		 * @param parent {Object} gridform object
		 */
		setWarning : function (field, message, cellSelectorLabel, cellSelectorContent, parent) {
			//set the warning
			this.setStatus(field, 'warning', cellSelectorLabel, cellSelectorContent, parent);
			//set warning text
			//if tooltip is available
			if (typeof $.fn.tooltip === "function") {
				$(cellSelectorContent).find("div.form-group")
				.attr("data-toggle", "tooltip")
				.attr("data-placement", parent.settings.tooltipOrientation)
				.attr("title", message);

				if (parent.settings.showTooltipInstantly === true) {
					$(cellSelectorContent).find("div.form-group").tooltip("show");
				} else {
					$(cellSelectorContent).find("div.form-group").tooltip();
				}
			}
		},

		/**
		 * Set the field status to "waiting"
		 *
		 * @memberOf mastertype
		 * @param field {Object} JSON object with config data of the field
		 * @param message {String} waiting text message
		 * @param cellSelectorLabel {string} String with the cell selector expression of the label
		 * @param cellSelectorContent {string} String with the cell selector expression of the content
		 * @param parent {Object} gridform object
		 */
		setWaiting : function (field, message, cellSelectorLabel, cellSelectorContent, parent) {

			//set the waiting status
			this.setStatus(field, 'waiting', cellSelectorLabel, cellSelectorContent, parent);
			//lock the field while waiting
			parent.enable(false, field.id);

		},

		/**
		 * Reset the field marking (no status)
		 *
		 * @memberOf mastertype
		 * @param data {Object} JSON object with config data of the field
		 * @param cellSelectorLabel {string} String with the cell selector expression of the label
		 * @param cellSelectorContent {string} String with the cell selector expression of the content
		 * @param parent {Object} gridform object
		 */
		resetFieldMark : function (data, cellSelectorLabel, cellSelectorContent, parent) {
			//Delete all classes
			$(cellSelectorLabel).find("div.form-group").removeClass("has-error").removeClass("has-success").removeClass("has-warning");
			$(cellSelectorContent).find("div.form-group").removeClass("has-error").removeClass("has-success").removeClass("has-warning").data("status", "");
			//delete error
			//if tooltip is available
			if (typeof $.fn.tooltip === "function") {
				$(cellSelectorContent).find("div.form-group").tooltip("destroy");
			}

			if (data.hasFeedback === true) {
				$(cellSelectorContent).find("span.form-control-feedback")
				.removeClass(parent.settings.icon_success)
				.removeClass(parent.settings.icon_error)
				.removeClass(parent.settings.icon_warning)
				.removeClass(parent.settings.icon_waiting);
			}
		}
	};

       

	//String field type
	gridform.types.string = $.extend({}, gridform.types.__mastertype, {

			//render the field content
			render : function (data, cellSelector, parent) {

				//Simple input text
				var disabled = (parent.settings.mode === "edit" && data.readonly !== true) ? '' : 'disabled';
				var hasFeedback = (data.hasFeedback === true) ? 'has-feedback' : '';
				var width = (data.width !== undefined) ? 'width:' + data.width : '';
				var type = (data.pwd === true) ? 'password' : 'text';
				var placeholder = (data.placeholder !== undefined) ? data.placeholder : '';
				var maxLength = (data.maxLength !== undefined) ? 'maxlength="' + parseInt(data.maxLength, 10) + '"' : '';

				var html = '<div class="form-group ' + hasFeedback + '" style="' + width + '">';
				html += '   <input type="' + type + '" ' + disabled + ' ' + maxLength + ' class="form-control" style="width:100%;" placeholder="' + placeholder + '"></input>';
				if (hasFeedback !== "") {
					html += '   <span style="display:none;top:0;" class="' + parent.settings.icon_success + ' form-control-feedback"></span>';
				}
				html += '</div>';

				return html;

			},
			//set the field content
			set : function (data, value, cellSelector, parent) {

				//Set the data in the input field
				if (parent.settings.mode === "edit") {
					$(cellSelector).find("input").val(value);
				} else {
					$(cellSelector).find("input").val(value);
				}

			},

			setPlaceholder : function (data, value, cellSelector, parent) {
				$(cellSelector).find("input").attr("placeholder", value);
			},
			//get the field content
			get : function (data, cellSelector) {

				return $(cellSelector).find("input").val();

			},

			//get the field, input, select, etc.
			getFieldNode : function (field, cellSelector) {
				return $(cellSelector).find("input");
			},
			//flush the field
			flush : function (cellSelector, parent) {

				$(cellSelector).find("input").val("");

			},

			enable : function (data, enable, cellSelector) {

				//If readonly this is always disabled....
				if (data.readonly === true)
					return false;

				if (enable === true) {
					$(cellSelector).find("input").removeAttr("disabled");
				} else if (enable === false) {
					$(cellSelector).find("input").attr("disabled", "disabled");
				}

			}

		});

	//TEXTAREA
	gridform.types.text = $.extend({}, gridform.types.__mastertype, {
			//render the field content
			render : function (data, cellSelector, parent) {

				//Simple textarea
				var disabled = (parent.settings.mode === "edit") ? '' : 'disabled';
				var hasFeedback = (data.hasFeedback === true) ? 'has-feedback' : '';
				var width = (data.width !== undefined) ? 'width:' + data.width : '';
				var placeholder = (data.placeholder !== undefined) ? data.placeholder : '';

				//var html = '<form class="form-inline" role="form" style="height:100%;">';
				var html = '<div class="form-group ' + hasFeedback + '" style="height:100%;' + width + '">';
				html += '   <textarea type="text" ' + disabled + ' class="form-control" style="width:100%;height:100%;resize: none;" placeholder="' + placeholder + '"></textarea>';
				if (hasFeedback !== "") {
					html += '   <span style="display:none;top:0;" class="' + parent.settings.icon_success + ' form-control-feedback"></span>';
				}
				html += '</div>';
				//html += '</form>';

				return html;

			},
			//set the field content
			set : function (data, value, cellSelector, parent) {

				//Set the data in the textarea
				if (parent.settings.mode === "edit") {
					$(cellSelector).find("textarea").val(value);
				} else {
					$(cellSelector).find("textarea").val(value);
				}

			},

			setPlaceholder : function (data, value, cellSelector, parent) {
				$(cellSelector).find("textarea").attr("placeholder", value);
			},

			//get the field content
			get : function (data, cellSelector) {
				return $(cellSelector).find("textarea").val();
			},

			//get the field, input, select, etc.
			getFieldNode : function (field, cellSelector) {
				return $(cellSelector).find("textarea");
			},

			//flush the field
			flush : function (cellSelector, parent) {

				$(cellSelector).find("textarea").val("");

			},

			enable : function (data, enable, cellSelector) {

				//If readonly this is always disabled....
				if (data.readonly === true)
					return false;

				if (enable === true) {
					$(cellSelector).find("textarea").removeAttr("disabled");
				} else if (enable === false) {
					$(cellSelector).find("textarea").attr("disabled", "disabled");
				}

			},

			afterDOMCreation : function (data, cellSelector, parent) {

				//Get the textarea the full size of the td!
				//Since HTML5 the rowspan and fill of a td is broken!
				//Wait a little until the table layout is ready and the computation can be successfull :)
				//BAD HACK!!! TODO!
				setTimeout(function () {
					var height = $(cellSelector).height();
					$(cellSelector).find("div").height(height);

				}, 50);
			}

		});

	//SELECT-LIST
	gridform.types.select = $.extend({}, gridform.types.__mastertype, {
			//render the field content
			render : function (data, cellSelector, parent) {

				//Simple textarea
				var disabled = (parent.settings.mode === "edit") ? '' : 'disabled';
				var hasFeedback = (data.hasFeedback === true) ? 'has-feedback' : '';
				var width = (data.width !== undefined) ? 'width:' + data.width : '';

				var html = '<div class="form-group ' + hasFeedback + '" style="' + width + '">';
				html += '   <select ' + disabled + ' class="form-control" style="width:100%;"></select>';
				if (hasFeedback !== "") {
					html += '   <span style="display:none;top:0;" class="' + parent.settings.icon_success + ' form-control-feedback"></span>';
				}
				html += '</div>';

				return html;

			},
			//set the field value
			set : function (data, value, cellSelector, parent) {

				//Set the data in the textarea
				if (parent.settings.mode === "edit") {
					$(cellSelector).find("select").val(value);
				} else {
					$(cellSelector).find("select").val(value);
				}

			},

			//get the field value
			get : function (data, cellSelector) {
				return $(cellSelector).find("select").val();
			},

			//get the field, input, select, etc.
			getFieldNode : function (field, cellSelector) {
				return $(cellSelector).find("select");
			},

			//flush the field
			flush : function (cellSelector, parent) {

				$(cellSelector).find("select").val("");

			},

			enable : function (data, enable, cellSelector) {

				//If readonly this is always disabled....
				if (data.readonly === true)
					return false;

				if (enable === true) {
					$(cellSelector).find("select").removeAttr("disabled");
				} else if (enable === false) {
					$(cellSelector).find("select").attr("disabled", "disabled");
				}

			},

			afterDOMCreation : function (data, cellSelector, parent) {

				/*
				 * internal function
				 */
				function fillDataInSelect(selection) {
					var elem = $(cellSelector).find("select");
					elem.html("");

					//Placeholder without value
					if (data.withoutPlaceholder !== true) {
						elem.append('<option value="">' + parent.settings.language.selectPlaceholder + '</option>');
					}

					for (var x in selection) {
						var selected = (data.selected == selection[x].key) ? 'selected' : '';
						elem.append('<option ' + selected + ' value="' + selection[x].key + '">' + selection[x].value + '</option>');
					}
					//if the field was set to waiting...then reset the status
					if ($(cellSelector).find("div.form-group").data("status") === "waiting") {
						parent.resetFieldMarks(data.id);
						if (parent.settings.mode === "edit") {
							parent.enable(true, data.id);
						}
					}
				};

				if (data.selection === undefined)
					return false;
				if (typeof data.selection === "function") {
					//Call the function and fill in the callback for filling data structure in the field
					//Before set the field to waiting ... until it gets the data (maybe a async call to a backend ...)
					parent.setWaiting(data.id);
					var elem = $(cellSelector).find("select");
					elem.append('<option value="" selected>' + parent.settings.language.loading + '</option>');

					data.selection(fillDataInSelect);

				} else if (typeof(data.selection) === "object") {
					//The options are set in the options directly
					fillDataInSelect(data.selection);
				}

			}

		});

        gridform.types.radio = $.extend({}, gridform.types.__mastertype, {
			//render the field content
			render : function (data, cellSelector, parent) {

				//Simple textarea
				var width = (data.width !== undefined) ? 'width:' + data.width : '';
				var disabled = (parent.settings.mode === "edit") ? '' : 'disabled';
				//Should font-Awesome be used?
				var fontA = (parent.settings.useFontAwesome === true) ? 'fontA' : '';
				//inline vs normal
				var extraStyle = (data.inline === true) ? 'display:inline-block;padding-right:10px;' : '';

				var html = '<div class="form-group">';

				for (var x in data.selection) {
					var uniqueId = parent.settings.name + '_' + data.id + '_' + x;
					html += '<div class="radio ' + fontA + '" style="' + extraStyle + '">';
					html += '<input type="radio" class="' + fontA + '" id="' + uniqueId + '" ' + disabled + ' name="' + data.id + '_radios" value="' + data.selection[x].key + '">';
					html += '<label class="' + disabled + '" for="' + uniqueId + '">';
					html += data.selection[x].value;
					html += '</label>';
					html += '</div>';
				}

				html += '</div>';

				return html;

			},
			//set the field value
			set : function (data, value, cellSelector, parent) {
				//Set chosen radio button
				$(cellSelector).find("input[value=" + value + "]").prop("checked", true);

			},

			//get the field value
			get : function (data, cellSelector) {
				return $(cellSelector).find("input:checked").val();
			},

			//get the field, input, select, etc.
			getFieldNode : function (field, cellSelector) {
				return $(cellSelector).find("select");
			},

			//flush the field
			flush : function (cellSelector, parent) {

				$(cellSelector).find("input").prop("checked", false);

			},

			enable : function (data, enable, cellSelector) {

				//If readonly this is always disabled....
				if (data.readonly === true)
					return false;

				if (enable === true) {
					$(cellSelector).find("input").removeAttr("disabled");
					//set the label enabled too
					$(cellSelector).find("label").removeClass("disabled");
				} else if (enable === false) {
					$(cellSelector).find("input").attr("disabled", "disabled");
					//set the label enabled too
					$(cellSelector).find("label").addClass("disabled");
				}

			}

		});
        
        
    gridform.types.iradio = $.extend({}, gridform.types.__mastertype, {
			//render the field content
			render : function (data, cellSelector, parent) {

				//Simple textarea
				var width = (data.width !== undefined) ? 'width:' + data.width : '';
				var disabled = (parent.settings.mode === "edit") ? '' : 'disabled';
				//inline vs normal
				var extraStyle = (data.inline === true) ? 'display:inline-block;padding-right:10px;' : '';

				var html = '<div class="form-group">';

				for (var x in data.selection) {
					var uniqueId = parent.settings.name + '_' + data.id + '_' + x;
					html += '<div class="radio fontA" style="' + extraStyle + '">';
					html += '<input type="radio" class="fontA" id="' + uniqueId + '" ' + disabled + ' name="' + data.id + '_radios" value="' + data.selection[x].key + '">';
					html += '<label class="' + disabled + '" for="' + uniqueId + '">';
					html += data.selection[x].value;
					html += '</label>';
					html += '</div>';
				}

				html += '</div>';

				return html;

			},
			//set the field value
			set : function (data, value, cellSelector, parent) {
				//Set chosen radio button
   				$(cellSelector).find("input[value=" + value + "]").iCheck("check");

			},

			//get the field value
			get : function (data, cellSelector) {
				return $(cellSelector).find("input:checked").val();
			},

			//get the field, input, select, etc.
			getFieldNode : function (field, cellSelector) {
				return $(cellSelector).find("input");
			},

			//flush the field
			flush : function (cellSelector, parent) {                
                $(cellSelector).find("input").iCheck("uncheck");
			},
            
            afterDOMCreation : function (data, cellSelector, parent){
                     
                $(cellSelector).find("input").iCheck({
                    radioClass: 'iradio_' + parent.settings.useICheck,
                  }); 

            },  

			enable : function (data, enable, cellSelector) {

				//If readonly this is always disabled....
				if (data.readonly === true)
					return false;

				if (enable === true) {
			        $(cellSelector).find("input").iCheck("enable");
					//set the label enabled too
					$(cellSelector).find("label").removeClass("disabled");
				} else if (enable === false) {
					$(cellSelector).find("input").iCheck("disable");
					//set the label enabled too
					$(cellSelector).find("label").addClass("disabled");
				}

			}

		});    
        

	gridform.types.checkbox = $.extend({}, gridform.types.__mastertype, {
			//render the field content
			render : function (data, cellSelector, parent) {

				//Simple checkbox
				var width = (data.width !== undefined) ? 'width:' + data.width : '';
				var disabled = (parent.settings.mode === "edit") ? '' : 'disabled';
				//Should font-Awesome be used?
				var fontA = (parent.settings.useFontAwesome === true) ? 'fontA' : '';
				//inline vs normal
				var extraStyle = (data.inline === true) ? 'display:inline-block;padding-right:10px;' : '';

				var html = '<div class="form-group">';

				for (var x in data.selection) {
					var uniqueId = parent.settings.name + '_' + data.id + '_' + x;
					html += '<div class="checkbox ' + fontA + '" style="' + extraStyle + '">';

					html += '<input type="checkbox" class="' + fontA + '" id="' + uniqueId + '" ' + disabled + ' name="' + data.selection[x].key + '" value="' + data.selection[x].key + '"> ';
					html += '<label class="' + disabled + '" for="' + uniqueId + '">';
					html += data.selection[x].value;
					html += '</label>';
					html += '</div>';
				}

				html += '</div>';

				return html;

			},
			//set the field value
			set : function (data, value, cellSelector, parent) {

				$(cellSelector).find("input").prop("checked", false);

				if (typeof value === "object") {
					for (var x in value) {
						$(cellSelector).find("input[name=" + value[x] + "]").prop("checked", true);
					}
				} else {

					$(cellSelector).find("input[name='" + value + "']").prop("checked", true);
				}

			},

			//get the field value
			get : function (data, cellSelector) {
				var boxes = $(cellSelector).find("input:checked");
				var data = [];
				for (var x = 0; x < boxes.length; x++) {
					data.push($(boxes[x]).val());
				}
				return data;
			},

			//get the field, input, select, etc.
			getFieldNode : function (field, cellSelector) {
				return $(cellSelector).find("select");
			},

			//flush the field
			flush : function (cellSelector, parent) {

				$(cellSelector).find("input").prop("checked", false);

			},

			enable : function (data, enable, cellSelector) {

				//If readonly this is always disabled....
				if (data.readonly === true)
					return false;

				if (enable === true) {
					$(cellSelector).find("input").removeAttr("disabled");
					//set the label enabled too
					$(cellSelector).find("label").removeClass("disabled");
				} else if (enable === false) {
					$(cellSelector).find("input").attr("disabled", "disabled");
					//set the label disabled too
					$(cellSelector).find("label").addClass("disabled");

				}

			}

		});
        
        
    gridform.types.icheckbox = $.extend({}, gridform.types.__mastertype, {
			//render the field content
			render : function (data, cellSelector, parent) {
                
				//Simple checkbox
				var width = (data.width !== undefined) ? 'width:' + data.width : '';
				var disabled = (parent.settings.mode === "edit") ? '' : 'disabled';				
				//inline vs normal
				var extraStyle = (data.inline === true) ? 'display:inline-block;padding-right:10px;' : '';

				var html = '<div class="form-group">';

				for (var x in data.selection) {
					var uniqueId = parent.settings.name + '_' + data.id + '_' + x;
					html += '<div class="checkbox fontA" style="' + extraStyle + '">';

					html += '<input type="checkbox" class="fontA" id="' + uniqueId + '" ' + disabled + ' name="' + data.selection[x].key + '" value="' + data.selection[x].key + '"> ';
					html += '<label class="' + disabled + '" for="' + uniqueId + '">';
					html += data.selection[x].value;
					html += '</label>';
					html += '</div>';
				}

				html += '</div>';

				return html;

			},
			//set the field value
			set : function (data, value, cellSelector, parent) {

				$(cellSelector).find("input").iCheck("uncheck");

				if (typeof value === "object") {
					for (var x in value) {
						$(cellSelector).find("input[name=" + value[x] + "]").iCheck("check");
					}
				} else {

					$(cellSelector).find("input[name='" + value + "']").iCheck("check");
				}

			},

			//get the field value
			get : function (data, cellSelector) {
				var boxes = $(cellSelector).find("input:checked");
				var data = [];
				for (var x = 0; x < boxes.length; x++) {
					data.push($(boxes[x]).val());
				}
				return data;
			},

			//get the field, input, select, etc.
			getFieldNode : function (field, cellSelector) {
				return $(cellSelector).find("input");
			},

			//flush the field
			flush : function (cellSelector, parent) {

				$(cellSelector).find("input").iCheck("uncheck");

			},
            
            afterDOMCreation : function (data, cellSelector, parent){
                     
                $(cellSelector).find("input").iCheck({
                    checkboxClass: 'icheckbox_' + parent.settings.useICheck,
                  }); 

            },            

			enable : function (data, enable, cellSelector) {

				//If readonly this is always disabled....
				if (data.readonly === true)
					return false;

				if (enable === true) {			
                    $(cellSelector).find("input").iCheck('enable');                    
					//set the label enabled too
					$(cellSelector).find("label").removeClass("disabled");
				} else if (enable === false) {
					$(cellSelector).find("input").iCheck('disable');
					//set the label disabled too
					$(cellSelector).find("label").addClass("disabled");

				}

			}

		});    
        

	/**
	 * Boolean data type for the grid
	 *
	 */
	gridform.types.boolean = $.extend({}, gridform.types.__mastertype, {
			//render the field content
			render : function (data, cellSelector, parent) {

				//Simple textarea
				var width = (data.width !== undefined) ? 'width:' + data.width : '';
				var disabled = (parent.settings.mode === "edit") ? '' : 'disabled';
				//Should font-Awesome be used or iCheck ... both need some other css
				var fontA = (parent.settings.useFontAwesome === true) ? 'fontA' : '';

				var html = '<div class="form-group">';

				var uniqueId = parent.settings.name + '_' + data.id;
				html += '<div class="checkbox ' + fontA + '">';
				html += '<input type="checkbox" class="' + fontA + '" id="' + uniqueId + '" ' + disabled + ' name="" value="1"> <label for="' + uniqueId + '">&nbsp;</label>';
				html += '</div>';
				html += '</div>';

				return html;

			},
			//set the field value
			set : function (data, value, cellSelector, parent) {
                
				$(cellSelector).find("input").prop("checked", false);
				if (value === true) {
					$(cellSelector).find("input").prop("checked", true);
				} else {
					$(cellSelector).find("input").prop("checked", false);
				}

			},

			//get the field value
			get : function (data, cellSelector) {
				var boxes = $(cellSelector).find("input:checked");
				if (boxes.length > 0) {
					return true;
				} else {
					return false;
				}
			},

			//get the field, input, select, etc.
			getFieldNode : function (field, cellSelector) {
				return $(cellSelector).find("input");
			},

			//flush the field
			flush : function (cellSelector, parent) {

				$(cellSelector).find("input").prop("checked", false);

			},     
                      

			enable : function (data, enable, cellSelector) {

				//If readonly this is always disabled....
				if (data.readonly === true)
					return false;

				if (enable === true) {
					$(cellSelector).find("input").removeAttr("disabled");
				} else if (enable === false) {
					$(cellSelector).find("input").attr("disabled", "disabled");
				}

			}

		});
        
        
    /**
	 * Boolean data type for the grid
	 *
	 */
	gridform.types.iboolean = $.extend({}, gridform.types.__mastertype, {
			//render the field content
			render : function (data, cellSelector, parent) {

				//Simple textarea
				var width = (data.width !== undefined) ? 'width:' + data.width : '';
				var disabled = (parent.settings.mode === "edit") ? '' : 'disabled';
		
				var html = '<div class="form-group">';

				var uniqueId = parent.settings.name + '_' + data.id;
				html += '<div class="checkbox fontA">';
				html += '<input type="checkbox" class="fontA" id="' + uniqueId + '" ' + disabled + ' name="" value="1"> <label for="' + uniqueId + '">&nbsp;</label>';
				html += '</div>';
				html += '</div>';

				return html;

			},
			//set the field value
			set : function (data, value, cellSelector, parent) {
                
				if (value === true){
                    $(cellSelector).find("input").iCheck("check");
				} else {
					$(cellSelector).find("input").iCheck("uncheck");
				}

			},

			//get the field value
			get : function (data, cellSelector) {
				var boxes = $(cellSelector).find("input:checked");
				if (boxes.length > 0) {
					return true;
				} else {
					return false;
				}
			},

			//get the field, input, select, etc.
			getFieldNode : function (field, cellSelector) {
				return $(cellSelector).find("input");
			},

			//flush the field
			flush : function (cellSelector, parent) {

				$(cellSelector).find("input").iCheck("uncheck");

			},
            
            afterDOMCreation : function (data, cellSelector, parent){
                     
                $(cellSelector).find("input").iCheck({
                    checkboxClass: 'icheckbox_' + parent.settings.useICheck,
                  }); 

            }, 

			enable : function (data, enable, cellSelector) {

				//If readonly this is always disabled....
				if (data.readonly === true)
					return false;

				if (enable === true) {
                    $(cellSelector).find("input").iCheck("enable");
				} else if (enable === false) {
					$(cellSelector).find("input").iCheck("disable");
				}
			}
		});     

	// Headline for a content area
	gridform.types.headline = $.extend({}, gridform.types.__mastertype, {

			labelAllowed : false,
			containsData : false,

			//render the field content
			render : function (data, cellSelector, parent) {
				var html = '<div class="headline">' + data.label + '</div>';
				return html;
			}
		});

	// Separation line
	gridform.types.separator = $.extend({}, gridform.types.__mastertype, {

			labelAllowed : false,
			containsData : false,

			//render the field content
			render : function (data, cellSelector, parent) {
				var html = '<div class="separator"></div>';
				return html;
			}
		});

	/**
	 * Extend the built-in types
	 *
	 * @param type {String} Name of the type
	 * @param object {Object} Complete object with all the field functions that are overwriting the existing ones in the mastertype
	 */
	gridform.addType = function (type, object, originalType) {
    
        if(originalType !== undefined && gridform.types[originalType]!==undefined){
            originalType = gridform.types[originalType];
        } else {
            originalType = {};
        }
    
		gridform.types[type] = $.extend({}, gridform.types.__mastertype, originalType, object);
	};
    
    

	
	/**
	 * Set the default values for the settings (for every instantiated gridform object)
	 *
	 * This can be useful for a standard form for a whole application
	 *
	 * @param object {Object} Settings object
	 */
	gridform.setDefaults = function (settings) {
		//Overwrite the default settings with the given values...
		gridform.form.prototype.defaultSettings = $.extend({}, gridform.form.prototype.defaultSettings, settings);
	};

	/**
	 * Add gridform library as jquery plugin
	 *
	 * @ignore
	 */
	$.fn.gridform = function (settings) {

		//Already existing with this name, then stop right now!
		if (gridform.forms[settings.name] !== undefined) {
			console.error("A form with the name '" + settings.name + "' already exists!");
		}
		//Create a new object of gridform
		var obj = new gridform.form(settings);
		if (obj === false)return false;
		//If the function is called for an already specified target, then render it to that element!
		if ($(this).length === 1)obj.render(this);

		//if no name is given, the object will not be available via direct access like "gridform.forms[<name>]"
		//but the object is returned here directly...
		if (settings.name !== undefined) {
			gridform.forms[settings.name] = obj;
		}
		return obj;

	};

}(jQuery));
