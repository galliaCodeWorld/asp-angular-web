import { Component, Input, Output, EventEmitter, Inject, Optional } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import * as moment from 'moment';

import {
	FormBuilder,
	FormArray,
	FormGroup,
	FormControl,
	Validators,
	AbstractControl
} from '@angular/forms';

import {
	NetcastDto,
	NetcastGenreDto,
	MaterialAlertMessageType,
	FormsErrorMessageType,
	FormErrorTypeEnum,
	KeyValueType,
	SqlPredicateDto,
	SqlSearchPredicateDto,
} from "../../models/index";
import { Service } from "../../services/index";
import { dateValidator } from '../../validators/date.validator';
import { NetcastViewModel } from '../../models/view-models/netcast.viewmodel';
import { MaterialAlertComponent } from '../material-helper/material-alert.component';
@Component({
	selector: 'form-netcast-edit',
	templateUrl: 'form-netcast-edit.component.html'
})
export class FormNetcastEditComponent {
	constructor(
		private service: Service,
		private fb: FormBuilder,
		@Optional() @Inject(MAT_DIALOG_DATA) public data: any,
	) {
	}

	@Input('showProgress') showProgress: boolean;
	@Input('netcast') inputNetcast: NetcastDto;

	@Output() onEditNetcastComplete: EventEmitter<NetcastDto> = new EventEmitter<NetcastDto>();
	@Output() onEditNetcastCancel: EventEmitter<void> = new EventEmitter<void>();
	//@Output() onAddNetcastImage: EventEmitter<string> = new EventEmitter<string>();

	genres: KeyValueType[];

	netcastHourErrorMessage: FormsErrorMessageType;
	netcastMinuteErrorMessage: FormsErrorMessageType;

	defaultAvatar = this.service.defaultAvatar;

	image: string = this.defaultAvatar;
	isPrivate: boolean;
	netcast: NetcastDto;
	formGroup: FormGroup

	viewModel: NetcastViewModel;

	ngOnInit() {
		if (this.service.isEmpty(this.data) === false && this.data.hasOwnProperty('netcastId')) {
			this.netcast = this.data;
		}
		else {
			this.netcast = this.inputNetcast;
		}

		this.viewModel = this.service.mapToNetcastViewModel(this.netcast);
		this.isPrivate = this.viewModel.isPrivate;
		this.image = this.viewModel.imageSrc;
		this.netcastHourErrorMessage = new FormsErrorMessageType();
		this.netcastMinuteErrorMessage = new FormsErrorMessageType();
		this.netcastHourErrorMessage.errorTypeName = FormErrorTypeEnum.pattern;
		this.netcastHourErrorMessage.displayValue = "Please enter a number between 1 and 12";
		this.netcastMinuteErrorMessage.errorTypeName = FormErrorTypeEnum.pattern;
		this.netcastMinuteErrorMessage.displayValue = "Please enter a number between 0 and 59";
		this.service.getAccessToken()
			.then((accessToken: string) => {
				let predicates = new SqlSearchPredicateDto();
				predicates.orderBy = null;
				predicates.paging = null;
				predicates.sqlPredicates = null;
				return this.service.getAllNetcastGenres(predicates, accessToken);
			})
			.then((n: NetcastGenreDto[]) => {
				this.genres = new Array<KeyValueType>();
				n.forEach((g) => {
					let item = new KeyValueType();
					item.key = g.value;
					item.value = g.netcastGenreId;
					this.genres.push(item);
				});
				this.genres = this.genres.slice();
			})

		this.createForm();
		this.showProgress = false;
	}

