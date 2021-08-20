import { Component, AfterViewInit, ViewChild, NgZone } from '@angular/core';
import { MatSidenav, MatSidenavContainer } from "@angular/material/sidenav";
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatListOption, MatList, MatSelectionList } from '@angular/material';

import {
	FormBuilder,
	FormArray,
	FormGroup,
	FormControl,
	Validators,
	AbstractControl
} from '@angular/forms';

import { Service } from '../../services/index';
import {
	SearchTermDto,
	NetcastGenreDto,
	NetcastDto,
	MaterialAlertMessageType,

	ListItemType,
	SqlSearchPredicateDto,
	KeyValueType,
	IdDto,
} from '../../models/index';

@Component({
	templateUrl: 'netcast-search.page.html',
	styleUrls: ['./netcast-search.page.scss'],
})

export class NetcastSearchPage {
	constructor(
		private service: Service,
		private fb: FormBuilder,
		public router: Router,
		public activatedRoute: ActivatedRoute,
		private ngZone: NgZone,
	) {
	}

	ngOnInit() {
		this.showResults = false;
		this.loading = true;
		this.createForms();
		this.showSearchForm = true;

		this.service.isCheckedIntoHubConnection()
			.then(() => {
				return this.service.getAccessToken();
			})
			.then((accessToken: string) => {
				return this.service.getAllNetcastGenres(new SqlSearchPredicateDto(), accessToken);
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
			.catch((e) => {
				let alert = new MaterialAlertMessageType();
				alert.title = "Error";
				alert.message = e;
				this.service.openAlert(alert);
			})
			.then(() => {
				this.loading = false;
			});
	}

	@ViewChild('matSidenavContainer') private _container: MatSidenavContainer;
	ngAfterViewInit() {
		this.ngZone.run(() => {
			setTimeout(() => {
				if (window.innerWidth < 500) {
					this._container.close();
				}
				else {
					this._container.open();
				}
			}, 250);
		});
	}

	showResults: boolean;
	showSearchForm: boolean;

	loading: boolean;

	genres: KeyValueType[];

	items: Array<ListItemType>;

	setNetcastDtos(value: NetcastDto[]) {
		if (this.service.isEmpty(value)) {
			this.items = null;
		}
		else {
			this.items = new Array<ListItemType>();
			value.forEach((v) => {
				let item = new ListItemType();
				item.id = v.netcastId.toString();
				item.imgSrc = this.service.isEmpty(v.imageFilename) ? this.service.defaultAvatar
					: this.service.netcastImageUrl + v.netcastId.toString() + "/" + v.imageFilename + "?" + Date.now().toString();
				item.title = v.title;
				item.content = v.description.substring(0, 300);
				if (item.content.length > 300) {
					item.content = item.content + "...";
				}
				this.items.push(item);
			});
		}
	}

	titleSearchForm: FormGroup;
	tagSearchForm: FormGroup;
	descriptionSearchForm: FormGroup;
	genreSearchForm: FormGroup;

	createForms() {
		this.titleSearchForm = this.fb.group({
			title: new FormControl('', [
				Validators.maxLength(200),
				Validators.required
			])
		});

		this.tagSearchForm = this.fb.group({
			tag: new FormControl('', [
				Validators.maxLength(200),
				Validators.required
			])
		});

		this.descriptionSearchForm = this.fb.group({
			description: new FormControl('', [
				Validators.maxLength(200),
				Validators.required
			])
		});

		this.genreSearchForm = this.fb.group({
			netcastGenreId: new FormControl('', [
				Validators.pattern('^[0-9]{1,5}$'),
				Validators.required
			])
		});
	}

	async searchByTitle(event: MouseEvent): Promise<void> {
		if (this.titleSearchForm.valid) {
			let originalContent: string;
			try {
				if (this.service.isEmpty(event) === false) {
					originalContent = (<Element>event.target).innerHTML;
					(<Element>event.target).innerHTML = '<i class="fa fa-spinner fa-spin"></i> Searching';
					(<Element>event.target).setAttribute("disabled", "true");
				}

				let title = this.titleSearchForm.get('title').value;
				let accessToken: string;
				try {
					accessToken = await this.service.getAccessToken();
				}
				catch (e) {
					throw ("Unable to get access at this time, please try again later.")
				}

				try {
					let search = new SearchTermDto();
					search.term = title;
					//console.log("search.term: ", title);
					let dtos: NetcastDto[] = await this.service.searchNetcastsByTitle(search, accessToken);
					//console.log("netcast-search dtos: ", dtos);
					this.setNetcastDtos(dtos);
					//console.log("this.items: ", this.items);

					if (this.service.isEmpty(originalContent) === false && this.service.isEmpty(event) === false) {
						(<Element>event.target).innerHTML = originalContent;
						(<Element>event.target).removeAttribute("disabled");
					}
					this.showResults = true;
					this.showSearchForm = false;
				}
				catch (e) {
					console.log("error:", e);
					throw ("An error occured while trying to search companies");
				}
			}
			catch (e) {
				if (this.service.isEmpty(originalContent) === false && this.service.isEmpty(event) === false) {
					(<Element>event.target).innerHTML = originalContent;
					(<Element>event.target).removeAttribute("disabled");
				}
				let alert = new MaterialAlertMessageType();
				alert.title = "Error";
				alert.message = e;
				this.service.openAlert(alert);
			}
		}
		else {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = "Please make sure the form is filled out and any error messages are fixed."
			this.service.openAlert(alert);
			return;
		}
	}

	async searchByTag(event: MouseEvent): Promise<void> {
		if (this.tagSearchForm.valid) {
			let originalContent: string;
			try {
				if (this.service.isEmpty(event) === false) {
					originalContent = (<Element>event.target).innerHTML;
					(<Element>event.target).innerHTML = '<i class="fa fa-spinner fa-spin"></i> Searching';
					(<Element>event.target).setAttribute("disabled", "true");
				}

				let tag = this.tagSearchForm.get('tag').value;
				let accessToken: string;
				try {
					accessToken = await this.service.getAccessToken();
				}
				catch (e) {
					throw ("Unable to get access at this time, please try again later.")
				}

				try {
					let search = new SearchTermDto();
					search.term = tag;
					let dtos: NetcastDto[] = await this.service.searchNetcastsByTags(search, accessToken);
					this.setNetcastDtos(dtos);
					if (this.service.isEmpty(originalContent) === false && this.service.isEmpty(event) === false) {
						(<Element>event.target).innerHTML = originalContent;
						(<Element>event.target).removeAttribute("disabled");
					}
					this.showResults = true;
					this.showSearchForm = false;
				}
				catch (e) {
					console.log("error:", e);
					throw ("An error occured while trying to search companies");
				}
			}
			catch (e) {
				if (this.service.isEmpty(originalContent) === false && this.service.isEmpty(event) === false) {
					(<Element>event.target).innerHTML = originalContent;
					(<Element>event.target).removeAttribute("disabled");
				}
				let alert = new MaterialAlertMessageType();
				alert.title = "Error";
				alert.message = e;
				this.service.openAlert(alert);
			}
		}
		else {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = "Please make sure the form is filled out and any error messages are fixed."
			this.service.openAlert(alert);
			return;
		}
	}

	async searchByDescription(event: MouseEvent): Promise<void> {
		if (this.descriptionSearchForm.valid) {
			let originalContent: string;
			try {
				if (this.service.isEmpty(event) === false) {
					originalContent = (<Element>event.target).innerHTML;
					(<Element>event.target).innerHTML = '<i class="fa fa-spinner fa-spin"></i> Searching';
					(<Element>event.target).setAttribute("disabled", "true");
				}

				let description = this.descriptionSearchForm.get('description').value;
				let accessToken: string;
				try {
					accessToken = await this.service.getAccessToken();
				}
				catch (e) {
					throw ("Unable to get access at this time, please try again later.")
				}

				try {
					let search = new SearchTermDto();
					search.term = description;
					let dtos: NetcastDto[] = await this.service.searchNetcastsByDescription(search, accessToken);
					this.setNetcastDtos(dtos);
					if (this.service.isEmpty(originalContent) === false && this.service.isEmpty(event) === false) {
						(<Element>event.target).innerHTML = originalContent;
						(<Element>event.target).removeAttribute("disabled");
					}
					this.showResults = true;
					this.showSearchForm = false;
				}
				catch (e) {
					console.log("error:", e);
					throw ("An error occured while trying to search companies");
				}
			}
			catch (e) {
				if (this.service.isEmpty(originalContent) === false && this.service.isEmpty(event) === false) {
					(<Element>event.target).innerHTML = originalContent;
					(<Element>event.target).removeAttribute("disabled");
				}
				let alert = new MaterialAlertMessageType();
				alert.title = "Error";
				alert.message = e;
				this.service.openAlert(alert);
			}
		}
		else {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = "Please make sure the form is filled out and any error messages are fixed."
			this.service.openAlert(alert);
			return;
		}
	}

	async searchByGenre(event: MouseEvent): Promise<void> {
		if (this.genreSearchForm.valid) {
			let originalContent: string;
			try {
				if (this.service.isEmpty(event) === false) {
					originalContent = (<Element>event.target).innerHTML;
					(<Element>event.target).innerHTML = '<i class="fa fa-spinner fa-spin"></i> Searching';
					(<Element>event.target).setAttribute("disabled", "true");
				}

				let netcastGenreId = this.genreSearchForm.get('netcastGenreId').value;
				let accessToken: string;
				try {
					accessToken = await this.service.getAccessToken();
				}
				catch (e) {
					throw ("Unable to get access at this time, please try again later.")
				}

				try {
					let search = new IdDto();
					search.id = netcastGenreId;
					let dtos: NetcastDto[] = await this.service.getNetcastsByGenreId(search, accessToken);
					this.setNetcastDtos(dtos);
					if (this.service.isEmpty(originalContent) === false && this.service.isEmpty(event) === false) {
						(<Element>event.target).innerHTML = originalContent;
						(<Element>event.target).removeAttribute("disabled");
					}
					this.showResults = true;
					this.showSearchForm = false;
				}
				catch (e) {
					console.log("error:", e);
					throw ("An error occured while trying to search companies");
				}
			}
			catch (e) {
				if (this.service.isEmpty(originalContent) === false && this.service.isEmpty(event) === false) {
					(<Element>event.target).innerHTML = originalContent;
					(<Element>event.target).removeAttribute("disabled");
				}
				let alert = new MaterialAlertMessageType();
				alert.title = "Error";
				alert.message = e;
				this.service.openAlert(alert);
			}
		}
		else {
			let alert = new MaterialAlertMessageType();
			alert.title = "Please Check";
			alert.message = "Please make sure the form is filled out and any error messages are fixed."
			this.service.openAlert(alert);
			return;
		}
	}

	gotoNetcastDetails(netcastId: string): void {
		console.log("id: ", netcastId);
		this.router.navigate(['/netcast-details', netcastId], { relativeTo: this.activatedRoute });
	}
}