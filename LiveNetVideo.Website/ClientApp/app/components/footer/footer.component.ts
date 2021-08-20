import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
	Service
} from '../../services/index';

@Component({
	selector: 'footer-component',
	templateUrl: 'footer.component.html'
})
export class FooterComponent {
	constructor(
		private service: Service
	) { }

	// copyright information binding
	domain: string;
	year: string;

	ngOnInit() {
		this.domain = this.service.domainName;
		let date = new Date();
		this.year = String(date.getFullYear());
	}
}