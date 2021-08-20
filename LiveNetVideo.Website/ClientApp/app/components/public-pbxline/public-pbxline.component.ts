import {
	Component, Input, Output, EventEmitter,
	ComponentFactory,
	ComponentFactoryResolver,
	ViewContainerRef,
	ComponentRef,
} from '@angular/core';
import { MatDialogRef, MatDialog, MatCard } from '@angular/material';
import {
	Router,
	ActivatedRoute
} from '@angular/router';
import {
	MaterialAlertMessageType,	MaterialActionAlertMessageType,
	PbxLineDto,
	IdCardType,
	PbxLineRepDto,
	LongIdDto,
	CompanyEmployeeDto,
} from "../../models/index";
import { Service } from "../../services/index";
import {
	MaterialActionAlertComponent,
	IdCardComponent,
	FormCompanyPbxlineEditComponent,
} from "../index";
@Component({
	selector: 'public-pbxline',
	templateUrl: 'public-pbxline.component.html'
})
export class PublicPbxlineComponent {
	constructor(
		private service: Service,
		private matDialog: MatDialog,
		public viewContainerRef: ViewContainerRef,
		public componentFactoryResolver: ComponentFactoryResolver,
		public activatedRoute: ActivatedRoute,
		public router: Router,
	) { }

	@Input('pbxline') inputPbxline: PbxLineDto;

	_pbxline: PbxLineDto;
	get pbxline(): PbxLineDto {
		return this._pbxline;
	}
	set pbxline(value: PbxLineDto) {
		this._pbxline = value;
		if (this.service.isEmpty(value) === false) {
			this.lineName = value.lineName;
			this.description = value.description;
			this.isDisabled = this.service.isEmpty(value.isDisabled) ? false : true;
			this.imgSrc = this.service.isEmpty(value.iconFilename) ? this.service.defaultAvatar :
				this.service.pbxContentUrl + value.companyProfileId.toString() + "/" + this.service.pbxLineImageFolder + "/" + value.iconFilename + "?" + Date.now().toString();
			this.pbxlineId = value.pbxLineId;
		}
	}

	imgSrc: string;
	lineName: string;
	description: string;
	isDisabled: boolean;
	pbxlineId: number;
	ngOnInit() {
		//this.setGui(this.pbxline);
		this.pbxline = this.inputPbxline;
	}

	async gotoPbxline(): Promise<void> {
		this.router.navigate(['/customer-pbx', this.pbxlineId], { relativeTo: this.activatedRoute });
	}
}