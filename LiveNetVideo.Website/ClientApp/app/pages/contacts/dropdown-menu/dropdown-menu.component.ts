import { Component, EventEmitter, Output, ViewChild, ElementRef, OnInit, NgZone } from '@angular/core';

@Component({
    selector: 'dropdown-menu',
    styleUrls: ['dropdown-menu.component.scss'],
    templateUrl: 'dropdown-menu.component.html'
})
export class DropdownMenuComponent {
    @Output() onEditContactClicked: EventEmitter<any> = new EventEmitter();
    @Output() onBlockContactClicked: EventEmitter<any> = new EventEmitter();
    @Output() onDeleteContactClicked: EventEmitter<any> = new EventEmitter();

    dropdownShown: boolean = false;
   
    editContact() {
        this.onEditContactClicked.emit()
        this.hideDropdown();
    }

    blockContact() {
        this.onBlockContactClicked.emit();
        this.hideDropdown();
    }

    removeContact() {
        this.onDeleteContactClicked.emit();
        this.hideDropdown();
    }

    hideDropdown() {
        this.dropdownShown = false;
    }
}