import { Component, Inject, OnInit, Optional } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import {
	CallType,
	CallerType,
	IncomingCallResponseEnum,
	IncomingCallDialogType,
	ProfileDto
} from '../../../models/index';
import { ConfigService } from '../../../services/index';
@Component({
	templateUrl: './incoming-call-dialog.component.html',
	styleUrls: ['./incoming-call-dialog.component.scss']
})
export class IncomingCallDialogComponent implements OnInit {
	callerProfile: ProfileDto;

	constructor(
		public dialogRef: MatDialogRef<IncomingCallDialogComponent>,
		@Optional() @Inject(MAT_DIALOG_DATA) public data: ProfileDto,
		private configService: ConfigService
	) {
	}

	ngOnInit() {
		this.callerProfile = this.data;
		if (this.callerProfile.avatarFileName) {
			this.callerProfile.avatarFileName = this.configService.avatarBaseUrl + this.callerProfile.avatarFileName;
		} else {
			this.callerProfile.avatarFileName = '../../../../assets/images/default-avatar.png'
		}
	}

	accept(): void {
		this.dialogRef.close(IncomingCallResponseEnum.accept);
	}

	reject(): void {
		this.dialogRef.close(IncomingCallResponseEnum.deny);
	}

	block(): void {
		this.dialogRef.close(IncomingCallResponseEnum.block);
	}
}