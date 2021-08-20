import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CallFailureModalComponent } from './call-failure-modal.component';

describe('CallFailureModalComponent', () => {
  let component: CallFailureModalComponent;
  let fixture: ComponentFixture<CallFailureModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CallFailureModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CallFailureModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
