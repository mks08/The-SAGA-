import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { ButtonComponent } from './components/button/button.component';
import { IconComponent } from './components/icon/icon.component';
import { ChatbotWidgetComponent } from './components/chatbot-widget/chatbot-widget.component';

@NgModule({
  declarations: [ButtonComponent, IconComponent, ChatbotWidgetComponent],
  imports: [CommonModule, ReactiveFormsModule],
  exports: [ButtonComponent, IconComponent, ChatbotWidgetComponent, CommonModule, ReactiveFormsModule],
})
export class SharedModule {}
