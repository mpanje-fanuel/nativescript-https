//

import {EventData, Observable} from 'tns-core-modules/data/observable';
import {Page} from 'tns-core-modules/ui/page';
import {View} from 'tns-core-modules/ui/core/view';
import {knownFolders} from 'tns-core-modules/file-system';
import * as Https from 'nativescript-https';


export function onLoaded(args: EventData) {
    let page: Page = <Page>args.object;
    page.bindingContext = new MainPage()
}

export function onUnloaded(args: EventData) {
    let page: Page = <Page>args.object
}

class MainPage extends Observable {

    textView: string;

    constructor() {
        super()
    }

}

export function testit(args: EventData) {
    let view = args.object as View;
    let page = view.page as Page;
    let context = page.bindingContext as MainPage;

    Https.request({
        url: 'https://jsonplaceholder.typicode.com/todos/1',
        method: 'GET',
        // method: 'POST',
        headers: {
            'x-version': '4.2.0',
            'x-env': 'DEVELOPMENT',
        },
        params: {
            'test': 'testQueryParam'
        }
        // content: JSON.stringify({ dis: 'is awesome' })
    }).then(function (response) {
        console.log('Https.request response', response);
        context.textView = JSON.stringify(response, null, 2);
    }).catch(function (error) {
        console.error('Https.request error', error);
        context.textView = JSON.stringify(error, null, 2);
    })

}

export function enableSSL(args: EventData) {
    let dir = knownFolders.currentApp().getFolder('certs');
    let certificate = dir.getFile('wegossipapp.com.cer').path;
    Https.enableSSLPinning({host: 'wegossipapp.com', certificate})
}

export function disableSSL(args: EventData) {
    Https.disableSSLPinning()
}


// Https.request({
// 	url: 'https://wegossipapp.com/api/newuser',
// 	method: 'POST',
// 	headers: {
// 		'Authorization': 'Basic ZWx1c3VhcmlvOnlsYWNsYXZl',
// 		'x-uuid': 'aHR0cHdhdGNoOmY',
// 		'x-version': '4.2.0',
// 		'x-env': 'DEVELOPMENT',
// 	},
// 	content: JSON.stringify({
// 		'username': 'roblav96',
// 		'password': 'password',
// 	})
// }).then(function(response) {
// 	console.log('Https.request response', response)
// }).catch(function(error) {
// 	console.error('Https.request error', error)
// })
















