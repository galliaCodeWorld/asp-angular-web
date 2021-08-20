var MultiPlatformChat = MultiPlatformChat || {};

if (MultiPlatformChat.hasOwnProperty("LocalStorage") === false) {
    MultiPlatformChat.LocalStorage = function (jsHelper, daysToExpire) {
        this.jsHelper = jsHelper;
        this.daysToExpire = jsHelper.isEmpty(daysToExpire) ? 30 : daysToExpire;
    }

    MultiPlatformChat.LocalStorage.prototype.set = function (key, value) {
        var self = this;
        return new Promise(function (resolve, reject) {
            self.jsHelper.setCookie(key, value, this.daysToExpire)
                .then(function () {
                    resolve();
                })
                .catch(function (errorMessage) {
                    reject(errorMessage);
                });
        });
    };

    MultiPlatformChat.LocalStorage.prototype.get = function (key) {
        var self = this;
        return new Promise(function (resolve, reject) {
            var cookie = self.jsHelper.getCookie(key);
            resolve(cookie);
        });
    };

    MultiPlatformChat.LocalStorage.prototype.delete = function (key) {
        let self = this;
        return new Promise(function (resolve, reject) {
            self.jsHelper.setCookie(key, "", -1)
                .then(function () {
                    resolve();
                })
                .catch(function (error) {
                    reject(error);
                });
        });
    };
}