	createForm() {
		this.formGroup = this.fb.group({
			title: new FormControl(this.netcast.title, [
				Validators.maxLength(200),
				Validators.required

			]),
			description: new FormControl(this.netcast.description, [
				Validators.maxLength(4000)
			]),
			//isPrerecordered: new FormControl(0, [
			//    Validators.required
			//]),
			//localFileLocation: new FormControl('', [
			//    Validators.maxLength(500)
			//]),
			tags: new FormControl(this.netcast.tags, [
				Validators.maxLength(300)
			]),
			isPrivate: new FormControl(this.netcast.isPrivate, [
				Validators.required
			]),
			password: new FormControl(this.netcast.hPassword, [
				Validators.maxLength(300)
			]),
			netcastDate: new FormControl('', [
				dateValidator,

			]),
			netcastHour: new FormControl('', [

				Validators.pattern('^[0-9]{1,2}$'),
				Validators.max(12),
				Validators.min(1)
			]),
			netcastMinute: new FormControl('', [

				Validators.pattern('^[0-9]{1,2}$'),
				Validators.max(59),
				Validators.min(0)
			]),
			isPm: new FormControl(true, [

			]),
			avatarDataUri: new FormControl(''),
			netcastGenreId: new FormControl(this.netcast.netcastGenreId, [
				Validators.pattern('^[0-9]{1,5}$'),
				Validators.required
			])
		})
	}

	onImageSelected(imageDataUri: string): void {
		//console.log("form-add-contact.component.ts onImageSelected: imageDateUri: ", imageDataUri);
		this.image = imageDataUri;
	}

	//onIsPrivateChanged(value): void {
	//	console.log("onIsPrivateChanged value: ", value);
	//	if (value) {
	//	}
	//}

	removeAvatar(): void {
		this.image = this.defaultAvatar;
	}

