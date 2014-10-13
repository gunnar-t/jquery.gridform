/** @namespace */
var gridform = gridform || {};
gridform.ui = gridform.ui || {};
/**
 * jquery.gridform v0.4 alpha
 * Bootstrap ui for jquery.gridform
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

	console.log("UI bootstrap");
	/**
	 * Abstract field type
	 *
	 * All fields extend this type and overwrite some of the methods.
	 *
	 * @class mastertype
	 */
	var mastertype = {

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
					html += '   <span style="display:none;top:0;" class="' + parent.settings.icon_success + ' form-control-feedback"></span>';
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

	gridform.types.checkbox = $.extend({}, mastertype, {
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

	/**
	 * Boolean data type for the grid
	 *
	 */
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
                
                console.log(cellSelector);
				$(cellSelector).find("input").prop("checked", false);
                console.log(value);
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

	// Headline for a content area
	gridform.types.headline = $.extend({}, mastertype, {

			labelAllowed : false,
			containsData : false,

			//render the field content
			render : function (data, cellSelector, parent) {
				var html = '<div class="headline">' + data.label + '</div>';
				return html;
			}
		});

	// Separation line
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
	 *
	 * @param type {String} Name of the type
	 * @param object {Object} Complete object with all the field functions that are overwriting the existing ones in the mastertype
	 */
	gridform.addType = function (type, object) {
		gridform.types[type] = $.extend({}, mastertype, object);
	};

}(jQuery));
