//SELECT-LIST
gridform.addType("autocomplete", {
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
        //set the field value
        set : function (data, value, cellSelector, parent) {

            //Set the data in the textarea
            if (parent.settings.mode === "edit") {
                $(cellSelector).find("input").val(value);
            } else {
                $(cellSelector).find("input").val(value);
            }
        },

        //get the field value
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

        },

        afterDOMCreation : function (data, cellSelector, parent) {
    
            var elem = $(cellSelector).find("input");
            
            var minLength = (data.minLength == undefined)? 1: data.minLength;
            if(data.url === undefined || typeof data.url !== "string"){
                console.error("There is no url provided for the callback of field '"+ data.id +"'!");
                return;
            }            
              
            $(elem).autocomplete({
                source: data.url,
                minLength: minLength               
            });

        }

    });
