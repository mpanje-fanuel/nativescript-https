"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = require("tns-core-modules/utils/types");
var policies = {
    def: AFSecurityPolicy.defaultPolicy(),
    secured: false,
};
policies.def.allowInvalidCertificates = true;
policies.def.validatesDomainName = false;
function enableSSLPinning(options) {
    if (!policies.secure) {
        policies.secure = AFSecurityPolicy.policyWithPinningMode(1);
        var allowInvalidCertificates = (types_1.isDefined(options.allowInvalidCertificates)) ? options.allowInvalidCertificates : false;
        policies.secure.allowInvalidCertificates = allowInvalidCertificates;
        var validatesDomainName = (types_1.isDefined(options.validatesDomainName)) ? options.validatesDomainName : true;
        policies.secure.validatesDomainName = validatesDomainName;
        var data = NSData.dataWithContentsOfFile(options.certificate);
        policies.secure.pinnedCertificates = NSSet.setWithObject(data);
    }
    policies.secured = true;
    console.log('nativescript-https > Enabled SSL pinning');
}
exports.enableSSLPinning = enableSSLPinning;
function disableSSLPinning() {
    policies.secured = false;
    console.log('nativescript-https > Disabled SSL pinning');
}
exports.disableSSLPinning = disableSSLPinning;
function request(options) {
    console.log("nativescript-https: (request) Request: ", options);
    return new Promise(function (resolve, reject) {
        try {
            var request_1 = NSMutableURLRequest.requestWithURL(NSURL.URLWithString(options.url));
            request_1.HTTPMethod = options.method;
            var headers_1 = options.headers;
            if (headers_1) {
                Object.keys(headers_1).forEach(function (key) {
                    request_1.setValueForHTTPHeaderField(headers_1[key], key);
                });
            }
            var jsonString = NSString.stringWithString(JSON.stringify(options.body));
            request_1.HTTPBody = jsonString.dataUsingEncoding(NSUTF8StringEncoding);
            var manager = AFHTTPSessionManager.manager();
            manager.requestSerializer.allowsCellularAccess = true;
            manager.securityPolicy = (policies.secured == true) ? policies.secure : policies.def;
            console.log("nativescript-https: (request) AF Send: ", request_1);
            manager.session.dataTaskWithRequestCompletionHandler(request_1, function (data, response, error) {
                if (error) {
                    console.log("nativescript-https: (request) AF Send Error", error);
                    reject(new Error(error.localizedDescription));
                }
                else {
                    console.log("nativescript-https: (request) AF Send Response", data);
                    resolve({
                        content: function (data) {
                            var content = NSString.alloc().initWithDataEncoding(data, NSASCIIStringEncoding).toString();
                            try {
                                content = JSON.parse(content);
                            }
                            catch (e) {
                                console.log("nativescript-https: Response JSON Parse Error", e, e.stack, content);
                            }
                            return content;
                        }
                    });
                }
            });
        }
        catch (error) {
            reject(error);
        }
    }).then(function (AFResponse) {
        console.log("nativescript-https: (request) AF Send Then");
        var send = {
            content: AFResponse.content,
            headers: {},
        };
        console.log("nativescript-https: (request) AF Send Then", send);
        var response = AFResponse.task.response;
        if (!types_1.isNullOrUndefined(response)) {
            send.statusCode = response.statusCode;
            var dict = response.allHeaderFields;
            dict.enumerateKeysAndObjectsUsingBlock(function (k, v) {
                send.headers[k] = v;
            });
        }
        if (AFResponse.reason) {
            send.reason = AFResponse.reason;
        }
        console.log("nativescript-https: (request) AF Send Then Done ? ");
        return Promise.resolve(send);
    });
}
exports.request = request;
//# sourceMappingURL=https.ios.js.map