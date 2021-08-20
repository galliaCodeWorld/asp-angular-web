import { Component, Input } from '@angular/core';
import { AbstractControlDirective, AbstractControl } from '@angular/forms';
import { Service } from "../../services/index";
import { FormsErrorMessageType } from '../../models';

@Component({
	selector: 'show-form-errors',
	templateUrl: 'show-form-errors.component.html',
})
export class ShowFormErrorsComponent {
	constructor(
		private service: Service
	) {
	}

	@Input()
	private control: AbstractControlDirective | AbstractControl;

	@Input('customErrorMessage') customErrorMessage: FormsErrorMessageType;

	shouldShowErrors(): boolean {
		// this method has binding in dom. so when the control values change, the dom will update
		//console.log("control: ", this.control);

		return this.control &&
			this.control.errors &&
			(this.control.dirty || this.control.touched);
	}

	listOfErrors(): string[] {
		let results: string[] = Object.keys(this.control.errors)
			.map(
				errorType => this.service.getFormErrorMessage(errorType, this.service.mapFormDisplayError(this.control.errors[errorType]), this.customErrorMessage)
			);
		return results;
	}
}