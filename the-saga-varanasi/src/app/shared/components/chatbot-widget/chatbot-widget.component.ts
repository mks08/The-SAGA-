import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-chatbot-widget',
  templateUrl: './chatbot-widget.component.html',
  styleUrls: ['./chatbot-widget.component.scss'],
})
export class ChatbotWidgetComponent implements OnInit {
  quickForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.quickForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      message: [''],
    });
  }

  sendQuick() {
    if (this.quickForm.valid) {
      // stub: integrate with LeadService
      console.log('quick send', this.quickForm.value);
    }
  }
}
