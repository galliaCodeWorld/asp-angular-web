import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FlashMessageService } from '../../services/index';

@Component({
	selector: 'page-error',
	templateUrl: './page-error.component.html'
})
export class PageErrorComponent {
	constructor(
		public router: Router,
		public activatedRoute: ActivatedRoute,
		public flashMessageService: FlashMessageService

	) {
		this.title = "";
		this.message = "";
	}

	title: string;
	message: string;

	ngOnInit() {
		this.title = this.flashMessageService.title;
		this.message = this.flashMessageService.message;
		this.flashMessageService.clear();
	}
}