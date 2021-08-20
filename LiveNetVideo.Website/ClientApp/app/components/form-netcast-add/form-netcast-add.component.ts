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
@Component({
	selector: 'form-netcast-add',
	templateUrl: 'form-netcast-add.component.html'
})
export class FormNetcastAddComponent {
	constructor(
		private service: Service,
		private fb: FormBuilder,
		@Optional() @Inject(MAT_DIALOG_DATA) public data: any,
	) {
	}

	@Input('showProgress') showProgress: boolean;
	@Output() onAddNetcast: EventEmitter<NetcastDto> = new EventEmitter<NetcastDto>();
	@Output() onAddNetcastImage: EventEmitter<string> = new EventEmitter<string>();

	ngOnInit() {
		this.model = new NetcastDto();
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

	genres: KeyValueType[];

	netcastHourErrorMessage: FormsErrorMessageType;
	netcastMinuteErrorMessage: FormsErrorMessageType;

	defaultAvatar = this.service.defaultAvatar;

	image: string = this.defaultAvatar;

	model: NetcastDto;
	formGroup: FormGroup

	createForm() {
		this.formGroup = this.fb.group({
			title: new FormControl('', [
				Validators.maxLength(200),
				Validators.required

			]),
			description: new FormControl('', [
				Validators.maxLength(4000)
			]),
			//isPrerecordered: new FormControl(0, [
			//    Validators.required
			//]),
			//localFileLocation: new FormControl('', [
			//    Validators.maxLength(500)
			//]),
			tags: new FormControl('', [
				Validators.maxLength(300)
			]),
			isPrivate: new FormControl(0, [
				Validators.required
			]),
			password: new FormControl('', [
				Validators.maxLength(25)
			]),
			netcastDate: new FormControl('', [
				dateValidator,
				Validators.required
			]),
			netcastHour: new FormControl('', [
				Validators.required,
				Validators.pattern('^[0-9]{1,2}$'),
				Validators.max(12),
				Validators.min(1)
			]),
			netcastMinute: new FormControl('', [
				Validators.required,
				Validators.pattern('^[0-9]{1,2}$'),
				Validators.max(59),
				Validators.min(0)
			]),
			isPm: new FormControl(true, [
				Validators.required
			]),
			avatarDataUri: new FormControl(''),
			netcastGenreId: new FormControl('', [
				Validators.pattern('^[0-9]{1,5}$'),
				Validators.required
			])
		})
	}

	onImageSelected(imageDataUri: string): void {
		//console.log("form-add-contact.component.ts onImageSelected: imageDateUri: ", imageDataUri);
		this.image = imageDataUri;
	}

	removeAvatar(): void {
		this.image = this.defaultAvatar;
	}

	submit() {
		let originalContent: string;
		try {
			if (this.formGroup.valid) {
				let title = this.formGroup.get('title').value;
				let description = this.formGroup.get('description').value;
				let netcastDateStr = this.formGroup.get('netcastDate').value;
				let isPrivate = this.formGroup.get('isPrivate').value;
				let netcastHour: number = Number(this.formGroup.get('netcastHour').value);
				let netcastMinute: number = Number(this.formGroup.get('netcastMinute').value);
				let isPm = this.formGroup.get('isPm').value;
				let tags = this.formGroup.get('tags').value;
				let password = this.formGroup.get('password').value;
				let netcastGenreId = Number(this.formGroup.get('netcastGenreId').value);

				if (this.service.isEmpty(event) === false) {
					originalContent = (<Element>event.target).innerHTML;
					(<Element>event.target).innerHTML = '<i class="fa fa-spinner fa-spin"></i> Please Wait';
					(<Element>event.target).setAttribute("disabled", "true");
				}

				console.log("this.service.profile", this.service.profile);
				console.log("this.service.memberId", this.service.memberId);

				let netcastDto = new NetcastDto();
				netcastDto.title = title;
				netcastDto.description = description;
				netcastDto.isPrivate = isPrivate;
				netcastDto.memberId = this.service.profile.memberId;
				netcastDto.hPassword = password;
				netcastDto.tags = tags;
				netcastDto.netcastGenreId = netcastGenreId;

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
					throw ("The meeting must be set in the future. Please choose a meeting date and time that is in the future.");
				}

				netcastDto.startDateTime = netcastDate.toDate();

				//this.model.avatarDataUri = this.image != this.defaultAvatar ? this.image : "";
				// onAddNetcast creates the db record, then its done it will add the image if available;
				this.onAddNetcast.emit(netcastDto);

				// the image is emitted to the parent and waite. onAddNetcast runs an operation, which will check
				// for the image to add after if finishes its operation.
				this.onAddNetcastImage.emit(this.image);

				if (this.service.isEmpty(originalContent) === false && this.service.isEmpty(event) === false) {
					(<Element>event.target).innerHTML = originalContent;
					(<Element>event.target).removeAttribute("disabled");
				}
			}
			else {
				let alert = new MaterialAlertMessageType();
				alert.title = "Please Check";
				alert.message = "Please make sure the form is filled out and any error messages are fixed."
				this.service.openAlert(alert);
			}
		}
		catch (error) {
			//TODO: Handle error

			if (this.service.isEmpty(originalContent) === false && this.service.isEmpty(event) === false) {
				(<Element>event.target).innerHTML = originalContent;
				(<Element>event.target).removeAttribute("disabled");
			}
			console.log("form-add-netcast.component.ts submit error:", error);
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = "Sorry, unable to create netcast. Please try again later.";
			this.service.openAlert(alert);
		}
	}
}