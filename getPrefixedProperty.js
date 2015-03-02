
(function(window){

    var helper = window.helper || (window.helper = {});

    var prefixedProperties = {};
    var testDiv = document.createElement('div');
    var availablePrefixes = ["Webkit", "webkit", "ms", "Moz", "moz", "o", "O"];

    var getPrefixedProperty = function (property) {

        var camelCaseProperty;
        if (!prefixedProperties[property]) {
            prefixedProperties[property] = property;

            if (typeof testDiv.style[property] === 'undefined') {
                camelCaseProperty = property.charAt(0).toUpperCase() + property.slice(1);

                for (var i = 0; i < availablePrefixes.length; i++) {
                    if (typeof testDiv.style[availablePrefixes[i] + camelCaseProperty] !== "undefined") {
                        availablePrefixes = [availablePrefixes[i]];
                        prefixedProperties[property] = availablePrefixes[i] + camelCaseProperty;
                        break;
                    }
                }
            }
        }

        return prefixedProperties[property];
    };

    helper.getPrefixedProperty = getPrefixedProperty;

}(this));
