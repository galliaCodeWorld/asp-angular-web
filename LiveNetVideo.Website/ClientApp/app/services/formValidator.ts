import { FormControl } from '@angular/forms';

export class FormValidator {
    static isNameValid(control: FormControl): any {

        let NAME_REGEXP = /^[a-zA-Z\s]*$/i;

        if (control.value == null || control.value === "")
            return { "required": true };
        else if ((control.value as string).length < 3)
            return { "minLength": true };
        else if ((control.value as string).length > 50)
            return { "maxLength": true };
        else if (!NAME_REGEXP.test(control.value))
            return { "notValid": true };
        else
            return null;
    }

    static isPhoneNumberValid(control: FormControl): any {
        //Implement phone number validation here
        return null;
    }
}