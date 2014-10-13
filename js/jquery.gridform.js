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
			$(gridform.forms[this.settings.name]).trigger("rendered", [{
						'rendered' : this.rendered
					}
				]);

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
			var html = '<table class="gridform" border=0 ><tbody>';

			if (this.settings.labelType === "inline") {

				//Build an empty row to set the column widths as set by the settings
				html += '<tr>';
				for (var c = 1; c <= this.cols; c++) {
					var labelWidth = '';
					var contentWidth = '';
					if (this.settings.dimensions['col_' + c] !== undefined) {
						labelWidth = (this.settings.dimensions['col_' + c].labelWidth !== undefined) ? 'width:' + this.settings.dimensions['col_' + c].labelWidth : '';
						contentWidth = (this.settings.dimensions['col_' + c].contentWidth !== undefined) ? 'width:' + this.settings.dimensions['col_' + c].contentWidth : '';
					}
					html += '<td style="' + labelWidth + '"></td>';
					html += '<td style="' + contentWidth + '"></td>';
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
							html += '<td data-id="' + rc + '" class="gridform_content" colspan="2">';
							if (showCellNames)
								html += rc;
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
									if (this.settings.debug)
										console.log("The cell " + x + '_' + y + " is filled by field '" + this.settings.fields[rc].id + "'");
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
								html += '<td data-id="' + rc + '" class="gridform_content" colspan="' + colspan + '" rowspan="' + rowspan + '">';
								if (showCellNames)
									html += rc;
								html += '</td>';
							} else {
								//Label and ... field

								html += '<td data-id="' + rc + '" class="gridform_label" style="text-align:' + labelAlign + ';" rowspan="' + rowspan + '">';
								if (showCellNames)
									html += '<small>' + rc + ': ' + this.settings.fields[rc].label + '</small>';
								html += '</td>';
								//Field
								html += '<td data-id="' + rc + '" class="gridform_content" style="height:100%;vertical-align:top;" colspan="' + colspan + '" rowspan="' + rowspan + '">';
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
				html += '<tr>';
				for (var c = 1; c <= this.cols; c++) {
					var contentWidth = '';
					if (this.settings.dimensions['col_' + c] !== undefined) {
						contentWidth = (this.settings.dimensions['col_' + c].contentWidth !== undefined) ? 'width:' + this.settings.dimensions['col_' + c].contentWidth : '';
					}
					html += '<td style="' + contentWidth + '"></td>';
				}
				html += '</tr>';

				for (var r = 1; r <= this.rows; r++) {

					//Build all cells in that row
					//This is always two <tr> per logical ROW

					html += '<tr>';
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
							html += '<td data-id="' + rc + '" class="gridform_content" rowspan="2">';
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
									if (this.settings.debug)
										console.log("The cell " + x + '_' + y + " is filled by field content '" + this.settings.fields[rc].id + "'");
									spannedCells[x + '_' + y] = this.settings.fields[rc];
								}
							}

							//Place for an label
							//is a label allowed for the type?
							var labelAllowed = (gridform.types[this.settings.fields[rc].type] !== undefined && gridform.types[this.settings.fields[rc].type].labelAllowed === false) ? false : true;

							if (this.settings.fields[rc].label === undefined || labelAllowed === false) {

								//Rowspan is here now the configured rowspan * 2 (there is no label)
								html += '<td data-id="' + rc + '" class="gridform_content" colspan="' + colspan + '" rowspan="' + (rowspan * 2) + '">';
								if (showCellNames)
									html += rc;
								html += '</td>';

							} else {
								//Label
								html += '<td data-id="' + rc + '" class="gridform_label" style="text-align:' + labelAlign + ';" colspan="' + colspan + '">';
								if (showCellNames)
									html += '<small>' + rc + ': ' + this.settings.fields[rc].label + '</small>';
								html += '</td>';

							}

						}

					}
					html += '</tr>';

					//Build all cells in that row with field content
					html += '<tr>';
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
								html += '<td data-id="' + rc + '" class="gridform_content" style="height:100%;vertical-align:top;" colspan="' + colspan + '" rowspan="' + ((rowspan * 2) - 1) + '">';
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

				//Gibt es diesen Typen
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
				if (this.fieldsById[x] === undefined) {
					//Error
					console.error("No field with id " + x + ", so I can set the data!");
				} else {
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
				if (this.settings.debug)
					console.log("getElement: No getFieldNode-Method for field type " + field.type);
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
				if (this.settings.debug)
					console.log("No set" + type + "-Method for field type " + field.type);
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
					if (this.settings.debug)
						console.log("No resetFieldMark-Method for field type " + field.type);
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
				return data;

			} else {
				return get(id);
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
		validate : function (id, callback) {

			var that = this;

			//Internal function
			function validate(id, callback, onlyOne) {

				//Reset the field
				that.resetFieldMarks(id);

				var field = that.fieldsById[id];
				if (field === undefined)
					return false;
				var type = field.type;

				//Is this a field with data
				if (gridform.types[type].containsData !== true)
					return false;

				//get the cell where this field is
				var cellSelector = that.settings.target + ' td[data-id=' + field.row + '_' + field.col + '].gridform_content';
				var valid = true;

				var value = that.getData(field.id);
				//Mandatory field
				if (field.mandatory === true &&
					(value === "" || value === null || value === undefined ||
						(typeof value === "object" && value.length === 0))) {
					that.setError(id, that.settings.language.mandatoryField);
					that.valid = false;
					valid = false;
					that.validated++;

					if (that.settings.debug)
						console.log("Validated: " + that.validated + " / " + that.fieldCount + " => " + field.id);
					//Cancel here
					if (onlyOne === true || that.fieldCount == that.validated) {
						if (onlyOne === true) {
							that.enable(true, id);
							if (that.settings.debug)
								console.log("Validated field " + id + " to " + valid);
						} else {
							that.enable(true);
							if (that.settings.debug)
								console.log("Validated form to " + that.valid);
						}
						if (typeof callback === "function") {
							if (that.settings.debug)
								console.log("ready with validating");
							callback(valid);
						}
					}

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
							that.valid = false;
						}

						that.validated++;
						if (that.settings.debug)
							console.log("Validated: " + that.validated + " / " + that.fieldCount + " => " + field.id);
						//Are all fields checked?!
						if (onlyOne === true || that.fieldCount == that.validated) {
							if (onlyOne === true) {
								that.enable(true, id);
								if (that.settings.debug)
									console.log("Validated field " + id + " to " + valid);
								//Trigger the event
								$(gridform.forms[that.settings.name]).trigger("validated", [{
											id : valid
										}
									]);
							} else {
								that.enable(true);
								if (that.settings.debug)
									console.log("Validated form to " + that.valid);
								//Trigger the event
								$(gridform.forms[that.settings.name]).trigger("validated", [that.valid]);
							}
							if (typeof callback === "function") {
								if (that.settings.debug)
									console.log("Validated: " + that.validated + " / " + that.fieldCount + " => " + field.id);
								callback(that.valid);
							}

						}

					});

				} else {

					//Is there an internal function for that type
					if (gridform.types[type] !== undefined && typeof gridform.types[type]['validate'] === "function") {
						//Call that function
						var valid = gridform.types[type]['validate'](field, cellSelector);
						if (valid !== true) {
							if (that.settings.debug)
								console.log(valid);
							that.setError(id, valid);
							that.valid = false;
						}
					}
					that.setSuccess(id);

					that.validated++;
					if (that.settings.debug)
						console.log("Validated: " + that.validated + " / " + that.fieldCount + " => " + field.id);
					//Are all fields checked?!
					if (onlyOne === true || that.fieldCount == that.validated) {
						if (onlyOne === true) {
							that.enable(true, id);
							if (that.settings.debug)
								console.log("Validated field " + id + " to " + valid);
							//Trigger the event
							$(gridform.forms[that.settings.name]).trigger("validated", [{
										id : that.valid
									}
								]);
						} else {
							that.enable(true);
							if (that.settings.debug)
								console.log("Validated form to " + that.valid);
							//Trigger the event
							$(gridform.forms[that.settings.name]).trigger("validated", [that.valid]);
						}

						if (typeof callback === "function") {
							if (that.settings.debug)
								console.log("ready with validating");
							callback(that.valid);
						}
					}
				}

			};

			this.valid = true;
			this.validated = 0;

			if (id === undefined) {
				this.enable(false);
				//validate all fields
				for (var x in this.fieldsById) {
					validate(this.fieldsById[x].id, callback);
				}

			} else {
				//just one field
				this.enable(false, id);
				validate(id, callback, true);
			}
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

		}

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
		if (obj === false)
			return false;
		//If the function is called for an already specified target, then render it to that element!
		if ($(this).length === 1)
			obj.render(this);

		//if no name is given, the object will not be available via direct access like "gridform.forms[<name>]"
		//but the object is returned here directly...
		if (settings.name !== undefined) {
			gridform.forms[settings.name] = obj;
		}
		return obj;

	};

}(jQuery));
