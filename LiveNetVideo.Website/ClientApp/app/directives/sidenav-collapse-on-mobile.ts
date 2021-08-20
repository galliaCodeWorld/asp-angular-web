import { Directive, ElementRef, Output, EventEmitter, HostListener } from '@angular/core';
import { MatSidenav } from '@angular/material'

import { Observable } from 'rxjs/Observable';
import "rxjs/Rx";

@Directive({ selector: '[mobileCollapse]' })
export class mobileCollapse {
	@Output() mobileCollapse: EventEmitter<any> = new EventEmitter();

	mobileWidth: number = 450;
	constructor(private el: ElementRef, private sidenav: MatSidenav) {
		el.nativeElement.addEventListener('click', () => {
			if (window.innerWidth < this.mobileWidth) {
				this.sidenav.close();
				//console.log('true')
			}
			//console.log('false')
		})

		this.checkViewportSize();
		Observable.fromEvent(window, 'resize')
			.debounceTime(50)
			.subscribe(() => {
				this.checkViewportSize()
			});
	}

	checkViewportSize(): any {
		if (window.innerWidth < this.mobileWidth) {
			this.sidenav.close();
		} else if (!this.sidenav.opened) {
			this.sidenav.open();
		}
	}
}