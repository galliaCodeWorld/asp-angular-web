import { Component, OnDestroy, OnInit, Output, EventEmitter } from '@angular/core';

import { MatDialogRef, MatDialog } from '@angular/material';
import {
	Service
} from '../../services/index'
import {
	MaterialAlertMessageType
} from '../../models/index'
import {
	PhotoCameraComponent
} from "../index";
@Component({
	selector: 'image-selector',
	templateUrl: 'image-selector.component.html'
})
export class ImageSelectorComponent {
	constructor(
		private service: Service,
		private matDialog: MatDialog,
	) {
	}

	@Output() onImageSelected: EventEmitter<string> = new EventEmitter<string>();

	ngOnInit() {
	}

	openCamera(): void {
		//console.log("open camera");
		let dialogRef = this.matDialog.open(PhotoCameraComponent, {
			width: '80%',
			height: '80%'
		})

		dialogRef.componentInstance.onUsePhoto.subscribe((imageDataUri: string) => {
			this.onImageSelected.emit(imageDataUri);
			dialogRef.close();
		});

		dialogRef.afterClosed().subscribe(() => {
			dialogRef.componentInstance.onUsePhoto.unsubscribe();
		});
	}

	//openAddContactModal(): void {
	//	let dialogRef = this.matDialog.open(FormAddContactComponent, {
	//		width: '50%',
	//		height: '100%'
	//	})
	//}

	photoSelected(event: any) {
		let input: HTMLInputElement = event.target;
		if (input.files && input.files[0]) {
			var reader = new FileReader();
			let file = input.files[0]
			reader.readAsDataURL(file);
			reader.onload = (e: any) => {
				//console.log("e.target.result: ", e.target.result);
				let imageDataUri: string = e.target.result;
				this.onImageSelected.emit(imageDataUri);
			}
		}
	}
}