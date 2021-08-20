import { Directive, ElementRef, Output, EventEmitter, HostListener } from '@angular/core';

@Directive({ selector: '[clickedOutside]' })
export class ClickOutside {

    @Output() clickedOutside: EventEmitter<any> = new EventEmitter();

    constructor(private el: ElementRef) {
        var specifiedElement = this.el.nativeElement;
        document.addEventListener('click', (event) => {
            var isClickInside = specifiedElement.contains(event.target);
            if (!isClickInside) {
                this.clickedOutside.emit(null)
            }
        });
    }
}

