import { Component, OnInit, Inject, Optional } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import {
	IncomingCallResponseEnum,
	ProfileDto
} from '../../../models/index';
@Component({
	templateUrl: './pbx-rep-incoming-call.component.html',
	styleUrls: ['./pbx-rep-incoming-call.component.scss']
})

export class PbxRepIncomingCallComponent implements OnInit {
	callerProfile: ProfileDto;

	constructor(
		public dialogRef: MatDialogRef<PbxRepIncomingCallComponent>,
		@Optional() @Inject(MAT_DIALOG_DATA) public data: ProfileDto
	) {
	}

	ngOnInit() {
		this.callerProfile = this.data;
	}

	accept(): void {
		this.dialogRef.close(IncomingCallResponseEnum.accept);
	}

	reject(): void {
		this.dialogRef.close(IncomingCallResponseEnum.deny);
	}
}