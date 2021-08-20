import { Component, OnInit } from '@angular/core';
import { PbxLineDto, IdDto } from '../../models/index';
import { ActivatedRoute, Router } from '@angular/router';
import { PbxService, SignalrService } from '../../services/index';
@Component({
	templateUrl: './pbx-rep-lines.component.html',
	styleUrls: ['./pbx-rep-lines.component.scss']
})
export class PbxRepLinesComponent implements OnInit {
	companyId: number;
	isLoading: boolean;
	pbxLines: PbxLineDto[] = []
	isEmpty: boolean = false;
	constructor(
		private router: Router,
		private activatedRoute: ActivatedRoute,
		private pbxService: PbxService,
		private signalrService: SignalrService
	) {
	}
	ngOnInit() {
		this.activatedRoute.paramMap
			.subscribe(param => {
				this.companyId = parseInt(param.get('id'));
				let dto: IdDto = new IdDto();
				dto.id = this.companyId;
				//this.getAllPbxLines();
				let jwtToken = this.signalrService.jwtToken;

				//this.pbxService.getEmployeePbxLines(dto, jwtToken.access_token)
				//	.then((pbxLines: Array<PbxLineDto>) => {
				//		this.pbxLines = pbxLines;
				//		//if there is only one pbxLine, take them directly to the pbxLine
				//		if (pbxLines.length === 1) {
				//			this.navigateToPbxLine(pbxLines[0].pbxLineId);
				//		} else if (pbxLines.length < 1) {
				//			this.isEmpty = true;
				//		}
				//	})
				//	.catch((error) => {
				//	})
				//	.then(() => {
				//		this.isLoading = false;
				//	})
			})
	}

	//getAllPbxLines() {
	//	this.isLoading = true;
	//	return new Promise<void>((resolve, reject) => {
	//		let { access_token } = this.signalrService.jwtToken;
	//		this.pbxService.getPbxLinesByCompanyProfileId({
	//			id: this.companyId
	//		}, access_token)
	//			.then((pbxLines: PbxLineDto[]) => {
	//				this.pbxLines = pbxLines;
	//				//if there is only one pbxLine, take them directly to the pbxLine
	//				if (pbxLines.length < 2) {
	//					this.navigateToPbxLine()
	//				} else if (pbxLines.length < 1) {
	//					this.isEmpty = true;
	//				}
	//			})
	//			.catch(error => console.log(reject))
	//			.then(() => this.isLoading = false)
	//	})
	//}

	navigateToPbxLine(pbxLineId) {
		console.log("routing to pbx-line with pbxLineId: ", pbxLineId);
		this.router.navigate(['dashboard/pbx-rep-shell/pbxline/', pbxLineId]);
	}
}