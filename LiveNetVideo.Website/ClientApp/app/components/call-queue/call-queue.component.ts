import { Component, OnInit } from '@angular/core';
import { PbxService, SignalrService } from '../../services/index';
import { ActivatedRoute } from '@angular/router';

@Component({
	templateUrl: './call-queue.component.html',
	styleUrls: ['./call-queue.component.scss']
})
export class CallQueueComponent implements OnInit {
	constructor(
		private pbxService: PbxService,
		private route: ActivatedRoute,
		private signalrService: SignalrService) {
	}

	repId: string;

	ngOnInit() {
		this.route.paramMap
			.subscribe(param => {
				this.repId = param.get('id');
			})

		this.getPbxCallQueue()
	}

	getPbxCallQueue() {
		let { access_token } = this.signalrService.jwtToken
		this.pbxService.getPbxCallQueuesByPbxLineRepId({
			id: parseInt(this.repId)
		}, access_token)
			.then(data => {
			})
			.catch(error => console.log(error))
	}
}