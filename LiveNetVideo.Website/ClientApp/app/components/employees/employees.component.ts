import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material';
import { 
    InviteEmployeeComponent 
} from '../index'
import { PbxService, JsHelperService, SignalrService } from '../../services/index';

@Component({
    styleUrls: ['./employees.component.scss'],
    templateUrl: './employees.component.html'
})
export class EmployeesComponent implements OnInit{
    employees = []
    pendingInvitee = [];
    constructor(
        private dialog: MatDialog,
        private route: ActivatedRoute,
        private pbxService: PbxService,
        private jsHelperService: JsHelperService,
        private signalrService: SignalrService) {
    }
    arr = new Array(10);
    
    companyId: string;
    isLoading: boolean = false;

    ngOnInit() {
        this.route.paramMap
        .subscribe(param => {
            this.companyId = param.get('id')
            this.getAllInvites();
        })
    }

    inviteEmployee() {
        let dialogRef = this.dialog.open(InviteEmployeeComponent, {
            data: {
                id: this.companyId
            }
        });

        dialogRef.afterClosed().subscribe((data) => {
            this.getAllInvites();
        })
    }

    

    getAllInvites(): any {
        this.isLoading = true;
        let { access_token }  = this.signalrService.jwtToken;
        this.pbxService.getCompanyEmployeeInvitesByCompanyProfileId({
            id: parseInt(this.companyId)
        }, access_token)
        .then(invites => this.pendingInvitee = invites)
        .catch(error => console.log(error))
        .then(() => this.isLoading = false)
    }
}