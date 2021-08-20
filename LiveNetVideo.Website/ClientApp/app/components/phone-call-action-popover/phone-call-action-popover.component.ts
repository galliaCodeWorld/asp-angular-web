import { Component } from '@angular/core';

import { PhoneCallAction } from '../../models/index';
@Component({
	selector: 'phone-call-action-popover',
	templateUrl: 'phone-call-action-popover.component.html'
})
export class PhoneCallActionPopover {
	isOnHold: boolean = false;

	constructor() {
		// TODO: findout what jhon is trying to do with this flag
		// then need to implement

		//this.isOnHold = this.navParams.data.isOnHold;
	}
	close(phoneCallAction: PhoneCallAction) {
		// TODO: need to implement
	}

	privateMessage() {
		console.log('public message clicked')
		this.close(PhoneCallAction.PRIVATE_MESSAGE);
	}

	displayMain() {
		console.log('public message clicked')
		this.close(PhoneCallAction.DISPLAY_TO_MAIN);
	}

	hold() {
		console.log('public message clicked')
		this.close(PhoneCallAction.HOLD);
	}

	resumeCall() {
		console.log('call is resumed from holed')
		this.close(PhoneCallAction.RESUME_HOLD)
	}

	sendFile() {
		console.log('send file')
		this.close(PhoneCallAction.SEND_FILE)
	}
}