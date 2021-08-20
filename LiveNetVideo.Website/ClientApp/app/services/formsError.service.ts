import { Injectable } from '@angular/core';
import { FormsErrorMessageType, FormErrorTypeEnum } from "../models/index";

@Injectable()
export class FormsErrorService {
	//errorMessages = {
	//	'email': (paramValue) => 'A valid email is required',
	//	'required': (paramValue) => 'This field is required',
	//	'minlength': (paramValue) => 'The min number of characters is ' + paramValue.requiredLength,
	//	'maxlength': (paramValue) => 'The max allowed number of characters is ' + paramValue.requiredLength,
	//	'pattern': (paramValue) => 'The required pattern is: ' + paramValue.requiredPattern,
	//	'years': (paramValue) => paramValue.message,
	//	'countryCity': (paramValue) => paramValue.message,
	//	'uniqueName': (paramValue) => paramValue.message,
	//	'telephoneNumbers': (paramValue) => paramValue.message,
	//	'telephoneNumber': (paramValue) => paramValue.message
	//};
	errorMessages = {
		[FormErrorTypeEnum.matDatepickerParse]: (paramValue) => 'Invalid date format. Please enter mm/dd/yyyy',
		[FormErrorTypeEnum.invalidDateFormat]: (paramValue) => 'Invalid date format. Please enter mm/dd/yyyy',
		[FormErrorTypeEnum.invalidOptionalEmail]: (paramValue) => 'A valid email is required',
		[FormErrorTypeEnum.max]: (paramValue) => 'The value can not be greater than ' + paramValue,
		[FormErrorTypeEnum.min]: (paramValue) => 'The value can not be less than ' + paramValue,
		[FormErrorTypeEnum.email]: (paramValue) => 'A valid email is required',
		[FormErrorTypeEnum.required]: (paramValue) => 'This field is required',
		[FormErrorTypeEnum.minlength]: (paramValue) => 'The min number of characters is ' + paramValue,
		[FormErrorTypeEnum.maxlength]: (paramValue) => 'The max allowed number of characters is ' + paramValue,
		[FormErrorTypeEnum.pattern]: (paramValue) => 'Please enter the recommended value.',
		[FormErrorTypeEnum.years]: (paramValue) => paramValue,
		[FormErrorTypeEnum.countryCity]: (paramValue) => paramValue,
		[FormErrorTypeEnum.uniqueName]: (paramValue) => paramValue,
		[FormErrorTypeEnum.telephoneNumbers]: (paramValue) => paramValue,
		[FormErrorTypeEnum.telephoneNumber]: (paramValue) => paramValue
	};

	getErrorMessage(errorType: string, paramValue: string, formErrorMessage?: FormsErrorMessageType): string {
		// NOTE: to display a custom error message, pass in the third optional parameter for getErrorMessage()
		if (typeof formErrorMessage !== "undefined" && formErrorMessage != null) {
			if (formErrorMessage.errorTypeName === errorType) {
				return formErrorMessage.displayValue;
			}
			else {
				return this.errorMessages[errorType](paramValue);
			}
		}
		else {
			return this.errorMessages[errorType](paramValue);
		}
	}

	getErrorMessages(errors: Array<FormsErrorMessageType>): Array<string> {
		//console.log("errors: ", errors);
		let errorMessages: Array<string> = new Array<string>();
		for (let i = 0; i < errors.length; i++) {
			let message: string = this.getErrorMessage(errors[i].errorTypeName, errors[i].displayValue);
			errorMessages.push(message);
		}

		return errorMessages;
	}

	mapErrors(param: any): string {
		let displayValue = "";
		if (param) {
			//console.log("param:", param);

			let props = new Array('requiredLength', 'requiredPattern', 'message', 'max', 'min');
			for (let i = 0; i < props.length; i++) {
				if (param.hasOwnProperty(props[i])) {
					displayValue = param[props[i]];
					break;
				}
			}
		}

		//console.log("displayValue: ", displayValue);

		return displayValue;
	}
}