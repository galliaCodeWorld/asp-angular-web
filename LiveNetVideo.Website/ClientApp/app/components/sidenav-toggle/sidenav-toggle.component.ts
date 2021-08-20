import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatSidenav } from "@angular/material/sidenav";

@Component({
	selector: 'sidenav-toggle',
	templateUrl: 'sidenav-toggle.component.html',
	styleUrls: ['./sidenav-toggle.component.scss'],
})
export class SidenavToggleComponent {
	constructor() {
	}

	@Input('sideNav') sideNav: MatSidenav;

	toggle() {
		this.sideNav.toggle();
	}
}