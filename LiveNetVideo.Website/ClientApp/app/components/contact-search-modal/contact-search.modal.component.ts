import { Component, EventEmitter, Output } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router'
import {
    SignalrService,
    LocalStorageService,
    JsHelperService,
    ContactService,
    ConfigService,
    UserService,
    FlashMessageService
} from '../../services/index'

import {
    PhoneContactType
} from '../../models/index'

@Component({
    selector: 'contact-search-modal',
    styleUrls: ['./contact-search.modal.component.scss'],
    templateUrl: './contact-search.modal.component.html'
})
export class ContactSearchModalComponent {
    @Output() onCloseClick: EventEmitter<any> = new EventEmitter();
    @Output() callContactClicked: EventEmitter<string> = new EventEmitter();
    constructor(
    ) {
    }

    callContact(email: string) {
        this.callContactClicked.emit(email);
    }

    close() {
        this.onCloseClick.emit('null')
    }
}