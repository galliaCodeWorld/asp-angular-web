import { Component } from '@angular/core'
import { Service } from '../../services';

@Component({
	styleUrls: ['login-shell.component.scss'],
	templateUrl: 'login-shell.component.html'
})
export class LoginShellComponent {
	burgerIsActive: boolean = false;

	constructor(
		private service: Service
	) {
		this.domain = this.service.domainName;
	}

	domain: string;
}