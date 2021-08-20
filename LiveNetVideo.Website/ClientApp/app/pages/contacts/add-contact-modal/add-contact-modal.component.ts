import { Component, Output, EventEmitter } from '@angular/core';
import { PhoneContactType } from '../../../models/index'
import {
    Validators,
    FormBuilder,
    FormGroup
} from '@angular/forms';


import {
    FormValidator,
    EmailValidator
} from '../../../services/index'

@Component({
    templateUrl: './add-contact-modal.component.html',
    styleUrls: ['./add-contact-modal.component.scss'],
    selector: 'add-contact-modal'
})
export class AddContactModalComponent {
    @Output() close: EventEmitter<any> = new EventEmitter;

    contactForm: FormGroup;

    image: string = 'assets/images/default-avatar.png';

    constructor(formBuilder: FormBuilder) {
        this.contactForm = formBuilder.group({
            name: ['', Validators.compose([FormValidator.isNameValid])],
            email: ['', Validators.compose([EmailValidator.isValidEmailFormat])]
        })
    }
    closeClicked(data: any = null) {
        console.log(data)
        this.close.emit(data)
    }

    pictureChanged(img: string) {
        this.image = img;
    }

    save() {
        let contact: PhoneContactType = {
            name: this.contactForm.get('name').value,
            email: this.contactForm.get('email').value,
            avatarDataUri: this.image
        }

        this.closeClicked(contact)
    }
}