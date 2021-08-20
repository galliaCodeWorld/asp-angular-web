import { Component, Input, Output, EventEmitter, Inject, Optional } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import {
	PbxLineRepDto
} from "../../models/index";
import { Service } from "../../services/index";
@Component({
	selector: 'other-reps',
	templateUrl: 'other-reps.component.html'
})
export class OtherRepsComponent {
	constructor(
		private service: Service,
		public matDialog: MatDialog,
		@Optional() @Inject(MAT_DIALOG_DATA) public data: any,
	) { }

	@Input('otherReps') otherReps: Array<PbxLineRepDto>;

	ngOnInit() {
		//console.log("data: ", this.data);
		if (this.service.isEmpty(this.data) === false && this.data[0].hasOwnProperty('pbxLineRepId')) {
			this.otherReps = this.data;
			//console.log("other-reps.component.ts: ", this.otherReps);
		}
	}

	close(): void {
		let dialog = this.matDialog.getDialogById('reps-paging-list');
		dialog.close();
	}
}