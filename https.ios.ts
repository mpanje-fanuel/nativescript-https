import {isDefined, isNullOrUndefined, isObject} from 'tns-core-modules/utils/types'
import * as Https from './https.common'


interface Ipolicies {
    def: AFSecurityPolicy
    secured: boolean
    secure?: AFSecurityPolicy
}

let policies: Ipolicies = {
    def: AFSecurityPolicy.defaultPolicy(),
    secured: false,
};
policies.def.allowInvalidCertificates = true;
policies.def.validatesDomainName = false;

export function enableSSLPinning(options: Https.HttpsSSLPinningOptions) {
    if (!policies.secure) {
        policies.secure = AFSecurityPolicy.policyWithPinningMode(AFSSLPinningMode.PublicKey);
        let allowInvalidCertificates = (isDefined(options.allowInvalidCertificates)) ? options.allowInvalidCertificates : false;
        policies.secure.allowInvalidCertificates = allowInvalidCertificates;
        let validatesDomainName = (isDefined(options.validatesDomainName)) ? options.validatesDomainName : true;
        policies.secure.validatesDomainName = validatesDomainName;
        let data = NSData.dataWithContentsOfFile(options.certificate);
        policies.secure.pinnedCertificates = NSSet.setWithObject(data)
    }
    policies.secured = true;
    console.log('nativescript-https > Enabled SSL pinning')
}

export function disableSSLPinning() {
    policies.secured = false;
    console.log('nativescript-https > Disabled SSL pinning')
}

console.info('nativescript-https > Disabled SSL pinning by default');


function AFSuccess(resolve, task: NSURLSessionDataTask, data: NSDictionary<string, any> & NSData & NSArray<any>) {
    console.log('AFSuccess', data);
    let content: any;
    if (data && data.class) {
        if (data.enumerateKeysAndObjectsUsingBlock || data.class().name == 'NSArray') {
            let serial = NSJSONSerialization.dataWithJSONObjectOptionsError(data, NSJSONWritingOptions.PrettyPrinted);
            content = NSString.alloc().initWithDataEncoding(serial, NSUTF8StringEncoding).toString()
        } else if (data.class().name == 'NSData') {
            content = NSString.alloc().initWithDataEncoding(data, NSASCIIStringEncoding).toString()
        } else {
            content = data
        }

        try {
            content = JSON.parse(content);
        } catch (e) {
        }

    } else {
        content = data
    }

    resolve({task, content});
}

function AFFailure(resolve, reject, task: NSURLSessionDataTask, error: NSError) {
    console.log('nativescript-https: (AFFailure)', error);

    if (error && error.userInfo) {
        let data: NSData = error.userInfo.valueForKey(AFNetworkingOperationFailingURLResponseDataErrorKey);
        let body = NSString.alloc().initWithDataEncoding(data, NSUTF8StringEncoding).toString();
        try {
            body = JSON.parse(body)
        } catch (e) {
            console.log('nativescript-https: (AFFailure) JSON Parse Error', e, e.stack);
        }

        let content: any = {
            body,
            description: error.description,
            reason: error.localizedDescription,
            url: null
        };

        if (policies.secured == true) {
            content.description = 'nativescript-https > Invalid SSL certificate! ' + content.description
        }

        let reason = error.localizedDescription;
        resolve({task, content, reason})
    } else {
        console.log('nativescript-https: (AFFailure) Error but not content...');
        resolve({task});
    }
}

export function request(opts: Https.HttpsRequestOptions): Promise<Https.HttpsResponse> {
    return new Promise(function (resolve, reject) {
        try {

            let manager = AFHTTPSessionManager.manager();


            manager.requestSerializer = AFHTTPRequestSerializer.serializer()
            manager.requestSerializer.allowsCellularAccess = true;
            manager.securityPolicy = (policies.secured == true) ? policies.secure : policies.def;


            let heads = opts.headers;
            if (heads) {
                Object.keys(heads).forEach(function (key) {
                    manager.requestSerializer.setValueForHTTPHeaderField(heads[key] as any, key);
                });
            }

            let content;
            if (opts.body) {
                if (isObject(opts.body)) {
                    content = NSMutableDictionary.new<string, any>();
                    Object.keys(opts.body).forEach(function (key) {
                        content.setValueForKey(opts.body[key] as any, key)
                    })
                } else {
                    content = <string> opts.body;
                }
            }

            let methods = {
                'GET': 'GETParametersSuccessFailure',
                'POST': 'POSTParametersSuccessFailure',
                'PUT': 'PUTParametersSuccessFailure',
                'DELETE': 'DELETEParametersSuccessFailure',
                'PATCH': 'PATCHParametersSuccessFailure',
                'HEAD': 'HEADParametersSuccessFailure',
            };

            console.log("CONTENT: ", content);

            manager[methods[opts.method]](
                opts.url,
                content,
                function success(task: NSURLSessionDataTask, data: any) {
                    AFSuccess(resolve, task, data)
                }, function failure(task, error) {
                    AFFailure(resolve, reject, task, error)
                });

        } catch (error) {
            reject(error)
        }

    }).then(function (AFResponse: {
        task: NSURLSessionDataTask
        content: any
        reason?: string
    }) {

        let sendi: Https.HttpsResponse = {
            content: AFResponse.content,
            headers: {},
        };

        let response = AFResponse.task.response as NSHTTPURLResponse;
        if (!isNullOrUndefined(response)) {
            sendi.statusCode = response.statusCode;
            let dict = response.allHeaderFields;
            dict.enumerateKeysAndObjectsUsingBlock(function (k, v) {
                sendi.headers[k] = v
            })
        }

        if (AFResponse.reason) {
            sendi.reason = AFResponse.reason
        }
        return Promise.resolve(sendi)

    })
}


export * from './https.common'












