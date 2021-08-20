import { Injectable } from '@angular/core';

@Injectable()
export class FlashMessageService {
	constructor() {
		this.title = "";
		this.message = "";
		this.type = "show";
	}

	title: string;
	message: string;
	type: string;
	
	clear() {
		this.title = "";
		this.message = "";
		this.type = 'show';
	}
}