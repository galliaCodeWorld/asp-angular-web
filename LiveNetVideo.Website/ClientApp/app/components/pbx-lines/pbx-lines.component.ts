import { Component, OnInit, Inject } from '@angular/core';
import { CreatePbxLineComponent } from '../index';
import { MatDialog } from '@angular/material';
import { PbxLineDto } from '../../models/index';
import { ActivatedRoute } from '@angular/router';
import { PbxService, SignalrService } from '../../services/index';

@Component({
    templateUrl: './pbx-lines.component.html',
    styleUrls: ['./pbx-lines.component.scss']
})
export class PbxLinesComponent implements OnInit {
    isLoading: boolean;
    pbxLines = []
    companyId: string;
    
    constructor(private dialog: MatDialog,
        private route: ActivatedRoute,
        private pbxService: PbxService,
        private signalrService: SignalrService) {
    }


    ngOnInit() {
        this.route.paramMap
            .subscribe(param => {
                this.companyId = param.get('id')
                this.getAllPbxLines();
            })
    }

    createPbxLine() {
        let dialogRef = this.dialog.open(CreatePbxLineComponent, {
            data: {
                id: this.companyId
            }
        });

        dialogRef.afterClosed().subscribe((pbxLine: PbxLineDto) => {
            this.getAllPbxLines();
        })
    }



    getAllPbxLines() {
        this.isLoading = true;
        return new Promise<void>((resolve, reject) => {
            let { access_token } = this.signalrService.jwtToken;
            this.pbxService.getPbxLinesByCompanyProfileId({
                id: parseInt(this.companyId)
            }, access_token)
                .then((pbxLines: PbxLineDto[]) => {
                    for (let pbxline of pbxLines) {
                        pbxline.iconFilename = !pbxline.iconFilename ? '../../../assets/images/default-avatar.png' :
                            `https://nofb.org/Content/Pbx/${this.companyId}/PbxLines/${pbxline.iconFilename}`
                    }
                    this.pbxLines = pbxLines;

                }, error => console.log(reject))
                .then(() => this.isLoading = false)
        })
    }
}