import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { PbxCallQueueDto } from "../../../models/index";

@Component({
	selector: 'pbx-line-queue',
	templateUrl: 'pbx-line-queue.component.html'
})

export class PbxLineQueueComponent implements OnInit {
	constructor(
	) {
	}

	@Input('pbxCallQueues') pbxCallQueues: Array<PbxCallQueueDto>;

	ngOnInit() {
	}
}