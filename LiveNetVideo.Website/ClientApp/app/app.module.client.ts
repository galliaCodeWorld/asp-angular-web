import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { sharedConfig } from './app.module.shared';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppModuleMaterials } from './app.module.materials';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { HttpClientModule } from '@angular/common/http';
//import { FlexLayoutModule } from '@angular/flex-layout';
import { environment } from '../environments/environment';
//import { ServiceWorkerModule } from '@angular/service-worker';
//import { AppComponent } from './components/app/app.component';

import {
	PhoneCallComponent,

	PbxLineCallComponent,
	MaterialAlertComponent,
	MaterialActionAlertComponent,
	MaterialSnackBarComponent,
	CreateCompanyComponent,
	CreatePbxLineComponent,
	InviteEmployeeComponent,
	IncomingPhoneCallComponent,
	OutgoingCallDialogComponent,
	FormAddContactComponent,
	FormEditContactComponent,
	PhotoCameraComponent,
	ContactCardComponent,
	IdCardComponent,
	FormCompanyPhotoAddComponent,
	FormCompanyVideoAddComponent,
	FormCompanyLocationAddComponent,
	FormCompanyLocationEditComponent,
	FormCompanyPbxlineEditComponent,
	FormCompanyPbxlineAddComponent,
	FormCompanyEmployeeInviteAddComponent,
	EmployeeCardComponent,
	CompanyEmployeeComponent,
	FormCompanyEmployeeEditComponent,
	ContactListComponent,
	TextMessagingMessageComponent,
	PrivateMessagingComponent,
	PbxCustomerDetailsComponent,
	OtherRepsComponent,
	OtherRepComponent,
	FormGetInfoComponent,
	FormCreateCompanyComponent,
	MeetingAttendeeComponent,
	FormAddAttendeeComponent,
	MeetingItemComponent,
	FormEditMeetingComponent,
	MeetingDetailsComponent,
	MeetingInviteComponent,
	LoginOptionsComponent,
	MemberLoginFormComponent,
	FormNetcastAddComponent,
	FormNetcastEditComponent,
	ButtonAddNetcastComponent,
} from "./components/index";

import {
	ContactService,
	SettingsService,
	VideoHelperService,
	ConfigService,
	SignalrService,
	JsHelperService,
	LocalStorageService,
	BlockCallService,
	UserService,
	PushService,
	PermissionsService,
	FlashMessageService,
	CapturePhotoService,
	MaterialsHelperService,
	PbxService,
	FormsErrorService,
	Service,
	MeetingService,
	NetcastService,
} from './services/index';

import { MapperService } from './services/mapper.service';

import {
	PageCanActivate,
	GuestCanActivate,
	MemberCanActivate,
	EmployeeCompaniesResolver
} from "./guards/index";

@NgModule({
	bootstrap: sharedConfig.bootstrap,
	declarations: sharedConfig.declarations,
	imports: [

		BrowserModule,
		FormsModule,
		ReactiveFormsModule,
		AppModuleMaterials,
		...sharedConfig.imports,
		BrowserAnimationsModule,
		HttpClientModule,
		ToastrModule.forRoot(
			{
				positionClass: 'toast-top-center',
				messageClass: 'is-open-sans',
				titleClass: 'is-open-sans',
				timeOut: 6400
			}
		), // ToastrModule added
		//FlexLayoutModule,

		//ServiceWorkerModule.register('assets/service-worker/ngsw-worker.js', { enabled: environment.production }),
	],// entryComponents are components that get loaded dynamically using ViewContainerRef.createComponent()
	entryComponents: [

		PhoneCallComponent,
		PbxLineCallComponent,
		MaterialAlertComponent,
		MaterialActionAlertComponent,
		MaterialSnackBarComponent,
		CreateCompanyComponent,
		CreatePbxLineComponent,
		InviteEmployeeComponent, //causing problems,
		IncomingPhoneCallComponent,
		OutgoingCallDialogComponent,
		FormAddContactComponent,
		FormEditContactComponent,
		PhotoCameraComponent,
		ContactCardComponent,
		IdCardComponent,
		IncomingPhoneCallComponent,
		FormCompanyPhotoAddComponent,
		FormCompanyVideoAddComponent,
		FormCompanyLocationAddComponent,
		FormCompanyLocationEditComponent,
		FormCompanyPbxlineEditComponent,
		FormCompanyPbxlineAddComponent,
		FormCompanyEmployeeInviteAddComponent,
		EmployeeCardComponent,
		CompanyEmployeeComponent,
		FormCompanyEmployeeEditComponent,
		ContactListComponent,
		TextMessagingMessageComponent,
		PrivateMessagingComponent,
		PbxCustomerDetailsComponent,
		OtherRepsComponent,
		OtherRepComponent,
		FormGetInfoComponent,
		FormCreateCompanyComponent,
		MeetingAttendeeComponent,
		FormAddAttendeeComponent,
		MeetingItemComponent,
		FormEditMeetingComponent,
		MeetingDetailsComponent,
		MeetingInviteComponent,
		LoginOptionsComponent,
		MemberLoginFormComponent,
		FormNetcastAddComponent,
		FormNetcastEditComponent,
		ButtonAddNetcastComponent,
	],
	providers: [
		{ provide: 'ORIGIN_URL', useValue: location.origin },
		ContactService,
		SettingsService,
		VideoHelperService,
		ConfigService,
		SignalrService,
		JsHelperService,
		LocalStorageService,
		BlockCallService,
		UserService,
		PushService,
		PermissionsService,
		FlashMessageService,
		CapturePhotoService,
		MaterialsHelperService,
		PbxService,
		FormsErrorService,
		Service,
		PageCanActivate,
		GuestCanActivate,
		MemberCanActivate,
		EmployeeCompaniesResolver,
		MeetingService,
		NetcastService,
		MapperService,
	]
})
export class AppModule {
}