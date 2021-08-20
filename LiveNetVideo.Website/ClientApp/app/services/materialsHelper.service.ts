import { Injectable } from '@angular/core';
import {
	MatDialog,
	MatDialogRef,
	MAT_DIALOG_DATA,
	MatSnackBar
} from '@angular/material';

import {
	MaterialAlertMessageType,
	MaterialActionAlertMessageType,
	MaterialSnackBarMessageType,
	IncomingCallResponseEnum,
	CallType,
	IncomingCallDialogType,
	EmailDtoType
} from '../models/index';
import {
	MaterialAlertComponent,
	MaterialActionAlertComponent,
	MaterialSnackBarComponent
} from '../components/index';

import {
	ConfigService
} from './index';
import { Component } from '@angular/core/src/metadata/directives';
import { ComponentRef } from '@angular/core/src/linker/component_factory';

@Injectable()
export class MaterialsHelperService {
	constructor(
		public dialog: MatDialog,
		public snackBar: MatSnackBar,
		public configService: ConfigService
	) { }

	openAlert(data: MaterialAlertMessageType): void {
		let dialogRef = this.dialog.open(MaterialAlertComponent, {
			data: data,
			width: '300px',
		});

		dialogRef.afterClosed().subscribe(result => {
			//console.log('The dialog was closed');
		});
	}

	openActionAlert(data: MaterialActionAlertMessageType): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			let dialogRef = this.dialog.open(MaterialActionAlertComponent, {
				data: data,
				width: '300px'
			});

			dialogRef.afterClosed().subscribe(result => {
				//console.log('The dialog was closed');
				resolve(data.doAction);
			});
		});
	}

	//openIncomingCall(call: CallType): Promise<IncomingCallResponseEnum> {
	//	return new Promise<IncomingCallResponseEnum>((resolve, reject) => {
	//		let data = new IncomingCallDialogType();
	//		data.call = call;
	//		data.avatarBaseUrl = this.configService.avatarBaseUrl;
	//		let dialogRef = this.dialog.open(MaterialDialogExampleComponent, {
	//			width: '250px',
	//			data: data
	//		});

	//		dialogRef.afterClosed().subscribe(result => {
	//			console.log('The dialog was closed');
	//			resolve(data.response);
	//		});
	//	});
	//}

	// openCustomDialog<T>(customComponent: ComponentRef<T>): Promise<boolean> {
	// 	return new Promise<boolean>((resolve, reject) => {
	// 		let dialogRef = this.dialog.open(customComponent, {
	// 			width: '300px'
	// 		});

	// 		dialogRef.afterClosed().subscribe(result => {
	// 			console.log('The dialog was closed');
	// 			resolve(data.doAction);
	// 		});
	// 	});
	// }

	openSnackBar(data: MaterialSnackBarMessageType) {
		this.snackBar.openFromComponent(MaterialSnackBarComponent, {
			duration: 3000,
			data: data,
			horizontalPosition: 'center',
			verticalPosition: 'top'
		});
	}
}