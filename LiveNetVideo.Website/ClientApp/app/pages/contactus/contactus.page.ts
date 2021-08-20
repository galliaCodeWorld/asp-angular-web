import { Component, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
//import { ToastrService } from 'ngx-toastr';
import {
	Validators,
	FormBuilder,
	FormGroup
} from '@angular/forms';

import {
	MaterialAlertMessageType,
	ContactUsDto,
} from '../../models/index'

import {
	Service
} from '../../services/index'

@Component({
	templateUrl: 'contactus.page.html'
})
export class ContactUsPage {
	constructor(
		public activatedRoute: ActivatedRoute,
		public router: Router,
		public service: Service,
	) {
	}

	ngOnInit() {
	}

	ngAfterViewInit() {
		this.service.checkAndDisplayFlashMessage();
	}

	onContactUsComplete(model: ContactUsDto): void {
		let alert = new MaterialAlertMessageType();
		alert.title = "SUCCESS";
		alert.message = "<p>Your inquiry or comment has been sent to us and will be reviewed in the order it was received.</p>";
		alert.message += "<p>An email with a link to check the status of your inquiry has been sent. Please check your email.</p>";
		this.service.openAlert(alert);
	}

	cancelContactUs(): void {
		this.router.navigate(['/login'], { relativeTo: this.activatedRoute });
	}
}