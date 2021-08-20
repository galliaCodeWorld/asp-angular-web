import { Component, Inject, ViewContainerRef, ViewChild, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';
import {
	MaterialActionAlertMessageType
} from '../../models/index';

@Component({
	styleUrls: ['./material-action-alert.component.scss'],
	templateUrl: 'material-action-alert.component.html',
})
export class MaterialActionAlertComponent {
	constructor(
		private domSanitizer: DomSanitizer,
		public dialogRef: MatDialogRef<MaterialActionAlertComponent>,
		@Optional() @Inject(MAT_DIALOG_DATA) public data: MaterialActionAlertMessageType
	) { }

	// for inserting dynamic component to dialog
	@ViewChild('viewContainerRef', { read: ViewContainerRef }) viewContainerRef: ViewContainerRef;

	// for inserting dynamic html to dialog
	htmlContent: SafeHtml;

	ngOnInit() {
		this.htmlContent = this.domSanitizer.bypassSecurityTrustHtml(this.data.message);
	}

	yes(): void {
		this.data.doAction = true;
		this.dialogRef.close(true);
	}

	no(): void {
		this.data.doAction = false;
		this.dialogRef.close(false);
	}
}