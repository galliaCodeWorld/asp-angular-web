import { Component, Inject, Optional } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import {
	CallType,
	CallerType,
	IncomingCallResponseEnum,
	IncomingCallDialogType
} from '../../models/index';
@Component({
	selector: 'material-dialog-example',
	templateUrl: 'material-dialog-example.component.html',
})
export class IncomingCallDialogComponent {
	constructor(
		public dialogRef: MatDialogRef<IncomingCallDialogComponent>,
		@Optional() @Inject(MAT_DIALOG_DATA) public data: IncomingCallDialogType
	) { }

	accept(): void {
		this.data.response = IncomingCallResponseEnum.accept;
		this.dialogRef.close();
	}

	deny(): void {
		this.data.response = IncomingCallResponseEnum.deny;
		this.dialogRef.close();
	}

	block(): void {
		this.data.response = IncomingCallResponseEnum.block;
		this.dialogRef.close();
	}
}