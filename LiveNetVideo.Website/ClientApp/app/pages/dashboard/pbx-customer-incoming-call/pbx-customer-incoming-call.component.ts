// import { Component, OnInit, Inject } from '@angular/core';
// import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
// import {
//     IncomingCallResponseEnum, ProfileDto
// } from '../../../models/index'
// @Component({
//     templateUrl: './pbx-customer-incoming-call.component.html',
//     styleUrls: ['./pbx-customer-incoming-call.component.scss']
// })

// export class PbxCustomerIncomingCallComponent implements OnInit {

//     callerProfile: ProfileDto

//     constructor(
//         public dialogRef: MatDialogRef<PbxCustomerIncomingCallComponent>,
//         @Inject(MAT_DIALOG_DATA) public data: ProfileDto
//     ) {

//     }

//     ngOnInit() {
//         this.callerProfile = this.data;
//     }

//     accept(): void {
//         this.dialogRef.close(IncomingCallResponseEnum.accept);
//     }

//     reject(): void {
//         this.dialogRef.close(IncomingCallResponseEnum.accept);
//     }
// }

//moved to pbx-custoemr folder