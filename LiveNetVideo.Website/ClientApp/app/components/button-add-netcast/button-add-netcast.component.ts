import { Component, OnDestroy, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { MatDialogRef, MatDialog } from '@angular/material';
import {
	Service
} from '../../services/index'
import {
	NetcastDto,
	NetcastGenreDto,
	MaterialAlertMessageType
} from '../../models/index'
import { FormNetcastAddComponent } from "../index";
@Component({
	selector: 'button-add-netcast',
	templateUrl: 'button-add-netcast.component.html'
})
export class ButtonAddNetcastComponent {
	constructor(
		private service: Service,
		private matDialog: MatDialog,
	) {
	}

	@Output() onNetcastAdded: EventEmitter<NetcastDto> = new EventEmitter<NetcastDto>();

	ngOnInit() {
	}

	netcastDataUriImage: string;

	openAddNetcastModal(): void {
		let dialogRef = this.matDialog.open(FormNetcastAddComponent, {
			width: '80%',
			height: '80%'
		});

		//dialogRef.componentInstance.showProgress = this.showProgress;

		dialogRef.componentInstance.onAddNetcast.subscribe(async (netcast: NetcastDto) => {
			console.log("button-add-netcast.component.ts onAddNetcast netcast: ", netcast);
			dialogRef.componentInstance.showProgress = true;
			try {
				let nc: NetcastDto = await this.addNetcast(netcast);
				this.onNetcastAdded.emit(nc);

				dialogRef.close();
			}
			catch (e) {
				console.log("error: ", e);
				let alert = new MaterialAlertMessageType();
				alert.title = "ERROR";
				alert.message = e;
				this.service.openAlert(alert);
			}
			finally {
				dialogRef.componentInstance.showProgress = false;
			}
		});

		dialogRef.componentInstance.onAddNetcastImage.subscribe((dataUri: string) => {
			this.netcastDataUriImage = dataUri;
		});

		dialogRef.afterClosed().subscribe(() => {
			dialogRef.componentInstance.onAddNetcast.unsubscribe();
			dialogRef.componentInstance.onAddNetcastImage.unsubscribe();
		});
	}

	async addNetcast(netcast: NetcastDto): Promise<NetcastDto> {
		try {
			let accessToken: string = await this.service.getAccessToken();
			let nc: NetcastDto = await this.service.createNetcast(netcast, accessToken);
			//console.log("nc: ", nc);
			//console.log("netcastDataUriImage", this.netcastDataUriImage);
			if (!this.service.isEmpty(this.netcastDataUriImage)) {
				let updatedNc: NetcastDto = await this.service.addNetcastImage(this.netcastDataUriImage, nc.netcastId, accessToken);
				//console.log("updatedNc: ", updatedNc);
				nc = updatedNc;
			}

			return nc;
		}
		catch (e) {
			console.log("addNetcast error e: ", e);
			throw (e);
		}
	}
}