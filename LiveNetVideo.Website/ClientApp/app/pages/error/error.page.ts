import { Component, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import {
} from '../../models/index'

import {
	Service
} from '../../services/index'

@Component({
	templateUrl: 'error.page.html'
})
export class ErrorPage {
	constructor(
		public activatedRoute: ActivatedRoute,
		public router: Router,
		public service: Service,
	) {
	}

	ngOnInit() {
		console.log("ngOnInit login page");
	}

	ngAfterViewInit() {
		this.service.checkAndDisplayFlashMessage();
	}

	reload(): void {
		window.location.reload();
	}
}