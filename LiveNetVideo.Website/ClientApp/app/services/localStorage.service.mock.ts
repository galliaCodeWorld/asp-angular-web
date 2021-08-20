// Note: this service is an abstraction of ionic-native/file
// the reason we want to abstract this is because it will be easier to update the abstraction
// then to go through our code to make changes when we update
import { Injectable } from '@angular/core';

@Injectable()
export class LocalStorageServiceMock {
	constructor() {
		this.path = "";
	}

	_path: string;
	get path(): string {
		return this._path;
	}
	set path(value: string) {
		this._path = value;
	}

	setItem(key: string, value: any): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			resolve();
		});
	}

	getItem(key: string): Promise<any> {
		return new Promise<any>((resolve, reject) => {
			resolve();
		})
	}

	removeItem(key: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			resolve();
		});
	}

	removeAllItems(): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			resolve();
		});
	}
}