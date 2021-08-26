import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformServer } from '@angular/common';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';
import 'rxjs/add/observable/fromPromise';
import { TransferState } from "../transer-state/transfer-state";

@Injectable()
export class TransferHttp {
    public isServer = isPlatformServer(this.platformId);

    constructor(
        @Inject(PLATFORM_ID) public platformId,
        public http: HttpClient,
        protected transferState: TransferState
    ) { }

    request(uri: string, options?: Object): Observable<any> {
        return this.getData(uri, options, (url: string, _options: Object) => {
            return this.http.get(url, _options);
        });
    }
	/**
	 * Performs a request with `get` http method.
	 */
    get(url: string, options?: Object): Observable<any> {
        return this.getData(url, options, (_url: string, _options: Object) => {
            return this.http.get(_url, _options);
        });
    }
	/**
	 * Performs a request with `post` http method.
	 */
    post(url: string, body: any, options?: Object): Observable<any> {
        return this.getPostData(url, body, options, (_url: string, _options: Object) => {
            return this.http.post(_url, body, _options);
        });
    }
	/**
	 * Performs a request with `put` http method.
	 */
    put(url: string, body: any, options?: Object): Observable<any> {
        return this.getPostData(url, body, options, (_url: string, _options: Object) => {
            return this.http.put(_url, body, _options);
        });
    }
	/**
	 * Performs a request with `delete` http method.
	 */
    delete(url: string, options?: Object): Observable<any> {
        return this.getData(url, options, (_url: string, _options: Object) => {
            return this.http.delete(_url, _options);
        });
    }
	/**
	 * Performs a request with `patch` http method.
	 */
    patch(url: string, body: any, options?: Object): Observable<any> {
        return this.getPostData(url, body, options, (_url: string, _options: Object) => {
            return this.http.patch(_url, body.options);
        });
    }
	/**
	 * Performs a request with `head` http method.
	 */
    head(url: string, options?: Object): Observable<any> {
        return this.getData(url, options, (_url: string, _options: Object) => {
            return this.http.head(_url, _options);
        });
    }
	/**
	 * Performs a request with `options` http method.
	 */
    options(url: string, options?: Object): Observable<any> {
        return this.getData(url, options, (_url: string, _options: Object) => {
            return this.http.options(_url, _options);
        });
    }

    public getData(url: string, options: Object,
        callback: (url: string, options?: Object) => Observable<any>) {
        const key = url + JSON.stringify(options);

        try {
            return this.resolveData(key);
        } catch (e) {
            return callback(url, options)
                .map(res => res.json())
                .do(data => {
                    if (this.isServer) {
                        this.setCache(key, data);
                    }
                });
        }
    }

    public getPostData(url: string, body: any, options: Object,
        callback: (url: string, body: any, options?: Object) => Observable<any>) {
        const key = url + JSON.stringify(body);

        try {
            return this.resolveData(key);
        } catch (e) {
            return callback(url, body, options)
                .map(res => res.json())
                .do(data => {
                    if (this.isServer) {
                        this.setCache(key, data);
                    }
                });
        }
    }

    public resolveData(key: string) {
        const data = this.getFromCache(key);

        if (!data) {
            throw new Error();
        }

        return Observable.fromPromise(Promise.resolve(data));
    }

    public setCache(key, data) {
        return this.transferState.set(key, data);
    }

    public getFromCache(key): any {
        return this.transferState.get(key);
    }
}