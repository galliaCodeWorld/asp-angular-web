var MultiPlatformChat = MultiPlatformChat || {};

if (MultiPlatformChat.hasOwnProperty("JsHelper") === false) {
    MultiPlatformChat.JsHelper = function () {
        //var self = this;

        //var base64Key = self.base64Encode("MyLocalKey");
        //var reg = new RegExp('=');
        //var key = base64Key.replace(reg, '');
        //this.ipKey = "MyLocalKey";

        // ipKey is a readonly property, exposed using a method
        var _ipKey = "MyLocalKey";
        this.ipKey = function () {
            return _ipKey;
        }
    }

    MultiPlatformChat.JsHelper.prototype.tryParseJson = function (json) {
        //console.log("parseing json: ", json);
        try {
            var obj = JSON.parse(json);
            return obj;
        }
        catch (error) {
            //console.log("json parse errro: ", error);
            return null;
        }
    }

    MultiPlatformChat.JsHelper.prototype.parseHttpResponseMessage = function (httpResponseMessage) {
        // NOTE: returns an httpResponseMessage object
        var self = this;
        try {
            var isValid = true;
            var obj = JSON.parse(httpResponseMessage);
            if (obj.hasOwnProperty("statusCode") === false || obj.hasOwnProperty("content") === false || obj.hasOwnProperty("actionCode") === false) {
                isValid = false;
            }
            return isValid ? obj : null;
        }
        catch (error) {
            return null;
        }
    }

    //MultiPlatformChat.JsHelper.prototype.tryGetHttpResponseContent = function (httpResponseMessage) {
    //    // NOTE: returns content as string or object, returns empty string if any errors occur
    //    var self = this;

    //    var response = self.parseHttpResponseMessage(httpResponseMessage);
    //    if (self.isEmpty(response) === false && response.statusCode === 200) {
    //        var obj = self.tryParseJson(response.content);

    //        return self.isEmpty(obj) ? response.content : obj;
    //    }

    //    return "";
    //}

    MultiPlatformChat.JsHelper.prototype.empty = function (obj) {
        let self = this;
        return self.isEmpty(obj);
    }

    MultiPlatformChat.JsHelper.prototype.isEmpty = function (obj) {
        if (obj === undefined || obj === null || obj === "" || (Object.keys(obj).length === 0 && obj.constructor === Object)) {
            return true;
        }
        else {
            return false;
        }
    }

    MultiPlatformChat.JsHelper.prototype.setCookie = function (name, value, expireDays) {
        var self = this;
        //console.log("setCookie value: ", value);

        //console.log("setting cookie: ", name, value, expireDays);
        if (typeof value !== "string") {
            value = self.stringify(value);
            //console.log("setCookie after stringify value: ", value);
        }

        // NOTE: value and name can not contain ";"
        return new Promise(function (resolve, reject) {
            // check to make sure value and name does not contain ";",
            // do not set the cookie if its name or value
            // has a ";" in it

            var valid = true;
            if (self.isEmpty(name) || typeof name !== 'string' || name.indexOf(';') >= 0) {
                valid = false;
            }

            if (typeof value !== 'string' || value.indexOf(';') >= 0) {
                valid = false;
            }

            if (valid) {
                var d = new Date();
                d.setTime(d.getTime() + (expireDays * 24 * 60 * 60 * 1000));
                var expires = "expires=" + d.toUTCString();
                document.cookie = name + "=" + value + ";" + expires + ";path=/";

                resolve();
            }
            else {
                reject("Make sure the cookie name and value does not contain a ';' in it.")
            }
        });
    }

    MultiPlatformChat.JsHelper.prototype.getCookie = function (cname) {
        //console.log("getting cookie: ", cname);
        var name = cname + "=";
        //console.log("name: ", name);
        var decodedCookie = decodeURIComponent(document.cookie);
        //console.log("decodedCookie: ", decodedCookie);
        var ca = decodedCookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }

    MultiPlatformChat.JsHelper.prototype.createHash = function (key) {
        // TODO: need to generate secret using algorithm, server will use same algorithm to
        // decipher the secret. Time should be used in the algorithm so the secret is only good for 3 seconds.

        // for now use static secret

        var stamp = new Date().getTime();
        var seconds = Math.floor(stamp / 1000);
        console.log("seconds: ", seconds);
        var secret = this.base64Encode(key);
        var time = this.base64Encode(seconds);

        //var generatedSecret = encodeURIComponent(this.base64Encode(this.implode("|", { secret, time })));
        var pieces = [secret, time];
        var generatedSecret = this.base64Encode(this.implode("|", pieces));

        return generatedSecret;
    }

    MultiPlatformChat.JsHelper.prototype.isDomElement = function (obj) {
        // checks if an object is a Dom Element, returns bool
        var self = this;
        if (obj instanceof Node) {
            return (obj && (typeof obj === "object") && (typeof obj.nodeType === "number") && (typeof obj.nodeName === "string"));
        }
        else if (obj instanceof HTMLElement) {
            return (obj && (typeof obj === "object") && (obj !== null) && (obj.nodeType === 1) && (typeof obj.nodeName === "string"));
        }
        else {
            return false;
        }
    }; //end isDomElement

    MultiPlatformChat.JsHelper.prototype.implode = function (glue, pieces) {
        //  discuss at: http://phpjs.org/functions/implode/
        // original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // improved by: Waldo Malqui Silva (http://waldo.malqui.info)
        // improved by: Itsacon (http://www.itsacon.net/)
        // bugfixed by: Brett Zamir (http://brett-zamir.me)
        //   example 1: implode(' ', ['Kevin', 'van', 'Zonneveld']);
        //   returns 1: 'Kevin van Zonneveld'
        //   example 2: implode(' ', {first:'Kevin', last: 'van Zonneveld'});
        //   returns 2: 'Kevin van Zonneveld'

        var i = '',
            retVal = '',
            tGlue = '';
        if (arguments.length === 1) {
            pieces = glue;
            glue = '';
        }
        if (typeof pieces === 'object') {
            if (Object.prototype.toString.call(pieces) === '[object Array]') {
                return pieces.join(glue);
            }
            for (i in pieces) {
                retVal += tGlue + pieces[i];
                tGlue = glue;
            }
            return retVal;
        }
        return pieces;
    };

    MultiPlatformChat.JsHelper.prototype.base64Decode = function (data) {
        var self = this;

        //   example 2: base64_decode('YQ===');
        //   returns 2: 'a'
        //   example 3: base64_decode('4pyTIMOgIGxhIG1vZGU=');
        //   returns 3: '✓ à la mode'

        var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
            ac = 0,
            dec = '',
            tmp_arr = [];

        if (self.empty(data)) {
            return data;
        }

        data += '';

        do {
            // unpack four hexets into three octets using index points in b64
            h1 = b64.indexOf(data.charAt(i++));
            h2 = b64.indexOf(data.charAt(i++));
            h3 = b64.indexOf(data.charAt(i++));
            h4 = b64.indexOf(data.charAt(i++));

            bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

            o1 = bits >> 16 & 0xff;
            o2 = bits >> 8 & 0xff;
            o3 = bits & 0xff;

            if (h3 === 64) {
                tmp_arr[ac++] = String.fromCharCode(o1);
            } else if (h4 === 64) {
                tmp_arr[ac++] = String.fromCharCode(o1, o2);
            } else {
                tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
            }
        } while (i < data.length);

        dec = tmp_arr.join('');

        return decodeURIComponent(escape(dec.replace(/\0+$/, '')));
    }; //end base64_decode

    MultiPlatformChat.JsHelper.prototype.base64Encode = function (data) {
        var self = this;
        //   example 2: base64_encode('a');
        //   returns 2: 'YQ=='
        //   example 3: base64_encode('✓ à la mode');
        //   returns 3: '4pyTIMOgIGxhIG1vZGU='

        var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
            ac = 0,
            enc = '',
            tmp_arr = [];

        if (!data) {
            return data;
        }

        data = unescape(encodeURIComponent(data));

        do {
            // pack three octets into four hexets
            o1 = data.charCodeAt(i++);
            o2 = data.charCodeAt(i++);
            o3 = data.charCodeAt(i++);

            bits = o1 << 16 | o2 << 8 | o3;

            h1 = bits >> 18 & 0x3f;
            h2 = bits >> 12 & 0x3f;
            h3 = bits >> 6 & 0x3f;
            h4 = bits & 0x3f;

            // use hexets to index into b64, and append result to encoded string
            tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
        } while (i < data.length);

        enc = tmp_arr.join('');

        var r = data.length % 3;

        return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
    };

    MultiPlatformChat.JsHelper.prototype.isValidEmail = function (email) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    };

    MultiPlatformChat.JsHelper.prototype.sortBy = function (field, reverse, primer) {
        //example array.sort(sort_by('price', true, parseInt));
        var key = primer ?
            function (x) { return primer(x[field]) } :
            function (x) { return x[field] };

        reverse = !reverse ? 1 : -1;

        return function (a, b) {
            return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
        }
    };

    MultiPlatformChat.JsHelper.prototype.isExpiredToken = function (jwtToken) {
        var self = this;
        var isExpired = true;
        if (!self.isEmpty(jwtToken)) {
            var expiredString = jwtToken[".expires"];
            if (!self.isEmpty(expiredString)) {
                var now = new Date();
                var expire = new Date(expiredString);

                var expireTime = Math.abs(expire.getTime() / 1000);
                var nowTime = Math.abs(now.getTime() / 1000);

                var diffSeconds = expireTime - nowTime;

                //console.log("diffSeconds: ", diffSeconds);
                //var timeDiff = Math.abs(expire.getTime() - now.getTime());
                //var diffSeconds = Math.ceil(timeDiff / (1000));
                if (diffSeconds > 10) {
                    isExpired = false;
                }
            }
        }

        return isExpired;
    }

    MultiPlatformChat.JsHelper.prototype.stringify = function (obj) {
        let result = "";
        let JsonStringifyReplacerCache = [];
        let JsonStringifyReplacer = function (key, value) {
            if (typeof value === 'object' && value !== null) {
                if (JsonStringifyReplacerCache.indexOf(value) !== -1) {
                    // Circular reference found, discard key
                    return;
                }
                // Store value in our collection
                JsonStringifyReplacerCache.push(value);
            }
            return value;
        };

        try {
            result = JSON.stringify(obj, JsonStringifyReplacer);
        }
        catch (e) {
            console.log("error")
        }

        return result;
    }

    MultiPlatformChat.JsHelper.prototype.createAlert = function (message, heading, alertType) {
        let self = this;
        /* NOTE: this is an important function used throughout the namespace */
        alertType = (self.empty(alertType)) ? 'alert-warning' : alertType;
        let alert = document.createElement('div');
        alert.className = "alert " + alertType + " alert-dismissible";
        alert.setAttribute('role', 'alert');
        let errorButton = document.createElement('button');
        alert.appendChild(errorButton);
        errorButton.type = "button";
        errorButton.className = "close";
        errorButton.setAttribute('data-dismiss', 'alert');
        let errorSpan1 = document.createElement('span');
        errorButton.appendChild(errorSpan1);
        errorSpan1.setAttribute('aria-hidden', 'true');
        errorSpan1.innerHTML = "&times;";
        let errorSpan2 = document.createElement('span');
        errorButton.appendChild(errorSpan2);
        errorSpan2.className = "sr-only";
        errorSpan2.innerHTML = "Close";

        let text = document.createElement('span');
        text.innerHTML = message;
        if (typeof heading !== "undefined") {
            let title = document.createElement('strong');
            title.innerHTML = heading;
            alert.appendChild(title);
        }
        alert.appendChild(text);

        return alert;
    }; //end createAlert

    /*
    checks if var is dom node or element, returns true for valid dom element or false otherwise
    @param obj is the object to check
    */
    MultiPlatformChat.JsHelper.prototype.isDomElement = function (obj) {
        let self = this;
        if (obj instanceof Node) {
            return (obj && (typeof obj === "object") && (typeof obj.nodeType === "number") && (typeof obj.nodeName === "string"));
        }
        else if (obj instanceof HTMLElement) {
            return (obj && (typeof obj === "object") && (obj !== null) && (obj.nodeType === 1) && (typeof obj.nodeName === "string"));
        }
        else {
            return false;
        }
    }; //end isDomElement

    /*
    clears all .alert classes from a containing dom element
    @param container is a valid dom element
    */
    MultiPlatformChat.JsHelper.prototype.clearAlerts = function (container) {
        let self = this;
        //it simply removes all elements with class .alert inside a containing element
        if (self.isDomElement(container)) {
            let alerts = container.getElementsByClassName("alert");
            while (alerts.length > 0) {
                alerts[0].parentNode.removeChild(alerts[0]);
            }
            return true;
        }
        else {
            return false;
        }
    }; //end clearAlerts

    /*
    @param elInput is a dom form input element
    @param config is an object literal containing: regex string "pattern", bool "required", int maxLength, string fieldName
    @param callback is the callback function called after validation,
    TODO: separate the callback into successCB and failCB
    */
    MultiPlatformChat.JsHelper.prototype.validateInput = function (elInput, config, callback) {
        let self = this;
        /*

         EXAMPLE
         NOTE: config is an object literal
         which can contain //fieldName, required, maxLength, pattern, matchShowError,
         var config = {
         'pattern' :   /[^a-zA-Z\-_0-9]/
         ,'required' : true
         ,'maxLength' : 50
         ,'fieldName' : 'First Name'
         };

         */

        let alert = '';

        if (!self.empty(elInput)) {
            if (self.isDomElement(elInput)) {
                var displayName = (!self.empty(config.fieldName)) ? config.fieldName : elInput.name;

                if (!self.empty(config.required)) {
                    if (self.empty(elInput.value)) {
                        alert = displayName + " is required";
                        callback && callback(alert);
                        return;
                    }
                }
                if (!self.empty(config.maxLength)) {
                    if (elInput.value.length > config.maxLength) {
                        alert = displayName + " can only contain " + config.maxLength.toString() + " characters.";
                        callback && callback(alert);
                        return;
                    }
                }

                if (!self.empty(config.minLength)) {
                    if (elInput.value.length < config.minLength) {
                        alert = displayName + " must contain atleast " + config.minLength.toString() + " characters.";
                        callback && callback(alert);
                        return;
                    }
                }

                callback && callback(alert);
                return;
            }
            else {
                console.log('input element to check has to be a form dom element');
                callback && callback(alert);
                return;
            }
        }
        else {
            console.log('input element to check is undefined');
            callback && callback(alert);
            return;
        }
    }; //end validateInput
}