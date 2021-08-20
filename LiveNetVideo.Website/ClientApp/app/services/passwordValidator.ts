import { FormControl, FormGroup } from '@angular/forms';

export class PasswordValidator {

    static isValid(control: FormControl): any {
        //Check if the password requirements met.
        if (control.value == null || control.value === "")
            return { "required": true };
        else{
            //return { "pw_weak": true };

            return null;
        }
    }

    static isMatching(group: FormGroup) {
        
        var firstPassword = group.controls['password'].value;
        var secondPassword = group.controls['re_password'].value;
        if ((firstPassword && secondPassword) && (firstPassword != secondPassword)) {

           group.controls['re_password'].setErrors({ "pw_mismatch": true });

           return { "pw_mismatch": true };
        }
        else {
           return null;
        }

    }

    static matchingPasswords(passwordKey: string, confirmPasswordKey: string) {
        return (group: FormGroup): { [key: string]: any } => {
            let password = group.controls[passwordKey];
            let confirmPassword = group.controls[confirmPasswordKey];

            if (password.value !== confirmPassword.value) {
                return {
                    mismatchedPasswords: true
                };
            }
        }
    }
}