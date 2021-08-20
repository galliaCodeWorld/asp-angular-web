import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { FormControl, Validators } from '@angular/forms';
import { PbxService, UserService, SignalrService, JsHelperService } from '../../services/index';
import { CompanyProfileDto } from '../../models/index';
import { access } from 'fs';

@Component({
	styleUrls: ['./create-company.component.scss'],
	templateUrl: './create-company.component.html'
})
export class CreateCompanyComponent {
	image: any = 'assets/images/default-avatar.png';
	companyName: string = '';
	companyFormControl: FormControl
	imageBlob: any;
	constructor(
		private dialogRef: MatDialogRef<CreateCompanyComponent>,
		private pbxService: PbxService,
		private userService: UserService,
		private signalrService: SignalrService,
		private jsHelperService: JsHelperService) {
		this.companyFormControl = new FormControl('', [
			Validators.required,
		]);
	}

	pictureChanged({ base64, blob }) {
		this.image = base64,
			this.imageBlob = blob;
	}

	cancel() {
		this.dialogRef.close(null);
	}

	save() {
		let jwt = this.signalrService.jwtToken;

		if (!this.jsHelperService.isEmpty(jwt)) {
			this.pbxService.createCompanyProfile({
				companyLocationId: 0,
				companyName: this.companyName,
				memberId: this.userService.profile.memberId
			}, jwt.access_token)
				.then(data => {
					return this.pbxService.getCompanyProfilesByMemberId({
						id: this.userService.profile.memberId
					}, jwt.access_token)
				})
				.then((companyProfiles: CompanyProfileDto[]) => {
					console.log('company created')
					return this.pbxService.addCompanyProfileImage(this.imageBlob, companyProfiles[0].companyProfileId, jwt.access_token)
				})
				.then((companyProfile: any) => {
					this.dialogRef.close(companyProfile)
				})
				.catch(error => {
					console.log(error)
					this.dialogRef.close(null)
				})
		}
	}
}