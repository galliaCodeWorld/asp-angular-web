import { Component, Inject, OnInit, Optional } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import {
	CallType,
	CallerType,
	ProfileDto
} from '../../../models/index';
import { SignalrService } from '../../../services/index';
@Component({
	templateUrl: './pbx-line-outgoing-call-dialog.component.html',
	styleUrls: ['./pbx-line-outgoing-call-dialog.component.scss']
})
export class PbxLineOutgoingCallDialog implements OnInit {
	callReciever: any;
	callTimeOut: any;
	constructor(
		public dialogRef: MatDialogRef<PbxLineOutgoingCallDialog>,
		public signalrService: SignalrService,
		@Optional() @Inject(MAT_DIALOG_DATA) public data: any
	) {
	}

	ngOnInit() {
		this.callReciever = this.data;
	}

	cancel(): void {
		this.dialogRef && this.dialogRef.close();
	}
}