import { FormControl } from '@angular/forms';

export class EmailValidator {
    //use this !!
    static isValidEmailFormat(control: FormControl): any {
        return EmailValidator.isValidEmail(control.value);
    }

    static isValidEmail(value: string): any {
        let EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        if (value == null || value == "") {

            return {
                "required": true
            };

        }
        else if (!EMAIL_REGEX.test(value.trim())) {
            return {
                "invalid": true
            };
        }
        else
            return null;
    }

    static isRealEmail(control: FormControl): any {
        //Check if the given email is a real one.
        return new Promise(resolve => {
            //resolve({ "notReal": true });

            resolve(null);
        })

    }

    static isUniqueEmail(control: FormControl): any {
        //Check if this email already a member.
        return new Promise(resolve => {
            //resolve({ "notUnique": true });

            resolve(null);
        });
    }
}