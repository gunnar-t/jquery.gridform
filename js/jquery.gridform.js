var gridform = gridform || {};
/**
 * jquery.gridform v0.3
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
	 */
	gridform.form = function (settings) {
		return this.init(settings);
	};
	gridform.form.prototype = {

		settings : null,
		fieldsById : {},
		renderedAtTarget : null,
		rendered : null,
		fieldCount : null,
        //default settings that can be overwritten on prototype level :)
        defaultSettings: {
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
            tooltipOrientation: "bottom",
            //success should not be shown by green color (if you do not want a rainbow coloured form :))
            successIsGreen : false,
            //use font-awesome for checkboxes and radio-buttons
            useFontAwesome : false,
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
        
        

		init : function (userSettings) {

			//Settings
			this.settings = $.extend(this.defaultSettings, userSettings);

			//At least a name must be prodived!
			if (this.settings.name === undefined) {
				console.error("A 'name' for the gridform is needed!");
				this.settings = {};
				return false;
			}

			return this;

		},

		/**
		 * Render the grid to the given selector
		 *
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

		__buildTable : function (debugOptions) {

			//Check how many rows and cols we need
			this.cols = 0;
			this.rows = 0;
			var fields = {};

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
                
				//Are there functions for some methods after adding the grid, label and contents to the DOM
				//e.g. Event Handler, async loadable Selection-Options, etc....
				if (gridform.types[type] !== undefined && typeof gridform.types[type]['afterDOMCreation'] === "function") {
					gridform.types[type]['afterDOMCreation'](field, cellSelectorContent, this);
				}
                var that = this;
                //Maybe the option "validateOnBlur" is set, so get the element and attach the validation method to the blur event!
                if(field.validateOnBlur === true && (field.mandatory === true || typeof field.validate === "function")){
                    //get the element 
                    var elem = this.getElement(field.id);
                    //wrap that event handler in a lambda function for correct scope
                    //otherwise the id will be that of the last element of the form :)
                    (function(id){
                        elem.on("blur",function(){
                            that.validate(id);
                        });
                    })(field.id);
                
                    
                }
                

			}

		},

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

		setSuccess : function (id) {
			this.setStatus(id, "Success");
		},

		setWarning : function (id, message) {
			this.setStatus(id, "Warning", message);
		},

		setError : function (id, error) {
			this.setStatus(id, "Error", error);
		},

		setWaiting : function (id) {
			this.setStatus(id, "Waiting");
		},

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
					//Hier bereits abbrechen
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
					//call the validate-function with "value" and then the callbback from the validating method
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
							} else {
								that.enable(true);
								if (that.settings.debug)
									console.log("Validated form to " + that.valid);
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
						} else {
							that.enable(true);
							if (that.settings.debug)
								console.log("Validated form to " + that.valid);
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

	/**** all the rendering types *****/
	//Master type (not visible outside of this scope :)
	var mastertype = {

		//Properties
		//is a label allowed (e.g. the headline or separator has no label, just a field content)
		labelAllowed : true,
		//if this field contains data (and can be validated!)
		containsData : true,

		//set the label
		setLabel : function (data, cellSelectorLabel, parent) {

			//var html = '<form class="form-inline" style="display:inline;text-align:right;">';
			var html = '<div class="form-group" style="display:inline;">';
			html += '   <label class="control-label">' + data.label + '</label>';
			html += '</div>';
			//html += '</form>';

			return html;

		},
		//render the field content
		render : function (data, cellSelector, parent) {
			return '';
		},
		//set the field content
		set : function (data, value, cellSelector, parent) {},
		//set a placeholder
		setPlaceholder : function (data, value, cellSelector, parent) {
			return '';
		},
		//get the field content
		get : function (data, cellSelector) {},
		//flush the field
		flush : function (cellSelector, parent) {},
		//enable/disable
		enable : function (field, enable, cellSelector) {},
		//get the field, input, select, etc.
		getFieldNode : function (field, cellSelector) {},
		//setStatus
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
		//setError
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

		//setSuccess
		setSuccess : function (field, message, cellSelectorLabel, cellSelectorContent, parent) {
			//set the error
			this.setStatus(field, 'success', cellSelectorLabel, cellSelectorContent, parent);
		},

		//setWarning
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

		//setWaiting
		setWaiting : function (field, message, cellSelectorLabel, cellSelectorContent, parent) {

			//set the waiting status
			this.setStatus(field, 'waiting', cellSelectorLabel, cellSelectorContent, parent);
			//lock the field while waiting
			parent.enable(false, field.id);

		},

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

	//STRING
	gridform.types.string = $.extend({}, mastertype, {

			//render the field content
			render : function (data, cellSelector, parent) {

				//Simple input text
				var disabled = (parent.settings.mode === "edit" && data.readonly !== true) ? '' : 'disabled';
				var hasFeedback = (data.hasFeedback === true) ? 'has-feedback' : '';
				var width = (data.width !== undefined) ? 'width:' + data.width : '';
				var type = (data.pwd === true) ? 'password' : 'text';
				var placeholder = (data.placeholder !== undefined) ? data.placeholder : '';
				var maxLength = (data.maxLength !== undefined) ? 'maxlength="' + parseInt(data.maxLength, 10) + '"' : '';

				//var html = '<form class="form-inline" role="form" style="">';
				var html = '<div class="form-group ' + hasFeedback + '" style="' + width + '">';
				html += '   <input type="' + type + '" ' + disabled + ' ' + maxLength + ' class="form-control" style="width:100%;" placeholder="' + placeholder + '"></input>';
				if (hasFeedback !== "") {
					html += '   <span style="display:none;top:0;" class="'+ parent.settings.icon_success +' form-control-feedback"></span>';
				}
				html += '</div>';
				//html += '</form>';

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
	gridform.types.text = $.extend({}, mastertype, {
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
					html += '   <span style="display:none;top:0;" class="'+ parent.settings.icon_success +' form-control-feedback"></span>';
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
                setTimeout(function(){
                    var height = $(cellSelector).height();
                    $(cellSelector).find("div").height(height);
                    
                },50);
            }

		});

	//SELECT-LIST
	gridform.types.select = $.extend({}, mastertype, {
			//render the field content
			render : function (data, cellSelector, parent) {

				//Simple textarea
				var disabled = (parent.settings.mode === "edit") ? '' : 'disabled';
				var hasFeedback = (data.hasFeedback === true) ? 'has-feedback' : '';
				var width = (data.width !== undefined) ? 'width:' + data.width : '';

				//var html = '<form class="form-inline" role="form">';
				var html = '<div class="form-group ' + hasFeedback + '" style="' + width + '">';
				html += '   <select ' + disabled + ' class="form-control" style="width:100%;"></select>';
				if (hasFeedback !== "") {
					html += '   <span style="display:none;top:0;" class="'+ parent.settings.icon_success +' form-control-feedback"></span>';
				}
				html += '</div>';
				//html += '</form>';

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

	gridform.types.radio = $.extend({}, mastertype, {
			//render the field content
			render : function (data, cellSelector, parent) {

				//Simple textarea
				var width = (data.width !== undefined) ? 'width:' + data.width : '';
				var disabled = (parent.settings.mode === "edit") ? '' : 'disabled';
				//Should font-Awesome be used?
				var fontA = (parent.settings.useFontAwesome === true) ? 'fontA' : '';
                //inline vs normal
                var extraStyle = (data.inline === true)? 'display:inline-block;padding-right:10px;': '';

				var html = '<div class="form-group">';

				for (var x in data.selection) {
					var uniqueId = parent.settings.name + '_' + data.id + '_' + x;
					html += '<div class="radio ' + fontA + '" style="'+extraStyle+'">';
					html += '<input type="radio" class="' + fontA + '" id="' + uniqueId + '" ' + disabled + ' name="' + data.id + '_radios" value="' + data.selection[x].key + '">';
					html += '<label class="'+disabled+'" for="' + uniqueId + '">';
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

	gridform.types.checkbox = $.extend({}, mastertype, {
			//render the field content
			render : function (data, cellSelector, parent) {

				//Simple textarea
				var width = (data.width !== undefined) ? 'width:' + data.width : '';
				var disabled = (parent.settings.mode === "edit") ? '' : 'disabled';
				//Should font-Awesome be used?
				var fontA = (parent.settings.useFontAwesome === true) ? 'fontA' : '';
                //inline vs normal
                var extraStyle = (data.inline === true)? 'display:inline-block;padding-right:10px;': '';

				var html = '<div class="form-group">';

				for (var x in data.selection) {
					var uniqueId = parent.settings.name + '_' + data.id + '_' + x;
					html += '<div class="checkbox ' + fontA + '" style="'+extraStyle+'">';

					html += '<input type="checkbox" class="' + fontA + '" id="' + uniqueId + '" ' + disabled + ' name="' + data.selection[x].key + '" value="' + data.selection[x].key + '"> ';
					html += '<label class="'+disabled+'" for="' + uniqueId + '">';
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

	gridform.types.boolean = $.extend({}, mastertype, {
			//render the field content
			render : function (data, cellSelector, parent) {

				//Simple textarea
				var width = (data.width !== undefined) ? 'width:' + data.width : '';
				var disabled = (parent.settings.mode === "edit") ? '' : 'disabled';
				//Should font-Awesome be used?
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
					$(cellSelector).find("input[name='" + value + "']").prop("checked", true);
				} else {
					$(cellSelector).find("input[name='" + value + "']").prop("checked", false);
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

	//Headline for separation of form parts
	gridform.types.headline = $.extend({}, mastertype, {

			labelAllowed : false,
			containsData : false,

			//render the field content
			render : function (data, cellSelector, parent) {
				var html = '<div class="headline">' + data.label + '</div>';
				return html;
			}
		});

	//Headline for separation of form parts
	gridform.types.separator = $.extend({}, mastertype, {

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
	 */
	gridform.addType = function (type, object) {
		gridform.types[type] = $.extend({}, mastertype, object);
	};
    
    /**
    * Set the default values for the settings
    * This can be useful for a standard form for a whole application
    */
    gridform.setDefaults = function(settings){
        //Overwrite the default settings with the given values...
        gridform.form.prototype.defaultSettings = $.extend(gridform.form.prototype.defaultSettings, settings);
    };
    
	/*** add as jquery plugin ****/
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

		gridform.forms[settings.name] = obj;
		return obj;

	};

}(jQuery));
