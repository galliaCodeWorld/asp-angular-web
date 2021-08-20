import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Service } from '../../services/index';
import {
	SmsMessageType,
	ObservableMessageType,
	TextMessageType,
} from "../../models/index";

@Component({
	selector: 'text-messaging-message',
	templateUrl: './text-messaging-message.component.html',
	styleUrls: ['./text-messaging-message.component.scss'],
})
export class TextMessagingMessageComponent {
	constructor(
		private service: Service,
	) {
	}
	@Input('message') message: TextMessageType;
	@Output() onOpenPrivateSmsInterface: EventEmitter<string> = new EventEmitter<string>();

	ngOnInit() {
		//console.log("ngOnInit message: ", this.message);
	}

	ngOnDestroy() {
	}

	openPrivateSmsInterface(): void {
		console.log("openPrivateSmsInterface message:", this.message);
		this.onOpenPrivateSmsInterface.emit(this.message.id);
	}

	async sendPrivate(): Promise<void> {
	}
}