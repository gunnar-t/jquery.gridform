//SELECT-LIST
gridform.addType("autocomplete", {
  
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

    }, 'string');
