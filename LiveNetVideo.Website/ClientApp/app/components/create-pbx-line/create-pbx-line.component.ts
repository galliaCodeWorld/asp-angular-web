import { Component, Inject, Optional } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Service } from '../../services/index';

@Component({
	styleUrls: ['./create-pbx-line.component.scss'],
	templateUrl: './create-pbx-line.component.html'
})
export class CreatePbxLineComponent {
	pbxLineNameFormControl: FormControl;
	pbxLineDescription: FormControl;
	pbxLineName: string;

	image: any = 'assets/images/default-avatar.png';
	imageBlob: any;

	companyId: number;
	constructor(
		private dialogRef: MatDialogRef<CreatePbxLineComponent>,
		private service: Service,
		@Optional() @Inject(MAT_DIALOG_DATA) public data: any,
	) {
		this.companyId = data.id;

		this.pbxLineNameFormControl = new FormControl('', [
			Validators.required,
		]);

		this.pbxLineDescription = new FormControl('', [
			Validators.required,
		]);
	}

	pictureChanged({ base64, blob }) {
		this.image = base64,
			this.imageBlob = blob;
	}

	cancel() {
		this.dialogRef.close()
	}

	save() {
		//let jwt = this.signalrService.jwtToken;
		//if (!this.jsHelperService.isEmpty(jwt)) {
		//	this.pbxService.createPbxLine({
		//		companyProfileId: this.companyId,
		//		lineName: this.pbxLineName,
		//		description: this.pbxLineDescription.value
		//	}, jwt.access_token)
		//		.then(data => {
		//			console.log('='.repeat(30), this.imageBlob)
		//			return this.pbxService.addPbxLineImage(this.imageBlob, data.pbxLineId, jwt.access_token)
		//		})
		//		.then((data) => {
		//			console.log('x'.repeat(10), data)
		//			this.dialogRef.close()
		//		})
		//		.catch(error => {
		//			console.log(error)
		//			this.dialogRef.close(null)
		//		})
		//}
	}
}