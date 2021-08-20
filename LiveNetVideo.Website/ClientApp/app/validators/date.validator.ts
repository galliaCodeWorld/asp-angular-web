import { AbstractControl } from '@angular/forms';

export function dateValidator(control: AbstractControl) {
	if (control.value) {
		// && control.value.match(/^((0|1)\d{1})-|\/((0|1|2)\d{1})-|\/((19|20)\d{2})$/)
		//console.log("control", control);
		return null;
	}
	else if (!control.value) {
		return null;
	}
	else {
		return { 'invalidDateFormat': true };
	}
}