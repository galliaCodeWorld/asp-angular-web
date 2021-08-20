import { AbstractControl } from '@angular/forms';

export function optionalEmail(control: AbstractControl) {
	//console.log("control: ", control);

	// RFC 2822 compliant regex
	if (control.value && control.value.match(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/)) {
		return null;
	}
	else if (!control.value) {
		return null;
	}
	else {
		return { 'invalidOptionalEmail': true };
	}
}