	async submit(event: MouseEvent): Promise<void> {
		let originalContent: string;
		try {
			if (this.formGroup.valid) {
				let accessToken: string = await this.service.getAccessToken();
				console.log("got accessToken: ", accessToken);
				// errorMessages will stop update.
				let errorMessages: string[] = new Array<string>();

				// warnings will display warning messages but will still perform update.
				let warnings: string[] = new Array<string>();

				let title: string = this.formGroup.get('title').value;
				let description: string = this.formGroup.get('description').value;
				let netcastDateStr: string = this.formGroup.get('netcastDate').value;
				let isPrivate: boolean = this.formGroup.get('isPrivate').value;
				let netcastHour: number = Number(this.formGroup.get('netcastHour').value);
				let netcastMinute: number = Number(this.formGroup.get('netcastMinute').value);
				let isPm: boolean = this.formGroup.get('isPm').value;
				let tags: string = this.formGroup.get('tags').value;
				let password: string = this.formGroup.get('password').value;
				let netcastGenreId: number = Number(this.formGroup.get('netcastGenreId').value);

				if (this.service.isEmpty(event) === false) {
					originalContent = (<Element>event.target).innerHTML;
					(<Element>event.target).innerHTML = '<i class="fa fa-spinner fa-spin"></i> Please Wait';
					(<Element>event.target).setAttribute("disabled", "true");
				}

				//console.log("before new NetcastDto");

				let netcastDto: NetcastDto = Object.assign(this.netcast);
				netcastDto.title = title;
				netcastDto.description = description;
				netcastDto.isPrivate = isPrivate;
				//netcastDto.memberId = this.service.profile.memberId;

				//console.log("after isPrivate: ", netcastDto);
				//console.log("this.formGroup: ", this.formGroup);
				// check the password update
				if (this.service.isEmpty(isPrivate)) {
					netcastDto.hPassword = "";
				}
				else if (password === this.netcast.hPassword) {
					netcastDto.hPassword = password
				}
				else if (password.length > 25) {
					errorMessages.push("The password must be less than 25 characters");
				}
				else if (password.length >= 4 && password.length <= 25) {
					netcastDto.hPassword = password;
				}
				else {
					errorMessages.push("The password field is required for a private Netcast and must be between 4 and 25 characters.")
				}

				netcastDto.tags = tags;
				netcastDto.netcastGenreId = netcastGenreId;

				// check netcast startDateTime update
				if (!this.service.isEmpty(netcastDateStr) || !this.service.isEmpty(netcastHour)) {
					if (!this.service.isEmpty(netcastDateStr) && !this.service.isEmpty(netcastHour)) {
						let minutes: number;

						if (this.service.isEmpty(isPm) === false) {
							netcastHour = netcastHour < 12 ? netcastHour + 12 : netcastHour;
							minutes = (netcastHour * 60);
						}
						else if (netcastHour < 12) {
							minutes = (netcastHour * 60);
						}
						else {
							minutes = 0;
						}

						minutes = minutes + netcastMinute;

						let netcastDate: moment.Moment = moment(netcastDateStr).add(minutes, 'm');
						//console.log("meetDate: ", meetDate);
						let currentDate: moment.Moment = moment();
						//console.log("currentDate: ", currentDate);
						if (currentDate > netcastDate) {
							//console.log("in the past");
							errorMessages.push("The Netcast must be set in the future. Please choose a netcast date and time that is in the future.");
						}
						else {
							netcastDto.startDateTime = netcastDate.toDate();
						}
					}
					else {
						errorMessages.push("The Netcast Date, Hour, Minute are required.");
					}
				}
				else {
					// we use the current netcastDate
					netcastDto.startDateTime = this.netcast.startDateTime;
				}

				// check image for processing image update
				if (this.image == this.defaultAvatar) {
					// blank out imageFilename and the webapi server will delete the image
					netcastDto.imageFilename = "";
				}
				else if (this.image != this.viewModel.imageSrc) {
					// the image is not the same as the original image
					// check to make sure the image is data:image/

					//console.log("udpateing image: ", this.image);

					if (this.image.search('data:image/') > -1) {
						// add the new image, this will delete any old files on the server
						//console.log("valid image");
						let updatedNetcast = await this.service.addNetcastImage(this.image, this.netcast.netcastId, accessToken);
						if (!this.service.isEmpty(updatedNetcast)) {
							// then set the imageFilename
							//console.log("updated image success updatedNetcast:", updatedNetcast);
							netcastDto.imageFilename = updatedNetcast.imageFilename;
						}
						else {
							warnings.push("Failed to update the netcast image.")
							netcastDto.imageFilename = this.netcast.imageFilename
						}
					}
					else {
						warnings.push("The image selected does not appear to be a valid image. Skipping image update.")
						netcastDto.imageFilename = this.netcast.imageFilename
					}
				}
				else {
					// this.image did not change, leave the filename the same
					netcastDto.imageFilename = this.netcast.imageFilename;
				}

				//this.model.avatarDataUri = this.image != this.defaultAvatar ? this.image : "";
				// onAddNetcast creates the db record, then its done it will add the image if available;
				//this.onAddNetcast.emit(netcastDto);

				// the image is emitted to the parent and waite. onAddNetcast runs an operation, which will check
				// for the image to add after if finishes its operation.
				//this.onAddNetcastImage.emit(this.image);

				if (errorMessages.length > 0) {
					// do not process the form, and display the error messages.
					let alert = new MaterialAlertMessageType();
					alert.title = "Error";
					errorMessages.forEach((m) => {
						alert.message += alert.message + m + "<br />";
					});
					this.service.openAlert(alert);
				}
				else {
					// process the form
					if (warnings.length > 0) {
						let alert = new MaterialAlertMessageType();
						alert.title = "Warning";
						warnings.forEach((m) => {
							alert.message += alert.message + m + "<br />";
						});
						this.service.openAlert(alert);
					}
					//console.log("performing update");
					let updated = await this.service.updateNetcast(netcastDto, accessToken);

					this.onEditNetcastComplete.emit(updated);
				}

				if (this.service.isEmpty(originalContent) === false && this.service.isEmpty(event) === false) {
					(<Element>event.target).innerHTML = originalContent;
					(<Element>event.target).removeAttribute("disabled");
				}
			}
			else {
				let alert = new MaterialAlertMessageType();
				alert.title = "Please Check";
				alert.message = "Please make sure any error messages are fixed."
				this.service.openAlert(alert);
			}
		}
		catch (error) {
			//TODO: Handle error

			if (this.service.isEmpty(originalContent) === false && this.service.isEmpty(event) === false) {
				(<Element>event.target).innerHTML = originalContent;
				(<Element>event.target).removeAttribute("disabled");
			}
			console.log("form-netcast-edit.component.ts submit error:", error);
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = "Sorry, unable to update netcast. Please try again later.";
			this.service.openAlert(alert);
		}
	}

	cancel() {
		this.onEditNetcastCancel.emit();
	}
}