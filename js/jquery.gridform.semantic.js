/** @namespace */
var gridform = gridform || {};
gridform.ui = gridform.ui || {};
/**
 * jquery.gridform v0.4 alpha
 * Semantic ui for jquery.gridform
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

    gridform.form.prototype.defaultSettings.icon_success  = 'green checkmark';
    gridform.form.prototype.defaultSettings.icon_waiting  = 'loading';
    gridform.form.prototype.defaultSettings.icon_warning  = 'red warning';
    gridform.form.prototype.defaultSettings.icon_error  = 'red remove';

    
	/**
	 * These functions need to be overwritten as well (the mastertype is not correct for semantic ui)
     *	
	 * @class mastertype
	 */     
	var mastertypeOverwrites = {
        
		/**
		 * Set a label for the type
		 *
		 * @memberOf mastertype
		 * @param data {Object} JSON object with config data of the field
		 * @param cellSelectorLabel {string} String with the cell selector expression
		 * @param parent {Object} gridform object
		 */
		setLabel : function (data, cellSelectorLabel, parent) {
            
            var html = '<div class="ui form" style="">';
            html += '<div class="field">';
			html += '<label>' + data.label;
			//Mark mandatory fields with an asterisk
			if (parent.settings.markMandatoryFields === true && data.mandatory === true) {
				html += ' *';
			}
			html += '</label>';
            html += '</div></div>';

			return html;

		},

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
            
			if (field.hasFeedback === true) {
				$(cellSelectorContent).find("div.input i").addClass(parent.settings['icon_' + type]).show();
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
			
            $(cellSelectorContent).find(".field").addClass("error");
            $(cellSelectorLabel).find(".field").addClass("error");
           
            //set the error
			this.setStatus(field, 'error', cellSelectorLabel, cellSelectorContent, parent);
    
            //Show tooltip
            $(cellSelectorContent).find("div.field").popup({transition:'fade', "content":error});
			
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
            //Show tooltip
            $(cellSelectorContent).find(".field").data("content",message).popup({transition:'fade'});
            
            if (parent.settings.showTooltipInstantly === true) {
				$(cellSelectorContent).find(".field").popup('show');
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
			$(cellSelectorLabel).find('.field').removeClass("error").removeClass("success").removeClass("warning");
			$(cellSelectorContent).find(".field").removeClass("error").removeClass("success").removeClass("warning").data("status", "");
			//delete error
			$(cellSelectorContent).find(".field").popup('destroy');

			if (data.hasFeedback === true) {
				$(cellSelectorContent).find("i")
				.removeClass(parent.settings.icon_success)
				.removeClass(parent.settings.icon_error)
				.removeClass(parent.settings.icon_warning)
				.removeClass(parent.settings.icon_waiting);
			}
		}
	};
        
	//String field type
	gridform.types.string = $.extend({}, gridform.types.string, {

			//render the field content
			render : function (data, cellSelector, parent) {

				//Simple input text
				var disabled = (parent.settings.mode === "edit" && data.readonly !== true) ? '' : 'disabled';
				var hasFeedback = (data.hasFeedback === true) ? 'has-feedback' : '';
				var width = (data.width !== undefined) ? 'width:' + data.width : '';
				var type = (data.pwd === true) ? 'password' : 'text';
				var placeholder = (data.placeholder !== undefined) ? data.placeholder : '';
				var maxLength = (data.maxLength !== undefined) ? 'maxlength="' + parseInt(data.maxLength, 10) + '"' : '';
                                
                var html = '<div class="ui form">';
                
                if (hasFeedback !== "") {
                    html += '<div class="ui mini field icon input" style="'+ width +'">';
                    html += '   <input type="' + type + '" ' + disabled + ' ' + maxLength + ' placeholder="' + placeholder + '">';
                    html += '       <i class="icon"></i>';
                } else {
                    html += '<div class="ui mini input" style="'+ width +'">';
                    html += '<input type="' + type + '" ' + disabled + ' ' + maxLength + ' placeholder="' + placeholder + '">';
                }
                
                html += '</div>';
                html += '</div>';
                
				return html;

			}
			
		
			

		},mastertypeOverwrites);

	//TEXTAREA
	gridform.types.text = $.extend({}, gridform.types.text, {
			//render the field content
			render : function (data, cellSelector, parent) {

	                
                //Simple input text
				var disabled = (parent.settings.mode === "edit" && data.readonly !== true) ? '' : 'disabled';
				var hasFeedback = (data.hasFeedback === true) ? 'has-feedback' : '';
				var width = (data.width !== undefined) ? 'width:' + data.width : '';
				var type = (data.pwd === true) ? 'password' : 'text';
				var placeholder = (data.placeholder !== undefined) ? data.placeholder : '';
				var maxLength = (data.maxLength !== undefined) ? 'maxlength="' + parseInt(data.maxLength, 10) + '"' : '';
                                
                var html = '<div class="ui form">';
                
                if (hasFeedback !== "") {
                    html += '<div class="ui mini field icon input" style="'+ width +'">';
                    html += '   <textarea type="' + type + '" ' + disabled + ' ' + maxLength + ' placeholder="' + placeholder + '"></textarea>';
                    html += '       <i class="icon"></i>';
                } else {
                    html += '<div class="ui mini input" style="'+ width +'">';
                    html += '<textarea type="' + type + '" ' + disabled + ' ' + maxLength + ' placeholder="' + placeholder + '"></textarea>';
                }
                
                html += '</div>';
                html += '</div>';
                
                

				return html;

			},
			

			

		},mastertypeOverwrites);

        
        
    //Original-Funktion afterDOMCreation abspeichern!
    origAfterDomCreation = gridform.types.select.afterDOMCreation;
	//SELECT-LIST
	gridform.types.select = $.extend({}, gridform.types.select, {
			//render the field content
			render : function (data, cellSelector, parent) {

				//Simple textarea
				var disabled = (parent.settings.mode === "edit") ? '' : 'disabled';
				var hasFeedback = (data.hasFeedback === true) ? 'has-feedback' : '';
				var width = (data.width !== undefined) ? 'width:' + data.width : '';
                				                                                              
                var html = '<div class="ui form">';
                
                if (hasFeedback !== "") {
                    html += '<div class="ui mini field icon input">';
                    html += '   <select class="ui dropdown search" style="'+ width +'" ' + disabled + '></select>';
                    html += '       <i class="icon"></i>';
                } else {
                    html += '<div class="ui mini field input ">';
                    html += '   <select class="ui dropdown search" style="'+ width +'" ' + disabled + '></select>';
                }
                
                html += '</div>';
                html += '</div>';

				return html;
			},
            
            enable : function (data, enable, cellSelector) {

				//If readonly this is always disabled....
				if (data.readonly === true)
					return false;

				if (enable === true) {
					$(cellSelector).find(".dropdown").removeClass("disabled");
				} else if (enable === false) {
					$(cellSelector).find(".dropdown").addClass("disabled");
				}

			},
                       
            
            afterDOMCreation : function (data, cellSelector, parent){
            
                origAfterDomCreation(data, cellSelector, parent);
               
                $('select.dropdown').dropdown()
            }
			
            

		},mastertypeOverwrites);

	gridform.types.radio = $.extend({}, gridform.types.radio, {
			//render the field content
			render : function (data, cellSelector, parent) {

				//Simple textarea
				var width = (data.width !== undefined) ? 'width:' + data.width : '';
				var disabled = (parent.settings.mode === "edit") ? '' : 'disabled';
				//Should font-Awesome be used?
				var fontA = (parent.settings.useFontAwesome === true) ? 'fontA' : '';
				//inline vs normal
				var extraStyle = (data.inline === true) ? 'display:inline-block;padding-right:10px;' : '';       
				var html = '<div class="ui grouped field">';               

				for (var x in data.selection) {                  
 
                    var uniqueId = parent.settings.name + '_' + data.id + '_' + x;
                    html += '<div class="" style="'+ extraStyle +'">';
                    html += '  <div class="ui radio checkbox">';
                    html += '   <input type="radio" id="' + uniqueId + '" ' + disabled + ' name="' + data.id + '_radios" value="' + data.selection[x].key + '">';
                    html += '      <label>'+ data.selection[x].value +'</label>';
                    html += '</div>';
                    html += '</div>';                    
                    
				}

				html += '</div>';

				return html;

			},			
            
            afterDOMCreation : function (data, cellSelector, parent) {
                
                $(cellSelector).find('.ui.radio.checkbox').checkbox();
            
            }

		},mastertypeOverwrites);

	gridform.types.checkbox = $.extend({}, gridform.types.checkbox, {
			//render the field content
			render : function (data, cellSelector, parent) {

				//Simple textarea
				var width = (data.width !== undefined) ? 'width:' + data.width : '';
				var disabled = (parent.settings.mode === "edit") ? '' : 'disabled';
				//Should font-Awesome be used?
				var fontA = (parent.settings.useFontAwesome === true) ? 'fontA' : '';
				//inline vs normal
				var extraStyle = (data.inline === true) ? 'display:inline-block;padding-right:10px;' : '';
        
                var html = '<div class="ui grouped field">';               

				for (var x in data.selection) {                  
 
                    var uniqueId = parent.settings.name + '_' + data.id + '_' + x;
                    html += '<div class="" style="'+ extraStyle +'">';
                    html += '  <div class="ui checkbox">';
                    html += '   <input type="checkbox" id="' + uniqueId + '" ' + disabled + ' name="' + data.selection[x].key  + '" value="' + data.selection[x].key + '">';
                    html += '      <label class="'+ disabled + '" for="'+ uniqueId +'">'+ data.selection[x].value +'</label>';
                    html += '</div>';
                    html += '</div>';                    
                    
				}

				html += '</div>';
                
				return html;

			},
			

		},mastertypeOverwrites);

	/**
	 * Boolean data type for the grid
	 *
	 */
	gridform.types.boolean = $.extend({}, gridform.types.boolean, {
			//render the field content
			render : function (data, cellSelector, parent) {

				//Simple textarea
				var width = (data.width !== undefined) ? 'width:' + data.width : '';
				var disabled = (parent.settings.mode === "edit") ? '' : 'disabled';
				//Should font-Awesome be used?
				var fontA = (parent.settings.useFontAwesome === true) ? 'fontA' : '';

				var html = '<div class="ui form">';     
                html += '<div class="grouped fields">';               
                
				var uniqueId = parent.settings.name + '_' + data.id;
				                
                html += '  <div class="ui checkbox">';
                html += '   <input type="checkbox" id="' + uniqueId + '" ' + disabled + ' name="" value="1">';
                html += '      <label class="'+ disabled + '" for="'+ uniqueId +'">&nbsp;</label>';
                html += '</div>';
                html += '</div>';   
                
				return html;

			},
			

		},mastertypeOverwrites);
        
    /** Overwrite at least the mastertype of other types */
	gridform.types.iboolean = $.extend({}, gridform.types.iboolean, mastertypeOverwrites);
	gridform.types.icheckbox = $.extend({}, gridform.types.icheckbox, mastertypeOverwrites);
	gridform.types.iradio = $.extend({}, gridform.types.iradio, mastertypeOverwrites);
    
    /** Finaly overwrite the original mastertype here as well (so, that additional types can borrow things correctly, see method addType in jquery.gridfrom) */
    gridform.types.__mastertype = $.extend(gridform.types.__mastertype, mastertypeOverwrites); 
    
      
        
}(jQuery));
