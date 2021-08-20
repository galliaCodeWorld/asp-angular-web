import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-call-failure-modal',
  templateUrl: './call-failure-modal.component.html',
  styleUrls: ['./call-failure-modal.component.scss']
})
export class CallFailureModalComponent implements OnInit {

  @Output() closeClicked: EventEmitter<any> = new EventEmitter;
  constructor() { 

  }

  ngOnInit() {

  }
  
  close() {
    this.closeClicked.emit(null)
  }
}
